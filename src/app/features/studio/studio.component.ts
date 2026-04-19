import {
  Component,
  DestroyRef,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TopNavComponent } from '../../shared/layout/top-nav.component';
import { SideRailComponent } from '../../shared/layout/side-rail.component';
import { SpeechService } from '../../core/services/speech.service';
import { TranslationService } from '../../core/services/translation.service';
import { PreferencesService } from '../../core/services/preferences.service';
import { LANGUAGES, findLanguageByLabel } from '../../core/models/language';

const BAR_COUNT = 18;
const STATIC_BARS = [8, 12, 24, 32, 20, 28, 16, 24, 12, 32, 24, 28, 16, 32, 20, 24, 12, 8];

@Component({
  selector: 'vt-studio',
  standalone: true,
  imports: [TopNavComponent, SideRailComponent, FormsModule],
  templateUrl: './studio.component.html',
})
export class StudioComponent implements OnDestroy {
  readonly speech = inject(SpeechService);
  private readonly translation = inject(TranslationService);
  readonly prefs = inject(PreferencesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly languages = LANGUAGES;

  /** Raw frequency magnitudes (0-255) for each of BAR_COUNT bars. */
  readonly liveBars = signal<number[]>(new Array(BAR_COUNT).fill(0));

  /** Translated sentences, appended as each final source chunk comes in. */
  readonly translatedChunks = signal<string[]>([]);

  /** User-facing error for mic / browser issues (separate from speech.error). */
  readonly micError = signal<string | null>(null);

  /** True while mic + recognizer are active. */
  readonly recording = computed(() => this.speech.state() === 'listening');

  /** True when recording was paused (text preserved). */
  readonly paused = signal(false);

  /** Formatted session timer (HH:MM:SS). */
  readonly sessionTime = signal('00:00:00');

  /** Display bars: live when recording, static fallback otherwise. */
  readonly displayBars = computed(() => {
    if (this.recording()) {
      return this.liveBars().map((v, i) => ({
        heightPx: Math.max(6, (v / 255) * 128),
        opacity: 0.3 + (v / 255) * 0.7,
        glow: i === 9 || i === 13,
      }));
    }
    return STATIC_BARS.map((h, i) => ({
      heightPx: h * 4,
      opacity: 0.2 + (h / 32) * 0.8,
      glow: i === 9 || i === 13,
    }));
  });

  private micStream?: MediaStream;
  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private rafId?: number;
  private timerId?: number;
  private sessionStartMs = 0;
  private pausedElapsedMs = 0;

  constructor() {
    // Each time a final source chunk is committed, translate it and append.
    this.speech.finalChunk$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((chunk) => this.translateChunk(chunk));
  }

  ngOnDestroy(): void {
    this.stopRecording();
  }

  // ---------- Transport controls ----------

  async toggleRecording(): Promise<void> {
    if (this.recording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording(): Promise<void> {
    this.micError.set(null);
    this.paused.set(false);
    this.pausedElapsedMs = 0;

    if (!this.speech.supported) {
      this.micError.set(
        'Your browser does not support the Web Speech API. Try Chrome, Edge, or Safari.',
      );
      return;
    }

    if (this.prefs.engine() === 'whisper') {
      this.micError.set(
        'Whisper engine requires a backend + API key. Falling back to Web Speech API.',
      );
    }

    // Reset panels
    this.speech.reset();
    this.translatedChunks.set([]);

    await this.acquireMicAndStart();

    // Session timer starts fresh
    this.sessionStartMs = Date.now();
    this.sessionTime.set('00:00:00');
    this.timerId = window.setInterval(() => this.tickTimer(), 1000);
  }

  pauseRecording(): void {
    this.pausedElapsedMs = Date.now() - this.sessionStartMs;
    this.speech.stop();
    this.teardownAnalyser();
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = undefined;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
    this.paused.set(true);
  }

  async resumeRecording(): Promise<void> {
    this.micError.set(null);
    this.paused.set(false);

    await this.acquireMicAndStart();

    // Resume timer from where it was paused
    this.sessionStartMs = Date.now() - this.pausedElapsedMs;
    this.timerId = window.setInterval(() => this.tickTimer(), 1000);
  }

  private async acquireMicAndStart(): Promise<void> {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.micError.set(
        msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')
          ? 'Microphone permission denied. Grant access in your browser and retry.'
          : `Could not access microphone: ${msg}`,
      );
      this.paused.set(true);
      return;
    }
    this.setupAnalyser(this.micStream);
    const sourceLang = findLanguageByLabel(this.prefs.sourceLangLabel())?.bcp47 ?? 'en-US';
    this.speech.start(sourceLang);
  }

  stopRecording(): void {
    this.speech.stop();
    this.teardownAnalyser();
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = undefined;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  stopSession(): void {
    this.stopRecording();
    this.paused.set(false);
    this.pausedElapsedMs = 0;
    this.speech.reset();
    this.translatedChunks.set([]);
    this.sessionTime.set('00:00:00');
  }

  clearSession(): void {
    this.speech.reset();
    this.translatedChunks.set([]);
    this.sessionTime.set('00:00:00');
  }

  copyTranscript(): void {
    const text = this.speech.finalText();
    if (!text) return;
    void navigator.clipboard?.writeText(text).catch(() => {
      /* no-op */
    });
  }

  downloadTranscript(kind: 'txt' | 'srt'): void {
    const text = this.speech.finalText();
    if (!text) return;
    const content =
      kind === 'srt'
        ? `1\n00:00:00,000 --> 00:59:59,000\n${text}\n`
        : text;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceflow-transcript.${kind}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Internals ----------

  private translateChunk(chunk: string): void {
    const src = findLanguageByLabel(this.prefs.sourceLangLabel())?.short ?? 'en';
    const tgt = findLanguageByLabel(this.prefs.targetLangLabel())?.short ?? 'es';
    if (src === tgt) {
      this.translatedChunks.update((arr) => [...arr, chunk]);
      return;
    }
    this.translation
      .translate(chunk, src, tgt)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((translated) => {
        this.translatedChunks.update((arr) => [...arr, translated]);
      });
  }

  private setupAnalyser(stream: MediaStream): void {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctor();
      const source = this.audioCtx.createMediaStreamSource(stream);
      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      this.analyser = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(data);
        const bars: number[] = new Array(BAR_COUNT);
        const step = data.length / BAR_COUNT;
        for (let i = 0; i < BAR_COUNT; i++) {
          bars[i] = data[Math.floor(i * step)];
        }
        this.liveBars.set(bars);
        this.rafId = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      // Non-fatal — recording still works, just no live viz.
      console.warn('[studio] analyser setup failed', e);
    }
  }

  private teardownAnalyser(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    this.analyser?.disconnect();
    this.analyser = undefined;
    void this.audioCtx?.close().catch(() => {
      /* no-op */
    });
    this.audioCtx = undefined;
    this.liveBars.set(new Array(BAR_COUNT).fill(0));
  }

  private tickTimer(): void {
    const elapsed = Math.floor((Date.now() - this.sessionStartMs) / 1000);
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    this.sessionTime.set(`${h}:${m}:${s}`);
  }
}

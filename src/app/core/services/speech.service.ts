import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

export type SpeechState = 'idle' | 'listening' | 'error' | 'unsupported';

/** Minimal typings for the Web Speech API (not in lib.dom.d.ts). */
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

/**
 * Wraps the browser Web Speech API. Only Chromium-based browsers and Safari
 * expose it today — Firefox does not.
 */
@Injectable({ providedIn: 'root' })
export class SpeechService {
  private readonly zone = inject(NgZone);
  private recognition?: SpeechRecognitionLike;
  private stopping = false;

  readonly state = signal<SpeechState>('idle');
  readonly error = signal<string | null>(null);
  readonly interimText = signal('');
  readonly finalText = signal('');
  /** Emits each final transcript chunk as soon as it is committed. */
  readonly finalChunk$ = new Subject<string>();

  readonly supported: boolean =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  constructor() {
    if (!this.supported) {
      this.state.set('unsupported');
    }
  }

  start(langTag: string): void {
    if (!this.supported) {
      this.state.set('unsupported');
      return;
    }
    // Guard against double-start.
    if (this.recognition) {
      return;
    }

    const Ctor = (window.SpeechRecognition || window.webkitSpeechRecognition)!;
    const rec = new Ctor();
    rec.lang = langTag;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () =>
      this.zone.run(() => {
        this.state.set('listening');
        this.error.set(null);
      });

    rec.onresult = (event: SpeechRecognitionEvent) =>
      this.zone.run(() => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          if (result.isFinal) {
            const chunk = transcript.trim();
            if (chunk) {
              this.finalText.update((prev) => (prev ? `${prev} ${chunk}` : chunk));
              this.finalChunk$.next(chunk);
            }
          } else {
            interim += transcript;
          }
        }
        this.interimText.set(interim);
      });

    rec.onerror = (event: SpeechRecognitionErrorEvent) =>
      this.zone.run(() => {
        this.state.set('error');
        const map: Record<string, string> = {
          'not-allowed': 'Microphone permission denied. Grant access and try again.',
          'service-not-allowed': 'Speech service blocked by the browser.',
          'no-speech': 'No speech detected. Try speaking into the mic.',
          'audio-capture': 'No microphone found.',
          network: 'Network error — Web Speech needs an internet connection.',
          aborted: 'Recording stopped.',
        };
        this.error.set(map[event.error] ?? `Speech error: ${event.error}`);
      });

    rec.onend = () =>
      this.zone.run(() => {
        this.recognition = undefined;
        if (this.state() !== 'error') {
          this.state.set('idle');
        }
        this.stopping = false;
      });

    try {
      rec.start();
      this.recognition = rec;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start speech recognition';
      this.state.set('error');
      this.error.set(msg);
    }
  }

  stop(): void {
    if (!this.recognition || this.stopping) return;
    this.stopping = true;
    try {
      this.recognition.stop();
    } catch {
      /* no-op */
    }
  }

  reset(): void {
    this.finalText.set('');
    this.interimText.set('');
    this.error.set(null);
  }
}

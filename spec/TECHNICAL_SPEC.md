# VoiceFlow Technical Specification

## Overview

VoiceFlow is a real-time speech-to-text and translation web application built with Angular 21, Tailwind CSS, and the Web Speech API. Users can record audio in one language, automatically transcribe it, and see live translations appear side-by-side. The application is designed for multilingual communication scenarios (interviews, conferences, meetings) with a clean, accessible dark-mode interface.

## Architecture

### Core Technology Stack

- **Framework**: Angular 21 (standalone components, signals-based reactivity)
- **Styling**: Tailwind CSS 3 with custom Material Design 3 color tokens
- **Transcription**: Web Speech API (webkitSpeechRecognition, Chromium/Safari only)
- **Translation**: MyMemory free translation API (api.mymemory.translated.net)
- **Audio Visualization**: Web Audio API (AudioContext, AnalyserNode, MediaStream)
- **HTTP Client**: Angular HttpClient with fetch backend
- **State Management**: Angular signals (no external store needed)
- **Async Operations**: RxJS with takeUntilDestroyed pattern
- **Icons**: Material Symbols Outlined via Google Fonts

### High-Level Data Flow

```
User clicks Record
  ↓
getMediaStream (browser mic permission)
  ↓
AudioContext + AnalyserNode (waveform viz)
  ├→ requestAnimationFrame loop → liveBars signal (60fps)
  └→ SpeechRecognition API
       ├→ interim results → interimText signal (gray italic)
       └→ final results → finalText + finalChunk$ Subject
            ↓
       forEach final chunk
            ↓
       MyMemory translate (src → tgt)
            ↓
       translatedChunks array signal
            ↓
       Template renders side-by-side panels
```

## Project Structure

```
src/
├── app/
│   ├── app.config.ts                  # Global providers (Router, HttpClient)
│   ├── app.routes.ts                  # 4 lazy routes (studio, upload, history, settings)
│   ├── core/
│   │   ├── models/
│   │   │   ├── language.ts            # Language interface + LANGUAGES array + utility
│   │   │   └── session.model.ts       # Session interface + SessionService mock data
│   │   └── services/
│   │       ├── preferences.service.ts # Shared signal store (prefs, engine, apiKey, etc)
│   │       ├── speech.service.ts      # Web Speech API wrapper + state signals
│   │       ├── translation.service.ts # MyMemory API wrapper
│   │       └── session.service.ts     # Mock session history
│   ├── shared/
│   │   └── layout/
│   │       ├── top-nav.component.ts   # Fixed header with brand + nav tabs
│   │       ├── side-rail.component.ts # Icon sidebar with nav + add button
│   │       └── side-history.component.ts # Session list sidebar
│   └── features/
│       ├── studio/
│       │   ├── studio.component.ts
│       │   └── studio.component.html
│       ├── upload/
│       │   ├── upload.component.ts
│       │   └── upload.component.html
│       ├── history/
│       │   ├── history.component.ts
│       │   └── history.component.html
│       └── settings/
│           ├── settings.component.ts
│           └── settings.component.html
├── index.html                         # Dark mode setup + Google Fonts
├── styles.css                         # Tailwind directives + custom utilities
└── main.ts
```

## Key Services

### PreferencesService

**Type**: `@Injectable({ providedIn: 'root' })`

A lightweight signal-based store synchronized across all screens. No persistence mechanism (future: localStorage or backend).

**Signals**:
- `sourceLangLabel: signal('English (US)')` — human-readable source language
- `targetLangLabel: signal('Spanish (Mexico)')` — human-readable target language
- `engine: signal<'web-speech' | 'whisper'>('web-speech')` — recognizer engine selector
- `autoPunctuation: signal(true)` — whether to auto-insert punctuation (UI toggle, not yet used)
- `fontSize: signal<1 | 2 | 3>(2)` — font scale (1=small, 2=medium, 3=large)
- `apiKey: signal('')` — Whisper API key placeholder (not yet integrated)

**Usage**: Injected into Studio and Settings components. Both screens bind directly to prefs.* signals, ensuring changes instantly propagate.

### SpeechService

**Type**: `@Injectable({ providedIn: 'root' })`

Wraps the native Web Speech API with Angular signals and RxJS observables.

**Key Signals**:
- `state: signal<'idle' | 'listening' | 'error' | 'unsupported'>('idle')` — recognizer lifecycle
- `error: signal<string | null>(null)` — human-readable error messages
- `interimText: signal('')` — live partial results as user speaks (not yet final)
- `finalText: signal('')` — concatenated final utterances (persistent during session)

**Key Observable**:
- `finalChunk$: Subject<string>` — emits each new final text chunk (used by Studio to trigger translation)

**Public Methods**:
- `start(langTag: string): void` — initiates recognition in specified BCP47 language tag
- `stop(): void` — stops recording and aborts recognizer
- `reset(): void` — clears all text signals (used by Studio clearSession)

**Internal Implementation**:
- Constructor checks `window.SpeechRecognition || window.webkitSpeechRecognition` and sets state to 'unsupported' if unavailable
- Recognition settings: `continuous: true, interimResults: true, maxAlternatives: 1`
- All callbacks wrapped in `NgZone.run()` to ensure Angular change detection
- Error handler maps 6 error codes (not-allowed, service-not-allowed, no-speech, audio-capture, network, aborted) to user-friendly messages
- Result handler accumulates final transcript, emits finalChunk$ for new final chunks, streams interim text

### TranslationService

**Type**: `@Injectable({ providedIn: 'root' })`

Calls the free MyMemory API to translate text between language pairs.

**Public Method**:
```typescript
translate(text: string, sourceShort: string, targetShort: string): Observable<string>
```

**Behavior**:
- Accepts ISO 639-1 language codes (e.g., 'en', 'es', 'ja')
- Short-circuits with `of(text)` if source === target (same language, no translation needed)
- Constructs HTTP GET to `api.mymemory.translated.net/get?q={text}&langpair={src}|{tgt}`
- Maps response path `responseData.translatedText`, filters MYMEMORY WARNING messages
- Catches network errors, returns observable of '[translation failed]'

**Limitations**:
- No API key required, CORS-enabled by default
- No rate limiting enforced by client (MyMemory has server-side limits)
- Quality varies by language pair (free tier)

### SessionService

**Type**: `@Injectable({ providedIn: 'root' })`

Mock data provider for session history screen.

**Signals**:
- `sessions: signal<Session[]>([MOCK_SESSIONS])` — readonly array of 3 sample sessions

**Methods**:
- `getById(id: string): Session | undefined` — returns session by ID
- `clearAll(): void` — resets to empty array

**Note**: Currently mock-only. Future: replace with backend HTTP calls.

## Feature Screens

### Studio (Real-Time Recording)

**Route**: `/studio`

**Purpose**: Core recording and transcription screen. Users record speech, see live transcription + translation.

**Key Signals**:
- `speech: SpeechService` — injected service
- `translation: TranslationService` — injected service
- `prefs: PreferencesService` — injected service
- `liveBars: signal<number[]>` — frequency magnitudes (0-255) for waveform visualization, 18 bars
- `translatedChunks: signal<string[]>` — array of translated utterances appended as they arrive
- `recording: computed()` — true when speech.state() === 'listening'
- `displayBars: computed()` — live bars when recording, static fallback otherwise
- `sessionTime: signal('00:00:00')` — elapsed time in HH:MM:SS format
- `micError: signal<string | null>(null)` — user-facing errors (permissions, unsupported browser)

**Key Methods**:

- `toggleRecording()` — async conditional: calls startRecording() if idle, stopRecording() if active

- `startRecording()` — async
  1. Clears micError
  2. Checks `speech.supported`; if false, sets error message and returns
  3. Checks `prefs.engine()`; if 'whisper' (not yet implemented), shows warning but proceeds with Web Speech fallback
  4. Calls `speech.reset()` and clears translatedChunks
  5. Requests `navigator.mediaDevices.getUserMedia({ audio: true })`; catches permission errors with friendly messages
  6. Calls `setupAnalyser(stream)` to initialize AudioContext waveform visualization
  7. Gets source language BCP47 tag via `findLanguageByLabel()` utility, defaults to 'en-US'
  8. Calls `speech.start(langTag)`
  9. Records `sessionStartMs = Date.now()` and starts 1-second timer via `setInterval(() => this.tickTimer())`

- `stopRecording()` — sync
  1. Calls `speech.stop()`
  2. Calls `teardownAnalyser()` (cancels RAF, closes AudioContext)
  3. Stops all mic tracks and clears micStream
  4. Clears interval timer

- `clearSession()` — sync. Calls speech.reset(), clears translatedChunks, resets sessionTime to '00:00:00'

- `translateChunk(chunk: string)` — private, sync. Triggered by finalChunk$ subscription in constructor.
  1. Gets source and target language short codes (ISO 639-1) via findLanguageByLabel() utility
  2. If source === target, appends chunk to translatedChunks immediately
  3. Otherwise subscribes to `translation.translate(chunk, src, tgt)` and appends result

- `setupAnalyser(stream: MediaStream)` — private, sync. Sets up audio visualization.
  1. Creates AudioContext (handles webkit prefix)
  2. Creates AnalyserNode with fftSize 64 (32 frequency bins), smoothingTimeConstant 0.7
  3. Connects mic stream source → analyser
  4. Starts requestAnimationFrame loop that calls `analyser.getByteFrequencyData()` 60fps
  5. Downsamples 32 frequency bins to 18 bars via `Math.floor(i * step)` indexing
  6. Updates liveBars signal each frame
  7. Catches exceptions (non-fatal; recording still works without viz)

- `teardownAnalyser()` — private, sync. Cleans up audio context.
  1. Cancels active RAF ID
  2. Disconnects analyser
  3. Closes AudioContext (wrapped in try/catch for cross-browser compat)
  4. Resets liveBars to 18 zeros

- `tickTimer()` — private, sync. Called every 1 second by setInterval.
  1. Calculates elapsed seconds: `(Date.now() - sessionStartMs) / 1000`
  2. Formats as HH:MM:SS with zero-padding
  3. Updates sessionTime signal

- `copyTranscript()` — sync. Uses navigator.clipboard API.
  1. Gets finalText from speech service
  2. Calls `navigator.clipboard.writeText(text)`
  3. No-ops on error (silently fails, no toast)

- `downloadTranscript(kind: 'txt' | 'srt')` — sync. Downloads transcript file.
  1. Gets finalText
  2. If kind === 'srt': wraps in SRT format (index 1, timecode 00:00:00,000 --> 00:59:59,000, text)
  3. Creates Blob with mime type 'text/plain;charset=utf-8'
  4. Creates object URL and <a> element, triggers click, revokes URL

**Template Structure**:
- Error banner: `@if (micError() || speech.error())` shows red error box
- Waveform section: 18 bars from displayBars computed, cyan glow on center bars (indices 9, 13)
- Control buttons: Pause (disabled unless recording), Mic toggle (large cyan circle), Stop
- Two-column panels:
  - Original: source language dropdown, finalText, interimText (italic+pulse), placeholder
  - Translation: target language dropdown, iterates translatedChunks, placeholder
- Sticky status bar: Mic status (Capturing/Idle), Session Timer, Engine indicator (Web Speech → MyMemory)
- Footer: Copy button, .TXT/.SRT download buttons, Share Session button

**Constructor Behavior**:
```typescript
constructor() {
  this.speech.finalChunk$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((chunk) => this.translateChunk(chunk));
}
```
Subscribes to finalChunk$ and automatically translates each new final utterance.

### Settings (Preferences)

**Route**: `/settings`

**Purpose**: Configure language preferences, API keys, recognition engine, typography.

**Key Signals**:
- `prefs: PreferencesService` — injected service
- `showKey: signal(false)` — toggles API key input visibility
- `targetLanguages: string[]` — computed list of language labels from LANGUAGES

**Methods**:
- `resetDefaults()` — sets all prefs signals back to default values:
  - engine → 'web-speech'
  - apiKey → ''
  - autoPunctuation → true
  - targetLangLabel → 'Spanish (Mexico)'
  - fontSize → 2

- `saveChanges()` — currently logs preferences to console (future: persist to backend)

**Template Sections**:
1. **Engine Selection**: Radio-style toggle buttons (Web Speech API Basic vs Whisper API Pro)
2. **API Authentication**: Password input for Whisper API key, eye-icon visibility toggle
3. **Preferences**: 2-column grid
   - Auto-punctuation toggle switch
   - Default Target Language dropdown
4. **Typography**: 2-column grid
   - Font size range slider (1-3)
   - Preview paragraph with dynamic font-size binding
5. **Footer**: Reset Defaults button, Save Changes button

### Upload (Batch Transcription)

**Route**: `/upload`

**Purpose**: Drag-drop file upload, transcription, translation (future implementation).

**Current State**: Scaffolded UI with drag-drop zone, language selectors, waveform preview, 3-phase progress grid, results preview.

**Not Yet Implemented**: Actual file upload, backend transcription.

### History (Session Management)

**Route**: `/history`

**Purpose**: Browse past sessions, search/filter, review transcripts.

**Key Signals**:
- `sessions: readonly Session[]` — from injected SessionService
- `activeTab: signal('recent' | 'saved' | 'lexicon' | 'archived')` — current view filter
- `selectedId: signal<string | null>(null)` — currently selected session
- `modalOpen: computed()` — true when session is selected
- `selected: computed()` — the full session object for display

**Methods**:
- `selectSession(id: string)` — sets selectedId, opens modal
- `closeModal()` — clears selectedId
- `clearAll()` — calls sessionService.clearAll()
- `badgeClasses(language: string)` — returns Tailwind classes for language badges

**Template Structure**:
- Header: "Ready to Capture" main card
- Bento grid: System Status + Language Model tiles
- Right sidebar: Session list with tabs (Recent/Saved/Lexicon/Archived), New Session button
- Modal: Full transcript review, metadata, action buttons

## Styling & Theme

### Tailwind Configuration

**Color Palette** (Material Design 3 inspired):
- **Primary** (cyan): `primary`, `primary-container`, `on-primary`, `on-primary-container`
- **Secondary** (purple): `secondary`, `secondary-container`, `on-secondary`, `on-secondary-container`
- **Tertiary** (teal): `tertiary`, `tertiary-container`, `on-tertiary`, `on-tertiary-container`
- **Surface variants**: `surface-container`, `surface-container-low`, `surface-container-high`, `surface-container-highest`
- **State colors**: `error`, `error-container`, `warning`, `success`, `outline`, `outline-variant`
- **Text colors**: `on-surface`, `on-surface-variant`

**Border Radius** (custom scale):
- 0.125rem, 0.25rem, 0.375rem, 0.5rem, 0.625rem, 0.75rem (pinned to Stitch design tokens)

**Typography**:
- **Headline font**: Space Grotesk (bold, sans-serif, display text)
- **Body font**: Manrope (regular weight, paragraph text)
- **Label font**: Inter (small, UI labels, buttons)
- **Monospace font**: JetBrains Mono (transcription text, code snippets)

### Custom Utilities (styles.css)

- `.glass-panel` — backdrop blur 12px, opacity fallback for unsupported browsers
- `.waveform-bar` — fixed dimensions, cyan glow effect, animated opacity
- `.mono-text-stream` — monospace font family, line-height 1.8, word-wrap
- `.custom-scrollbar` — webkit scrollbar styling (thin dark thumb, light track)

## State Management

### No External Store

The app uses Angular signals exclusively (no Redux, NgRx, Akita, etc.). This was chosen because:

1. **Simplicity**: Signals are synchronous, require no boilerplate
2. **Local Scoping**: Each component controls its own state (liveBars, sessionTime, etc.)
3. **Shared State**: PreferencesService singleton handles app-wide prefs via signals
4. **Change Detection**: Automatic; no need for OnPush strategies
5. **Minimal Bundle**: No store library overhead

**State Categories**:
- **Transient**: liveBars, sessionTime, translatedChunks (reset per session)
- **User Settings**: prefs.* (survives page reload, future: localStorage)
- **Service State**: speech.state, speech.finalText (managed by SpeechService)

## Error Handling

### Browser Compatibility

- **Web Speech API**: Not available in Firefox. Service detects absence at construction, sets `state = 'unsupported'`. Studio shows banner: "Your browser does not support the Web Speech API. Try Chrome, Edge, or Safari."
- **MediaStream/getUserMedia**: Requires HTTPS (or localhost). Permission denied → friendly error: "Microphone permission denied. Grant access in your browser and retry."
- **AudioContext**: Cross-browser via webkit prefix. Non-fatal errors caught; recording still works without visualization.

### Network Errors

- **Translation API**: MyMemory down or malformed response → returns observable of '[translation failed]'. Chunk is not appended; user sees gap in translation.
- **HTTP Errors**: HttpClient error handler filters warnings, catches 4xx/5xx as fallback.

### User-Facing Errors

All errors shown via micError signal banner at top of Studio:
- "Your browser does not support..."
- "Microphone permission denied..."
- "Could not access microphone: {error}"
- "Whisper engine requires a backend..." (warning, still proceeds with Web Speech)

## Browser Support

**Fully Supported**:
- Chrome 87+ (Web Speech API, AudioContext, MediaStream)
- Edge 87+ (Chromium-based, same as Chrome)
- Safari 14.1+ (Web Speech API, AudioContext, but different prefix handling)

**Partially Supported**:
- Firefox (no Web Speech API; shows "unsupported" banner, all other features work)

**Not Supported**:
- IE 11 and earlier (no signals, no Web Speech API, no modern JS syntax)

## Performance Notes

### Bundle Size

- Initial chunk: ~283 kB (68.5 kB transferred, gzipped)
- Lazy-loaded feature chunks: 5 routes, ~50-100 kB each
- Dependencies: @angular/core, @angular/common, @angular/router, @angular/forms, tailwindcss

### Real-Time Constraints

- Waveform refresh: 60fps via requestAnimationFrame
- Translation latency: ~200-500ms per chunk (network dependent)
- Session timer: 1 update per second via setInterval
- No throttling or debouncing on signals; Angular handles change detection

### Storage

- Preferences: signals only, no persistence (future: localStorage ~1 KB)
- Sessions: mock data in memory (future: backend database)
- Transcripts: stored in speech.finalText signal until cleared (no size limit enforced)

## Future Extensions

1. **Persistent Settings** — localStorage or backend API
2. **Whisper Integration** — actual backend endpoint instead of fallback
3. **Session Persistence** — save/load transcripts from backend
4. **Audio Upload** — handle pre-recorded files instead of live mic only
5. **Pause/Resume** — Web Speech API doesn't natively support, would require custom logic
6. **Real-Time Collaboration** — WebSocket sync of transcripts across users
7. **Advanced Export** — JSON, CSV, SRT with speaker diarization
8. **Lexicon Management** — custom domain vocabulary to improve recognition accuracy
9. **Accessibility** — ARIA labels, keyboard shortcuts, screen reader optimization

---

This specification covers the complete architecture, services, screens, styling, state management, error handling, and browser support for the VoiceFlow application as built in Angular 21 with Web Speech API and MyMemory translation.

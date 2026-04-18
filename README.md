# VoiceFlow (vtext)

A web implementation of the **VoiceFlow** audio transcription + real-time translation app,
built from the Google Stitch project `vtext` ("The Obsidian Broadcast" design system).

Dark editorial dashboard with cyan neon accents, 4 primary screens:

| Route | Screen | Purpose |
|---|---|---|
| `/studio` | Main Recording Studio | Live broadcast: waveform, mic controls, dual-column live transcript/translation |
| `/upload` | Upload Audio | Drag-and-drop file upload, language pickers, processing phases, results preview |
| `/history` | Session History | Past sessions sidebar, session-review modal with side-by-side transcripts |
| `/settings` | Settings Panel | Engine selection (Web Speech / Whisper), API key, preferences, typography |

## Tech stack

- **Angular 21** (standalone components, lazy-loaded routes, signals, new control flow `@if` / `@for`)
- **Tailwind CSS 3** — color tokens and font families mirrored exactly from the Stitch design theme
- **Google Fonts** — Space Grotesk (headline), Manrope (body), Inter (label), JetBrains Mono (mono)
- **Material Symbols Outlined** — icons, loaded via Google Fonts

No backend — session data is mocked in `SessionService` using Angular signals.

## Project structure

```
src/app/
├── core/
│   ├── models/session.model.ts
│   └── services/session.service.ts      # signal-backed mock sessions store
├── shared/layout/
│   ├── top-nav.component.ts              # fixed top header (shared on every screen)
│   ├── side-rail.component.ts            # slim icon rail (Studio screen)
│   └── side-history.component.ts         # wide right sidebar (Upload / Settings)
├── features/
│   ├── studio/                           # /studio  — live recording studio
│   ├── upload/                           # /upload  — upload audio
│   ├── history/                          # /history — session history + modal
│   └── settings/                         # /settings — configuration panel
├── app.routes.ts                         # lazy-loaded routes
└── app.config.ts                         # providers (router)
```

## Prerequisites

- Node.js ≥ 20 (tested on Node 24)
- npm ≥ 10

## Setup

```bash
npm install
```

## Run (dev server)

```bash
npm start
```

Then open http://localhost:4200 — it redirects to `/studio`.

## Build (production)

```bash
npm run build
```

Output goes to `dist/vtext/`.

## Design tokens

The full Stitch color palette is mirrored in [`tailwind.config.js`](./tailwind.config.js):
`primary`, `primary-container`, `surface-container-*`, `secondary`, etc. These map 1:1 to the
Stitch design-system tokens so any class you see in the original Stitch HTML works here verbatim.

Global helpers defined in [`src/styles.css`](./src/styles.css): `.glass-panel`, `.waveform-bar`,
`.waveform-bar-dim`, `.mono-text-stream`, `.custom-scrollbar`, `.no-scrollbar`.

## Notes on fidelity

- The **right sidebar** on the Upload/Settings screens is hidden below `xl` breakpoint (matches Stitch).
- The **slim left rail** on the Studio screen is hidden below `lg` breakpoint (matches Stitch).
- The Studio waveform, processing phases, and transcript content are static mock data — same
  placeholder strings as in the Stitch designs.
- The History session-review modal opens when you click any session in the right panel.

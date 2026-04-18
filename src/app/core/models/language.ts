export interface Language {
  /** Human-readable label shown in dropdowns */
  label: string;
  /** BCP-47 tag used by Web Speech API (SpeechRecognition) */
  bcp47: string;
  /** ISO 639-1 short code used by the MyMemory translation API */
  short: string;
}

export const LANGUAGES: Language[] = [
  { label: 'English (US)', bcp47: 'en-US', short: 'en' },
  { label: 'Spanish (Mexico)', bcp47: 'es-MX', short: 'es' },
  { label: 'Japanese (JP)', bcp47: 'ja-JP', short: 'ja' },
  { label: 'German (DE)', bcp47: 'de-DE', short: 'de' },
  { label: 'French (FR)', bcp47: 'fr-FR', short: 'fr' },
];

export function findLanguageByLabel(label: string): Language | undefined {
  return LANGUAGES.find((l) => l.label === label);
}

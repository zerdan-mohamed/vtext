export interface TranscriptLine {
  timestamp: string;
  text: string;
}

export interface Session {
  id: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  durationMin: string;
  capturedAt: string; // e.g. "Oct 24, 2023"
  capturedAtTime: string; // e.g. "14:20 PM"
  preview: string;
  source: TranscriptLine[];
  translation: TranscriptLine[];
}

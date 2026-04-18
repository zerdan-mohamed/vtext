import { Injectable, signal } from '@angular/core';

export type Engine = 'web-speech' | 'whisper';
/** 1 = small, 2 = medium, 3 = large */
export type FontSize = number;

/**
 * App-wide user preferences. Simple signal store so Studio and Settings
 * screens stay in sync without a router-dependent dance.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly sourceLangLabel = signal('English (US)');
  readonly targetLangLabel = signal('Spanish (Mexico)');
  readonly engine = signal<Engine>('web-speech');
  readonly autoPunctuation = signal(true);
  readonly fontSize = signal<FontSize>(2);
  readonly apiKey = signal('');
}

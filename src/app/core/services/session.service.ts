import { Injectable, signal } from '@angular/core';
import { Session } from '../models/session.model';

const MOCK_SESSIONS: Session[] = [
  {
    id: 'project-alpha-briefing',
    title: 'Project Alpha Briefing',
    sourceLanguage: 'English (US)',
    targetLanguage: 'Japanese',
    durationMin: '12:45',
    capturedAt: 'Oct 24, 2023',
    capturedAtTime: '14:20 PM',
    preview:
      '"...the primary architectural shift focuses on the obsidian depth rule, where tonal gradients replace border lines for a more fluid UI..."',
    source: [
      {
        timestamp: '00:00:02',
        text: "Good morning team. Today we're reviewing the obsidian broadcast design system foundations.",
      },
      {
        timestamp: '00:00:15',
        text: 'The primary architectural shift focuses on the obsidian depth rule, where tonal gradients replace border lines for a more fluid UI.',
      },
      {
        timestamp: '00:00:32',
        text: "We need to ensure that the neon-kinetic accents aren't overwhelming, maintaining high legibility at all times.",
      },
    ],
    translation: [
      {
        timestamp: '00:00:02',
        text: 'おはようございます。本日は「オブシディアン・ブロードキャスト」デザインシステムの基礎を確認します。',
      },
      {
        timestamp: '00:00:15',
        text: '主な設計の変更点は「オブシディアン・デプス・ルール」に焦点を当てており、階調のグラデーションによって境界線を置き換え、より流動的なUIを実現します。',
      },
      {
        timestamp: '00:00:32',
        text: 'ネオン・キネティック・アクセントが過剰にならないよう、常に高い可読性を維持する必要があります。',
      },
    ],
  },
  {
    id: 'tokyo-design-sync',
    title: 'Tokyo Design Sync',
    sourceLanguage: 'Japanese',
    targetLanguage: 'English (US)',
    durationMin: '08:22',
    capturedAt: 'Oct 23, 2023',
    capturedAtTime: '11:05 AM',
    preview:
      '"...discussing the integration of Material Symbols into the workflow and the literal transcription protocols..."',
    source: [],
    translation: [],
  },
  {
    id: 'paris-workshop-q4',
    title: 'Paris Workshop Q4',
    sourceLanguage: 'French',
    targetLanguage: 'English (US)',
    durationMin: '45:10',
    capturedAt: 'Oct 22, 2023',
    capturedAtTime: '09:12 AM',
    preview:
      '"...feedback on the new glassmorphism filters and the impact of responsive pivots on the mobile experience..."',
    source: [],
    translation: [],
  },
];

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly _sessions = signal<Session[]>(MOCK_SESSIONS);
  readonly sessions = this._sessions.asReadonly();

  getById(id: string): Session | undefined {
    return this._sessions().find((s) => s.id === id);
  }

  clearAll(): void {
    this._sessions.set([]);
  }
}

import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';

type NavTab = 'realtime' | 'upload' | 'library';

@Component({
  selector: 'vt-top-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  template: `
    <header
      class="fixed top-0 left-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 flex justify-between items-center px-6 py-4 shadow-2xl">
      <div class="flex items-center gap-4">
        <a routerLink="/studio"
          class="text-2xl font-bold tracking-tighter text-cyan-400 uppercase font-headline">
          VoiceFlow
        </a>
      </div>

      <nav class="hidden md:flex items-center space-x-8">
        <a routerLink="/studio" routerLinkActive="text-cyan-400 font-bold"
          [ngClass]="{'text-neutral-400': tab !== 'realtime'}"
          class="font-headline hover:bg-white/5 transition-colors duration-200 px-3 py-1 rounded">
          Real-time
        </a>
        <a routerLink="/upload" routerLinkActive="text-cyan-400 font-bold"
          [ngClass]="{'text-neutral-400': tab !== 'upload'}"
          class="font-headline hover:bg-white/5 transition-colors duration-200 px-3 py-1 rounded">
          Upload Session
        </a>
        <a routerLink="/history" routerLinkActive="text-cyan-400 font-bold"
          [ngClass]="{'text-neutral-400': tab !== 'library'}"
          class="font-headline hover:bg-white/5 transition-colors duration-200 px-3 py-1 rounded">
          Library
        </a>
      </nav>

      <div class="flex items-center gap-4">
        <button
          class="text-neutral-400 hover:bg-white/5 transition-colors duration-200 p-2 rounded-lg active:scale-95">
          <span class="material-symbols-outlined">dark_mode</span>
        </button>
        <a routerLink="/settings" routerLinkActive="text-cyan-400"
          class="text-neutral-400 hover:bg-white/5 transition-colors duration-200 p-2 rounded-lg active:scale-95">
          <span class="material-symbols-outlined">settings</span>
        </a>
        <a routerLink="/history" routerLinkActive="text-cyan-400"
          class="text-neutral-400 hover:bg-white/5 transition-colors duration-200 p-2 rounded-lg active:scale-95">
          <span class="material-symbols-outlined">history</span>
        </a>
      </div>
    </header>
  `,
})
export class TopNavComponent {
  @Input() tab: NavTab = 'realtime';
}

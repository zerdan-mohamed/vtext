import { Component } from '@angular/core';

/**
 * Slim left-hand rail used on the Studio (real-time) screen.
 * Icon-only navigation with tooltips on hover.
 */
@Component({
  selector: 'vt-side-rail',
  standalone: true,
  template: `
    <aside
      class="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-64px)] w-20 flex-col items-center py-8 border-r border-white/5 bg-neutral-900 z-40">
      <nav class="flex flex-col gap-8">
        <div class="group relative">
          <span
            class="material-symbols-outlined text-cyan-400 bg-cyan-500/10 p-3 rounded-xl border-r-2 border-cyan-400 cursor-pointer">mic</span>
          <span
            class="absolute left-16 top-1/2 -translate-y-1/2 bg-surface-container-highest px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Recent Sessions
          </span>
        </div>
        <div class="group relative">
          <span
            class="material-symbols-outlined text-neutral-500 hover:text-neutral-200 p-3 cursor-pointer transition-colors">description</span>
          <span
            class="absolute left-16 top-1/2 -translate-y-1/2 bg-surface-container-highest px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Saved Transcripts
          </span>
        </div>
        <div class="group relative">
          <span
            class="material-symbols-outlined text-neutral-500 hover:text-neutral-200 p-3 cursor-pointer transition-colors">translate</span>
          <span
            class="absolute left-16 top-1/2 -translate-y-1/2 bg-surface-container-highest px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Translation Lexicon
          </span>
        </div>
        <div class="group relative">
          <span
            class="material-symbols-outlined text-neutral-500 hover:text-neutral-200 p-3 cursor-pointer transition-colors">archive</span>
          <span
            class="absolute left-16 top-1/2 -translate-y-1/2 bg-surface-container-highest px-3 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Archived
          </span>
        </div>
      </nav>
      <div class="mt-auto">
        <button
          class="bg-cyan-500/20 text-cyan-400 p-3 rounded-full hover:bg-cyan-500/30 transition-colors">
          <span class="material-symbols-outlined">add</span>
        </button>
      </div>
    </aside>
  `,
})
export class SideRailComponent {}

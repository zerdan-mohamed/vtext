import { Component, Input } from '@angular/core';

/**
 * Wide right-hand sidebar used on the Upload & Settings screens.
 * Shows session-history nav + storage usage.
 */
@Component({
  selector: 'vt-side-history',
  standalone: true,
  template: `
    <aside
      class="fixed right-0 top-0 h-screen w-80 border-l border-white/10 bg-neutral-900 shadow-[-20px_0_30px_rgba(0,0,0,0.5)] z-40 hidden xl:flex flex-col p-6">
      <div class="mb-12 pt-20">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container/30 bg-primary-container/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-cyan-400">graphic_eq</span>
          </div>
          <div>
            <h3 class="text-lg font-black text-cyan-400 leading-tight font-headline">Session History</h3>
            <p class="text-xs text-neutral-500 uppercase tracking-widest">The Obsidian Broadcast</p>
          </div>
        </div>
        <button
          class="w-full py-3 bg-primary-container text-on-primary-container font-bold rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 active:scale-95">
          <span class="material-symbols-outlined">add</span>
          <span>New Session</span>
        </button>
      </div>

      <nav class="flex-1 space-y-2">
        <div class="flex items-center space-x-3 px-4 py-3 rounded text-neutral-500 hover:text-neutral-200 hover:bg-white/5 cursor-pointer transition-all">
          <span class="material-symbols-outlined">mic</span>
          <span class="text-sm">Recent Sessions</span>
        </div>
        <div class="flex items-center space-x-3 px-4 py-3 rounded text-neutral-500 hover:text-neutral-200 hover:bg-white/5 cursor-pointer transition-all">
          <span class="material-symbols-outlined">description</span>
          <span class="text-sm">Saved Transcripts</span>
        </div>
        <div class="flex items-center space-x-3 px-4 py-3 rounded text-neutral-500 hover:text-neutral-200 hover:bg-white/5 cursor-pointer transition-all">
          <span class="material-symbols-outlined">translate</span>
          <span class="text-sm">Translation Lexicon</span>
        </div>
        <div class="flex items-center space-x-3 px-4 py-3 rounded text-neutral-500 hover:text-neutral-200 hover:bg-white/5 cursor-pointer transition-all">
          <span class="material-symbols-outlined">archive</span>
          <span class="text-sm">Archived</span>
        </div>
      </nav>

      @if (showStorage) {
        <div class="mt-auto pt-6 border-t border-white/5">
          <div class="p-4 rounded-xl bg-surface-container border border-white/5">
            <p class="text-xs text-neutral-400 mb-2">STORAGE USAGE</p>
            <div class="h-1 w-full bg-surface-variant rounded-full overflow-hidden">
              <div class="h-full w-2/3 bg-primary-container"></div>
            </div>
            <p class="text-[10px] text-neutral-500 mt-2">6.4 GB of 10 GB Used</p>
          </div>
        </div>
      }
    </aside>
  `,
})
export class SideHistoryComponent {
  @Input() showStorage = true;
}

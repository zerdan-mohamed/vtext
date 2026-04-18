import { Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { TopNavComponent } from '../../shared/layout/top-nav.component';
import { SessionService } from '../../core/services/session.service';
import { Session } from '../../core/models/session.model';

type Tab = 'recent' | 'saved' | 'lexicon' | 'archived';
interface TabDef {
  id: Tab;
  icon: string;
  label: string;
}

@Component({
  selector: 'vt-history',
  standalone: true,
  imports: [TopNavComponent, NgClass],
  templateUrl: './history.component.html',
})
export class HistoryComponent {
  private readonly sessionService = inject(SessionService);

  readonly sessions = this.sessionService.sessions;
  readonly tabs: TabDef[] = [
    { id: 'recent', icon: 'mic', label: 'Recent' },
    { id: 'saved', icon: 'description', label: 'Saved' },
    { id: 'lexicon', icon: 'translate', label: 'Lexicon' },
    { id: 'archived', icon: 'archive', label: 'Archived' },
  ];
  readonly activeTab = signal<Tab>('recent');
  readonly selectedId = signal<string | null>(this.sessions()[0]?.id ?? null);
  readonly modalOpen = signal<boolean>(!!this.sessions()[0]);

  readonly selected = computed<Session | undefined>(() => {
    const id = this.selectedId();
    return id ? this.sessionService.getById(id) : undefined;
  });

  selectSession(id: string): void {
    this.selectedId.set(id);
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
  }

  clearAll(): void {
    this.sessionService.clearAll();
    this.modalOpen.set(false);
    this.selectedId.set(null);
  }

  badgeClasses(language: string): string {
    if (language.toLowerCase().includes('english')) return 'bg-cyan-400/20 text-cyan-400';
    if (language.toLowerCase().includes('japanese')) return 'bg-secondary/10 text-secondary';
    return 'bg-primary-container/10 text-primary-container';
  }
}

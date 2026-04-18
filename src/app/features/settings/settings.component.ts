import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { TopNavComponent } from '../../shared/layout/top-nav.component';
import { SideHistoryComponent } from '../../shared/layout/side-history.component';
import { PreferencesService } from '../../core/services/preferences.service';
import { LANGUAGES } from '../../core/models/language';

@Component({
  selector: 'vt-settings',
  standalone: true,
  imports: [TopNavComponent, SideHistoryComponent, FormsModule, NgClass],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  readonly prefs = inject(PreferencesService);
  readonly showKey = signal(false);
  readonly targetLanguages = LANGUAGES.map((l) => l.label);

  resetDefaults(): void {
    this.prefs.engine.set('web-speech');
    this.prefs.apiKey.set('');
    this.prefs.autoPunctuation.set(true);
    this.prefs.targetLangLabel.set('Spanish (Mexico)');
    this.prefs.fontSize.set(2);
  }

  saveChanges(): void {
    // Signals are already the source of truth; nothing else to persist.
    console.log('Saved settings', {
      engine: this.prefs.engine(),
      apiKey: this.prefs.apiKey(),
      autoPunctuation: this.prefs.autoPunctuation(),
      targetLangLabel: this.prefs.targetLangLabel(),
      fontSize: this.prefs.fontSize(),
    });
  }
}

import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TopNavComponent } from '../../shared/layout/top-nav.component';
import { SideHistoryComponent } from '../../shared/layout/side-history.component';

interface WaveBar {
  height: number;
  dim: boolean;
}

@Component({
  selector: 'vt-upload',
  standalone: true,
  imports: [TopNavComponent, SideHistoryComponent, FormsModule],
  templateUrl: './upload.component.html',
})
export class UploadComponent {
  readonly fileName = signal('broadcast_session_042.wav');
  readonly fileSize = signal('42.5 MB');
  readonly fileDuration = signal('12:45');

  readonly sourceLang = signal('English (US)');
  readonly targetLang = signal('Japanese (JP)');

  readonly sourceOptions = ['English (US)', 'German (DE)', 'Japanese (JP)'];
  readonly targetOptions = ['Japanese (JP)', 'Spanish (ES)', 'French (FR)'];

  readonly bars: WaveBar[] = [
    20, 40, 15, 60, 80, 45, 30, 70, 90, 55, 20, 40, 65, 35, 75, 50, 25, 85, 60, 40, 15, 95, 70, 30,
    50, 80, 45, 20, 60, 35,
  ]
    .map((h) => ({ height: h, dim: false }))
    .concat([50, 25, 15, 40, 30, 20, 10, 15].map((h) => ({ height: h, dim: true })));

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.fileName.set(file.name);
      this.fileSize.set(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onFilePick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileName.set(file.name);
      this.fileSize.set(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  }
}

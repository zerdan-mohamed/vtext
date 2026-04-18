import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

interface MyMemoryResponse {
  responseData: { translatedText: string; match: number };
  responseStatus: number | string;
}

/**
 * Thin wrapper around the MyMemory public translation API.
 * - Free, no API key required, CORS-enabled.
 * - Endpoint: https://api.mymemory.translated.net/get?q=...&langpair=en|es
 * - Rate-limited to ~1000 words/day per anonymous IP; fine for demos.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = 'https://api.mymemory.translated.net/get';

  translate(text: string, sourceShort: string, targetShort: string): Observable<string> {
    const trimmed = text.trim();
    if (!trimmed) return of('');
    if (sourceShort === targetShort) return of(trimmed);

    const params = new HttpParams()
      .set('q', trimmed)
      .set('langpair', `${sourceShort}|${targetShort}`);

    return this.http.get<MyMemoryResponse>(this.endpoint, { params }).pipe(
      map((r) => {
        const out = r?.responseData?.translatedText ?? '';
        // MyMemory sometimes returns the error message in the translatedText field
        // (e.g. "MYMEMORY WARNING: ...") — fall back to original if that happens.
        if (!out || out.toUpperCase().startsWith('MYMEMORY WARNING')) {
          return trimmed;
        }
        return out;
      }),
      catchError(() => of('[translation failed]')),
    );
  }
}

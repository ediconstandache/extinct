import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, timer, of, combineLatest } from 'rxjs';
import { switchMap, catchError, map, shareReplay, startWith } from 'rxjs/operators';

export type AnnouncementSeverity = 'red' | 'green' | 'white';

export interface AnnouncementItem {
  id: string;
  title: string;
  message?: string;
  url: string;
  label?: string;
  start: string; // ISO with offset recommended (e.g. 2026-01-15T18:00:00+02:00)
  end: string;   // ISO with offset recommended
  severity?: AnnouncementSeverity;
  priority?: number; // optional: higher appears first
}

export interface AnnouncementsConfig {
  items: AnnouncementItem[];
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
  // How often to re-fetch announcements.json
  private readonly REFRESH_MS = 30_000;

  // How often to recompute “active now”
  private readonly TICK_MS = 1_000;

  constructor(private http: HttpClient) {}

  /**
   * Build a correct URL even if app is hosted under a subpath.
   */
  private announcementsUrl(): string {
    return new URL('assets/announcements.json', document.baseURI).toString();
  }

  /**
   * Poll JSON periodically. Cache-busting avoids stale GitHub Pages/CDN caches.
   */
  private config$(): Observable<AnnouncementsConfig> {
    return timer(0, this.REFRESH_MS).pipe(
      switchMap(() => {
        const url = `${this.announcementsUrl()}?v=${Date.now()}`;
        return this.http.get<AnnouncementsConfig>(url).pipe(
          catchError(() => of({ items: [] } as AnnouncementsConfig))
        );
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Emits the list of currently active announcements (can be multiple).
   * Re-evaluates every second and refreshes from server every REFRESH_MS.
   */
  activeAnnouncements$(): Observable<AnnouncementItem[]> {
    const tick$ = timer(0, this.TICK_MS).pipe(startWith(0));

    return combineLatest([this.config$(), tick$]).pipe(
      map(([cfg]) => {
        const now = Date.now();

        const active = (cfg.items ?? []).filter((i: AnnouncementItem) => {
          const start = new Date(i.start).getTime();
          const end = new Date(i.end).getTime();
          return Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end;
        });

        // Sort: priority desc, then earliest ending, then title
        active.sort((a: AnnouncementItem, b: AnnouncementItem) => {
          const pa = a.priority ?? 0;
          const pb = b.priority ?? 0;
          if (pb !== pa) return pb - pa;

          const ea = new Date(a.end).getTime();
          const eb = new Date(b.end).getTime();
          if (ea !== eb) return ea - eb;

          return (a.title ?? '').localeCompare(b.title ?? '');
        });

        return active;
      })
    );
  }

  /**
   * Display the active window in Romania time (Europe/Bucharest)
   */
  formatWindow(a: AnnouncementItem): string {
    const start = new Date(a.start);
    const end = new Date(a.end);

    const opts: Intl.DateTimeFormatOptions = {
      timeZone: 'Europe/Bucharest',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    };

    return `${start.toLocaleString('ro-RO', opts)} → ${end.toLocaleString('ro-RO', opts)}`;
  }
}

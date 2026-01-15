import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError, of } from 'rxjs';

export type AnnouncementSeverity = 'red' | 'green' | 'white';

export interface AnnouncementItem {
  id: string;
  title: string;
  message?: string;
  url: string;
  label?: string;
  start: string; // ISO
  end: string;   // ISO
  severity?: AnnouncementSeverity;
}

export interface AnnouncementsConfig {
  timezone?: string;
  items: AnnouncementItem[];
}

@Injectable({ providedIn: 'root' })
export class AnnouncementService {

    // How often to re-fetch announcements.json (ms)
  private readonly REFRESH_MS = 30_000;

  // How often to recompute “active now” (ms)
  private readonly TICK_MS = 1_000;
  
  constructor(private http: HttpClient) {}

  private announcementsUrl(): string {
    return new URL('announcements.json', document.baseURI).toString();
  }

  
  /**
   * Poll the JSON periodically (cache-busting included).
   */
  private config$(): Observable<AnnouncementsConfig> {
    return timer(0, this.REFRESH_MS).pipe(
      switchMap(() => {
        const url = `${this.announcementsUrl()}?v=${Date.now()}`;
        return this.http.get<AnnouncementsConfig>(url).pipe(
          catchError(() => of({ items: [] } as AnnouncementsConfig))
        );
      }),
      // share the latest config across subscribers
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Emits active announcements (possibly multiple), re-evaluated every second,
   * and refreshed from server every REFRESH_MS.
   */
  activeAnnouncements$(): Observable<AnnouncementItem[]> {
    const tick$ = timer(0, this.TICK_MS).pipe(startWith(0));

    return combineLatest([this.config$(), tick$]).pipe(
      map(([cfg]) => {
        const now = Date.now();

        const active = (cfg.items ?? []).filter(i => {
          const start = new Date(i.start).getTime();
          const end = new Date(i.end).getTime();
          return Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end;
        });

        // Sort: priority desc, then soonest ending, then title
        active.sort((a, b) => {
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

  formatWindow(a: AnnouncementItem): string {
    const start = new Date(a.start);
    const end = new Date(a.end);

    // Display in Romania time explicitly (optional but often desired)
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

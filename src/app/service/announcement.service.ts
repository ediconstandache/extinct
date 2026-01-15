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
  constructor(private http: HttpClient) {}

  /**
   * cache-bust avoids stale JSON on GitHub Pages/CDN caches
   */
  loadConfig() {
    const bust = Date.now();
    return this.http
      .get<AnnouncementsConfig>(`assets/announcements.json?v=${bust}`)
      .pipe(
        catchError(() => of({ items: [] } as AnnouncementsConfig))
      );
  }

  activeNow(cfg: AnnouncementsConfig, now = new Date()): AnnouncementItem[] {
    const t = now.getTime();
    return (cfg.items ?? []).filter(i => {
      const start = new Date(i.start).getTime();
      const end = new Date(i.end).getTime();
      return Number.isFinite(start) && Number.isFinite(end) && t >= start && t <= end;
    });
  }
}

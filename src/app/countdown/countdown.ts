// countdown.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-countdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown.html',
  styleUrls: ['./countdown.css']
})
export class Countdown implements OnInit, OnDestroy {
  // Countdown UI
  days = 0;
  hours = '00';
  minutes = '00';
  seconds = '00';

  // Glitch & lightning
  glitch = false;

  lightningLeft = false;
  lightningRight = false;

  lightningLeftColor: 'red' | 'green' | null = null;
  lightningRightColor: 'red' | 'green' | null = null;

  shake = false;

  // Names
  names: string[] = [
    'Tudor','Roberta','Alexia','Alin','Gelu','Maria','Mary','Raluca','Petru','Anca',
    'Andrei','Andrei','Luca','Victor','Eduard','Andrei','Anastasia','Ilinca','Ilinca',
    'Lucia','Mihai','Diana','Tiberiu','Maria','Stefan','Vlad','Ilinca','Andrada','Laura'
  ];
  currentName = '...';

  private intervalId: any;
  private glitchTimeoutId: any;
  private lightningTimeoutId: any;
  private nameIntervalId: any;

  // =========================
  // CRACKING AS A COUNTDOWN
  // =========================

  /**
   * Set your cracking schedule here.
   *
   * - crackStartDate: when the cracking begins (progress 0)
   * - crackEndDate:   when the cracking is fully done (progress 1)
   *
   * If user opens the page anytime:
   * - before start => 0
   * - between      => proportional progress
   * - after end    => 1
   */
  private crackStartDate = new Date('January 13, 2026 15:20:00');
  private crackEndDate   = new Date('January 13, 2026 15:22:00');

  /**
   * 0..1 used by CSS to reveal the cracked overlay.
   * Bound to CSS variable: --crackProgress (% in template)
   */
  crackProgress = 0;

  // Your actual countdown target (you can keep it same as crackEndDate if you want)
  private targetDate = new Date('February 27, 2026 19:00:00');

  ngOnInit() {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 1000);

    this.scheduleRandomGlitch();
    this.scheduleRandomLightning();

    this.pickRandomName();
    this.nameIntervalId = setInterval(() => this.pickRandomName(), 500);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    clearTimeout(this.glitchTimeoutId);
    clearTimeout(this.lightningTimeoutId);
    clearInterval(this.nameIntervalId);
  }

  /** One tick updates both countdown + crack progress */
  private tick() {
    this.updateCountdown();
    this.updateCrackProgress();
  }

  private updateCrackProgress() {
    const now = Date.now();
    const start = this.crackStartDate.getTime();
    const end = this.crackEndDate.getTime();

    if (end <= start) {
      // misconfigured range => snap to done
      this.crackProgress = 1;
      return;
    }

    if (now <= start) {
      this.crackProgress = 0;
      return;
    }

    if (now >= end) {
      this.crackProgress = 1;
      return;
    }

    const p = (now - start) / (end - start);
    // clamp
    this.crackProgress = Math.max(0, Math.min(1, p));
  }

  private pickRandomName() {
    const index = Math.floor(Math.random() * this.names.length);
    this.currentName = this.names[index];
  }

  private updateCountdown() {
    const now = Date.now();
    const distance = this.targetDate.getTime() - now;

    if (distance <= 0) {
      this.days = 0;
      this.hours = this.minutes = this.seconds = '00';
      return;
    }

    this.days = Math.floor(distance / (1000 * 60 * 60 * 24));

    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    this.hours = String(h).padStart(2, '0');
    this.minutes = String(m).padStart(2, '0');
    this.seconds = String(s).padStart(2, '0');
  }

  private scheduleRandomGlitch() {
    const nextGlitchIn = Math.random() * 9000 + 1000; // 1–10s
    this.glitchTimeoutId = setTimeout(() => {
      this.triggerGlitch();
      this.scheduleRandomGlitch();
    }, nextGlitchIn);
  }

  private triggerGlitch() {
    this.glitch = true;
    const glitchDuration = Math.random() * 300 + 150; // 150–450ms
    setTimeout(() => (this.glitch = false), glitchDuration);
  }

  private scheduleRandomLightning() {
    const nextStrikeIn = Math.random() * 11000 + 1200; // 1.2–12s
    this.lightningTimeoutId = setTimeout(() => {
      this.triggerLightningCluster();
      this.scheduleRandomLightning();
    }, nextStrikeIn);
  }

  private triggerLightningCluster() {
    const flashes = Math.floor(Math.random() * 3) + 2; // 2–4
    const side: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
    const color: 'red' | 'green' = Math.random() < 0.5 ? 'red' : 'green';

    if (side === 'left') this.lightningLeftColor = color;
    else this.lightningRightColor = color;

    let i = 0;

    const doFlash = () => {
      if (i === 0) this.triggerShake();

      if (side === 'left') this.lightningLeft = true;
      else this.lightningRight = true;

      // optional: tiny glitch sync with lightning sometimes
      if (Math.random() > 0.6) {
        this.glitch = true;
        setTimeout(() => (this.glitch = false), 120);
      }

      const onMs = Math.random() * 120 + 90;  // 90–210ms
      const offMs = Math.random() * 140 + 70; // 70–210ms

      setTimeout(() => {
        if (side === 'left') this.lightningLeft = false;
        else this.lightningRight = false;

        i++;
        if (i < flashes) {
          setTimeout(doFlash, offMs);
        } else {
          if (side === 'left') this.lightningLeftColor = null;
          else this.lightningRightColor = null;
        }
      }, onMs);
    };

    doFlash();
  }

  private triggerShake() {
    this.shake = true;
    setTimeout(() => (this.shake = false), 260);
  }
}

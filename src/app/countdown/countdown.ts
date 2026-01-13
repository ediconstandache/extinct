// countdown.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Creates a UTC timestamp from a Romania-local date/time (Europe/Bucharest).
 * DST-safe using Intl timeZone conversion.
 *
 * month: 1..12
 */
function romaniaToUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): number {
  // First, make a UTC "guess" for the same wall-clock components
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);

  // Format that instant in Romania time, then read back its parts
  const roFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Bucharest',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = roFormatter.formatToParts(new Date(utcGuess));
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);

  // Interpret the Romania-local formatted parts as if they were UTC.
  // The delta between this and utcGuess encodes the Romania offset at that instant.
  const roAsUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );

  // Adjust: convert Romania wall-clock -> true UTC
  return utcGuess - (roAsUtc - utcGuess);
}

@Component({
  selector: 'app-countdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './countdown.html',
  styleUrls: ['./countdown.css']
})
export class Countdown implements OnInit, OnDestroy {
  // =========================
  // COUNTDOWN DISPLAY
  // =========================
  days = 0;
  hours = '00';
  minutes = '00';
  seconds = '00';

  // =========================
  // CRACK PROGRESS (0..1)
  // Used in HTML as: [style.--crackProgress.%]="crackProgress * 100"
  // =========================
  crackProgress = 0;

  // =========================
  // EFFECTS
  // =========================
  glitch = false;

  lightningLeft = false;
  lightningRight = false;

  lightningLeftColor: 'red' | 'green' | null = null;
  lightningRightColor: 'red' | 'green' | null = null;

  shake = false;

  // =========================
  // NAMES
  // =========================
  names: string[] = [
    'Tudor','Roberta','Alexia','Alin','Gelu','Maria','Mary','Raluca','Petru','Anca',
    'Andrei','Andrei','Luca','Victor','Eduard','Andrei','Anastasia','Ilinca','Ilinca',
    'Lucia','Mihai','Diana','Tiberiu','Maria','Stefan','Vlad','Ilinca','Andrada','Laura'
  ];
  currentName = '...';

  // =========================
  // TIMERS
  // =========================
  private intervalId: any;
  private glitchTimeoutId: any;
  private lightningTimeoutId: any;
  private nameIntervalId: any;

  // =========================
  // EDITABLE DATES (Romania local time)
  // =========================

  /**
   * Crack starts at this Romania local time.
   * Change these values to control when cracking begins.
   */
  private crackStartUtc = romaniaToUtc(2026, 1, 13, 16, 10, 0);

  /**
   * Crack completes at this Romania local time (fully cracked).
   * Change this for your deadline.
   */
  private crackEndUtc = romaniaToUtc(2026, 1, 13, 16, 40, 0);

  /**
   * Countdown target (Romania local time). Often same as crackEndUtc.
   * Change if you want different countdown vs crack deadline.
   */
  private countdownTargetUtc = romaniaToUtc(2026, 2, 27, 22, 0, 0);

  // =========================
  // LIFECYCLE
  // =========================
  ngOnInit() {
    // Initial render
    this.tick();

    // Update once per second
    this.intervalId = setInterval(() => this.tick(), 1000);

    // Visual effects scheduling
    this.scheduleRandomGlitch();
    this.scheduleRandomLightning();

    // Name cycling
    this.pickRandomName();
    this.nameIntervalId = setInterval(() => this.pickRandomName(), 500);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    clearTimeout(this.glitchTimeoutId);
    clearTimeout(this.lightningTimeoutId);
    clearInterval(this.nameIntervalId);
  }

  // =========================
  // MAIN TICK
  // =========================
  private tick() {
    this.updateCountdown();
    this.updateCrackProgress();
  }

  // =========================
  // CRACK PROGRESS
  // =========================
  private updateCrackProgress() {
    const now = Date.now();
    const start = this.crackStartUtc;
    const end = this.crackEndUtc;

    if (end <= start) {
      // misconfigured => snap done
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
    this.crackProgress = Math.max(0, Math.min(1, p));
  }

  // =========================
  // COUNTDOWN
  // =========================
  private updateCountdown() {
    const now = Date.now();
    const distance = this.countdownTargetUtc - now;

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

  // =========================
  // NAME PICKER
  // =========================
  private pickRandomName() {
    const index = Math.floor(Math.random() * this.names.length);
    this.currentName = this.names[index];
  }

  // =========================
  // GLITCH
  // =========================
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

  // =========================
  // LIGHTNING
  // =========================
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

      // sometimes sync a tiny glitch
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
          // clear color
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

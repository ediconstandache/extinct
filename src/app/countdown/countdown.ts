import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-countdown',
  standalone: true,
  templateUrl: './countdown.html',
  styleUrls: ['./countdown.css']
})
export class Countdown implements OnInit, OnDestroy {
  days = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;

  glitch = false;

  lightningLeft = false;
  lightningRight = false;

  private intervalId: any;
  private glitchTimeoutId: any;
  private lightningTimeoutId: any;

  private targetDate = new Date('February 27, 2026 19:00:00');

  ngOnInit() {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);

    this.scheduleRandomGlitch();
    this.scheduleRandomLightning();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    clearTimeout(this.glitchTimeoutId);
    clearTimeout(this.lightningTimeoutId);
  }

  private updateCountdown() {
    const now = Date.now();
    const distance = this.targetDate.getTime() - now;

    if (distance <= 0) {
      this.days = this.hours = this.minutes = this.seconds = 0;
      clearInterval(this.intervalId);
      return;
    }

    this.days = Math.floor(distance / (1000 * 60 * 60 * 24));
    this.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    this.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    this.seconds = Math.floor((distance % (1000 * 60)) / 1000);
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

  // Lightning: random side, clustered flashes (more realistic)
  private scheduleRandomLightning() {
    const nextStrikeIn = Math.random() * 11000 + 1200; // 1.2–12s
    this.lightningTimeoutId = setTimeout(() => {
      this.triggerLightningCluster();
      this.scheduleRandomLightning();
    }, nextStrikeIn);
  }

  private triggerLightningCluster() {
    const flashes = Math.floor(Math.random() * 3) + 2; // 2–4 flashes
    const side = Math.random() < 0.5 ? 'left' : 'right';

    let i = 0;
    const doFlash = () => {
      if (side === 'left') this.lightningLeft = true;
      else this.lightningRight = true;

      // optional: tiny glitch during lightning for extra creep
      if (Math.random() > 0.55) {
        this.glitch = true;
        setTimeout(() => (this.glitch = false), 120);
      }

      const onMs = Math.random() * 120 + 90;   // 90–210ms
      const offMs = Math.random() * 140 + 70;  // 70–210ms

      setTimeout(() => {
        if (side === 'left') this.lightningLeft = false;
        else this.lightningRight = false;

        i++;
        if (i < flashes) setTimeout(doFlash, offMs);
      }, onMs);
    };

    doFlash();
  }
}

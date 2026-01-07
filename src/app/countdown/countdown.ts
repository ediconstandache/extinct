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

  private intervalId: any;
  private glitchTimeoutId: any;

  private targetDate = new Date('February 27, 2026 19:00:00');

  ngOnInit() {
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);

    this.scheduleRandomGlitch();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    clearTimeout(this.glitchTimeoutId);
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

    setTimeout(() => {
      this.glitch = false;
    }, glitchDuration);
  }
}

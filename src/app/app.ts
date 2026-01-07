import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { Countdown } from './countdown/countdown';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Countdown],
  templateUrl: './app.html',
})
export class App {}

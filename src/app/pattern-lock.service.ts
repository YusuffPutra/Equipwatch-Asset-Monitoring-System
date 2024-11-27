import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PatternLockService {
  // Logic for initializing pattern lock
  initialize(canvasId: string): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }
}

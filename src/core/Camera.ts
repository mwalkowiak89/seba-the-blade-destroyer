import { CONFIG } from './Config';

/**
 * Kamera w stylu NES/Contra:
 *  - przewija się tylko w prawo, `x` nigdy nie maleje,
 *  - lewa krawędź ekranu to twarda ściana dla gracza,
 *  - `lock(x)` zatrzymuje kamerę (arena bossa).
 */
export class Camera {
  x = 0;
  y = 0;
  readonly width = CONFIG.view.width;
  readonly height = CONFIG.view.height;
  /** Maksymalne x (szerokość poziomu - szerokość ekranu). */
  maxX = Infinity;
  locked = false;
  private shakeTime = 0;
  private shakeDuration = 0;
  private shakeIntensity = 0;
  shakeX = 0;
  shakeY = 0;

  get right(): number { return this.x + this.width; }

  follow(targetX: number, dt: number): void {
    if (this.locked) return;
    const desired = targetX - this.width * CONFIG.camera.followFraction;
    if (desired > this.x) {
      const t = 1 - Math.exp(-CONFIG.camera.smoothing * dt);
      this.x += (desired - this.x) * t;
      // domykanie ostatnich subpikseli, żeby nie "pełzać"
      if (desired - this.x < 0.05) this.x = desired;
    }
    if (this.x > this.maxX) this.x = this.maxX;
  }

  /** Krótkie drżenie ekranu (px, s). Kolejne wywołanie nadpisuje tylko, gdy mocniejsze. */
  shake(intensity: number, duration: number): void {
    if (intensity < this.shakeIntensity && this.shakeTime > 0) return;
    this.shakeIntensity = intensity;
    this.shakeDuration = this.shakeTime = duration;
  }

  update(dt: number): void {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const k = this.shakeIntensity * (this.shakeTime / this.shakeDuration);
      this.shakeX = Math.round((Math.random() * 2 - 1) * k);
      this.shakeY = Math.round((Math.random() * 2 - 1) * k);
    } else {
      this.shakeX = this.shakeY = 0;
    }
  }

  lock(x: number): void {
    this.x = x;
    this.locked = true;
  }

  /** Czy prostokąt jest widoczny (z marginesem). */
  isVisible(x: number, y: number, w: number, h: number, margin = 0): boolean {
    return x + w > this.x - margin && x < this.right + margin && y + h > this.y - margin && y < this.y + this.height + margin;
  }

  applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.translate(-Math.round(this.x) + this.shakeX, -Math.round(this.y) + this.shakeY);
  }
}

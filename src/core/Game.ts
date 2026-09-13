import { CONFIG } from './Config';
import { Input } from './Input';
import { GameScene } from '../scenes/GameScene';

/**
 * Pętla gry: stały krok symulacji (60 Hz) + render co klatkę, całkowite skalowanie canvasu.
 */
export class Game {
  private ctx: CanvasRenderingContext2D;
  private input: Input;
  private scene: GameScene;
  private accumulator = 0;
  private lastTime = 0;
  private running = false;

  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = CONFIG.view.width;
    canvas.height = CONFIG.view.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Brak kontekstu 2D');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.input = new Input(window);
    this.scene = new GameScene(this.input);
    window.addEventListener('resize', () => this.fitToWindow());
    this.fitToWindow();
    canvas.focus();
  }

  private fitToWindow(): void {
    const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / CONFIG.view.width, window.innerHeight / CONFIG.view.height)));
    this.canvas.style.width = `${CONFIG.view.width * scale}px`;
    this.canvas.style.height = `${CONFIG.view.height * scale}px`;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  restart(): void {
    this.scene = new GameScene(this.input);
  }

  private frame(now: number): void {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0.25) dt = 0.25; // po powrocie z zakładki w tle
    this.accumulator += dt;

    const step = CONFIG.view.fixedStep;
    let steps = 0;
    while (this.accumulator >= step && steps < CONFIG.view.maxStepsPerFrame) {
      this.input.update();
      this.scene.update(step);
      if (this.scene.wantsRestart) this.restart();
      this.accumulator -= step;
      steps++;
    }
    if (steps === CONFIG.view.maxStepsPerFrame) this.accumulator = 0;

    this.scene.draw(this.ctx);
    requestAnimationFrame((t) => this.frame(t));
  }
}

import { CONFIG } from './Config';
import { Input } from './Input';
import { GameScene } from '../scenes/GameScene';
import { loadAllAssets } from '../assets/AssetLoader';
import { HUD } from '../ui/HUD';
import { AudioEngine } from '../audio/AudioEngine';

/**
 * Pętla gry: stały krok symulacji (60 Hz) + render co klatkę, całkowite skalowanie canvasu.
 */
export class Game {
  private ctx: CanvasRenderingContext2D;
  private input: Input;
  private scene: GameScene | null = null;
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  /** Wygładzone FPS (do nakładki debug F3). */
  private fps = 60;

  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = CONFIG.view.width;
    canvas.height = CONFIG.view.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Brak kontekstu 2D');
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.input = new Input(window);
    AudioEngine.hookUnlock();
    window.addEventListener('resize', () => this.fitToWindow());
    this.fitToWindow();
    canvas.focus();
  }

  private fitToWindow(): void {
    const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / CONFIG.view.width, window.innerHeight / CONFIG.view.height)));
    this.canvas.style.width = `${CONFIG.view.width * scale}px`;
    this.canvas.style.height = `${CONFIG.view.height * scale}px`;
  }

  /** Ładuje zasoby (ekran ładowania), tworzy scenę i startuje pętlę. */
  async start(): Promise<void> {
    if (this.running) return;
    HUD.drawLoading(this.ctx, 0, 1);
    try {
      await loadAllAssets((d, t) => HUD.drawLoading(this.ctx, d, t));
    } catch (e) {
      console.warn('Nie udało się załadować części zasobów – gra użyje placeholderów.', e);
    }
    this.scene = new GameScene(this.input);
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  restart(): void {
    this.scene = new GameScene(this.input);
  }

  private frame(now: number): void {
    if (!this.running || !this.scene) return;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    if (dt > 0) this.fps += (1 / dt - this.fps) * 0.1;
    if (dt > 0.25) dt = 0.25; // po powrocie z zakładki w tle
    this.accumulator += dt;

    const step = CONFIG.view.fixedStep;
    let steps = 0;
    while (this.accumulator >= step && steps < CONFIG.view.maxStepsPerFrame) {
      this.input.update();
      this.scene.update(step);
      if (this.scene.wantsRestart) this.restart();
      if (!this.scene) return;
      this.accumulator -= step;
      steps++;
    }
    if (steps === CONFIG.view.maxStepsPerFrame) this.accumulator = 0;

    this.scene.draw(this.ctx, this.fps);
    requestAnimationFrame((t) => this.frame(t));
  }
}

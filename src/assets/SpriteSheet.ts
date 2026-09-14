import type { AnimClip } from '../render/Visual';
import { CONFIG } from '../core/Config';

/** Wszystkie sheety mają gęstość pixelScale: 1 px sheetu = 1 px canvasu = 1/pixelScale jednostki świata. */
export const D = CONFIG.view.pixelScale;

export type AnchorMode = 'bottom' | 'center' | 'pivot';

export interface SheetDef {
  file: string;
  frameW: number;
  frameH: number;
  cols: number;
  clips: Record<string, AnimClip>;
  anchor?: AnchorMode;
  anchorX?: number;
  anchorY?: number;
}

/**
 * Sprite sheet o stałym rozmiarze klatki (odpowiednik SpriteFrames z Godota).
 * Klatki liczone rzędami. Kotwica mówi, który punkt klatki trafia w punkt encji.
 */
export class SpriteSheet {
  private white: HTMLCanvasElement | null = null;

  constructor(public readonly image: HTMLImageElement, public readonly def: SheetDef) {}

  /** Biała silhouetka sheetu (flash trafienia) – tworzona leniwie raz. */
  get flashImage(): HTMLCanvasElement {
    if (!this.white) {
      const c = document.createElement('canvas');
      c.width = this.image.width; c.height = this.image.height;
      const g = c.getContext('2d')!;
      g.drawImage(this.image, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, c.width, c.height);
      this.white = c;
    }
    return this.white;
  }

  get frameW(): number { return this.def.frameW; }
  get frameH(): number { return this.def.frameH; }

  clip(name: string): AnimClip | undefined { return this.def.clips[name]; }

  /** Indeks klatki dla klipu w czasie t (s). */
  frameAt(clipName: string, t: number, fallback = 'idle'): number {
    const clip = this.def.clips[clipName] ?? this.def.clips[fallback] ?? Object.values(this.def.clips)[0];
    const n = clip.frames.length;
    let i = Math.floor(Math.max(0, t) * clip.fps);
    i = clip.loop === false ? Math.min(i, n - 1) : i % n;
    return clip.frames[i];
  }

  clipDuration(clipName: string): number {
    const clip = this.def.clips[clipName];
    return clip ? clip.frames.length / clip.fps : 0;
  }

  /** Rozmiar klatki w jednostkach świata. */
  get worldW(): number { return this.frameW / D; }
  get worldH(): number { return this.frameH / D; }

  /**
   * Rysuje klatkę tak, aby punkt kotwicy (ax, ay w pikselach klatki) trafił w (x, y) świata.
   * flipX odbija względem kotwicy. Pozycje zaokrąglane do pełnych pikseli canvasu (pixel-perfect).
   */
  drawAnchored(ctx: CanvasRenderingContext2D, frame: number, x: number, y: number, ax: number, ay: number, opts: { flipX?: boolean; flipY?: boolean; rotation?: number; alpha?: number; flash?: boolean } = {}): void {
    const sx = (frame % this.def.cols) * this.frameW;
    const sy = Math.floor(frame / this.def.cols) * this.frameH;
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    ctx.translate(Math.round(x * D) / D, Math.round(y * D) / D);
    if (opts.rotation) ctx.rotate(opts.rotation);
    ctx.scale(opts.flipX ? -1 : 1, opts.flipY ? -1 : 1);
    ctx.drawImage(opts.flash ? this.flashImage : this.image, sx, sy, this.frameW, this.frameH, -ax / D, -ay / D, this.frameW / D, this.frameH / D);
    ctx.restore();
  }
}

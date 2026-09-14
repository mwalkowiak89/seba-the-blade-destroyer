import { CONFIG } from '../core/Config';
import type { SpriteSheet } from '../assets/SpriteSheet';

export interface ParallaxLayer {
  image: HTMLImageElement;
  /** Współczynnik przewijania względem kamery (0 = nieruchome, 1 = jak świat). */
  scroll: number;
  /** Pozycja pionowa górnej krawędzi obrazu na ekranie. */
  y: number;
  /** Czy powtarzać w poziomie. */
  repeat?: boolean;
  /** Dodatkowe przesunięcie X (px). */
  offsetX?: number;
  /** Przezroczystość warstwy (czytelność planu gry). */
  alpha?: number;
  /** Animowana nakładka (np. obracające się łopaty) – klatka z klipu wg czasu. */
  sheet?: SpriteSheet;
  clip?: string;
}

/**
 * Wielowarstwowe tło (odpowiednik ParallaxBackground). Rysowane w przestrzeni ekranu,
 * z przesunięciem zaokrąglonym do pełnych pikseli – brak "pływania" pikseli.
 */
export class Parallax {
  constructor(private layers: ParallaxLayer[]) {}

  draw(ctx: CanvasRenderingContext2D, camX: number, time = 0): void {
    const W = CONFIG.view.width * CONFIG.view.pixelScale;
    for (const l of this.layers) {
      const w = l.sheet ? l.sheet.frameW : l.image.width;
      const shift = Math.round(camX * CONFIG.view.pixelScale * l.scroll) - (l.offsetX ?? 0);
      ctx.globalAlpha = l.alpha ?? 1;
      if (l.repeat === false) { ctx.drawImage(l.image, -shift, l.y); continue; }
      let x = -(((shift % w) + w) % w);
      for (; x < W; x += w) {
        if (l.sheet) {
          const f = l.sheet.frameAt(l.clip ?? 'spin', time);
          const sx = (f % l.sheet.def.cols) * l.sheet.frameW, sy = Math.floor(f / l.sheet.def.cols) * l.sheet.frameH;
          ctx.drawImage(l.sheet.image, sx, sy, l.sheet.frameW, l.sheet.frameH, x, Math.round(l.y), l.sheet.frameW, l.sheet.frameH);
        } else ctx.drawImage(l.image, x, Math.round(l.y));
      }
    }
    ctx.globalAlpha = 1;
  }
}

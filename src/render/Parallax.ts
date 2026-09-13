import { CONFIG } from '../core/Config';

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
}

/**
 * Wielowarstwowe tło (odpowiednik ParallaxBackground). Rysowane w przestrzeni ekranu,
 * z przesunięciem zaokrąglonym do pełnych pikseli – brak "pływania" pikseli.
 */
export class Parallax {
  constructor(private layers: ParallaxLayer[]) {}

  draw(ctx: CanvasRenderingContext2D, camX: number): void {
    const W = CONFIG.view.width;
    for (const l of this.layers) {
      const w = l.image.width;
      const shift = Math.round(camX * l.scroll) - (l.offsetX ?? 0);
      ctx.globalAlpha = l.alpha ?? 1;
      if (l.repeat === false) { ctx.drawImage(l.image, -shift, l.y); continue; }
      let x = -(((shift % w) + w) % w);
      for (; x < W; x += w) ctx.drawImage(l.image, x, Math.round(l.y));
    }
    ctx.globalAlpha = 1;
  }
}

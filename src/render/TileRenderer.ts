import { MANIFEST } from '../assets/manifest.generated';
import { Images } from '../assets/AssetLoader';
import { Level, Tile } from '../world/Level';

type TileName = keyof typeof MANIFEST.tiles;

interface Deco { col: number; row: number; tile: TileName }

/**
 * Rysowanie planszy z tilesetu (odpowiednik TileMap z autotilingiem):
 *  - bloki pełne: płyta pancerna + nakładki krawędzi tam, gdzie sąsiad nie jest pełny,
 *  - platformy one-way: krata pomostowa z wspornikami na końcach,
 *  - dekoracje planu drugiego (słupy pod kratami, rury) wyliczane raz przy starcie.
 */
export class TileRenderer {
  private image: HTMLImageElement;
  private ts: number;
  private cols: number;
  private decos: Deco[] = [];
  /** Cała statyczna plansza wyrenderowana raz do offscreen canvasu – 1 drawImage na klatkę. */
  private cache: HTMLCanvasElement | null = null;

  constructor(private level: Level) {
    this.image = Images.get('tileset');
    this.ts = MANIFEST.images.tileset.tileSize;
    this.cols = MANIFEST.images.tileset.cols;
    this.buildDecorations();
    this.prerender();
  }

  private prerender(): void {
    if (typeof document === 'undefined') return;
    const c = document.createElement('canvas');
    c.width = this.level.widthPx; c.height = this.level.heightPx;
    const g = c.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    this.drawBackgroundDirect(g, 0, this.level.widthPx);
    this.drawTilesDirect(g, 0, this.level.widthPx);
    this.drawPlatformsDirect(g);
    this.cache = c;
  }

  /** Rysuje widoczny wycinek prerenderowanej planszy (tło + kafle). */
  draw(ctx: CanvasRenderingContext2D, camX: number, camW: number): void {
    if (!this.cache) { this.drawBackgroundDirect(ctx, camX, camW); this.drawTilesDirect(ctx, camX, camW); this.drawPlatformsDirect(ctx); return; }
    const x = Math.max(0, Math.floor(camX)), w = Math.min(this.cache.width - x, Math.ceil(camW) + 1);
    if (w > 0) ctx.drawImage(this.cache, x, 0, w, this.cache.height, x, 0, w, this.cache.height);
  }

  private blit(ctx: CanvasRenderingContext2D, tile: TileName, col: number, row: number): void {
    const idx = MANIFEST.tiles[tile];
    const sx = (idx % this.cols) * this.ts, sy = Math.floor(idx / this.cols) * this.ts;
    ctx.drawImage(this.image, sx, sy, this.ts, this.ts, col * this.ts, row * this.ts, this.ts, this.ts);
  }

  private buildDecorations(): void {
    const L = this.level;
    // słupy wsporcze pod końcami krat
    for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
      if (L.tileAt(c, r) !== Tile.OneWay) continue;
      const isEnd = L.tileAt(c - 1, r) !== Tile.OneWay || L.tileAt(c + 1, r) !== Tile.OneWay;
      if (!isEnd) continue;
      for (let k = 1; k <= 8 && r + k < L.rows; k++) {
        if (L.tileAt(c, r + k) !== Tile.Empty) break;
        this.decos.push({ col: c, row: r + k, tile: k === 1 ? 'columnTop' : 'column' });
      }
    }
    // rury pionowe na ziemi (deterministycznie co kilka kolumn, gdzie nad ziemią jest miejsce)
    for (let c = 0; c < L.cols; c++) {
      if ((c * 7 + 3) % 11 !== 0) continue;
      for (let r = 1; r < L.rows; r++) {
        if (L.tileAt(c, r) === Tile.Solid && L.tileAt(c, r - 1) === Tile.Empty) {
          const h = 2 + (c % 3);
          let ok = true;
          for (let k = 1; k <= h; k++) if (L.tileAt(c, r - k) !== Tile.Empty) ok = false;
          if (!ok) break;
          for (let k = 1; k <= h; k++) this.decos.push({ col: c, row: r - k, tile: k === h ? 'pipeTop' : 'pipe' });
          break;
        }
      }
    }
  }

  /**
   * Platformy semi-solid jako elementy placu montażu: łopaty na stojakach, sekcje wieży leżące poziomo,
   * a pod snajperami – dachy kontenerów technicznych. Kolizja pozostaje na górnej krawędzi kafla.
   */
  private drawPlatformsDirect(g: CanvasRenderingContext2D): void {
    const L = this.level, ts = this.ts;
    const sniperCols = new Set(L.markers.filter((m) => m.type === 'sniper').map((m) => `${m.col},${m.row + 1}`));
    let runIndex = 0;
    for (let r = 0; r < L.rows; r++) {
      for (let c = 0; c < L.cols; c++) {
        if (L.tileAt(c, r) !== Tile.OneWay || L.tileAt(c - 1, r) === Tile.OneWay) continue;
        let c1 = c; while (L.tileAt(c1 + 1, r) === Tile.OneWay) c1++;
        const x0 = c * ts, x1 = (c1 + 1) * ts, y = r * ts;
        let hasSniper = false; for (let k = c; k <= c1; k++) if (sniperCols.has(`${k},${r}`)) hasSniper = true;
        if (hasSniper) this.drawContainerRoof(g, x0, y, x1 - x0);
        else if (runIndex % 2 === 0) this.drawBladePlatform(g, x0, y, x1 - x0);
        else this.drawTowerPlatform(g, x0, y, x1 - x0);
        runIndex++;
        c = c1;
      }
    }
  }

  /** Łopata z włókna szklanego na żółtych stojakach montażowych (nasada po lewej, końcówka po prawej). */
  private drawBladePlatform(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const K = '#2b2f36', W1 = '#f4f6f8', W2 = '#c9cfd6', W3 = '#9aa3ad';
    for (let i = 0; i < w; i++) {
      const t = i / w;
      const th = Math.max(3, Math.round(8 * (1 - t * 0.6)));
      const top = y + 1 + Math.round(2 * t);
      g.fillStyle = W1; g.fillRect(x + i, top, 1, th);
      g.fillStyle = W2; g.fillRect(x + i, top + th - 2, 1, 1);
      g.fillStyle = W3; g.fillRect(x + i, top + th - 1, 1, 1);
      g.fillStyle = K; g.fillRect(x + i, top - 1, 1, 1); g.fillRect(x + i, top + th, 1, 1);
    }
    g.fillStyle = W2; g.fillRect(x, y, 5, 11); g.fillStyle = K; g.fillRect(x, y, 1, 11); // kołnierz nasady
    for (let sx = x + 6; sx < x + w - 6; sx += Math.max(32, w - 12)) { // stojaki
      g.fillStyle = '#f2c230'; g.fillRect(sx, y + 9, 6, 7); g.fillStyle = '#a88410'; g.fillRect(sx, y + 14, 6, 2); g.fillStyle = K; g.fillRect(sx - 1, y + 15, 8, 1);
    }
  }

  /** Cylindryczna sekcja wieży leżąca poziomo, na kołyskach. */
  private drawTowerPlatform(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const K = '#2b2f36';
    g.fillStyle = '#c9cfd6'; g.fillRect(x, y + 1, w, 14);
    g.fillStyle = '#f4f6f8'; g.fillRect(x, y + 2, w, 4);
    g.fillStyle = '#9aa3ad'; g.fillRect(x, y + 11, w, 3);
    g.fillStyle = K; g.fillRect(x, y, w, 1); g.fillRect(x, y + 15, w, 1);
    g.fillStyle = '#8a94a3'; g.fillRect(x, y, 3, 16); g.fillRect(x + w - 3, y, 3, 16); // kołnierze
    g.fillStyle = K; g.fillRect(x, y, 1, 16); g.fillRect(x + w - 1, y, 1, 16);
    for (let i = x + 10; i < x + w - 6; i += 14) { g.fillStyle = '#e5e9ef'; g.fillRect(i, y + 3, 1, 1); } // nity
    for (let sx = x + 4; sx < x + w - 8; sx += Math.max(28, w - 16)) { g.fillStyle = '#4a505c'; g.fillRect(sx, y + 13, 8, 3); g.fillStyle = K; g.fillRect(sx, y + 15, 8, 1); }
  }

  /** Dach kontenera technicznego (stanowisko snajpera). */
  private drawContainerRoof(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const K = '#2b2f36', base = '#2e86c1', dark = '#1f5f8a', light = '#5dade2';
    g.fillStyle = base; g.fillRect(x, y, w, 16);
    g.fillStyle = dark; for (let i = x + 2; i < x + w - 2; i += 3) g.fillRect(i, y + 2, 1, 13);
    g.fillStyle = light; g.fillRect(x, y, w, 1); g.fillRect(x + 3, y + 3, 8, 3);
    g.fillStyle = K; g.fillRect(x, y + 15, w, 1); g.fillRect(x, y, 1, 16); g.fillRect(x + w - 1, y, 1, 16);
    g.fillStyle = '#ffe36b'; g.fillRect(x + w - 4, y + 8, 1, 1); // zamek drzwi
    g.fillStyle = '#f2c230'; for (let i = x + 1; i < x + w - 1; i += 4) g.fillRect(i, y + 1, 2, 1); // pas ostrzegawczy na krawędzi dachu
  }

  /** Dekoracje – rysować przed encjami. */
  private drawBackgroundDirect(ctx: CanvasRenderingContext2D, camX: number, camW: number): void {
    const c0 = Math.floor(camX / this.ts) - 1, c1 = Math.ceil((camX + camW) / this.ts) + 1;
    for (const d of this.decos) if (d.col >= c0 && d.col <= c1) this.blit(ctx, d.tile, d.col, d.row);
  }

  private drawTilesDirect(ctx: CanvasRenderingContext2D, camX: number, camW: number): void {
    const L = this.level;
    const c0 = Math.max(0, Math.floor(camX / this.ts));
    const c1 = Math.min(L.cols - 1, Math.ceil((camX + camW) / this.ts));
    for (let r = 0; r < L.rows; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = L.tileAt(c, r);
        if (t === Tile.Solid) {
          this.blit(ctx, ((c * 31 + r * 17) % 5 === 0) ? 'plateB' : 'plate', c, r);
          if (L.tileAt(c, r - 1) !== Tile.Solid) this.blit(ctx, 'edgeTop', c, r);
          if (L.tileAt(c, r + 1) !== Tile.Solid && r + 1 < L.rows) this.blit(ctx, 'edgeBottom', c, r);
          if (L.tileAt(c - 1, r) !== Tile.Solid) this.blit(ctx, 'edgeLeft', c, r);
          if (L.tileAt(c + 1, r) !== Tile.Solid) this.blit(ctx, 'edgeRight', c, r);
        }
      }
    }
  }
}

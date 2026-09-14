import { MANIFEST } from '../assets/manifest.generated';
import { Images } from '../assets/AssetLoader';
import { CONFIG } from '../core/Config';
import { Level, Tile } from '../world/Level';

type TileName = keyof typeof MANIFEST.tiles;

interface Deco { col: number; row: number; tile: TileName }

/** Gęstość pikseli: kafel 16 jednostek świata = 16*D px. */
const D = CONFIG.view.pixelScale;

/**
 * Rysowanie planszy z tilesetu (odpowiednik TileMap z autotilingiem):
 *  - bloki pełne: płyta pancerna + nakładki krawędzi tam, gdzie sąsiad nie jest pełny,
 *  - platformy one-way: łopaty na stojakach / sekcje wieży / dachy kontenerów (pod snajperami),
 *  - dekoracje planu drugiego (słupy pod platformami, rury).
 * Wszystko prerenderowane raz do offscreen canvasu w pełnej gęstości – 1 drawImage na klatkę.
 */
export class TileRenderer {
  private image: HTMLImageElement;
  /** Rozmiar kafla w px źródła (tilesetu) i w jednostkach świata. */
  private ts: number;
  private wt: number;
  private cols: number;
  private decos: Deco[] = [];
  private cache: HTMLCanvasElement | null = null;

  constructor(private level: Level) {
    this.image = Images.get('tileset');
    this.ts = MANIFEST.images.tileset.tileSize;
    this.wt = MANIFEST.images.tileset.worldTile;
    this.cols = MANIFEST.images.tileset.cols;
    this.buildDecorations();
    this.prerender();
  }

  private prerender(): void {
    if (typeof document === 'undefined') return;
    const c = document.createElement('canvas');
    c.width = this.level.widthPx * D; c.height = this.level.heightPx * D;
    const g = c.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    this.drawAll(g);
    this.cache = c;
  }

  /** Rysuje w px canvasu (współrzędne świata × D). */
  private drawAll(g: CanvasRenderingContext2D): void {
    this.drawDecorations(g);
    this.drawTiles(g);
    this.drawPlatforms(g);
  }

  /** Rysuje widoczny wycinek prerenderowanej planszy (ctx ma już transformację świata). */
  draw(ctx: CanvasRenderingContext2D, camX: number, camW: number): void {
    if (!this.cache) { ctx.save(); ctx.scale(1 / D, 1 / D); this.drawAll(ctx); ctx.restore(); return; }
    const x = Math.max(0, Math.floor(camX)), w = Math.min(this.level.widthPx - x, Math.ceil(camW) + 1);
    if (w > 0) ctx.drawImage(this.cache, x * D, 0, w * D, this.cache.height, x, 0, w, this.level.heightPx);
  }

  private blit(g: CanvasRenderingContext2D, tile: TileName, col: number, row: number): void {
    const idx = MANIFEST.tiles[tile];
    const sx = (idx % this.cols) * this.ts, sy = Math.floor(idx / this.cols) * this.ts;
    g.drawImage(this.image, sx, sy, this.ts, this.ts, col * this.wt * D, row * this.wt * D, this.ts, this.ts);
  }

  private buildDecorations(): void {
    const L = this.level;
    // słupy wsporcze pod końcami platform
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

  private drawDecorations(g: CanvasRenderingContext2D): void {
    for (const d of this.decos) this.blit(g, d.tile, d.col, d.row);
  }

  private drawTiles(g: CanvasRenderingContext2D): void {
    const L = this.level;
    for (let r = 0; r < L.rows; r++) {
      for (let c = 0; c < L.cols; c++) {
        if (L.tileAt(c, r) !== Tile.Solid) continue;
        this.blit(g, ((c * 31 + r * 17) % 5 === 0) ? 'plateB' : 'plate', c, r);
        if (L.tileAt(c, r - 1) !== Tile.Solid) this.blit(g, 'edgeTop', c, r);
        if (L.tileAt(c, r + 1) !== Tile.Solid && r + 1 < L.rows) this.blit(g, 'edgeBottom', c, r);
        if (L.tileAt(c - 1, r) !== Tile.Solid) this.blit(g, 'edgeLeft', c, r);
        if (L.tileAt(c + 1, r) !== Tile.Solid) this.blit(g, 'edgeRight', c, r);
      }
    }
  }

  /**
   * Platformy semi-solid jako elementy placu montażu (w px canvasu = jednostki świata × D).
   * Kolizja pozostaje na górnej krawędzi kafla.
   */
  private drawPlatforms(g: CanvasRenderingContext2D): void {
    const L = this.level, wt = this.wt;
    const sniperCols = new Set(L.markers.filter((m) => m.type === 'sniper').map((m) => `${m.col},${m.row + 1}`));
    let runIndex = 0;
    for (let r = 0; r < L.rows; r++) {
      for (let c = 0; c < L.cols; c++) {
        if (L.tileAt(c, r) !== Tile.OneWay || L.tileAt(c - 1, r) === Tile.OneWay) continue;
        let c1 = c; while (L.tileAt(c1 + 1, r) === Tile.OneWay) c1++;
        const x0 = c * wt * D, x1 = (c1 + 1) * wt * D, y = r * wt * D;
        let hasSniper = false; for (let k = c; k <= c1; k++) if (sniperCols.has(`${k},${r}`)) hasSniper = true;
        if (hasSniper) this.drawContainerRoof(g, x0, y, x1 - x0);
        else if (runIndex % 2 === 0) this.drawBladePlatform(g, x0, y, x1 - x0);
        else this.drawTowerPlatform(g, x0, y, x1 - x0);
        runIndex++;
        c = c1;
      }
    }
  }

  private R(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }

  /** Łopata z włókna szklanego na żółtych stojakach montażowych (nasada po lewej, końcówka po prawej). */
  private drawBladePlatform(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const K = '#2b2f36', W1 = '#f4f6f8', W2 = '#dfe3e8', W3 = '#b9c0c9', W4 = '#8f98a3';
    const T = 16 * D;
    for (let i = 0; i < w; i++) {
      const t = i / w;
      const th = Math.max(5, Math.round(T * 0.55 * (1 - t * 0.55)));
      const top = y + 2 + Math.round(T * 0.12 * t);
      this.R(g, x + i, top, 1, th, W1);
      this.R(g, x + i, top + Math.floor(th * 0.55), 1, Math.ceil(th * 0.25), W2);
      this.R(g, x + i, top + th - 3, 1, 2, W3);
      this.R(g, x + i, top + th - 1, 1, 1, W4);
      this.R(g, x + i, top - 1, 1, 1, K); this.R(g, x + i, top + th, 1, 1, K);
    }
    // kołnierz nasady z otworami na śruby
    this.R(g, x, y, 10, T * 0.8, W3); this.R(g, x, y, 2, T * 0.8, K); for (let k = 4; k < T * 0.8 - 2; k += 6) this.R(g, x + 5, y + k, 2, 2, K);
    // stojaki montażowe (żółte kozły) z czarnymi stopami
    for (let sx = x + 12; sx < x + w - 12; sx += Math.max(64, w - 24)) {
      this.R(g, sx, y + T * 0.55, 12, T * 0.45, '#f2c230'); this.R(g, sx + 2, y + T * 0.6, 8, 2, '#ffe08a');
      this.R(g, sx, y + T * 0.55, 12, 1, K); this.R(g, sx, y + T - 3, 12, 3, '#2b2f36'); this.R(g, sx - 3, y + T - 2, 18, 2, K);
    }
  }

  /** Cylindryczna sekcja wieży leżąca poziomo, na kołyskach. */
  private drawTowerPlatform(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const K = '#2b2f36', T = 16 * D;
    this.R(g, x, y + 1, w, T - 2, '#c9cfd6');
    this.R(g, x, y + 3, w, T * 0.28, '#f4f6f8');
    this.R(g, x, y + T * 0.62, w, T * 0.25, '#9aa3ad');
    this.R(g, x, y + T * 0.87, w, T * 0.1, '#6f7a86');
    this.R(g, x, y, w, 1, K); this.R(g, x, y + T - 1, w, 1, K);
    // kołnierze z otworami
    for (const fx of [x, x + w - 6]) { this.R(g, fx, y - 1, 6, T + 2, '#8a94a3'); this.R(g, fx + 2, y + 1, 2, T - 2, '#b8c0ca'); for (let k = 3; k < T - 2; k += 6) this.R(g, fx + 2, y + k, 2, 2, K); }
    this.R(g, x, y - 1, 1, T + 2, K); this.R(g, x + w - 1, y - 1, 1, T + 2, K);
    for (let i = x + 20; i < x + w - 12; i += 28) { this.R(g, i, y + 6, 2, 2, '#ffffff'); this.R(g, i, y + T * 0.7, 2, 1, '#5e6873'); } // nity / szew
    // kołyski
    for (let sx = x + 8; sx < x + w - 16; sx += Math.max(56, w - 32)) { this.R(g, sx, y + T - 7, 16, 7, '#4a505c'); this.R(g, sx + 2, y + T - 6, 12, 1, '#7d8792'); this.R(g, sx, y + T - 1, 16, 1, K); }
  }

  /** Dach kontenera technicznego (stanowisko snajpera). */
  private drawContainerRoof(g: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const K = '#2b2f36', base = '#2e86c1', dark = '#1f5f8a', light = '#5dade2', T = 16 * D;
    this.R(g, x, y, w, T, base);
    for (let i = x + 4; i < x + w - 4; i += 6) this.R(g, i, y + 4, 2, T - 6, dark);
    this.R(g, x, y, w, 2, light); this.R(g, x + 6, y + 6, 16, 6, light); this.R(g, x + 8, y + 8, 12, 2, '#ffffff');
    this.R(g, x, y + T - 2, w, 2, K); this.R(g, x, y, 2, T, K); this.R(g, x + w - 2, y, 2, T, K);
    this.R(g, x + w - 8, y + T / 2, 2, 2, '#ffe36b'); // zamek drzwi
    for (let i = x + 2; i < x + w - 2; i += 8) this.R(g, i, y + 2, 4, 2, '#f2c230'); // pas ostrzegawczy
  }
}

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

  constructor(private level: Level) {
    this.image = Images.get('tileset');
    this.ts = MANIFEST.images.tileset.tileSize;
    this.cols = MANIFEST.images.tileset.cols;
    this.buildDecorations();
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

  /** Dekoracje – rysować przed encjami. */
  drawBackground(ctx: CanvasRenderingContext2D, camX: number, camW: number): void {
    const c0 = Math.floor(camX / this.ts) - 1, c1 = Math.ceil((camX + camW) / this.ts) + 1;
    for (const d of this.decos) if (d.col >= c0 && d.col <= c1) this.blit(ctx, d.tile, d.col, d.row);
  }

  drawTiles(ctx: CanvasRenderingContext2D, camX: number, camW: number): void {
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
        } else if (t === Tile.OneWay) {
          const l = L.tileAt(c - 1, r) !== Tile.OneWay, rr = L.tileAt(c + 1, r) !== Tile.OneWay;
          this.blit(ctx, l && rr ? 'grateLR' : l ? 'grateL' : rr ? 'grateR' : 'grate', c, r);
        }
      }
    }
  }
}

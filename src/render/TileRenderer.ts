import { MANIFEST } from '../assets/manifest.generated';
import { Images } from '../assets/AssetLoader';
import { CONFIG } from '../core/Config';
import { Level, Skin, Tile } from '../world/Level';

type TileName = keyof typeof MANIFEST.tiles;

interface Deco { col: number; row: number; tile: TileName }

const D = CONFIG.view.pixelScale;

/**
 * Rysowanie planszy z tilesetu (odpowiednik TileMap) – wyłącznie blity kafli PNG, zero rysowania kształtów:
 *  - bloki pełne: blacha ryflowana + nakładki krawędzi tam, gdzie sąsiad nie jest pełny,
 *  - platformy one-way: łopata na kozłach / sekcja wieży na kołyskach / dach kontenera (pod snajperami),
 *  - dekoracje planu drugiego (słupy, rury).
 * Wszystko prerenderowane raz do offscreen canvasu – 1 drawImage na klatkę.
 */
export class TileRenderer {
  private image: HTMLImageElement;
  private ts: number;
  private cols: number;
  private decos: Deco[] = [];
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
    c.width = this.level.widthPx * D; c.height = this.level.heightPx * D;
    const g = c.getContext('2d');
    if (!g) return;
    g.imageSmoothingEnabled = false;
    g.scale(D, D);
    this.drawAll(g);
    this.cache = c;
  }

  private drawAll(g: CanvasRenderingContext2D): void {
    for (const d of this.decos) this.blit(g, d.tile, d.col, d.row);
    this.drawTiles(g);
    this.drawPlatforms(g);
  }

  /** Rysuje widoczny wycinek prerenderowanej planszy (ctx ma już transformację świata). */
  draw(ctx: CanvasRenderingContext2D, camX: number, camW: number): void {
    if (!this.cache) { this.drawAll(ctx); return; }
    const x = Math.max(0, Math.floor(camX)), w = Math.min(this.level.widthPx - x, Math.ceil(camW) + 1);
    if (w > 0) ctx.drawImage(this.cache, x * D, 0, w * D, this.cache.height, x, 0, w, this.level.heightPx);
  }

  private blit(g: CanvasRenderingContext2D, tile: TileName, col: number, row: number): void {
    const idx = MANIFEST.tiles[tile];
    const sx = (idx % this.cols) * this.ts, sy = Math.floor(idx / this.cols) * this.ts;
    g.drawImage(this.image, sx, sy, this.ts, this.ts, col * this.ts, row * this.ts, this.ts, this.ts);
  }

  /** Typ platformy dla runu one-way: skin L = wielka łopata, pod snajperem kontener, dalej naprzemiennie łopata / sekcja wieży. */
  private platformKind(c0: number, c1: number, r: number, runIndex: number): 'container' | 'blade' | 'tower' | 'bigBlade' {
    if (this.level.skinAt(c0, r) === Skin.BigBlade) return 'bigBlade';
    for (const m of this.level.markers) if (m.type === 'sniper' && m.row + 1 === r && m.col >= c0 && m.col <= c1) return 'container';
    return runIndex % 2 === 0 ? 'blade' : 'tower';
  }

  private forEachRun(fn: (c0: number, c1: number, r: number, kind: 'container' | 'blade' | 'tower' | 'bigBlade') => void): void {
    const L = this.level;
    let runIndex = 0;
    for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
      if (L.tileAt(c, r) !== Tile.OneWay || L.tileAt(c - 1, r) === Tile.OneWay) continue;
      let c1 = c; while (L.tileAt(c1 + 1, r) === Tile.OneWay) c1++;
      fn(c, c1, r, this.platformKind(c, c1, r, runIndex));
      runIndex++;
      c = c1;
    }
  }

  private buildDecorations(): void {
    const L = this.level;
    // podpory pod platformami: kozły (łopata) / kołyski (sekcja wieży) w kaflu poniżej końców, dalej słupy w dół
    this.forEachRun((c0, c1, r, kind) => {
      if (kind === 'container') return;
      if (kind === 'bigBlade') {
        // duże kozły pod 1/4 i 3/4 długości, od rzędu pod spodem łopaty do ziemi
        for (const c of new Set([c0 + Math.floor((c1 - c0) / 4), c1 - Math.floor((c1 - c0) / 4)])) {
          for (let k = 2; k <= 10 && r + k < L.rows; k++) {
            if (L.tileAt(c, r + k) !== Tile.Empty) break;
            const last = r + k + 1 >= L.rows || L.tileAt(c, r + k + 1) !== Tile.Empty;
            this.decos.push({ col: c, row: r + k, tile: last ? 'trestleBigFoot' : 'trestleBig' });
          }
        }
        return;
      }
      const ends = c1 - c0 >= 2 ? [c0 + 1, c1 - 1] : [c0, c1];
      for (const c of new Set(ends)) {
        for (let k = 1; k <= 8 && r + k < L.rows; k++) {
          if (L.tileAt(c, r + k) !== Tile.Empty) break;
          this.decos.push({ col: c, row: r + k, tile: k === 1 ? (kind === 'blade' ? 'trestle' : 'cradle') : k === 2 ? 'columnTop' : 'column' });
        }
      }
    });
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

  private drawTiles(g: CanvasRenderingContext2D): void {
    const L = this.level;
    const isCont = (c: number, r: number) => L.tileAt(c, r) === Tile.Solid && L.skinAt(c, r) === Skin.Container;
    for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
      if (L.tileAt(c, r) !== Tile.Solid) continue;
      if (isCont(c, r)) {
        // blok kontenerów: dach na górnym rzędzie, ściany boczne na krańcach
        const l = !isCont(c - 1, r), rr = !isCont(c + 1, r), top = !isCont(c, r - 1);
        const t: TileName = top ? (l && rr ? 'contLR' : l ? 'contL' : rr ? 'contR' : 'contM') : (l && rr ? 'contBLR' : l ? 'contBL' : rr ? 'contBR' : 'contBM');
        this.blit(g, t, c, r);
        continue;
      }
      this.blit(g, ((c * 31 + r * 17) % 5 === 0) ? 'plateB' : 'plate', c, r);
      if (L.tileAt(c, r - 1) !== Tile.Solid) this.blit(g, 'edgeTop', c, r);
      if (L.tileAt(c, r + 1) !== Tile.Solid && r + 1 < L.rows) this.blit(g, 'edgeBottom', c, r);
      if (L.tileAt(c - 1, r) !== Tile.Solid) this.blit(g, 'edgeLeft', c, r);
      if (L.tileAt(c + 1, r) !== Tile.Solid) this.blit(g, 'edgeRight', c, r);
    }
  }

  private drawPlatforms(g: CanvasRenderingContext2D): void {
    this.forEachRun((c0, c1, r, kind) => {
      for (let c = c0; c <= c1; c++) {
        const first = c === c0, last = c === c1;
        let t: TileName;
        if (kind === 'bigBlade') {
          this.blit(g, first ? 'bigRootT' : last ? 'bigTipT' : 'bigMidT', c, r);
          if (r + 1 < this.level.rows && this.level.tileAt(c, r + 1) === Tile.Empty) this.blit(g, first ? 'bigRootB' : last ? 'bigTipB' : 'bigMidB', c, r + 1);
          continue;
        }
        if (kind === 'blade') t = first ? 'bladeRoot' : last ? 'bladeTip' : 'bladeMid';
        else if (kind === 'tower') t = first && last ? 'towerM' : first ? 'towerL' : last ? 'towerR' : 'towerM';
        else t = first && last ? 'contLR' : first ? 'contL' : last ? 'contR' : 'contM';
        this.blit(g, t, c, r);
      }
    });
  }
}

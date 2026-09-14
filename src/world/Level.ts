import { CONFIG } from '../core/Config';

export enum Tile { Empty = 0, Solid = 1, OneWay = 2 }

export type MarkerType = 'player' | 'sniper' | 'drone' | 'runnerSpawner' | 'bossArena' | 'boss';

export interface Marker {
  type: MarkerType;
  /** Pozycja w pikselach (lewy-górny róg kafla). */
  x: number;
  y: number;
  col: number;
  row: number;
}

/** Legenda znaków tilemapy ASCII. */
const TILE_CHARS: Record<string, Tile> = { '#': Tile.Solid, '=': Tile.OneWay };
const MARKER_CHARS: Record<string, MarkerType> = {
  P: 'player', S: 'sniper', D: 'drone', R: 'runnerSpawner', B: 'bossArena', X: 'boss',
};

/**
 * Poziom = siatka kafli 16px + lista markerów. Kolizje odpytują siatkę bezpośrednio
 * (`tileAt`), rysowanie to zwykłe prostokąty (placeholder – do podmiany na tileset).
 */
export class Level {
  readonly tileSize = CONFIG.view.tile;
  readonly cols: number;
  readonly rows: number;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly markers: Marker[] = [];
  private tiles: Uint8Array;

  /**
   * @param screens tablica "ekranów" – każdy to 15 wierszy po 20 znaków; sklejane poziomo.
   */
  constructor(screens: string[][]) {
    const screenCols = CONFIG.view.width / this.tileSize;
    this.rows = CONFIG.view.levelHeight / this.tileSize;
    this.cols = screens.length * screenCols;
    this.widthPx = this.cols * this.tileSize;
    this.heightPx = this.rows * this.tileSize;
    this.tiles = new Uint8Array(this.cols * this.rows);

    screens.forEach((screen, si) => {
      if (screen.length !== this.rows) throw new Error(`Ekran ${si}: oczekiwano ${this.rows} wierszy, jest ${screen.length}`);
      screen.forEach((line, r) => {
        if (line.length !== screenCols) throw new Error(`Ekran ${si}, wiersz ${r}: oczekiwano ${screenCols} znaków, jest ${line.length}`);
        for (let c = 0; c < screenCols; c++) {
          const ch = line[c];
          const col = si * screenCols + c;
          const tile = TILE_CHARS[ch];
          if (tile !== undefined) this.tiles[r * this.cols + col] = tile;
          const marker = MARKER_CHARS[ch];
          if (marker) this.markers.push({ type: marker, col, row: r, x: col * this.tileSize, y: r * this.tileSize });
        }
      });
    });
  }

  tileAt(col: number, row: number): Tile {
    if (col < 0 || col >= this.cols) return Tile.Solid; // ściany na krańcach poziomu
    if (row < 0 || row >= this.rows) return Tile.Empty;  // góra/dół otwarte (szczeliny = śmierć)
    return this.tiles[row * this.cols + col] as Tile;
  }

  isSolidAtPx(px: number, py: number): boolean {
    return this.tileAt(Math.floor(px / this.tileSize), Math.floor(py / this.tileSize)) === Tile.Solid;
  }

  findMarker(type: MarkerType): Marker | undefined {
    return this.markers.find((m) => m.type === type);
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camW: number): void {
    const ts = this.tileSize;
    const c0 = Math.max(0, Math.floor(camX / ts));
    const c1 = Math.min(this.cols - 1, Math.ceil((camX + camW) / ts));
    for (let r = 0; r < this.rows; r++) {
      for (let c = c0; c <= c1; c++) {
        const t = this.tiles[r * this.cols + c];
        if (t === Tile.Solid) {
          ctx.fillStyle = '#4a4f5c';
          ctx.fillRect(c * ts, r * ts, ts, ts);
          ctx.fillStyle = '#5d6375';
          ctx.fillRect(c * ts + 1, r * ts + 1, ts - 2, ts - 2);
          // "śruba" DIY w rogu kafla
          ctx.fillStyle = '#2b2e37';
          ctx.fillRect(c * ts + 3, r * ts + 3, 2, 2);
        } else if (t === Tile.OneWay) {
          ctx.fillStyle = '#c9a227';
          ctx.fillRect(c * ts, r * ts, ts, 4);
          ctx.fillStyle = '#7a6118';
          ctx.fillRect(c * ts, r * ts + 4, ts, 2);
        }
      }
    }
  }
}

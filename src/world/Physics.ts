import { Level, Tile } from './Level';

export interface Body { x: number; y: number; w: number; h: number; vx: number; vy: number }

export interface MoveResult {
  onGround: boolean;
  onOneWay: boolean;
  hitWall: boolean;
  hitCeiling: boolean;
}

export interface MoveOptions {
  /** Ignoruj platformy jednokierunkowe (zeskok w dół). */
  dropThrough?: boolean;
}

const EPS = 0.001;

/**
 * Przesuwa ciało o (dx, dy) z kolizją względem siatki kafli – osobno X, potem Y.
 * Duże przesunięcia dzielone są na podkroki ≤ rozmiar kafla, żeby nic nie przeleciało przez ścianę.
 */
export function moveAndCollide(body: Body, level: Level, dx: number, dy: number, opts: MoveOptions = {}): MoveResult {
  const res: MoveResult = { onGround: false, onOneWay: false, hitWall: false, hitCeiling: false };
  const ts = level.tileSize;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / (ts - 1)));
  const sx = dx / steps;
  const sy = dy / steps;

  for (let i = 0; i < steps; i++) {
    if (sx !== 0) moveX(body, level, sx, res);
    if (sy !== 0) moveY(body, level, sy, res, opts);
  }
  // Test stania na ziemi, gdy nie było ruchu w dół (np. vy == 0 na płaskim).
  if (dy >= 0 && !res.onGround) res.onGround = probeGround(body, level, opts);
  return res;
}

function moveX(b: Body, level: Level, dx: number, res: MoveResult): void {
  const ts = level.tileSize;
  const newX = b.x + dx;
  const r0 = Math.floor(b.y / ts);
  const r1 = Math.floor((b.y + b.h - EPS) / ts);
  if (dx > 0) {
    const col = Math.floor((newX + b.w - EPS) / ts);
    for (let r = r0; r <= r1; r++) {
      if (level.tileAt(col, r) === Tile.Solid) {
        b.x = col * ts - b.w;
        b.vx = 0;
        res.hitWall = true;
        return;
      }
    }
  } else {
    const col = Math.floor(newX / ts);
    for (let r = r0; r <= r1; r++) {
      if (level.tileAt(col, r) === Tile.Solid) {
        b.x = (col + 1) * ts;
        b.vx = 0;
        res.hitWall = true;
        return;
      }
    }
  }
  b.x = newX;
}

function moveY(b: Body, level: Level, dy: number, res: MoveResult, opts: MoveOptions): void {
  const ts = level.tileSize;
  const newY = b.y + dy;
  const c0 = Math.floor(b.x / ts);
  const c1 = Math.floor((b.x + b.w - EPS) / ts);
  if (dy > 0) {
    const oldBottom = b.y + b.h;
    const newBottom = newY + b.h;
    const row = Math.floor((newBottom - EPS) / ts);
    for (let c = c0; c <= c1; c++) {
      const t = level.tileAt(c, row);
      if (t === Tile.Solid) {
        b.y = row * ts - b.h;
        b.vy = 0;
        res.onGround = true;
        return;
      }
      // Platforma jednokierunkowa: koliduje tylko z góry, gdy poprzednia pozycja była nad jej krawędzią.
      if (t === Tile.OneWay && !opts.dropThrough) {
        const top = row * ts;
        if (oldBottom <= top + EPS && newBottom >= top) {
          b.y = top - b.h;
          b.vy = 0;
          res.onGround = true;
          res.onOneWay = true;
          return;
        }
      }
    }
  } else {
    const row = Math.floor(newY / ts);
    for (let c = c0; c <= c1; c++) {
      if (level.tileAt(c, row) === Tile.Solid) {
        b.y = (row + 1) * ts;
        b.vy = 0;
        res.hitCeiling = true;
        return;
      }
    }
  }
  b.y = newY;
}

/** Czy tuż pod stopami jest podłoże (Solid lub OneWay z dokładnie ustawioną krawędzią). */
export function probeGround(b: Body, level: Level, opts: MoveOptions = {}): boolean {
  const ts = level.tileSize;
  const bottom = b.y + b.h;
  const row = Math.floor((bottom + 1) / ts);
  const c0 = Math.floor(b.x / ts);
  const c1 = Math.floor((b.x + b.w - EPS) / ts);
  for (let c = c0; c <= c1; c++) {
    const t = level.tileAt(c, row);
    if (t === Tile.Solid) return true;
    if (t === Tile.OneWay && !opts.dropThrough && Math.abs(row * ts - bottom) < 1) return true;
  }
  return false;
}

/** Czy ciało stoi wyłącznie na platformach jednokierunkowych (można zeskoczyć). */
export function standsOnOneWayOnly(b: Body, level: Level): boolean {
  const ts = level.tileSize;
  const bottom = b.y + b.h;
  const row = Math.floor((bottom + 1) / ts);
  const c0 = Math.floor(b.x / ts);
  const c1 = Math.floor((b.x + b.w - EPS) / ts);
  let any = false;
  for (let c = c0; c <= c1; c++) {
    const t = level.tileAt(c, row);
    if (t === Tile.Solid) return false;
    if (t === Tile.OneWay) any = true;
  }
  return any;
}

/** Czy pod CAŁĄ szerokością ciała jest podłoże (bezpieczne miejsce respawnu). */
export function fullySupported(b: Body, level: Level): boolean {
  const ts = level.tileSize;
  const row = Math.floor((b.y + b.h + 1) / ts);
  const c0 = Math.floor(b.x / ts);
  const c1 = Math.floor((b.x + b.w - EPS) / ts);
  for (let c = c0; c <= c1; c++) {
    if (level.tileAt(c, row) === Tile.Empty) return false;
  }
  return true;
}

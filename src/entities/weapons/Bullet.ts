import { Pool } from '../../core/Pool';
import type { WorldContext } from '../../scenes/WorldContext';
import { Sheets } from '../../assets/AssetLoader';
import { CONFIG } from '../../core/Config';
import { Sfx } from '../../render/Audio';
import { Tile } from '../../world/Level';
import { rectsOverlap } from '../../core/MathUtil';

export type BulletOwner = 'player' | 'enemy';
export type BulletKind = 'default' | 'saw' | 'bolt' | 'shard' | 'mine' | 'nacelle';

/** Pocisk – prosta trajektoria (opcjonalnie z grawitacją dla "ładunków" drona). */
export class Bullet {
  active = false;
  owner: BulletOwner = 'player';
  x = 0; y = 0; vx = 0; vy = 0;
  radius = 2;
  damage = 10;
  life = 0;
  gravity = 0;
  /** Czy pocisk znika po trafieniu w teren (pociski wrogów w Contrze przelatują przez teren). */
  hitsTerrain = true;
  color = '#fff';
  age = 0;
  kind: BulletKind = 'default';
  /** Po rykoszecie pocisk gracza nie zadaje obrażeń. */
  spent = false;
}

export interface BulletSpawn {
  owner: BulletOwner;
  x: number; y: number;
  vx: number; vy: number;
  damage: number;
  radius?: number;
  life?: number;
  gravity?: number;
  hitsTerrain?: boolean;
  color?: string;
  kind?: BulletKind;
}

export function nacelleBounds(b: Bullet): { x: number; y: number; w: number; h: number } {
  const { width: w, height: h } = CONFIG.boss.nacelle;
  return { x: b.x - w / 2, y: b.y - h / 2, w, h };
}

export function bulletHitsRect(b: Bullet, rect: { x: number; y: number; w: number; h: number }): boolean {
  const box = b.kind === 'nacelle' ? nacelleBounds(b) : { x: b.x - b.radius, y: b.y - b.radius, w: b.radius * 2, h: b.radius * 2 };
  return rectsOverlap(box.x, box.y, box.w, box.h, rect.x, rect.y, rect.w, rect.h);
}

export function nacelleImpact(world: WorldContext, b: Bullet): void {
  world.fx.spawn('explosion', b.x, b.y);
  world.camera.shake(4, .22); Sfx.play('slam', .7);
  world.particles.emit({ x: b.x, y: b.y, count: 15, color: ['#eef0dd', '#93a9af', '#ffb972'],
    speed: [45, 170], life: [.2, .4], gravity: 400, angle: [-Math.PI, 0], spreadX: 16 });
}

function nacelleHitsTerrain(b: Bullet, oldBottom: number, world: WorldContext): boolean {
  const box = nacelleBounds(b), ts = world.level.tileSize;
  for (let row = Math.floor(box.y / ts); row <= Math.floor((box.y + box.h) / ts); row++) {
    for (let col = Math.floor(box.x / ts); col <= Math.floor((box.x + box.w) / ts); col++) {
      const tile = world.level.tileAt(col, row);
      if (tile === Tile.Solid || (tile === Tile.OneWay && b.vy > 0 && oldBottom <= row * ts && box.y + box.h >= row * ts)) return true;
    }
  }
  return false;
}

/** Rozbryzg iskier w punkcie uderzenia w metal + animacja trafienia. */
export function impactSparks(world: WorldContext, x: number, y: number, vx: number, vy: number): void {
  const back = Math.atan2(-vy, -vx);
  Sfx.play('saw_hit', 0.5);
  world.fx.spawn('shotHit', x, y, { rotation: Math.atan2(vy, vx) });
  world.particles.emit({
    x, y, count: CONFIG.vfx.impactSparks, color: ['#ffe36b', '#ffb300', '#ffffff'],
    speed: [40, 130], life: [0.12, 0.35], size: [1, 1.6], gravity: 380, angle: [back - 0.9, back + 0.9],
  });
}

/** Wyładowanie elektryczne: poszarpana linia wzdłuż kierunku lotu, migająca. */
function drawBolt(ctx: CanvasRenderingContext2D, b: Bullet): void {
  const n = Math.hypot(b.vx, b.vy) || 1, dx = b.vx / n, dy = b.vy / n;
  const seg = 4, segs = 4;
  ctx.strokeStyle = Math.floor(b.age * 40) % 2 ? '#dff6ff' : '#5ec8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  let x = b.x - dx * seg * segs / 2, y = b.y - dy * seg * segs / 2;
  ctx.moveTo(Math.round(x), Math.round(y));
  for (let i = 1; i <= segs; i++) {
    const off = (i % 2 ? 1 : -1) * 2 * Math.sin(b.age * 60 + i);
    x += dx * seg; y += dy * seg;
    ctx.lineTo(Math.round(x - dy * off), Math.round(y + dx * off));
  }
  ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
}

/** Odłamek kompozytu: obracający się jasny prostokąt z ciemną krawędzią. */
function drawShard(ctx: CanvasRenderingContext2D, b: Bullet): void {
  ctx.save();
  ctx.translate(Math.round(b.x), Math.round(b.y));
  ctx.rotate(b.age * 9);
  ctx.fillStyle = '#e5e9ef'; ctx.fillRect(-4, -2, 8, 4);
  ctx.fillStyle = '#7d8794'; ctx.fillRect(-4, 1, 8, 1);
  ctx.fillStyle = '#2b2f36'; ctx.fillRect(2, -2, 2, 1);
  ctx.restore();
}

/** Mina energetyczna zrzucana przez drona: pulsujący rdzeń + poświata. */
function drawMine(ctx: CanvasRenderingContext2D, b: Bullet): void {
  const r = b.radius + Math.sin(b.age * 18) * 1;
  ctx.fillStyle = 'rgba(94,200,255,0.35)';
  ctx.beginPath(); ctx.arc(b.x, b.y, r + 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = Math.floor(b.age * 12) % 2 ? '#5ec8ff' : '#dff6ff';
  ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2b2f36'; ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
}

/** Pool pocisków. Aktualizacja/rysowanie w jednym miejscu, brak alokacji w pętli gry. */
export class BulletPool {
  private pool: Pool<Bullet>;

  constructor(size: number) {
    this.pool = new Pool(size, () => new Bullet());
  }

  spawn(s: BulletSpawn): Bullet | null {
    const b = this.pool.spawn();
    if (!b) return null;
    b.owner = s.owner;
    b.x = s.x; b.y = s.y; b.vx = s.vx; b.vy = s.vy;
    b.damage = s.damage;
    b.radius = s.radius ?? 2;
    b.life = s.life ?? 2;
    b.gravity = s.gravity ?? 0;
    b.hitsTerrain = s.hitsTerrain ?? (s.owner === 'player');
    b.color = s.color ?? (s.owner === 'player' ? '#ffe36b' : '#ff6b6b');
    b.age = 0;
    b.kind = s.kind ?? (s.owner === 'enemy' ? 'saw' : 'default');
    b.spent = false;
    return b;
  }

  update(dt: number, world: WorldContext): void {
    const cam = world.camera;
    this.pool.forEachActive((b) => {
      b.life -= dt;
      b.age += dt;
      if (b.kind === 'nacelle') {
        const oldBottom = b.y + CONFIG.boss.nacelle.height / 2;
        b.x += b.vx * dt;
        b.y += b.vy * dt + .5 * b.gravity * dt * dt;
        b.vy += b.gravity * dt;
        if (b.hitsTerrain && nacelleHitsTerrain(b, oldBottom, world)) {
          nacelleImpact(world, b); b.active = false;
        } else if (b.life <= 0 || !cam.isVisible(b.x - 24, b.y - 14, 48, 28, 64)) b.active = false;
        return;
      }
      b.vy += b.gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (
        b.life <= 0 ||
        !cam.isVisible(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2, 24) ||
        (b.hitsTerrain && world.level.isSolidAtPx(b.x, b.y))
      ) {
        if (b.hitsTerrain && b.life > 0) impactSparks(world, b.x, b.y, b.vx, b.vy);
        b.active = false;
      }
    });
  }

  forEachActive(fn: (b: Bullet) => void): void { this.pool.forEachActive(fn); }
  clear(): void { this.pool.clear(); }

  draw(ctx: CanvasRenderingContext2D): void {
    const screw = Sheets.tryGet('screw'), saw = Sheets.tryGet('saw');
    this.pool.forEachActive((b) => {
      if (b.owner === 'player' && screw) {
        // wirujący wkręt montażowy obrócony w kierunku lotu
        screw.drawAnchored(ctx, screw.frameAt('spin', b.age), b.x, b.y, screw.def.anchorX ?? 10, screw.def.anchorY ?? 3, { rotation: Math.atan2(b.vy, b.vx) });
        return;
      }
      if (b.owner === 'enemy') {
        if (b.kind === 'nacelle') {
          const nacelle = Sheets.tryGet('nacelle');
          if (nacelle) nacelle.drawAnchored(ctx, 0, b.x, b.y, 24, 14, { flipX: b.vx > 0 });
          else { const box = nacelleBounds(b); ctx.fillStyle = '#dce2d4'; ctx.fillRect(box.x, box.y, box.w, box.h); }
          return;
        }
        const sheet = b.kind === 'bolt' ? Sheets.tryGet('bolt') : b.kind === 'shard' ? Sheets.tryGet('shard') : b.kind === 'mine' ? Sheets.tryGet('mine') : saw;
        if (sheet) {
          const clip = b.kind === 'bolt' ? 'fly' : b.kind === 'mine' ? 'pulse' : 'spin';
          const rotation = b.kind === 'bolt' ? Math.atan2(b.vy, b.vx) : b.kind === 'shard' ? Math.round(b.age * 6) * (Math.PI / 2) : b.kind === 'mine' ? 0 : Math.round(b.age * 8) * (Math.PI / 4);
          sheet.drawAnchored(ctx, sheet.frameAt(clip, b.age), b.x, b.y, sheet.def.anchorX ?? 6, sheet.def.anchorY ?? 6, { rotation });
          return;
        }
        if (b.kind === 'bolt') { drawBolt(ctx, b); return; }
        if (b.kind === 'shard') { drawShard(ctx, b); return; }
        if (b.kind === 'mine') { drawMine(ctx, b); return; }
      }
      ctx.fillStyle = b.color;
      if (b.owner === 'player') {
        // wydłużony "pocisk" w kierunku lotu
        const len = 5;
        const n = Math.hypot(b.vx, b.vy) || 1;
        const dx = (b.vx / n) * len, dy = (b.vy / n) * len;
        ctx.lineWidth = b.radius * 2;
        ctx.strokeStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.x - dx, b.y - dy);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 1, 1);
      }
    });
  }
}

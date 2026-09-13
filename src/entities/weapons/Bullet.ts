import { Pool } from '../../core/Pool';
import type { WorldContext } from '../../scenes/WorldContext';
import { Sheets } from '../../assets/AssetLoader';
import { CONFIG } from '../../core/Config';

export type BulletOwner = 'player' | 'enemy';

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
}

/** Rozbryzg iskier w punkcie uderzenia w metal + animacja trafienia. */
export function impactSparks(world: WorldContext, x: number, y: number, vx: number, vy: number): void {
  const back = Math.atan2(-vy, -vx);
  world.fx.spawn('shotHit', x, y, { rotation: Math.atan2(vy, vx) });
  world.particles.emit({
    x, y, count: CONFIG.vfx.impactSparks, color: ['#ffe36b', '#ffb300', '#ffffff'],
    speed: [40, 130], life: [0.12, 0.35], size: [1, 1.6], gravity: 380, angle: [back - 0.9, back + 0.9],
  });
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
    return b;
  }

  update(dt: number, world: WorldContext): void {
    const cam = world.camera;
    this.pool.forEachActive((b) => {
      b.life -= dt;
      b.age += dt;
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
    const shot = Sheets.tryGet('shot'), saw = Sheets.tryGet('saw');
    this.pool.forEachActive((b) => {
      if (b.owner === 'player' && shot) {
        // pocisk energetyczny obrócony w kierunku lotu
        shot.drawAnchored(ctx, shot.frameAt('fly', b.age), b.x, b.y, shot.def.anchorX ?? 8, shot.def.anchorY ?? 5, { rotation: Math.atan2(b.vy, b.vx) });
        return;
      }
      if (b.owner === 'enemy' && saw) {
        // wirujące ostrze piły
        saw.drawAnchored(ctx, saw.frameAt('spin', b.age), b.x, b.y, 5, 5, { rotation: b.age * 14 });
        return;
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

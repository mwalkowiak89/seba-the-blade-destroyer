import { Pool } from '../../core/Pool';
import type { WorldContext } from '../../scenes/WorldContext';

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
    return b;
  }

  update(dt: number, world: WorldContext): void {
    const cam = world.camera;
    this.pool.forEachActive((b) => {
      b.life -= dt;
      b.vy += b.gravity * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (
        b.life <= 0 ||
        !cam.isVisible(b.x - b.radius, b.y - b.radius, b.radius * 2, b.radius * 2, 24) ||
        (b.hitsTerrain && world.level.isSolidAtPx(b.x, b.y))
      ) {
        if (b.hitsTerrain && b.life > 0) world.particles.emit({ x: b.x, y: b.y, count: 3, color: '#bbb', speed: [10, 40], life: [0.1, 0.25] });
        b.active = false;
      }
    });
  }

  forEachActive(fn: (b: Bullet) => void): void { this.pool.forEachActive(fn); }
  clear(): void { this.pool.clear(); }

  draw(ctx: CanvasRenderingContext2D): void {
    this.pool.forEachActive((b) => {
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

import { Pool } from '../core/Pool';
import { randRange } from '../core/MathUtil';
import { CONFIG } from '../core/Config';

class Particle {
  active = false;
  x = 0; y = 0; vx = 0; vy = 0;
  life = 0; maxLife = 0;
  size = 2;
  color = '#fff';
  gravity = 0;
}

/** Lekki system cząstek na placeholdery efektów (trafienia, eksplozje, dym). */
export class ParticleSystem {
  private pool = new Pool(256, () => new Particle());

  emit(opts: {
    x: number; y: number; count: number;
    speed?: [number, number]; life?: [number, number]; size?: [number, number];
    color?: string | string[]; gravity?: number; angle?: [number, number]; spreadX?: number; spreadY?: number;
  }): void {
    // limity wydajnościowe: <= maxPerEmit cząstek na emisję, czas życia <= maxLife
    const count = Math.min(opts.count, CONFIG.vfx.maxParticlesPerEmit);
    const maxLife = CONFIG.vfx.maxParticleLife;
    for (let i = 0; i < count; i++) {
      const p = this.pool.spawn();
      if (!p) return;
      const [a0, a1] = opts.angle ?? [0, Math.PI * 2];
      const ang = randRange(a0, a1);
      const spd = randRange(...(opts.speed ?? [20, 80]));
      p.x = opts.x + randRange(-(opts.spreadX ?? 0), opts.spreadX ?? 0);
      p.y = opts.y + randRange(-(opts.spreadY ?? 0), opts.spreadY ?? 0);
      p.vx = Math.cos(ang) * spd;
      p.vy = Math.sin(ang) * spd;
      const [l0, l1] = opts.life ?? [0.2, 0.4];
      p.maxLife = p.life = randRange(Math.min(l0, maxLife), Math.min(l1, maxLife));
      p.size = randRange(...(opts.size ?? [1, 3]));
      p.gravity = opts.gravity ?? 0;
      const c = opts.color ?? '#ffffff';
      p.color = Array.isArray(c) ? c[Math.floor(Math.random() * c.length)] : c;
    }
  }

  update(dt: number): void {
    this.pool.forEachActive((p) => {
      p.life -= dt;
      if (p.life <= 0) { p.active = false; return; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.pool.forEachActive((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      const s = Math.max(1, Math.round(p.size));
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
    });
    ctx.globalAlpha = 1;
  }

  clear(): void { this.pool.clear(); }
}

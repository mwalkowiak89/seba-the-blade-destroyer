import { CONFIG } from '../../core/Config';
import { PlaceholderVisual } from '../../render/Visual';
import { moveAndCollide } from '../../world/Physics';
import { Tile } from '../../world/Level';
import { EnemyBase } from './EnemyBase';
import type { WorldContext } from '../../scenes/WorldContext';

const R = CONFIG.enemies.runner;

/**
 * Biegacz: spawn z prawej krawędzi ekranu, biegnie prosto na gracza ze stałą prędkością,
 * przeskakuje niskie przeszkody (1-2 kafle), spada z krawędzi platform.
 */
export class Runner extends EnemyBase {
  visual = new PlaceholderVisual({ color: '#e0563c', accent: '#fff', outline: '#7a2a1a' });
  private anim = 'run';

  constructor(x: number, y: number) {
    super('runner', R.hp, R.contactDamage, R.score);
    this.w = R.width;
    this.h = R.height;
    this.x = x;
    this.y = y;
    this.facing = -1;
  }

  update(dt: number, world: WorldContext): void {
    const player = world.player;
    const dir: 1 | -1 = player.cx < this.cx ? -1 : 1;
    this.facing = dir;
    this.vx = dir * R.speed;

    if (this.onGround && this.shouldJump(world)) {
      this.vy = R.jumpVelocity;
      this.onGround = false;
    }

    this.vy = Math.min(this.vy + CONFIG.physics.gravity * dt, CONFIG.physics.maxFallSpeed);
    const res = moveAndCollide(this, world.level, this.vx * dt, this.vy * dt);
    this.onGround = res.onGround;
    if (res.onGround && this.vy > 0) this.vy = 0;
    this.anim = this.onGround ? 'run' : 'jump';

    this.postUpdate(dt, world);
  }

  /** Przeszkoda na wysokości stóp przed biegaczem → skok. */
  private shouldJump(world: WorldContext): boolean {
    const lvl = world.level;
    const ts = lvl.tileSize;
    const probeX = this.facing > 0 ? this.x + this.w + R.obstacleLookahead : this.x - R.obstacleLookahead;
    const col = Math.floor(probeX / ts);
    const footRow = Math.floor((this.bottom - 1) / ts);
    return lvl.tileAt(col, footRow) === Tile.Solid || lvl.tileAt(col, footRow - 1) === Tile.Solid;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // "nogi" – prosty placeholder animacji biegu: przesunięcie w pionie
    const bob = this.anim === 'run' ? Math.round(Math.sin(this.age * 22) * 1) : 0;
    ctx.save();
    ctx.translate(0, bob);
    this.drawVisual(ctx, this.anim);
    ctx.restore();
  }
}

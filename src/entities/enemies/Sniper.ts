import { CONFIG } from '../../core/Config';
import { normalize } from '../../core/MathUtil';
import { Sfx } from '../../render/Audio';
import { PlaceholderVisual } from '../../render/Visual';
import { EnemyBase } from './EnemyBase';
import type { WorldContext } from '../../scenes/WorldContext';

const S = CONFIG.enemies.sniper;

type SniperMode = 'idle' | 'aim' | 'cooldown';

/**
 * Snajper: statyczny, rozstawiony na podwyższeniu. Cykl: idle → celowanie (telegraf) → strzał
 * pojedynczym pociskiem w aktualną pozycję gracza → cooldown.
 */
export class Sniper extends EnemyBase {
  visual = new PlaceholderVisual({ color: '#8e44ad', accent: '#f1c40f', barrel: true, barrelLength: 12, outline: '#4a1f5c' });
  private mode: SniperMode = 'cooldown';
  private timer = S.fireInterval * 0.5;
  private aimDir = { x: -1, y: 0 };

  constructor(x: number, y: number) {
    super('sniper', S.hp, S.contactDamage, S.score);
    this.w = S.width;
    this.h = S.height;
    // marker to kafel nad podłożem – dosuwamy stopy do dolnej krawędzi kafla
    this.x = x + (CONFIG.view.tile - this.w) / 2;
    this.y = y + CONFIG.view.tile - this.h;
    this.facing = -1;
  }

  update(dt: number, world: WorldContext): void {
    const player = world.player;
    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    this.facing = dx < 0 ? -1 : 1;
    const inRange = Math.hypot(dx, dy) <= S.range && world.camera.isVisible(this.x, this.y, this.w, this.h);

    this.timer -= dt;
    switch (this.mode) {
      case 'cooldown':
        if (this.timer <= 0 && inRange) {
          this.mode = 'aim';
          this.timer = S.aimTime;
          Sfx.play('sniper_aim');
        }
        break;
      case 'aim':
        // śledzi gracza aż do momentu strzału
        this.aimDir = normalize(dx, dy);
        if (this.timer <= 0) {
          if (!player.isDead) {
            world.fireEnemyBullet(this.cx + this.aimDir.x * 8, this.cy + this.aimDir.y * 8, this.aimDir.x, this.aimDir.y, S.bulletSpeed, S.bulletDamage);
          }
          this.mode = 'cooldown';
          this.timer = S.fireInterval;
        }
        break;
      case 'idle':
        break;
    }
    this.postUpdate(dt, world);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const aiming = this.mode === 'aim';
    // telegraf: podczas celowania miga kolor
    const tint = aiming && Math.floor(this.age * 16) % 2 === 0 ? '#c56cf0' : undefined;
    this.drawVisual(ctx, aiming ? 'aim' : 'idle', { aim: aiming ? this.aimDir : { x: this.facing, y: 0 }, tint });
  }
}

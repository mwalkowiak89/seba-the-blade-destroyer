import { CONFIG } from '../../core/Config';
import { normalize } from '../../core/MathUtil';
import { Sfx } from '../../render/Audio';
import { PlaceholderVisual, SpriteSheetVisual } from '../../render/Visual';
import { EnemyBase } from './EnemyBase';
import type { WorldContext } from '../../scenes/WorldContext';

const S = CONFIG.enemies.sniper;

type SniperMode = 'idle' | 'aim' | 'cooldown';

/**
 * Snajper: statyczny, rozstawiony na podwyższeniu. Cykl: idle → celowanie (telegraf) → strzał
 * pojedynczym pociskiem w aktualną pozycję gracza → cooldown.
 */
export class Sniper extends EnemyBase {
  visual = new SpriteSheetVisual('turret', { placeholder: new PlaceholderVisual({ color: '#8e44ad', accent: '#f1c40f', barrel: true, barrelLength: 12, outline: '#4a1f5c' }) });
  private modeTime = 0;
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

  override reset(x: number, y: number): void {
    super.reset(x + (CONFIG.view.tile - this.w) / 2, y + CONFIG.view.tile - this.h);
  }

  protected override onReset(): void { this.mode = 'cooldown'; this.timer = S.fireInterval * 0.5; this.modeTime = 0; this.facing = -1; }

  update(dt: number, world: WorldContext): void {
    const player = world.player;
    const dx = player.cx - this.cx;
    const dy = player.cy - this.cy;
    this.facing = dx < 0 ? -1 : 1;
    const inRange = Math.hypot(dx, dy) <= S.range && world.camera.isVisible(this.x, this.y, this.w, this.h);

    this.timer -= dt;
    this.modeTime += dt;
    switch (this.mode) {
      case 'cooldown':
        if (this.timer <= 0 && inRange) {
          this.mode = 'aim';
          this.modeTime = 0;
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
          this.modeTime = 0;
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
    // telegraf: celownik laserowy w stronę gracza (kropkowana linia, narasta)
    if (aiming) {
      const len = 40 + (1 - this.timer / S.aimTime) * 80;
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(this.age * 20));
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = '#ff3b3b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(this.cx) + 0.5, Math.round(this.cy) + 0.5);
      ctx.lineTo(Math.round(this.cx + this.aimDir.x * len) + 0.5, Math.round(this.cy + this.aimDir.y * len) + 0.5);
      ctx.stroke();
      ctx.restore();
    }
    this.visual.draw(ctx, { x: this.x, y: this.y, w: this.w, h: this.h, facing: this.facing, anim: this.mode, time: this.modeTime, flash: this.hitFlash > 0, aim: aiming ? this.aimDir : { x: this.facing, y: 0 } });
  }
}

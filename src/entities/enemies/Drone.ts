import { CONFIG } from '../../core/Config';
import { normalize } from '../../core/MathUtil';
import { Sfx } from '../../render/Audio';
import { PlaceholderVisual, SpriteSheetVisual } from '../../render/Visual';
import { EnemyBase } from './EnemyBase';
import type { WorldContext } from '../../scenes/WorldContext';

const D = CONFIG.enemies.drone;

type DroneMode = 'patrol' | 'charge' | 'return';

/**
 * Dron: patroluje poziomo wokół punktu spawnu po sinusoidzie. Okresowo:
 *  - gracz pod nim → zrzuca ładunek (pocisk z grawitacją),
 *  - w przeciwnym razie → szarżuje w stronę gracza i wraca na trasę.
 */
export class Drone extends EnemyBase {
  visual = new SpriteSheetVisual('drone', { fallback: 'patrol', placeholder: new PlaceholderVisual({ color: '#1abc9c', accent: '#fff', shape: 'diamond', faceMarker: false }) });
  private mode: DroneMode = 'patrol';
  private originX: number;
  private originY: number;
  private patrolT = 0;
  private attackTimer = D.attackInterval;
  private chargeTimer = 0;
  private chargeDir = { x: 0, y: 0 };
  /** Dron serwisowy (wsparcie bossa): krąży w arenie i ostrzeliwuje gracza wyładowaniami. */
  service = false;
  private serviceTimer = 1.2;

  constructor(x: number, y: number) {
    super('drone', D.hp, D.contactDamage, D.score);
    this.w = D.width;
    this.h = D.height;
    this.originX = x;
    this.originY = y;
    this.x = x;
    this.y = y;
    this.facing = -1;
  }

  protected override onReset(): void {
    this.originX = this.x; this.originY = this.y; this.mode = 'patrol'; this.patrolT = 0; this.attackTimer = D.attackInterval; this.facing = -1;
    this.service = false; this.serviceTimer = 1.2;
  }

  /** Włącza tryb serwisowy: brak despawnu, ostrzał zamiast min/szarż. */
  setService(): void { this.service = true; this.despawnOffscreen = false; }

  update(dt: number, world: WorldContext): void {
    const player = world.player;
    switch (this.mode) {
      case 'patrol': {
        this.patrolT += dt;
        const px = this.originX + Math.sin(this.patrolT * (D.patrolSpeed / D.patrolRange)) * D.patrolRange;
        const py = this.originY + Math.sin(this.patrolT * D.waveFrequency * Math.PI * 2) * D.waveAmplitude;
        this.facing = px < this.x ? -1 : 1;
        this.x = px;
        this.y = py + Math.sin(this.age * 9) * 1.5; // delikatny bobbing lewitacji

        if (this.service) {
          this.serviceTimer -= dt;
          if (this.serviceTimer <= 0 && !player.isDead) {
            this.serviceTimer = 2.2;
            const d = normalize(player.cx - this.cx, player.cy - this.cy);
            world.fireEnemyBullet(this.cx, this.bottom, d.x, d.y, 170, 10, { kind: 'bolt', radius: 3 });
            Sfx.play('zap', 0.6);
          }
          break;
        }
        this.attackTimer -= dt;
        if (this.attackTimer <= 0 && world.camera.isVisible(this.x, this.y, this.w, this.h) && !player.isDead) {
          this.attackTimer = D.attackInterval;
          if (Math.abs(player.cx - this.cx) <= D.bombWindowX && player.cy > this.cy) {
            this.dropBomb(world);
          } else {
            this.startCharge(world);
          }
        }
        break;
      }
      case 'charge': {
        this.chargeTimer -= dt;
        this.x += this.chargeDir.x * D.chargeSpeed * dt;
        this.y += this.chargeDir.y * D.chargeSpeed * dt;
        if (this.chargeTimer <= 0) this.mode = 'return';
        break;
      }
      case 'return': {
        const tx = this.originX, ty = this.originY;
        const d = normalize(tx - this.x, ty - this.y);
        const dist = Math.hypot(tx - this.x, ty - this.y);
        const step = D.chargeSpeed * 0.6 * dt;
        if (dist <= step) { this.x = tx; this.y = ty; this.mode = 'patrol'; this.patrolT = 0; }
        else { this.x += d.x * step; this.y += d.y * step; }
        this.facing = d.x < 0 ? -1 : 1;
        break;
      }
    }
    this.postUpdate(dt, world);
  }

  private dropBomb(world: WorldContext): void {
    Sfx.play('drone_bomb');
    // pionowa mina energetyczna – opada wolno, znika na terenie
    world.fireEnemyBullet(this.cx, this.bottom + 2, 0, 1, D.bombSpeed * 0.4, D.bombDamage, { gravity: 260, radius: 4, kind: 'mine', hitsTerrain: true, life: 5 });
  }

  private startCharge(world: WorldContext): void {
    const p = world.player;
    this.chargeDir = normalize(p.cx - this.cx, p.cy - this.cy);
    this.chargeTimer = D.chargeTime;
    this.mode = 'charge';
    this.facing = this.chargeDir.x < 0 ? -1 : 1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // poświata silnika przy szarży
    if (this.mode === 'charge') {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ff7a1a';
      ctx.fillRect(Math.round(this.cx) - 2, Math.round(this.bottom), 4, 3);
      ctx.restore();
    }
    this.drawVisual(ctx, this.mode, { tint: this.mode === 'charge' ? '#ff7675' : undefined });
  }
}

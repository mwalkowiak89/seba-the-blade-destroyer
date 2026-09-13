import { Sfx } from '../../render/Audio';
import { Entity } from '../Entity';
import { HealthComponent } from '../HealthComponent';
import type { WorldContext } from '../../scenes/WorldContext';

/**
 * Baza przeciwnika: zdrowie, punkty, obrażenia kontaktowe, flash po trafieniu,
 * despawn po wyjściu za lewą krawędź kamery lub pod poziom.
 */
export abstract class EnemyBase extends Entity {
  health: HealthComponent;
  hitFlash = 0;
  /** Czy pociski gracza mogą go trafić (np. boss podczas intro). */
  vulnerable = true;
  /** Czy despawnować, gdy zostanie za kamerą. */
  despawnOffscreen = true;

  constructor(
    public readonly kind: string,
    hp: number,
    public readonly contactDamage: number,
    public readonly scoreValue: number,
  ) {
    super();
    this.health = new HealthComponent(hp);
  }

  /** Trafienie pociskiem gracza. */
  takeHit(damage: number, world: WorldContext): void {
    if (!this.vulnerable || !this.alive) return;
    if (!this.health.takeDamage(damage)) return;
    this.hitFlash = 0.08;
    Sfx.play('enemy_hit');
    if (this.health.isDead) this.die(world);
  }

  die(world: WorldContext): void {
    if (!this.alive) return;
    this.alive = false;
    world.addScore(this.scoreValue);
    world.events.emit('enemy:died', { enemy: this });
    Sfx.play('enemy_die');
    this.deathEffect(world);
  }

  protected deathEffect(world: WorldContext): void {
    world.particles.emit({
      x: this.cx, y: this.cy, count: 14, color: ['#ff9f43', '#ffdd59', '#ffffff', '#666'],
      speed: [40, 140], life: [0.25, 0.6], size: [1, 4], gravity: 300,
    });
  }

  /** Wspólna część update – wywołać na końcu `update` podklasy. */
  protected postUpdate(dt: number, world: WorldContext): void {
    this.age += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.despawnOffscreen && (this.x + this.w < world.camera.x - 48 || this.y > world.level.heightPx + 64)) {
      this.alive = false;
    }
  }

  /** Kontakt z graczem – domyślnie obrażenia kontaktowe. */
  onTouchPlayer(world: WorldContext): void {
    world.player.takeDamage(this.contactDamage, this.cx, world);
  }

  protected drawVisual(ctx: CanvasRenderingContext2D, anim: string, extra: { aim?: { x: number; y: number }; tint?: string; rotation?: number } = {}): void {
    this.visual.draw(ctx, {
      x: this.x, y: this.y, w: this.w, h: this.h,
      facing: this.facing, anim, time: this.age,
      flash: this.hitFlash > 0,
      ...extra,
    });
  }
}

import { CONFIG } from '../../core/Config';
import type { Input } from '../../core/Input';
import { clamp } from '../../core/MathUtil';
import { Sfx } from '../../render/Audio';
import { PlaceholderVisual, type Visual } from '../../render/Visual';
import { fullySupported, moveAndCollide } from '../../world/Physics';
import { Entity } from '../Entity';
import { HealthComponent } from '../HealthComponent';
import { MakitaGun } from '../weapons/MakitaGun';
import type { WeaponBase } from '../weapons/WeaponBase';
import type { WorldContext } from '../../scenes/WorldContext';
import { resolveAim } from './Aim';
import { DEAD, FALL, HURT, IDLE, type PlayerState } from './PlayerStates';

const P = CONFIG.player;

/**
 * "Seba" – kontroler gracza. Logika ruchu żyje w stanach (PlayerStates.ts),
 * tutaj: fizyka, strzelanie, obrażenia, ograniczenia kamery, respawn ze szczeliny.
 */
export class PlayerController extends Entity {
  visual: Visual = new PlaceholderVisual({ color: '#3d7bff', accent: '#ffb347', barrel: true, barrelLength: 8, outline: '#1b3a80' });
  health = new HealthComponent(P.maxHp, P.invulnTime);
  weapon: WeaponBase = new MakitaGun();
  state: PlayerState = IDLE;
  aim = { x: 1, y: 0 };

  // dane stanów
  somersaultTime = -1;
  hurtTimer = 0;
  knockbackDir: 1 | -1 = -1;
  private dropThroughTimer = 0;
  private lastSafe = { x: 0, y: 0 };
  private stateTime = 0;

  constructor(public input: Input, x: number, y: number) {
    super();
    this.w = P.width;
    this.h = P.standHeight;
    this.x = x;
    this.y = y;
    this.lastSafe = { x, y };
    this.health.onDeath = () => { Sfx.play('game_over'); };
  }

  get isDead(): boolean { return this.state === DEAD; }

  // ---- FSM ---------------------------------------------------------------
  setState(next: PlayerState, world: WorldContext): void {
    if (next === this.state) return;
    this.state.exit(this, world);
    this.state = next;
    this.stateTime = 0;
    next.enter(this, world);
  }

  setStanding(): void {
    if (this.h === P.standHeight) return;
    this.y -= P.standHeight - this.h;
    this.h = P.standHeight;
  }

  setCrouching(): void {
    if (this.h === P.crouchHeight) return;
    this.y += this.h - P.crouchHeight;
    this.h = P.crouchHeight;
  }

  startDropThrough(): void {
    this.dropThroughTimer = P.dropThroughTime;
    this.vy = 40;
    this.onGround = false;
  }

  // ---- Obrażenia ---------------------------------------------------------
  /** @param sourceX pozycja źródła obrażeń – decyduje o kierunku odrzutu. */
  takeDamage(amount: number, sourceX: number, world: WorldContext): boolean {
    if (this.isDead) return false;
    if (!this.health.takeDamage(amount)) return false;
    this.knockbackDir = sourceX > this.cx ? -1 : 1;
    world.events.emit('player:damaged', { amount });
    world.particles.emit({ x: this.cx, y: this.cy, count: 8, color: ['#ff4d4d', '#ffffff'], speed: [30, 90], life: [0.2, 0.4] });
    if (this.health.isDead) {
      this.setState(DEAD, world);
      world.events.emit('player:died', undefined);
    } else {
      Sfx.play('hurt');
      this.setState(HURT, world);
    }
    return true;
  }

  // ---- Update ------------------------------------------------------------
  update(dt: number, world: WorldContext): void {
    this.age += dt;
    this.stateTime += dt;
    this.health.update(dt);
    this.weapon.update(dt);
    if (this.dropThroughTimer > 0) this.dropThroughTimer -= dt;

    this.state.update(this, dt, world);

    // grawitacja
    this.vy = Math.min(this.vy + CONFIG.physics.gravity * dt, CONFIG.physics.maxFallSpeed);

    const res = moveAndCollide(this, world.level, this.vx * dt, this.vy * dt, { dropThrough: this.dropThroughTimer > 0 });
    this.onGround = res.onGround;
    if (res.onGround) {
      if (this.vy > 0) this.vy = 0;
      // bezpieczny respawn tylko, gdy stoimy całą szerokością na podłożu (nie na krawędzi szczeliny)
      if (fullySupported(this, world.level)) {
        this.lastSafe.x = this.x;
        this.lastSafe.y = this.y;
      }
    }

    this.clampToCamera(world);
    this.checkPit(world);

    // celowanie i ogień automatyczny
    const aim = resolveAim(this.input, this.state.name, this.facing);
    if (aim) {
      this.aim = aim;
      if (this.input.held('fire')) this.fire(world);
    }
  }

  /** Lewa krawędź ekranu = ściana; w arenie bossa także prawa. */
  private clampToCamera(world: WorldContext): void {
    const cam = world.camera;
    if (this.x < cam.x) { this.x = cam.x; if (this.vx < 0) this.vx = 0; }
    if (cam.locked && this.x + this.w > cam.right) { this.x = cam.right - this.w; if (this.vx > 0) this.vx = 0; }
  }

  private checkPit(world: WorldContext): void {
    if (this.y <= world.level.heightPx + 24 || this.isDead) return;
    this.takeDamage(P.pitDamage, this.cx, world);
    // respawn na ostatnim bezpiecznym gruncie (na ekranie)
    this.x = clamp(this.lastSafe.x, world.camera.x + 4, world.camera.right - this.w - 4);
    this.y = this.lastSafe.y - 8;
    this.vx = 0;
    this.vy = 0;
    if (!this.isDead) this.setState(FALL, world);
  }

  private fire(world: WorldContext): void {
    const bx = this.cx + this.aim.x * (this.w / 2 + 4);
    const by = this.cy - 1 + this.aim.y * (this.h / 2 + 2);
    if (this.weapon.tryFire(world.playerBullets, bx, by, this.aim.x, this.aim.y)) {
      Sfx.play('shoot');
      world.particles.emit({ x: bx, y: by, count: 2, color: '#ffe36b', speed: [10, 30], life: [0.05, 0.1], size: [1, 2] });
    }
  }

  // ---- Render ------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D): void {
    // miganie w i-frames
    if (this.health.isInvulnerable && !this.isDead) {
      if (Math.floor(this.health.invulnRemaining * P.flashHz) % 2 === 0) return;
    }
    const rotation = this.somersaultTime >= 0
      ? (this.somersaultTime / P.somersaultDuration) * Math.PI * 2 * P.somersaultTurns * this.facing
      : 0;
    this.visual.draw(ctx, {
      x: this.x, y: this.y, w: this.w, h: this.h,
      facing: this.facing,
      anim: this.state.name,
      time: this.stateTime,
      aim: this.aim,
      rotation,
      tint: this.isDead ? '#666' : this.state.name === 'hurt' ? '#ff8080' : undefined,
    });
  }
}

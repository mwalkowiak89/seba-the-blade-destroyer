import { CONFIG } from '../../core/Config';
import type { Input } from '../../core/Input';
import { clamp } from '../../core/MathUtil';
import { Sfx } from '../../render/Audio';
import { PlaceholderVisual, SpriteSheetVisual, type Visual } from '../../render/Visual';
import { Sheets } from '../../assets/AssetLoader';
import { D } from '../../assets/SpriteSheet';
import { MANIFEST } from '../../assets/manifest.generated';
import { fullySupported, moveAndCollide } from '../../world/Physics';
import { Tile } from '../../world/Level';
import { Entity } from '../Entity';
import { HealthComponent } from '../HealthComponent';
import { MakitaGun } from '../weapons/MakitaGun';
import type { WeaponBase } from '../weapons/WeaponBase';
import type { WorldContext } from '../../scenes/WorldContext';
import { resolveAim } from './Aim';
import { DEAD, FALL, HURT, IDLE, JUMP, type PlayerState } from './PlayerStates';

const P = CONFIG.player;
const MAKITA = MANIFEST.sheets.makita;

type WeaponOrientation = 'horizontal' | 'diagonal' | 'vertical';

/**
 * "Seba" – kontroler gracza. Logika ruchu żyje w stanach (PlayerStates.ts),
 * tutaj: fizyka, strzelanie, obrażenia, ograniczenia kamery, respawn ze szczeliny, render.
 *
 * Render = ciało (sheet `seba`, klip = stan/strzał) + nakładka broni (sheet `makita`)
 * obracana do 8 kierunków przez 3 orientacje bazowe i odbicia X/Y.
 */
export class PlayerController extends Entity {
  visual: Visual = new SpriteSheetVisual('seba', {
    placeholder: new PlaceholderVisual({ color: '#3d7bff', accent: '#ffb347', barrel: true, barrelLength: 8, outline: '#1b3a80' }),
  });
  health = new HealthComponent(P.maxHp, P.invulnTime);
  weapon: WeaponBase = new MakitaGun();
  state: PlayerState = IDLE;
  aim = { x: 1, y: 0 };
  /** Zewnętrzna siła pozioma (np. podmuch bossa) – ustawiana co klatkę przez świat, zerowana po użyciu. */
  pushVx = 0;
  /** Punkt wylotu tarczy/lufy w świecie – źródło pocisków, błysku i iskier. */
  muzzle = { x: 0, y: 0 };

  // dane stanów
  somersaultTime = -1;
  hurtTimer = 0;
  knockbackDir: 1 | -1 = -1;
  private dropThroughTimer = 0;
  private lastSafe = { x: 0, y: 0 };
  private stateTime = 0;
  private firingTimer = 0;
  private sparkAcc = 0;
  /** Mikro-odrzut broni (px wzdłuż kierunku celowania, zanika). */
  private recoil = 0;
  private wasOnGround = false;
  private airJumpUsed = false;

  constructor(public input: Input, x: number, y: number) {
    super();
    this.w = P.width;
    this.h = P.standHeight;
    this.x = x;
    this.y = y;
    this.lastSafe = { x, y };
  }

  get isDead(): boolean { return this.state === DEAD; }
  get isFiring(): boolean { return this.firingTimer > 0; }

  // ---- FSM ---------------------------------------------------------------
  setState(next: PlayerState, world: WorldContext): void {
    if (next === this.state) return;
    this.state.exit(this, world);
    this.state = next;
    this.stateTime = 0;
    next.enter(this, world);
  }

  canStand(world: WorldContext): boolean {
    const ts = world.level.tileSize;
    const top = this.bottom - P.standHeight;
    for (let r = Math.floor(top / ts); r <= Math.floor((this.bottom - 0.001) / ts); r++) {
      for (let c = Math.floor(this.x / ts); c <= Math.floor((this.x + this.w - 0.001) / ts); c++) {
        if (world.level.tileAt(c, r) === Tile.Solid) return false;
      }
    }
    return true;
  }

  setStanding(world: WorldContext): void {
    if (this.h === P.standHeight || !this.canStand(world)) return;
    this.y -= P.standHeight - this.h;
    this.h = P.standHeight;
  }

  /** Jeden dodatkowy skok na nowe naciśnięcie; lądowanie odnawia możliwość odbicia. */
  tryAirJump(world: WorldContext): boolean {
    if (this.onGround || this.airJumpUsed || !this.canStand(world)) return false;
    this.airJumpUsed = true;
    const alreadyJumping = this.state === JUMP;
    this.setState(JUMP, world);
    this.vy = P.airJumpVelocity;
    this.somersaultTime = 0;
    this.stateTime = 0;
    if (alreadyJumping) Sfx.play('jump');
    world.particles.emit({
      x: this.cx, y: this.bottom, count: 12, color: ['#fff4d0', '#a9dadd', '#ffe3a0'],
      speed: [30, 80], life: [0.15, 0.3], size: [1, 2],
      angle: [0, Math.PI], gravity: 180, spreadX: 8,
    });
    return true;
  }

  setProne(): void {
    if (this.h === P.proneHeight) return;
    this.y += this.h - P.proneHeight;
    this.h = P.proneHeight;
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
    world.particles.emit({ x: this.cx, y: this.cy, count: 10, color: ['#ff4d4d', '#ffffff', '#ffb300'], speed: [40, 120], life: [0.2, 0.45], gravity: 300 });
    world.camera.shake(CONFIG.vfx.shake.playerHit, 0.22);
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
    if (this.firingTimer > 0) this.firingTimer -= dt;
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 40);

    this.state.update(this, dt, world);

    // grawitacja
    this.vy = Math.min(this.vy + CONFIG.physics.gravity * dt, CONFIG.physics.maxFallSpeed);

    const res = moveAndCollide(this, world.level, (this.vx + this.pushVx) * dt, this.vy * dt, { dropThrough: this.dropThroughTimer > 0 });
    this.pushVx = 0;
    this.onGround = res.onGround;
    if (res.onGround) {
      this.airJumpUsed = false;
      if (this.vy > 0) this.vy = 0;
      // bezpieczny respawn tylko, gdy stoimy całą szerokością na podłożu (nie na krawędzi szczeliny)
      if (fullySupported(this, world.level)) {
        this.lastSafe.x = this.x;
        this.lastSafe.y = this.y;
      }
    }
    if (this.onGround && !this.wasOnGround && !this.isDead) this.landingDust(world);
    this.wasOnGround = this.onGround;

    this.clampToCamera(world);
    this.checkPit(world);

    // celowanie, pozycja broni i ogień automatyczny
    const aim = resolveAim(this.input, this.state.name, this.facing);
    if (aim) this.aim = aim;
    this.updateWeaponPose();
    if (aim && this.input.held('fire')) this.fire(world);
    if (!this.isDead && this.weaponVisible) this.sawSparks(dt, world);
    Sfx.setLoop('saw', !this.isDead && this.weaponVisible, this.isFiring ? 1 : 0.25);
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

  // ---- Broń: pozycja, orientacja, wylot -----------------------------------
  /** Broń schowana podczas koziołka i po trafieniu (jak w Contrze). */
  get weaponVisible(): boolean {
    const n = this.state.name;
    return n !== 'jump' && n !== 'hurt' && n !== 'dead';
  }

  private get orientation(): WeaponOrientation {
    if (Math.abs(this.aim.y) < 0.3) return 'horizontal';
    if (Math.abs(this.aim.x) < 0.3) return 'vertical';
    return 'diagonal';
  }

  /** Punkt dłoni w świecie (kotwica nakładki broni). */
  private handPoint(): { x: number; y: number } {
    type Pt = { x: number; y: number };
    const pivots = MANIFEST.sheets.seba.pivots as { stand: Pt; crouch: Pt; idle?: Pt; prone?: Pt; up?: Pt };
    const pv = this.state.name === 'prone' || this.isDead ? (pivots.prone ?? pivots.crouch)
      : this.state.name === 'idle' && (this.isFiring || this.input.held('fire')) && this.aim.y < -0.5 ? (pivots.up ?? pivots.stand)
      : this.state.name === 'idle' && !this.isFiring && !this.input.held('fire') ? (pivots.idle ?? pivots.stand)
      : pivots.stand;
    return { x: this.cx + (pv.x / D) * this.facing, y: this.bottom + pv.y / D };
  }

  /** Wspólny punkt rysowania i wylotu — uwzględnia aktualny odrzut. */
  private weaponPoint(): { x: number; y: number } {
    const hand = this.handPoint();
    const recoil = Math.round(this.recoil);
    return { x: hand.x - this.aim.x * recoil, y: hand.y - this.aim.y * recoil };
  }

  private updateWeaponPose(): void {
    const hand = this.weaponPoint();
    const o = this.orientation;
    const pv = MAKITA.pivots[o], mz = MAKITA.muzzle[o];
    const flipY = this.aim.y > 0.3;
    this.muzzle.x = hand.x + ((mz.x - pv.x) / D) * this.facing;
    this.muzzle.y = hand.y + ((mz.y - pv.y) / D) * (flipY ? -1 : 1);
  }

  private fire(world: WorldContext): void {
    const origin = this.weaponVisible ? this.muzzle : { x: this.cx + this.aim.x * 10, y: this.cy + this.aim.y * 10 };
    if (this.weapon.tryFire(world.playerBullets, origin.x, origin.y, this.aim.x, this.aim.y)) {
      Sfx.play('shoot');
      this.firingTimer = 0.14;
      this.recoil = 2;
      this.updateWeaponPose();
      world.fx.spawn('muzzle', origin.x, origin.y, { clip: 'flash', follow: this.weaponVisible ? () => this.muzzle : undefined });
      world.particles.emit({ x: origin.x, y: origin.y, count: 2, color: ['#ffe36b', '#ffffff'], speed: [20, 60], life: [0.05, 0.12], size: [1, 2], angle: [Math.atan2(this.aim.y, this.aim.x) - 0.4, Math.atan2(this.aim.y, this.aim.x) + 0.4] });
    }
  }

  /** Iskry z pracującej wkrętarki (przy wylocie). */
  private sawSparks(dt: number, world: WorldContext): void {
    this.sparkAcc += dt * CONFIG.vfx.sawSparkRate * (this.isFiring ? 2 : 1);
    while (this.sparkAcc >= 1) {
      this.sparkAcc -= 1;
      const base = Math.atan2(this.aim.y, this.aim.x);
      world.particles.emit({
        x: this.muzzle.x, y: this.muzzle.y, count: 1, color: ['#ffb300', '#ffe36b', '#ffffff', '#ff7a1a'],
        speed: [30, 90], life: [0.15, 0.4], size: [1, 1.6], gravity: 420,
        angle: [base + 0.6, base + 2.2],
      });
    }
  }

  private landingDust(world: WorldContext): void {
    Sfx.play('land');
    world.particles.emit({
      x: this.cx, y: this.bottom - 1, count: CONFIG.vfx.landingDust, color: ['#8a94a3', '#5b6577', '#c3c8d1'],
      speed: [15, 45], life: [0.25, 0.5], size: [1.5, 3], angle: [-Math.PI * 0.95, -Math.PI * 0.05], spreadX: 5,
    });
  }

  // ---- Render ------------------------------------------------------------
  private animName(): string {
    switch (this.state.name) {
      case 'idle': return this.isFiring ? (this.aim.y < -0.5 ? 'shoot_up' : 'shoot') : 'idle';
      case 'run': return this.isFiring ? 'run_shoot' : 'run';
      case 'prone': return 'prone';
      case 'jump': return 'spin';
      case 'fall': return 'jump';
      case 'hurt': return 'hurt';
      case 'dead': return 'dead';
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // i-frames: modulacja przezroczystości (miganie) zamiast znikania sprite'a
    const inv = this.health.isInvulnerable && !this.isDead;
    const alpha = this.isDead ? 0.7 : inv && Math.floor(this.health.invulnRemaining * P.flashHz) % 2 === 0 ? 0.3 : 1;
    const flash = this.state.name === 'hurt' && this.stateTime < 0.08;
    const spin = this.somersaultTime >= 0;
    // placeholder potrzebuje obrotu; sheet ma gotowe klatki koziołka
    const rotation = spin && !Sheets.tryGet('seba')
      ? (this.somersaultTime / P.somersaultDuration) * Math.PI * 2 * P.somersaultTurns * this.facing
      : 0;

    this.visual.draw(ctx, {
      x: this.x, y: this.y, w: this.w, h: this.h,
      facing: this.facing,
      anim: this.animName(),
      time: this.state.name === 'prone' && this.vx === 0 ? 0 : this.stateTime,
      aim: this.aim,
      rotation,
      alpha,
      flash,
    });
    if (this.weaponVisible) this.drawWeapon(ctx, alpha);
  }

  private drawWeapon(ctx: CanvasRenderingContext2D, alpha: number): void {
    const sheet = Sheets.tryGet('makita');
    if (!sheet) return;
    const o = this.orientation;
    const hand = this.weaponPoint();
    const pv = MAKITA.pivots[o];
    const frame = sheet.frameAt(o, this.isFiring ? this.age : 0, 'horizontal');
    sheet.drawAnchored(ctx, frame, hand.x, hand.y, pv.x, pv.y, { flipX: this.facing < 0, flipY: this.aim.y > 0.3, alpha });
  }
}

import { CONFIG } from '../../core/Config';
import { Sfx } from '../../render/Audio';
import { PlaceholderVisual } from '../../render/Visual';
import { Sheets } from '../../assets/AssetLoader';
import { rectsOverlap } from '../../core/MathUtil';
import { EnemyBase } from '../enemies/EnemyBase';
import type { WorldContext } from '../../scenes/WorldContext';
import { BossFSM, type AttackPattern } from './BossFSM';
import { createTurbinePhases } from './BossPhases';

const B = CONFIG.boss;

export type BossHitZone = 'weak' | 'core' | 'armor' | 'none';
type DyingStage = 'none' | 'hitstop' | 'explosions' | 'fall' | 'done';

/**
 * Boss "Skrzydło Turbiny Wiatrowej".
 * Encja trzyma stan fizyczny i prymitywy ruchu (hover, moveTowards, orientacja), zachowanie definiują
 * fazy/wzorce w BossPhases.ts. Słaby punkt: końcówka skrzydła (winglet); w fazie 3 – odsłonięty rdzeń.
 */
export class TurbineBoss extends EnemyBase {
  visual = new PlaceholderVisual({ color: '#95a5a6', accent: '#ecf0f1', faceMarker: false, outline: '#2c3e50' });
  readonly fsm: BossFSM<TurbineBoss>;

  // parametry ustawiane przez fazy / ataki
  hoverHz = B.phase1.hoverHz;
  attackCooldown = B.phase1.attackCooldown;
  tint = '#95a5a6';
  movementLocked = false;
  telegraphing = false;
  shakeOffset = 0;
  smokeAcc = 0;
  /** Odchylenie skrzydła (rad) – Wind Gust. */
  tilt = 0;
  /** Y promienia celowniczego szarży (świat) lub null. */
  laserY: number | null = null;
  /** Faza 3: pęknięty korpus, odsłonięty rdzeń – jedyny wrażliwy punkt. */
  coreExposed = false;
  quakeTimer = B.phase3.quake.interval;

  readonly arenaRight: number;
  private hoverT = 0;
  private attackTimer = 1.5;
  private patterns: AttackPattern<TurbineBoss>[] = [];
  private patternIndex = 0;
  private currentAttack: AttackPattern<TurbineBoss> | null = null;
  private introTimer = 1.4;
  private prevX = 0;
  private prevY = 0;
  /** Ostatnie przejście fazy – `update` odczytuje je i emituje event `boss:phase`. */
  lastPhaseChange: { from: number; to: number } | null = null;
  private pendingShake = 0;

  // finał
  private dyingStage: DyingStage = 'none';
  private dyingTimer = 0;
  private fallVy = 0;
  private fallRot = 0;

  constructor(public readonly arenaX: number, public readonly floorY: number) {
    super('boss', B.hp, B.contactDamage, B.score);
    this.arenaRight = arenaX + CONFIG.view.width;
    this.w = B.width;
    this.h = B.height;
    const t = this.hoverTarget();
    this.x = t.x;
    this.y = -this.h - 8; // wjazd z góry podczas intro
    this.prevX = this.x;
    this.prevY = this.y;
    this.despawnOffscreen = false;
    this.vulnerable = false;
    this.fsm = new BossFSM(createTurbinePhases(), (from, to) => this.onPhaseChanged(from, to));
  }

  get phaseIndex(): number { return this.fsm.phaseIndex; }
  get isIntro(): boolean { return this.introTimer > 0; }
  get isDying(): boolean { return this.dyingStage !== 'none'; }
  get vertical(): boolean { return this.w < this.h; }

  // ---- Geometria / strefy trafień ------------------------------------------
  /** Prostokąt końcówki skrzydła (winglet) – dół w pionie, lewy koniec w poziomie. */
  wingletRect(): { x: number; y: number; w: number; h: number } {
    const L = B.wingletLength;
    return this.vertical
      ? { x: this.x, y: this.bottom - L, w: this.w, h: L }
      : { x: this.x, y: this.y, w: L, h: this.h };
  }

  coreRect(): { x: number; y: number; w: number; h: number } {
    const s = B.coreSize;
    return { x: this.cx - s / 2, y: this.cy - s / 2, w: s, h: s };
  }

  /** Klasyfikuje trafienie pocisku (okrąg) w strefę. */
  hitZone(px: number, py: number, r: number): BossHitZone {
    if (!this.overlapsCircle(px, py, r)) return 'none';
    if (this.coreExposed) {
      const c = this.coreRect();
      return rectsOverlap(px - r, py - r, r * 2, r * 2, c.x, c.y, c.w, c.h) ? 'core' : 'armor';
    }
    const wl = this.wingletRect();
    return rectsOverlap(px - r, py - r, r * 2, r * 2, wl.x, wl.y, wl.w, wl.h) ? 'weak' : 'armor';
  }

  /** Punkt na krawędzi natarcia (0..1 wzdłuż skrzydła) – receptory odgromowe. */
  leadingEdgePoint(t: number): { x: number; y: number } {
    return this.vertical
      ? { x: this.facing < 0 ? this.x - 1 : this.x + this.w + 1, y: this.y + 8 + (this.h - 16) * t }
      : { x: this.x + 8 + (this.w - 16) * t, y: this.bottom + 1 };
  }

  // ---- API dla wzorców ataków --------------------------------------------
  hoverTarget(): { x: number; y: number } {
    return {
      x: this.arenaX + B.hoverOffsetX - B.width / 2,
      y: B.hoverCenterY + Math.sin(this.hoverT * Math.PI * 2 * this.hoverHz) * B.hoverAmplitude - this.h / 2,
    };
  }

  /** Ruch ze stałą prędkością w stronę punktu. @returns true, gdy osiągnięty. */
  moveTowards(tx: number, ty: number, speed: number, dt: number): boolean {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    const step = speed * dt;
    if (dist <= step) { this.x = tx; this.y = ty; return true; }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    return false;
  }

  /** Skrzydło ułożone poziomo (zamach, slam, szarża) – zachowuje środek. */
  setHorizontal(height: number): void {
    const cx = this.cx, cy = this.cy;
    this.w = B.height; this.h = height;
    this.x = cx - this.w / 2; this.y = cy - this.h / 2;
    this.prevX = this.x; this.prevY = this.y;
  }

  setVertical(): void {
    const cx = this.cx, cy = this.cy;
    this.w = B.width; this.h = B.height;
    this.x = cx - this.w / 2; this.y = cy - this.h / 2;
    this.prevX = this.x; this.prevY = this.y;
  }

  setPatterns(patterns: AttackPattern<TurbineBoss>[]): void { this.patterns = patterns; this.patternIndex = 0; }
  resetAttackTimer(t: number): void { this.attackTimer = t; }

  cancelAttack(): void {
    this.currentAttack = null;
    this.movementLocked = false;
    this.telegraphing = false;
    this.shakeOffset = 0;
    this.tilt = 0;
    this.laserY = null;
    this.setVertical();
  }

  /** Cykl: cooldown → kolejny wzorzec z listy → aż do jego zakończenia. */
  runAttackCycle(dt: number, world: WorldContext): void {
    if (world.player.isDead) return;
    if (this.currentAttack) {
      if (this.currentAttack.update(this, dt, world)) {
        this.currentAttack = null;
        this.attackTimer = this.attackCooldown;
      }
      return;
    }
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && this.patterns.length > 0) {
      this.currentAttack = this.patterns[this.patternIndex];
      this.patternIndex = (this.patternIndex + 1) % this.patterns.length;
      this.currentAttack.start(this, world);
    }
  }

  // ---- Zdarzenia ---------------------------------------------------------
  private onPhaseChanged(from: number, to: number): void {
    this.vulnerable = true;
    if (from >= 0) {
      Sfx.play('boss_phase');
      this.hitFlash = 0.25;
      this.pendingShake = CONFIG.vfx.shake.bossPhase;
    }
    this.lastPhaseChange = { from, to };
  }

  /** Finał: hit-stop → kaskada eksplozji → skrzydło łamie się i odpada → boss:died. */
  override die(world: WorldContext): void {
    if (this.dyingStage !== 'none') return;
    this.dyingStage = 'hitstop';
    this.dyingTimer = B.finale.hitStop;
    this.vulnerable = false;
    this.cancelAttack();
    this.laserY = null;
    this.hitFlash = 0.3;
    Sfx.play('boss_die');
    world.hitStop(B.finale.hitStop);
    world.camera.shake(CONFIG.vfx.shake.bossDeath, 0.5);
  }

  private finishDeath(world: WorldContext): void {
    this.dyingStage = 'done';
    this.alive = false;
    world.addScore(this.scoreValue);
    world.events.emit('enemy:died', { enemy: this });
    world.events.emit('boss:died', undefined);
  }

  private updateDying(dt: number, world: WorldContext): void {
    this.dyingTimer -= dt;
    switch (this.dyingStage) {
      case 'hitstop':
        if (this.dyingTimer <= 0) { this.dyingStage = 'explosions'; this.dyingTimer = B.finale.explosionsDuration; Sfx.play('boss_rumble'); }
        break;
      case 'explosions':
        if (Math.floor(this.dyingTimer * 8) !== Math.floor((this.dyingTimer + dt) * 8)) {
          world.fx.spawn('explosion', this.x + Math.random() * this.w, this.y + Math.random() * this.h);
          world.camera.shake(3, 0.15);
          Sfx.play('explosion', 0.5);
          world.particles.emit({ x: this.cx, y: this.cy, count: 8, color: ['#ff9f43', '#ffdd59', '#e5e9ef', '#2d3436'], speed: [40, 160], life: [0.25, 0.4], gravity: 200, spreadX: this.w / 2, spreadY: this.h / 2 });
        }
        if (this.dyingTimer <= 0) { this.dyingStage = 'fall'; this.dyingTimer = B.finale.fallDuration; this.fallVy = -60; Sfx.play('crack'); world.camera.shake(5, 0.3); }
        break;
      case 'fall':
        this.fallVy += CONFIG.physics.gravity * 0.6 * dt;
        this.y += this.fallVy * dt;
        this.x -= 20 * dt;
        this.fallRot += 1.8 * dt;
        if (Math.random() < 0.3) world.particles.emit({ x: this.x + Math.random() * this.w, y: this.y + Math.random() * this.h, count: 2, color: ['#2d3436', '#636e72', '#ff9f43'], speed: [10, 40], life: [0.3, 0.4], size: [2, 3] });
        if (this.dyingTimer <= 0 || this.y > this.floorY + 40) {
          for (let i = 0; i < 4; i++) world.fx.spawn('explosion', this.arenaX + 120 + i * 50, this.floorY - 10 - Math.random() * 30);
          world.camera.shake(7, 0.6);
          Sfx.play('explosion');
          this.finishDeath(world);
        }
        break;
      default:
        break;
    }
  }

  protected override deathEffect(): void { /* finał obsługuje updateDying */ }

  // ---- Update / draw -----------------------------------------------------
  update(dt: number, world: WorldContext): void {
    this.prevX = this.x;
    this.prevY = this.y;
    this.age += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;

    if (this.dyingStage !== 'none') { this.updateDying(dt, world); return; }

    if (this.introTimer > 0) {
      this.introTimer -= dt;
      const t = this.hoverTarget();
      this.moveTowards(t.x, t.y, 120, dt);
      if (this.introTimer <= 0) this.fsm.forcePhase(0, this, world);
      return;
    }

    this.hoverT += dt;
    if (!this.movementLocked) {
      const t = this.hoverTarget();
      this.x += (t.x - this.x) * Math.min(1, dt * 6);
      this.y += (t.y - this.y) * Math.min(1, dt * 6);
    }

    this.fsm.update(this, this.health.fraction, dt, world);

    if (this.lastPhaseChange) {
      world.events.emit('boss:phase', this.lastPhaseChange);
      this.lastPhaseChange = null;
    }
    if (this.pendingShake > 0) { world.camera.shake(this.pendingShake, 0.4); this.pendingShake = 0; }

    this.facing = world.player.cx < this.cx ? -1 : 1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const wing = Sheets.tryGet('bossWing');
    const flash = this.hitFlash > 0 || (this.telegraphing && Math.floor(this.age * 20) % 2 === 0) || this.dyingStage === 'hitstop';
    ctx.save();
    // promień celowniczy szarży (pikselowa linia)
    if (this.laserY !== null) {
      ctx.globalAlpha = 0.5 + 0.4 * Math.abs(Math.sin(this.age * 25));
      ctx.fillStyle = '#ff2a2a'; ctx.fillRect(this.arenaX, Math.round(this.laserY) - 1, this.arenaRight - this.arenaX, 2);
      ctx.fillStyle = '#ffb3b3'; ctx.fillRect(this.arenaX, Math.round(this.laserY), this.arenaRight - this.arenaX, 1);
      ctx.globalAlpha = 1;
    }
    if (!wing) { // fallback (headless / brak zasobów)
      const pal = BOSS_PALETTES[Math.max(0, Math.min(2, this.phaseIndex))];
      ctx.fillStyle = flash ? '#ffffff' : pal.m; ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, this.h);
      ctx.restore(); return;
    }
    const clip = `p${Math.max(1, Math.min(3, this.phaseIndex + 1))}${this.coreExposed ? 'c' : ''}`;
    const frame = wing.frameAt(clip, 0, 'p1');
    const ax = wing.def.anchorX ?? 14, ay = wing.def.anchorY ?? 48;
    const horizontal = this.w > this.h;
    const drawWing = (cx: number, cy: number, alpha: number) => {
      ctx.save();
      ctx.translate(Math.round(cx), Math.round(cy));
      if (this.tilt) ctx.rotate(this.tilt * this.facing);
      if (this.dyingStage === 'fall') ctx.rotate(this.fallRot);
      if (horizontal) ctx.rotate(Math.PI / 2); // końcówka (dół klatki) → lewa strona
      wing.drawAnchored(ctx, frame, 0, 0, ax, ay, { flipX: !horizontal && this.facing < 0, flash, alpha });
      ctx.restore();
    };
    // smuga ruchu przy szarży / zamachu
    const speed = Math.hypot(this.x - this.prevX, this.y - this.prevY);
    if (speed > 3) drawWing(this.prevX + this.w / 2, this.prevY + this.h / 2, 0.3);
    drawWing(this.cx + this.shakeOffset, this.cy, 1);
    // pulsujący rdzeń (faza 3) – nowy hitbox
    const core = Sheets.tryGet('bossCore');
    if (this.coreExposed && core && !flash) core.drawAnchored(ctx, core.frameAt('pulse', this.age), this.cx + this.shakeOffset, this.cy, core.def.anchorX ?? 8, core.def.anchorY ?? 8);
    ctx.restore();
  }
}

/** Paleta korpusu per faza: l – światło, m – wypełnienie, d – cień. */
const BOSS_PALETTES = [
  { l: '#c3c8d1', m: '#7d8794', d: '#3f4753' },
  { l: '#f5c08a', m: '#d9782a', d: '#7a3b0f' },
  { l: '#ff9a90', m: '#c8302a', d: '#5e1310' },
];

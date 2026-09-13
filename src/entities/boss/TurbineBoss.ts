import { CONFIG } from '../../core/Config';
import { Sfx } from '../../render/Audio';
import { PlaceholderVisual } from '../../render/Visual';
import { EnemyBase } from '../enemies/EnemyBase';
import type { WorldContext } from '../../scenes/WorldContext';
import { BossFSM, type AttackPattern } from './BossFSM';
import { aimAtPlayer, createTurbinePhases } from './BossPhases';

const B = CONFIG.boss;

/**
 * Boss "Skrzydło Turbiny Wiatrowej".
 * Encja trzyma stan fizyczny i prymitywy ruchu (hover, moveTowards, orientacja),
 * a zachowanie definiują fazy/wzorce w BossPhases.ts.
 */
export class TurbineBoss extends EnemyBase {
  visual = new PlaceholderVisual({ color: '#95a5a6', accent: '#ecf0f1', faceMarker: false, outline: '#2c3e50' });
  readonly fsm: BossFSM<TurbineBoss>;

  // parametry ustawiane przez fazy
  hoverHz = B.phase1.hoverHz;
  attackCooldown = B.phase1.attackCooldown;
  tint = '#95a5a6';
  movementLocked = false;
  telegraphing = false;
  shakeOffset = 0;
  smokeAcc = 0;

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

  /** Skrzydło ułożone poziomo (zamach przy podłodze) – zachowuje środek. */
  setHorizontal(height: number): void {
    const cx = this.cx, cy = this.cy;
    this.w = B.height;
    this.h = height;
    this.x = cx - this.w / 2;
    this.y = cy - this.h / 2;
    this.prevX = this.x; this.prevY = this.y; // bez fałszywej smugi ruchu przy zmianie orientacji
  }

  setVertical(): void {
    const cx = this.cx, cy = this.cy;
    this.w = B.width;
    this.h = B.height;
    this.x = cx - this.w / 2;
    this.y = cy - this.h / 2;
    this.prevX = this.x; this.prevY = this.y;
  }

  shootAtPlayer(world: WorldContext, speed: number): void {
    const d = aimAtPlayer(this, world);
    world.fireEnemyBullet(this.cx + d.x * 6, this.cy + d.y * 6, d.x, d.y, speed, B.bulletDamage);
  }

  setPatterns(patterns: AttackPattern<TurbineBoss>[]): void {
    this.patterns = patterns;
    this.patternIndex = 0;
  }

  resetAttackTimer(t: number): void { this.attackTimer = t; }

  cancelAttack(): void {
    this.currentAttack = null;
    this.movementLocked = false;
    this.telegraphing = false;
    this.shakeOffset = 0;
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

  override die(world: WorldContext): void {
    if (!this.alive) return;
    super.die(world);
    Sfx.play('boss_die');
    world.events.emit('boss:died', undefined);
  }

  protected override deathEffect(world: WorldContext): void {
    world.camera.shake(CONFIG.vfx.shake.bossDeath, 0.9);
    for (let i = 0; i < 6; i++) {
      world.fx.spawn('explosion', this.x + Math.random() * this.w, this.y + Math.random() * this.h);
      world.particles.emit({
        x: this.x + Math.random() * this.w, y: this.y + Math.random() * this.h, count: 20,
        color: ['#ff9f43', '#ffdd59', '#ffffff', '#e74c3c', '#2d3436'],
        speed: [30, 200], life: [0.4, 1.2], size: [2, 6], gravity: 200,
      });
    }
  }

  // ---- Update / draw -----------------------------------------------------
  update(dt: number, world: WorldContext): void {
    this.prevX = this.x;
    this.prevY = this.y;

    if (this.introTimer > 0) {
      this.introTimer -= dt;
      const t = this.hoverTarget();
      this.moveTowards(t.x, t.y, 120, dt);
      if (this.introTimer <= 0) this.fsm.forcePhase(0, this, world);
      this.postUpdate(dt, world);
      return;
    }

    this.hoverT += dt;
    if (!this.movementLocked) {
      const t = this.hoverTarget();
      // wygładzone dążenie do pozycji hover (po powrocie z ataku)
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
    this.postUpdate(dt, world);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const flash = this.hitFlash > 0 || (this.telegraphing && Math.floor(this.age * 20) % 2 === 0);
    const pal = BOSS_PALETTES[Math.max(0, Math.min(2, this.phaseIndex))];
    const K = '#050912';
    const x = Math.round(this.x) + Math.round(this.shakeOffset), y = Math.round(this.y), w = this.w, h = this.h;
    const vertical = w < h;

    ctx.save();
    // smuga ruchu przy szarży / zamachu
    const speed = Math.hypot(this.x - this.prevX, this.y - this.prevY);
    if (speed > 3) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = pal.m;
      ctx.fillRect(Math.round(this.prevX), Math.round(this.prevY), w, h);
      ctx.globalAlpha = 1;
    }
    // korpus: obrys, wypełnienie, krawędź światła i cienia
    ctx.fillStyle = K; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = flash ? '#ffffff' : pal.m; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    if (!flash) {
      ctx.fillStyle = pal.l; ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2);
      ctx.fillStyle = pal.d; ctx.fillRect(x + 1, y + h - 2, w - 2, 1); ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
      // płyty pancerne wzdłuż dłuższej osi + nity
      ctx.fillStyle = K;
      const len = vertical ? h : w;
      for (let k = 10; k < len - 6; k += 12) {
        if (vertical) { ctx.fillRect(x + 2, y + k, w - 4, 1); ctx.fillStyle = pal.l; ctx.fillRect(x + 4, y + k + 3, 1, 1); ctx.fillRect(x + w - 5, y + k + 3, 1, 1); ctx.fillStyle = K; }
        else { ctx.fillRect(x + k, y + 2, 1, h - 4); ctx.fillStyle = pal.l; ctx.fillRect(x + k + 3, y + 3, 1, 1); ctx.fillStyle = K; }
      }
      // ostrza na krawędzi natarcia (ząbki)
      ctx.fillStyle = pal.l;
      for (let k = 4; k < len - 4; k += 6) {
        if (vertical) ctx.fillRect(this.facing < 0 ? x - 1 : x + w, y + k, 1, 2);
        else ctx.fillRect(x + k, y + h, 2, 1);
      }
    }
    // piasta + oko (czerwone i pulsujące w Enrage)
    const cx = Math.round(this.cx) + Math.round(this.shakeOffset), cy = Math.round(this.cy);
    ctx.fillStyle = K; ctx.fillRect(cx - 5, cy - 5, 10, 10);
    ctx.fillStyle = pal.d; ctx.fillRect(cx - 4, cy - 4, 8, 8);
    ctx.fillStyle = this.phaseIndex >= 2 ? (Math.floor(this.age * 6) % 2 ? '#ff2a2a' : '#ff8a80') : pal.l;
    ctx.fillRect(cx - 2, cy - 2, 4, 4);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 1, cy - 1, 1, 1);
    // dym z korpusu w Enrage – emisja w BossPhases; tutaj lekka poświata
    if (this.phaseIndex >= 2 && !flash) {
      ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.age * 8);
      ctx.fillStyle = '#ff2a2a';
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    }
    ctx.restore();
  }
}

/** Paleta korpusu per faza: l – światło, m – wypełnienie, d – cień. */
const BOSS_PALETTES = [
  { l: '#c3c8d1', m: '#7d8794', d: '#3f4753' },
  { l: '#f5c08a', m: '#d9782a', d: '#7a3b0f' },
  { l: '#ff9a90', m: '#c8302a', d: '#5e1310' },
];

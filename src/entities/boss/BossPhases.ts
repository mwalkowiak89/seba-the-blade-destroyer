import { CONFIG } from '../../core/Config';
import { clamp, degToRad, normalize } from '../../core/MathUtil';
import type { WorldContext } from '../../scenes/WorldContext';
import type { AttackPattern, BossPhase } from './BossFSM';
import type { TurbineBoss } from './TurbineBoss';

const B = CONFIG.boss;

// =====================================================================
//  Wzorce ataków – każdy jest samodzielny, faza tylko je sekwencjonuje.
// =====================================================================

/** Seria pojedynczych pocisków wycelowanych w gracza. */
export class BurstShot implements AttackPattern<TurbineBoss> {
  readonly name = 'burst';
  private fired = 0;
  private timer = 0;
  constructor(private count: number, private interval: number, private speed: number) {}

  start(): void { this.fired = 0; this.timer = 0; }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    this.timer -= dt;
    if (this.timer <= 0) {
      boss.shootAtPlayer(world, this.speed);
      this.fired++;
      this.timer = this.interval;
    }
    return this.fired >= this.count;
  }
}

/** Wachlarz pocisków w stronę gracza – gęsty ostrzał (faza 3). */
export class FanShot implements AttackPattern<TurbineBoss> {
  readonly name = 'fan';
  constructor(private count: number, private spreadDeg: number, private speed: number) {}

  start(boss: TurbineBoss, world: WorldContext): void {
    const p = world.player;
    const base = Math.atan2(p.cy - boss.cy, p.cx - boss.cx);
    const spread = degToRad(this.spreadDeg);
    for (let i = 0; i < this.count; i++) {
      const t = this.count === 1 ? 0 : i / (this.count - 1) - 0.5;
      const a = base + t * spread;
      world.fireEnemyBullet(boss.cx, boss.cy, Math.cos(a), Math.sin(a), this.speed, B.bulletDamage);
    }
  }

  update(): boolean { return true; }
}

/**
 * Zamach skrzydła przez dół ekranu: telegraf → zejście na podłogę (skrzydło poziomo)
 * → przejazd do lewej ściany i z powrotem → powrót na pozycję hover.
 * Gracz musi przeskoczyć.
 */
export class SweepAttack implements AttackPattern<TurbineBoss> {
  readonly name = 'sweep';
  private stage: 'telegraph' | 'descend' | 'sweepLeft' | 'sweepRight' | 'return' = 'telegraph';
  private timer = 0;
  constructor(private telegraph: number, private speed: number, private height: number) {}

  start(boss: TurbineBoss): void {
    this.stage = 'telegraph';
    this.timer = this.telegraph;
    boss.movementLocked = true;
    boss.telegraphing = true;
  }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    const floorTopY = boss.floorY - this.height;
    switch (this.stage) {
      case 'telegraph':
        this.timer -= dt;
        if (this.timer <= 0) {
          boss.telegraphing = false;
          boss.setHorizontal(this.height);
          this.stage = 'descend';
        }
        return false;
      case 'descend':
        if (boss.moveTowards(boss.x, floorTopY, this.speed * 1.2, dt)) this.stage = 'sweepLeft';
        return false;
      case 'sweepLeft':
        if (boss.moveTowards(boss.arenaX + 4, floorTopY, this.speed, dt)) this.stage = 'sweepRight';
        return false;
      case 'sweepRight':
        if (boss.moveTowards(boss.arenaRight - boss.w - 4, floorTopY, this.speed, dt)) {
          boss.setVertical();
          this.stage = 'return';
        }
        return false;
      case 'return': {
        const t = boss.hoverTarget();
        if (boss.moveTowards(t.x, t.y, this.speed, dt)) {
          boss.movementLocked = false;
          return true;
        }
        return false;
      }
    }
  }
}

/** Szarża: telegraf (drganie) → zryw w aktualną pozycję gracza → pauza → powrót. */
export class ChargeAttack implements AttackPattern<TurbineBoss> {
  readonly name = 'charge';
  private stage: 'telegraph' | 'dash' | 'rest' | 'return' = 'telegraph';
  private timer = 0;
  private target = { x: 0, y: 0 };
  constructor(private telegraph: number, private speed: number, private rest: number) {}

  start(boss: TurbineBoss): void {
    this.stage = 'telegraph';
    this.timer = this.telegraph;
    boss.movementLocked = true;
    boss.telegraphing = true;
  }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    switch (this.stage) {
      case 'telegraph':
        this.timer -= dt;
        boss.shakeOffset = Math.sin(boss.age * 60) * 2;
        if (this.timer <= 0) {
          boss.shakeOffset = 0;
          boss.telegraphing = false;
          const p = world.player;
          this.target = {
            x: clamp(p.cx - boss.w / 2, boss.arenaX + 2, boss.arenaRight - boss.w - 2),
            y: clamp(p.cy - boss.h / 2, 8, boss.floorY - boss.h),
          };
          this.stage = 'dash';
        }
        return false;
      case 'dash':
        if (boss.moveTowards(this.target.x, this.target.y, this.speed, dt)) {
          this.stage = 'rest';
          this.timer = this.rest;
          world.particles.emit({ x: boss.cx, y: boss.bottom, count: 10, color: ['#bdc3c7', '#7f8c8d'], speed: [20, 80], life: [0.2, 0.5] });
        }
        return false;
      case 'rest':
        this.timer -= dt;
        if (this.timer <= 0) this.stage = 'return';
        return false;
      case 'return': {
        const t = boss.hoverTarget();
        if (boss.moveTowards(t.x, t.y, this.speed * 0.55, dt)) {
          boss.movementLocked = false;
          return true;
        }
        return false;
      }
    }
  }
}

// =====================================================================
//  Fazy – kolor, tempo ruchu i cykl ataków. Podmiana ataku = edycja listy.
// =====================================================================

function makePhase(
  name: string,
  startsAt: number,
  cfg: { hoverHz: number; attackCooldown: number; tint: string },
  patterns: () => AttackPattern<TurbineBoss>[],
  hooks: Partial<Pick<BossPhase<TurbineBoss>, 'update'>> = {},
): BossPhase<TurbineBoss> {
  return {
    name,
    startsAt,
    enter(boss) {
      boss.hoverHz = cfg.hoverHz;
      boss.attackCooldown = cfg.attackCooldown;
      boss.tint = cfg.tint;
      boss.setPatterns(patterns());
      boss.resetAttackTimer(0.8); // krótka przerwa po zmianie fazy
    },
    update(boss, dt, world) {
      boss.runAttackCycle(dt, world);
      hooks.update?.(boss, dt, world);
    },
    exit(boss) {
      boss.cancelAttack();
    },
  };
}

export function createTurbinePhases(): BossPhase<TurbineBoss>[] {
  const p1 = B.phase1, p2 = B.phase2, p3 = B.phase3;
  return [
    // Faza 1 – powolny hover, podstawowe serie.
    makePhase('Faza 1', B.phaseThresholds[0], { hoverHz: p1.hoverHz, attackCooldown: p1.attackCooldown, tint: '#95a5a6' },
      () => [new BurstShot(p1.burstCount, p1.burstInterval, p1.bulletSpeed)]),

    // Faza 2 – szybciej + zamach po podłodze.
    makePhase('Faza 2', B.phaseThresholds[1], { hoverHz: p2.hoverHz, attackCooldown: p2.attackCooldown, tint: '#e67e22' },
      () => [
        new BurstShot(p2.burstCount, p2.burstInterval, p2.bulletSpeed),
        new SweepAttack(p2.sweepTelegraph, p2.sweepSpeed, p2.sweepHeight),
      ]),

    // Faza 3 – enrage: czerwony, dym, szarże i wachlarze.
    makePhase('Faza 3 (ENRAGE)', B.phaseThresholds[2], { hoverHz: p3.hoverHz, attackCooldown: p3.attackCooldown, tint: '#e74c3c' },
      () => [
        new FanShot(p3.fanCount, p3.fanSpreadDeg, p3.bulletSpeed),
        new ChargeAttack(p3.chargeTelegraph, p3.chargeSpeed, p3.chargeRest),
        new FanShot(p3.fanCount, p3.fanSpreadDeg, p3.bulletSpeed),
        new SweepAttack(p2.sweepTelegraph * 0.7, p2.sweepSpeed * 1.3, p2.sweepHeight),
      ],
      {
        update(boss, dt, world) {
          // dym z placeholdera
          boss.smokeAcc += dt * p3.smokeRate;
          while (boss.smokeAcc >= 1) {
            boss.smokeAcc -= 1;
            world.particles.emit({
              x: boss.cx, y: boss.y + 4, count: 1, color: ['#2d3436', '#636e72', '#b33939'],
              speed: [10, 30], life: [0.5, 1.0], size: [2, 5], angle: [-Math.PI * 0.75, -Math.PI * 0.25], spreadX: boss.w / 2,
            });
          }
        },
      }),
  ];
}

/** Pomocnik eksportowany dla bossa: strzał w gracza. */
export function aimAtPlayer(boss: TurbineBoss, world: WorldContext): { x: number; y: number } {
  const p = world.player;
  return normalize(p.cx - boss.cx, p.cy - boss.cy);
}


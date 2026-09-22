import { CONFIG } from '../../core/Config';
import { clamp, degToRad, normalize } from '../../core/MathUtil';
import { Sfx } from '../../render/Audio';
import type { WorldContext } from '../../scenes/WorldContext';
import { Drone } from '../enemies/Drone';
import type { AttackPattern, BossPhase } from './BossFSM';
import type { TurbineBoss } from './TurbineBoss';

const B = CONFIG.boss;

/** Cel ustalony przed rzutem; ciężka gondola leci po łuku i rozbija się o teren. */
export class NacelleThrow implements AttackPattern<TurbineBoss> {
  readonly name = 'nacelle';
  private timer = 0;
  private released = false;

  start(boss: TurbineBoss, world: WorldContext): void {
    this.timer = B.nacelle.telegraph; this.released = false;
    boss.setVertical(); boss.movementLocked = true;
    boss.holdingNacelle = true;
    boss.nacelleTarget = {
      x: clamp(world.player.cx, boss.arenaX + 28, boss.arenaRight - 28),
      y: boss.floorY - B.nacelle.height / 2,
    };
    Sfx.play('boss_rumble', 0.65);
  }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    if (world.player.isDead || !boss.nacelleTarget) {
      boss.holdingNacelle = false; boss.nacelleTarget = null; boss.movementLocked = false;
      return true;
    }
    this.timer -= dt;
    if (!this.released) {
      if (this.timer > 0) return false;
      const origin = boss.nacelleOrigin(), target = boss.nacelleTarget, cfg = B.nacelle;
      world.enemyBullets.spawn({
        owner: 'enemy', kind: 'nacelle', x: origin.x, y: origin.y,
        vx: (target.x - origin.x) / cfg.flightTime,
        vy: (target.y - origin.y - 0.5 * cfg.gravity * cfg.flightTime ** 2) / cfg.flightTime,
        gravity: cfg.gravity, damage: cfg.damage, radius: cfg.width / 2,
        life: cfg.flightTime + 1, hitsTerrain: true,
      });
      boss.holdingNacelle = false;
      this.released = true; this.timer = cfg.flightTime + cfg.recovery;
      Sfx.play('charge', 0.65);
      return false;
    }
    if (this.timer > 0) return false;
    boss.nacelleTarget = null; boss.movementLocked = false;
    return true;
  }
}

// =====================================================================
//  Wzorce ataków – samodzielne klocki; fazy tylko je sekwencjonują.
// =====================================================================

/** Pchnięcie aerodynamiczne: skrzydło odchyla się, po czym fala wiatru spycha gracza w lewo. */
export class WindGust implements AttackPattern<TurbineBoss> {
  readonly name = 'gust';
  private t = 0;
  private stage: 'telegraph' | 'blow' = 'telegraph';
  constructor(private cfg = B.phase1.gust) {}

  start(boss: TurbineBoss): void { this.t = 0; this.stage = 'telegraph'; boss.telegraphing = true; boss.tilt = 0; }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    this.t += dt;
    if (this.stage === 'telegraph') {
      boss.tilt = -Math.sin((this.t / this.cfg.telegraph) * Math.PI / 2) * 0.25; // odchylenie w tył
      if (this.t >= this.cfg.telegraph) { this.stage = 'blow'; this.t = 0; boss.telegraphing = false; boss.tilt = 0.35; Sfx.play('gust'); }
      return false;
    }
    const p = world.player;
    if (!p.isDead) p.pushVx = -(p.state.name === 'prone' ? this.cfg.pronePush : this.cfg.push);
    // smugi powietrza przelatujące przez arenę
    world.particles.emit({
      x: boss.arenaRight - 4, y: 30 + Math.random() * (boss.floorY - 40), count: 2, color: ['#ffffff', '#dff6ff'],
      speed: [260, 340], life: [0.3, 0.4], size: [1, 2], angle: [Math.PI - 0.05, Math.PI + 0.05],
    });
    boss.tilt = 0.35 * (1 - this.t / this.cfg.duration);
    if (this.t >= this.cfg.duration) { boss.tilt = 0; return true; }
    return false;
  }
}

/** Wyładowanie odgromowe: seria iskier elektrycznych z receptorów na krawędzi natarcia. */
export class Lightning implements AttackPattern<TurbineBoss> {
  readonly name = 'lightning';
  private fired = 0;
  private timer = 0;
  constructor(private cfg: { count: number; interval: number; speed: number; spreadDeg: number } = B.phase1.lightning) {}

  start(): void { this.fired = 0; this.timer = 0; }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    this.timer -= dt;
    if (this.timer <= 0) {
      const p = world.player;
      const origin = boss.leadingEdgePoint(this.fired / Math.max(1, this.cfg.count - 1));
      const base = Math.atan2(p.cy - origin.y, p.cx - origin.x);
      const a = base + degToRad((Math.random() * 2 - 1) * this.cfg.spreadDeg);
      world.fireEnemyBullet(origin.x, origin.y, Math.cos(a), Math.sin(a), this.cfg.speed, B.bulletDamage, { kind: 'bolt', radius: 3 });
      world.particles.emit({ x: origin.x, y: origin.y, count: 4, color: ['#dff6ff', '#5ec8ff'], speed: [30, 90], life: [0.1, 0.2] });
      Sfx.play('zap');
      this.fired++;
      this.timer = this.cfg.interval;
    }
    return this.fired >= this.cfg.count;
  }
}

/** Niski zamach: błyskawiczny ślizg końcówki skrzydła tuż nad ziemią – wymaga podskoku. */
export class LowSweep implements AttackPattern<TurbineBoss> {
  readonly name = 'sweep';
  private stage: 'telegraph' | 'descend' | 'sweepLeft' | 'sweepRight' | 'return' = 'telegraph';
  private timer = 0;
  constructor(private cfg = B.phase1.sweep) {}

  start(boss: TurbineBoss): void {
    this.stage = 'telegraph'; this.timer = this.cfg.telegraph;
    boss.movementLocked = true; boss.telegraphing = true;
  }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    const floorTopY = boss.floorY - this.cfg.height;
    switch (this.stage) {
      case 'telegraph':
        this.timer -= dt;
        if (this.timer <= 0) { boss.telegraphing = false; boss.setHorizontal(this.cfg.height); this.stage = 'descend'; }
        return false;
      case 'descend':
        if (boss.moveTowards(boss.x, floorTopY, this.cfg.speed * 1.3, dt)) {
          this.stage = 'sweepLeft';
          Sfx.play('slam', 0.5);
          world.camera.shake(CONFIG.vfx.shake.sweepLand, 0.2);
          world.particles.emit({ x: boss.cx, y: boss.bottom, count: 10, color: ['#8a94a3', '#c3c8d1', '#ffb300'], speed: [30, 110], life: [0.2, 0.4], gravity: 300, angle: [-Math.PI, 0], spreadX: boss.w / 2 });
        }
        return false;
      case 'sweepLeft':
        if (boss.moveTowards(boss.arenaX + 4, floorTopY, this.cfg.speed * 1.6, dt)) this.stage = 'sweepRight';
        return false;
      case 'sweepRight':
        if (boss.moveTowards(boss.arenaRight - boss.w - 4, floorTopY, this.cfg.speed, dt)) { boss.setVertical(); this.stage = 'return'; }
        return false;
      case 'return': {
        const t = boss.hoverTarget();
        if (boss.moveTowards(t.x, t.y, this.cfg.speed, dt)) { boss.movementLocked = false; return true; }
        return false;
      }
    }
  }
}

/** Awaria kąta natarcia (Pitch Slam): skrzydło obraca się osiowo i uderza pionowo o ziemię, rozrzucając odłamki. */
export class PitchSlam implements AttackPattern<TurbineBoss> {
  readonly name = 'slam';
  private stage: 'aim' | 'fall' | 'rest' | 'rise' = 'aim';
  private timer = 0;
  private targetX = 0;
  constructor(private cfg = B.phase2.slam) {}

  start(boss: TurbineBoss, world: WorldContext): void {
    this.stage = 'aim'; this.timer = this.cfg.telegraph;
    boss.movementLocked = true; boss.telegraphing = true;
    boss.setHorizontal(20);
    this.targetX = clamp(world.player.cx - boss.w / 2, boss.arenaX + 2, boss.arenaRight - boss.w - 2);
  }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    switch (this.stage) {
      case 'aim':
        this.timer -= dt;
        boss.moveTowards(this.targetX, 30, 320, dt);
        boss.shakeOffset = Math.sin(boss.age * 50) * 1.5;
        if (this.timer <= 0) { this.stage = 'fall'; boss.telegraphing = false; boss.shakeOffset = 0; }
        return false;
      case 'fall':
        if (boss.moveTowards(boss.x, boss.floorY - boss.h, this.cfg.fallSpeed, dt)) {
          this.stage = 'rest'; this.timer = this.cfg.rest;
          Sfx.play('slam');
          world.camera.shake(6, 0.35);
          // odłamki kompozytu po łuku
          for (let i = 0; i < this.cfg.shards; i++) {
            const a = -Math.PI * (0.15 + 0.7 * (i / (this.cfg.shards - 1)));
            const sp = this.cfg.shardSpeed * (0.8 + Math.random() * 0.4);
            world.fireEnemyBullet(boss.x + Math.random() * boss.w, boss.y, Math.cos(a), Math.sin(a), sp, this.cfg.shardDamage, { kind: 'shard', radius: 3, gravity: 520, hitsTerrain: true, life: 3 });
          }
          world.particles.emit({ x: boss.cx, y: boss.bottom, count: 15, color: ['#b9b19f', '#8f8a7d', '#e5e9ef'], speed: [40, 140], life: [0.25, 0.4], gravity: 300, angle: [-Math.PI, 0], spreadX: boss.w / 2 });
        }
        return false;
      case 'rest':
        this.timer -= dt;
        if (this.timer <= 0) this.stage = 'rise';
        return false;
      case 'rise': {
        boss.setVertical();
        const t = boss.hoverTarget();
        if (boss.moveTowards(t.x, t.y, 260, dt)) { boss.movementLocked = false; return true; }
        return false;
      }
    }
  }
}

/** Szarża horyzontalna: czerwony promień telegrafuje tor, po czym skrzydło przelatuje w poprzek areny. */
export class HorizontalCharge implements AttackPattern<TurbineBoss> {
  readonly name = 'charge';
  private stage: 'telegraph' | 'dash' | 'rest' | 'return' = 'telegraph';
  private timer = 0;
  constructor(private cfg = B.phase3.charge) {}

  start(boss: TurbineBoss, world: WorldContext): void {
    this.stage = 'telegraph'; this.timer = this.cfg.telegraph;
    boss.movementLocked = true;
    boss.setHorizontal(22);
    // wysokość toru = aktualna wysokość gracza (środek), w granicach areny
    const y = clamp(world.player.cy - boss.h / 2, 12, boss.floorY - boss.h - 2);
    boss.y = y;
    boss.laserY = boss.cy;
    Sfx.play('laser');
  }

  update(boss: TurbineBoss, dt: number, world: WorldContext): boolean {
    switch (this.stage) {
      case 'telegraph':
        this.timer -= dt;
        boss.shakeOffset = Math.sin(boss.age * 70) * 1.5;
        if (this.timer <= 0) { this.stage = 'dash'; boss.laserY = null; boss.shakeOffset = 0; Sfx.play('charge'); }
        return false;
      case 'dash':
        world.particles.emit({ x: boss.x + boss.w, y: boss.cy, count: 2, color: ['#ff9a90', '#ffffff'], speed: [60, 120], life: [0.15, 0.3], angle: [-0.3, 0.3], spreadY: boss.h / 2 });
        if (boss.moveTowards(boss.arenaX + 2, boss.y, this.cfg.speed, dt)) {
          this.stage = 'rest'; this.timer = this.cfg.rest;
          world.camera.shake(4, 0.25); Sfx.play('slam', 0.6);
        }
        return false;
      case 'rest':
        this.timer -= dt;
        if (this.timer <= 0) { this.stage = 'return'; boss.setVertical(); }
        return false;
      case 'return': {
        const t = boss.hoverTarget();
        if (boss.moveTowards(t.x, t.y, this.cfg.returnSpeed, dt)) { boss.movementLocked = false; return true; }
        return false;
      }
    }
  }
}

// =====================================================================
//  Fazy
// =====================================================================

function makePhase(
  name: string,
  startsAt: number,
  cfg: { hoverHz: number; attackCooldown: number; tint: string },
  patterns: () => AttackPattern<TurbineBoss>[],
  hooks: Partial<Pick<BossPhase<TurbineBoss>, 'enter' | 'update'>> = {},
): BossPhase<TurbineBoss> {
  return {
    name,
    startsAt,
    enter(boss, world) {
      boss.hoverHz = cfg.hoverHz;
      boss.attackCooldown = cfg.attackCooldown;
      boss.tint = cfg.tint;
      boss.setPatterns(patterns());
      boss.resetAttackTimer(0.9);
      hooks.enter?.(boss, world);
    },
    update(boss, dt, world) {
      boss.runAttackCycle(dt, world);
      hooks.update?.(boss, dt, world);
    },
    exit(boss) { boss.cancelAttack(); },
  };
}

export function createTurbinePhases(): BossPhase<TurbineBoss>[] {
  const p1 = B.phase1, p2 = B.phase2, p3 = B.phase3;
  return [
    // Faza 1 – podmuch, wyładowania, niski zamach; wrażliwy tylko winglet.
    makePhase('Faza 1', B.phaseThresholds[0], { hoverHz: p1.hoverHz, attackCooldown: p1.attackCooldown, tint: '#95a5a6' },
      () => [new WindGust(), new NacelleThrow(), new Lightning(p1.lightning), new LowSweep()]),

    // Faza 2 – Pitch Slam z odłamkami + 2 drony serwisowe.
    makePhase('Faza 2', B.phaseThresholds[1], { hoverHz: p2.hoverHz, attackCooldown: p2.attackCooldown, tint: '#e67e22' },
      () => [new NacelleThrow(), new PitchSlam(), new Lightning(p1.lightning), new WindGust()],
      {
        enter(boss, world) {
          for (let i = 0; i < p2.serviceDrones; i++) {
            const d = new Drone(boss.arenaX + 90 + i * 110, 50 + i * 20);
            d.setService();
            world.spawnEnemy(d);
          }
        },
      }),

    // Faza 3 – rezonans: rdzeń odsłonięty, drgania podłoża, szarże z laserem, gęstsze wyładowania.
    makePhase('Faza 3 (ENRAGE)', B.phaseThresholds[2], { hoverHz: p3.hoverHz, attackCooldown: p3.attackCooldown, tint: '#e74c3c' },
      () => [new HorizontalCharge(), new NacelleThrow(), new Lightning(p3.lightning), new HorizontalCharge()],
      {
        enter(boss, world) {
          boss.coreExposed = true;
          Sfx.play('crack');
          world.camera.shake(5, 0.4);
          world.particles.emit({ x: boss.cx, y: boss.cy, count: 15, color: ['#e5e9ef', '#7d8794', '#ff2a2a'], speed: [60, 160], life: [0.3, 0.4], gravity: 200 });
        },
        update(boss, dt, world) {
          // ciągłe drgania + okresowe wstrząsy podłoża (bezpieczne tylko górne kratownice / powietrze)
          boss.quakeTimer -= dt;
          if (boss.quakeTimer < p3.quake.telegraph && boss.quakeTimer > 0) {
            world.camera.shake(1, 0.1);
            if (Math.random() < 0.5) world.particles.emit({ x: boss.arenaX + Math.random() * 320, y: boss.floorY, count: 1, color: ['#b9b19f', '#8f8a7d'], speed: [20, 60], life: [0.2, 0.4], angle: [-Math.PI * 0.8, -Math.PI * 0.2] });
          }
          if (boss.quakeTimer <= 0) {
            boss.quakeTimer = p3.quake.interval;
            Sfx.play('quake');
            world.camera.shake(3, 0.3);
            const p = world.player;
            if (p.onGround && p.bottom >= boss.floorY - 1 && !p.isDead) {
              p.takeDamage(p3.quake.damage, p.cx - 1, world);
              p.vy = p3.quake.knockUp; p.onGround = false;
            }
            world.particles.emit({ x: boss.arenaX + 160, y: boss.floorY, count: 15, color: ['#b9b19f', '#8f8a7d', '#e5e9ef'], speed: [40, 120], life: [0.25, 0.4], gravity: 300, angle: [-Math.PI * 0.9, -Math.PI * 0.1], spreadX: 160 });
          }
          // dym z pękniętego korpusu
          boss.smokeAcc += dt * p3.smokeRate;
          while (boss.smokeAcc >= 1) {
            boss.smokeAcc -= 1;
            world.particles.emit({ x: boss.cx, y: boss.y + 4, count: 1, color: ['#2d3436', '#636e72', '#b33939'], speed: [10, 30], life: [0.3, 0.4], size: [2, 4], angle: [-Math.PI * 0.75, -Math.PI * 0.25], spreadX: boss.w / 2 });
          }
        },
      }),
  ];
}

/** Pomocnik: kierunek do gracza. */
export function aimAtPlayer(boss: TurbineBoss, world: WorldContext): { x: number; y: number } {
  const p = world.player;
  return normalize(p.cx - boss.cx, p.cy - boss.cy);
}

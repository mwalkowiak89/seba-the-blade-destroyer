import { CONFIG } from '../../core/Config';
import { Sfx } from '../../render/Audio';
import { standsOnOneWayOnly } from '../../world/Physics';
import type { PlayerController } from './PlayerController';
import type { WorldContext } from '../../scenes/WorldContext';

export type PlayerStateName = 'idle' | 'run' | 'crouch' | 'jump' | 'fall' | 'hurt' | 'dead';

/** Stan FSM gracza. Stany są bezstanowymi singletonami – dane trzyma PlayerController. */
export interface PlayerState {
  readonly name: PlayerStateName;
  enter(p: PlayerController, world: WorldContext): void;
  update(p: PlayerController, dt: number, world: WorldContext): void;
  exit(p: PlayerController, world: WorldContext): void;
}

const P = CONFIG.player;

/** Wspólne sterowanie w powietrzu: pełna kontrola poziomu + obrót zwrotu. */
function airControl(p: PlayerController): void {
  const ax = p.input.axisX;
  p.vx = ax * P.runSpeed;
  if (ax !== 0) p.facing = ax as 1 | -1;
}

function tryGroundTransitions(p: PlayerController, world: WorldContext): boolean {
  if (!p.onGround) { p.setState(FALL, world); return true; }
  if (p.input.justPressed('jump')) {
    if (p.input.held('down') && standsOnOneWayOnly(p, world.level)) {
      p.startDropThrough();
      p.setState(FALL, world);
    } else {
      p.setState(JUMP, world);
    }
    return true;
  }
  return false;
}

export const IDLE: PlayerState = {
  name: 'idle',
  enter(p) { p.vx = 0; p.setStanding(); },
  update(p, _dt, world) {
    p.vx = 0;
    if (tryGroundTransitions(p, world)) return;
    if (p.input.held('down')) { p.setState(CROUCH, world); return; }
    if (p.input.axisX !== 0) { p.setState(RUN, world); return; }
  },
  exit() {},
};

export const RUN: PlayerState = {
  name: 'run',
  enter(p) { p.setStanding(); },
  update(p, _dt, world) {
    const ax = p.input.axisX;
    if (ax !== 0) p.facing = ax as 1 | -1;
    p.vx = ax * P.runSpeed;
    if (tryGroundTransitions(p, world)) return;
    if (p.input.held('down')) { p.setState(CROUCH, world); return; }
    if (ax === 0) { p.setState(IDLE, world); return; }
  },
  exit() {},
};

export const CROUCH: PlayerState = {
  name: 'crouch',
  enter(p) { p.vx = 0; p.setCrouching(); },
  update(p, _dt, world) {
    p.vx = 0;
    const ax = p.input.axisX;
    if (ax !== 0) p.facing = ax as 1 | -1; // obrót w kuckach bez ruchu
    if (tryGroundTransitions(p, world)) return;
    if (!p.input.held('down')) { p.setState(IDLE, world); return; }
  },
  exit(p) { p.setStanding(); },
};

/** Skok obrotowy – stała trajektoria, brak zmiennej wysokości. */
export const JUMP: PlayerState = {
  name: 'jump',
  enter(p) {
    p.setStanding();
    p.vy = P.jumpVelocity;
    p.onGround = false;
    p.somersaultTime = 0;
    Sfx.play('jump');
  },
  update(p, dt, world) {
    airControl(p);
    p.somersaultTime += dt;
    if (p.onGround && p.vy >= 0) {
      p.setState(p.input.axisX !== 0 ? RUN : IDLE, world);
    }
  },
  exit(p) { p.somersaultTime = -1; },
};

/** Spadanie bez koziołka (zejście z krawędzi, zeskok przez platformę, po hurt). */
export const FALL: PlayerState = {
  name: 'fall',
  enter(p) { p.setStanding(); },
  update(p, _dt, world) {
    airControl(p);
    if (p.onGround) p.setState(p.input.axisX !== 0 ? RUN : IDLE, world);
  },
  exit() {},
};

export const HURT: PlayerState = {
  name: 'hurt',
  enter(p) {
    p.setStanding();
    p.hurtTimer = P.hurtTime;
    p.vx = p.knockbackDir * P.hurtKnockbackX;
    p.vy = P.hurtKnockbackY;
    p.onGround = false;
  },
  update(p, dt, world) {
    p.hurtTimer -= dt;
    if (p.hurtTimer <= 0) p.setState(p.onGround ? IDLE : FALL, world);
  },
  exit() {},
};

export const DEAD: PlayerState = {
  name: 'dead',
  enter(p) { p.vx = 0; p.setCrouching(); },
  update(p) { p.vx = 0; },
  exit() {},
};

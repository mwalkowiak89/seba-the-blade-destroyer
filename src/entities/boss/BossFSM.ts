import type { WorldContext } from '../../scenes/WorldContext';

/**
 * Faza bossa. Aktywowana, gdy ułamek HP spadnie do `startsAt` lub niżej.
 * Fazy podaje się w kolejności malejących progów (1.0, 0.66, 0.33, ...).
 */
export interface BossPhase<B> {
  readonly name: string;
  readonly startsAt: number;
  enter(boss: B, world: WorldContext): void;
  update(boss: B, dt: number, world: WorldContext): void;
  exit(boss: B, world: WorldContext): void;
}

/**
 * Wzorzec ataku – wymienny klocek używany przez fazy.
 * `update` zwraca true, gdy atak się zakończył.
 */
export interface AttackPattern<B> {
  readonly name: string;
  start(boss: B, world: WorldContext): void;
  update(boss: B, dt: number, world: WorldContext): boolean;
}

/**
 * Generyczna maszyna faz bossa. Przejścia są tylko "w przód" i wynikają z HP.
 * Zdarzenie `onPhaseChange(from, to)` pozwala podpiąć UI/dźwięk/efekty.
 */
export class BossFSM<B> {
  phaseIndex = -1;

  constructor(
    private readonly phases: BossPhase<B>[],
    private readonly onPhaseChange?: (from: number, to: number, phase: BossPhase<B>) => void,
  ) {
    if (phases.length === 0) throw new Error('BossFSM wymaga co najmniej jednej fazy');
  }

  get current(): BossPhase<B> | null {
    return this.phaseIndex >= 0 ? this.phases[this.phaseIndex] : null;
  }

  /** Indeks najbardziej zaawansowanej fazy, której próg został osiągnięty. */
  private targetIndex(hpFraction: number): number {
    let idx = 0;
    for (let i = 0; i < this.phases.length; i++) {
      if (hpFraction <= this.phases[i].startsAt + 1e-6) idx = i;
    }
    return idx;
  }

  update(boss: B, hpFraction: number, dt: number, world: WorldContext): void {
    const target = this.targetIndex(hpFraction);
    while (this.phaseIndex < target) this.advance(boss, world);
    this.current?.update(boss, dt, world);
  }

  private advance(boss: B, world: WorldContext): void {
    const from = this.phaseIndex;
    this.current?.exit(boss, world);
    this.phaseIndex++;
    const phase = this.phases[this.phaseIndex];
    phase.enter(boss, world);
    this.onPhaseChange?.(from, this.phaseIndex, phase);
  }

  /** Wymuszone przejście (debug / skrypty). */
  forcePhase(index: number, boss: B, world: WorldContext): void {
    while (this.phaseIndex < index && this.phaseIndex < this.phases.length - 1) this.advance(boss, world);
  }
}

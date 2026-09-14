import type { Camera } from '../core/Camera';
import type { EventBus } from '../core/EventBus';
import type { Level } from '../world/Level';
import type { ParticleSystem } from '../render/Particles';
import type { FxSystem } from '../render/Fx';
import type { BulletPool } from '../entities/weapons/Bullet';
import type { PlayerController } from '../entities/player/PlayerController';
import type { EnemyBase } from '../entities/enemies/EnemyBase';
import type { BulletKind } from '../entities/weapons/Bullet';

export interface GameEvents extends Record<string, unknown> {
  'score': { total: number; delta: number };
  'player:damaged': { amount: number };
  'player:died': undefined;
  'enemy:died': { enemy: EnemyBase };
  'boss:spawned': { name: string };
  'boss:phase': { from: number; to: number };
  'boss:died': undefined;
}

/**
 * Kontekst świata przekazywany encjom w `update` – zamiast twardych zależności
 * od klasy sceny (unika cykli importów, ułatwia testy).
 */
export interface WorldContext {
  readonly level: Level;
  readonly camera: Camera;
  readonly player: PlayerController;
  readonly playerBullets: BulletPool;
  readonly enemyBullets: BulletPool;
  readonly particles: ParticleSystem;
  readonly fx: FxSystem;
  readonly events: EventBus<GameEvents>;
  /** Czas gry (s). */
  readonly time: number;
  addScore(points: number): void;
  spawnEnemy(enemy: EnemyBase): void;
  /** Wygodny strzał wroga w zadanym kierunku (znormalizowany wewnętrznie). */
  fireEnemyBullet(x: number, y: number, dirX: number, dirY: number, speed: number, damage: number, opts?: { gravity?: number; radius?: number; color?: string; kind?: BulletKind; hitsTerrain?: boolean; life?: number }): void;
  /** Zatrzymanie akcji (hit-stop) na czas w sekundach – działa tylko kamera, cząstki i FX. */
  hitStop(seconds: number): void;
  /** Podłoga areny bossa (y górnej krawędzi) – do drgań podłoża. */
  readonly arenaFloorY: number;
}

import type { Camera } from '../core/Camera';
import type { EventBus } from '../core/EventBus';
import type { Level } from '../world/Level';
import type { ParticleSystem } from '../render/Particles';
import type { BulletPool } from '../entities/weapons/Bullet';
import type { PlayerController } from '../entities/player/PlayerController';
import type { EnemyBase } from '../entities/enemies/EnemyBase';

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
  readonly events: EventBus<GameEvents>;
  /** Czas gry (s). */
  readonly time: number;
  addScore(points: number): void;
  spawnEnemy(enemy: EnemyBase): void;
  /** Wygodny strzał wroga w zadanym kierunku (znormalizowany wewnętrznie). */
  fireEnemyBullet(x: number, y: number, dirX: number, dirY: number, speed: number, damage: number, opts?: { gravity?: number; radius?: number; color?: string }): void;
}

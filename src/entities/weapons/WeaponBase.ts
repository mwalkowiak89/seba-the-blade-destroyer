import type { BulletPool } from './Bullet';
import { degToRad, randRange } from '../../core/MathUtil';

export interface WeaponStats {
  name: string;
  /** Odstęp między strzałami (s) – ogień automatyczny przy trzymaniu klawisza. */
  fireInterval: number;
  bulletSpeed: number;
  damage: number;
  bulletRadius: number;
  lifetime: number;
  spreadDeg: number;
}

/**
 * Baza broni gracza. Trzyma cooldown i deleguje do `spawnProjectiles`,
 * dzięki czemu nowe bronie (shotgun, laser...) to nowa podklasa z inną emisją pocisków.
 */
export abstract class WeaponBase {
  protected cooldown = 0;

  constructor(public stats: WeaponStats) {}

  update(dt: number): void {
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  /** Próba strzału. `dir` musi być znormalizowany. @returns true jeśli wystrzelono. */
  tryFire(pool: BulletPool, x: number, y: number, dirX: number, dirY: number): boolean {
    if (this.cooldown > 0) return false;
    this.cooldown = this.stats.fireInterval;
    this.spawnProjectiles(pool, x, y, dirX, dirY);
    return true;
  }

  protected abstract spawnProjectiles(pool: BulletPool, x: number, y: number, dirX: number, dirY: number): void;

  /** Pomocnik: obraca kierunek o losowy rozrzut. */
  protected withSpread(dirX: number, dirY: number): { x: number; y: number } {
    const a = Math.atan2(dirY, dirX) + degToRad(randRange(-this.stats.spreadDeg, this.stats.spreadDeg));
    return { x: Math.cos(a), y: Math.sin(a) };
  }
}

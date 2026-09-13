import { CONFIG } from '../../core/Config';
import type { BulletPool } from './Bullet';
import { WeaponBase } from './WeaponBase';

/** Broń główna – "Makita DIY": szybki, ciągły ogień pojedynczymi pociskami. */
export class MakitaGun extends WeaponBase {
  constructor() {
    super({ ...CONFIG.weapons.makita });
  }

  protected spawnProjectiles(pool: BulletPool, x: number, y: number, dirX: number, dirY: number): void {
    const d = this.withSpread(dirX, dirY);
    pool.spawn({
      owner: 'player',
      x, y,
      vx: d.x * this.stats.bulletSpeed,
      vy: d.y * this.stats.bulletSpeed,
      damage: this.stats.damage,
      radius: this.stats.bulletRadius,
      life: this.stats.lifetime,
    });
  }
}

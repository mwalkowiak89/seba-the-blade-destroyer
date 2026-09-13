import type { Visual } from '../render/Visual';
import type { WorldContext } from '../scenes/WorldContext';
import { rectsOverlap } from '../core/MathUtil';
import type { Body } from '../world/Physics';

/** Bazowa encja świata: AABB + prędkość + wizual. */
export abstract class Entity implements Body {
  x = 0;
  y = 0;
  w = 16;
  h = 16;
  vx = 0;
  vy = 0;
  facing: 1 | -1 = 1;
  alive = true;
  onGround = false;
  /** Czas życia encji – wykorzystywany przez animacje. */
  age = 0;
  abstract visual: Visual;

  get cx(): number { return this.x + this.w / 2; }
  get cy(): number { return this.y + this.h / 2; }
  get bottom(): number { return this.y + this.h; }

  overlaps(o: { x: number; y: number; w: number; h: number }): boolean {
    return rectsOverlap(this.x, this.y, this.w, this.h, o.x, o.y, o.w, o.h);
  }

  /** Test kolizji z okrągłym pociskiem (przybliżenie: AABB vs AABB pocisku). */
  overlapsCircle(cx: number, cy: number, r: number): boolean {
    return rectsOverlap(this.x, this.y, this.w, this.h, cx - r, cy - r, r * 2, r * 2);
  }

  abstract update(dt: number, world: WorldContext): void;
  abstract draw(ctx: CanvasRenderingContext2D): void;
}

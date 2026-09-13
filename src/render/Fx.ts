import { Pool } from '../core/Pool';
import { Sheets, type SheetName } from '../assets/AssetLoader';

class FxSprite {
  active = false;
  sheet: SheetName = 'shotHit';
  clip = 'play';
  x = 0; y = 0; t = 0; duration = 0;
  rotation = 0; flipX = false;
  /** Opcjonalne śledzenie pozycji (np. muzzle flash przy lufie). */
  follow: (() => { x: number; y: number }) | null = null;
}

/** Jednorazowe animacje (trafienie, eksplozja, błysk lufy) – pool bez alokacji. */
export class FxSystem {
  private pool = new Pool(64, () => new FxSprite());

  spawn(sheet: SheetName, x: number, y: number, opts: { clip?: string; rotation?: number; flipX?: boolean; follow?: () => { x: number; y: number } } = {}): void {
    const s = Sheets.tryGet(sheet);
    if (!s) return;
    const f = this.pool.spawn();
    if (!f) return;
    f.sheet = sheet; f.clip = opts.clip ?? 'play';
    f.x = x; f.y = y; f.t = 0;
    f.duration = s.clipDuration(f.clip);
    f.rotation = opts.rotation ?? 0; f.flipX = opts.flipX ?? false;
    f.follow = opts.follow ?? null;
  }

  update(dt: number): void {
    this.pool.forEachActive((f) => {
      f.t += dt;
      if (f.follow) { const p = f.follow(); f.x = p.x; f.y = p.y; }
      if (f.t >= f.duration) f.active = false;
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.pool.forEachActive((f) => {
      const s = Sheets.get(f.sheet);
      s.drawAnchored(ctx, s.frameAt(f.clip, f.t, f.clip), f.x, f.y, s.def.anchorX ?? s.frameW / 2, s.def.anchorY ?? s.frameH / 2, { rotation: f.rotation, flipX: f.flipX });
    });
  }

  clear(): void { this.pool.clear(); }
}

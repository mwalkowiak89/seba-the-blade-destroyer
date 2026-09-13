export const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sign = (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0);
export const degToRad = (d: number) => (d * Math.PI) / 180;
export const randRange = (min: number, max: number) => min + Math.random() * (max - min);
export const approach = (v: number, target: number, step: number) =>
  v < target ? Math.min(v + step, target) : Math.max(v - step, target);

export interface Vec2 { x: number; y: number }

export function normalize(x: number, y: number): Vec2 {
  const len = Math.hypot(x, y);
  return len === 0 ? { x: 0, y: 0 } : { x: x / len, y: y / len };
}

export function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

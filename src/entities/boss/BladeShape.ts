import profile from './blade-profile.json';

export { profile as BLADE_PROFILE };
export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

export function bladeEdges(y: number): [number, number] {
  const rows = profile.rows;
  for (let i = 1; i < rows.length; i++) {
    if (y <= rows[i][0]) {
      const [a, left, right] = rows[i - 1], [b, nextLeft, nextRight] = rows[i];
      const t = Math.max(0, (y - a) / (b - a));
      return [left + (nextLeft - left) * t, right + (nextRight - right) * t];
    }
  }
  return [rows[rows.length - 1][1], rows[rows.length - 1][2]];
}

/** Każdy pas profilu jest wypukłym trapezem — także po odbiciu i obrocie. */
export function bladeBands(transform: (x: number, y: number) => Point, minY = 0): Point[][] {
  const bands: Point[][] = [];
  for (let i = 1; i < profile.rows.length; i++) {
    const y0 = Math.max(minY, profile.rows[i - 1][0]), y1 = profile.rows[i][0];
    if (y0 >= y1) continue;
    const [l0, r0] = bladeEdges(y0), [l1, r1] = bladeEdges(y1);
    bands.push([transform(l0, y0), transform(r0, y0), transform(r1, y1), transform(l1, y1)]);
  }
  return bands;
}

/** SAT dla wypukłego pasa i prostokąta; brak obrażeń w pustym obrysie przy końcówce. */
export function bandOverlapsRect(points: Point[], rect: Rect): boolean {
  const corners = [{ x: rect.x, y: rect.y }, { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h }, { x: rect.x, y: rect.y + rect.h }];
  const axes: Point[] = [{ x: 1, y: 0 }, { x: 0, y: 1 }];
  points.forEach((p, i) => { const next = points[(i + 1) % points.length]; axes.push({ x: next.y - p.y, y: p.x - next.x }); });
  for (const axis of axes) {
    const project = (p: Point) => p.x * axis.x + p.y * axis.y;
    const a = points.map(project), b = corners.map(project);
    if (Math.max(...a) < Math.min(...b) || Math.max(...b) < Math.min(...a)) return false;
  }
  return true;
}

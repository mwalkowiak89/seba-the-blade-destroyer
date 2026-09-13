// Prymitywy rysowania pixel-art na buforze PNG (pipeline zasobów).
export const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), h.length > 7 ? parseInt(h.slice(7, 9), 16) : 255];

export function px(img, x, y, color) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const c = typeof color === 'string' ? hex(color) : color;
  img.data.set(c, (y * img.width + x) * 4);
}
export function rect(img, x, y, w, h, color) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(img, x + i, y + j, color);
}
export function hline(img, x, y, w, color) { rect(img, x, y, w, 1, color); }
export function vline(img, x, y, h, color) { rect(img, x, y, 1, h, color); }
export function line(img, x0, y0, x1, y1, color) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
  for (;;) { px(img, x0, y0, color); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}
export function circle(img, cx, cy, r, color, fill = false) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    const d = Math.hypot(x, y);
    if (fill ? d <= r + 0.3 : Math.abs(d - r) < 0.6) px(img, cx + x, cy + y, color);
  }
}
/** Zamiana kolorów wg mapy {'#src': '#dst'}. */
export function recolor(img, map) {
  const m = new Map(Object.entries(map).map(([k, v]) => [k.toLowerCase(), hex(v)]));
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0) continue;
    const k = '#' + [img.data[i], img.data[i + 1], img.data[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
    const c = m.get(k);
    if (c) img.data.set(c, i);
  }
  return img;
}
export function flipX(img) {
  const out = { width: img.width, height: img.height, data: Buffer.alloc(img.data.length) };
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) out.data.set(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4), (y * img.width + (img.width - 1 - x)) * 4);
  return out;
}
export function flipY(img) {
  const out = { width: img.width, height: img.height, data: Buffer.alloc(img.data.length) };
  for (let y = 0; y < img.height; y++) out.data.set(img.data.subarray(y * img.width * 4, (y + 1) * img.width * 4), (img.height - 1 - y) * img.width * 4);
  return out;
}
/** Obrót o 45° (najbliższy sąsiad) – do orientacji diagonalnych broni. */
export function rotate45(img, outW, outH, cx, cy, ox, oy) {
  const out = { width: outW, height: outH, data: Buffer.alloc(outW * outH * 4) };
  const c = Math.SQRT1_2;
  for (let y = 0; y < outH; y++) for (let x = 0; x < outW; x++) {
    const dx = x - ox + 0.5, dy = y - oy + 0.5;
    // odwrotny obrót o -45° (obraz kręci się przeciwnie do wskazówek = celowanie w górę)
    const sx = Math.floor(cx + dx * c - dy * c), sy = Math.floor(cy + dx * c + dy * c);
    if (sx >= 0 && sy >= 0 && sx < img.width && sy < img.height) out.data.set(img.data.subarray((sy * img.width + sx) * 4, (sy * img.width + sx) * 4 + 4), (y * outW + x) * 4);
  }
  return out;
}
export function rotate90ccw(img) {
  const out = { width: img.height, height: img.width, data: Buffer.alloc(img.data.length) };
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const nx = y, ny = img.width - 1 - x;
    out.data.set(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4), (ny * out.width + nx) * 4);
  }
  return out;
}

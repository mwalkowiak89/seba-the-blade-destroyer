// Pomocniki PNG dla pipeline'u zasobów (Node, pngjs).
import { PNG } from 'pngjs';
import fs from 'node:fs';

export function load(path) {
  return PNG.sync.read(fs.readFileSync(path));
}
export function save(png, path) {
  const dir = path.substring(0, path.lastIndexOf('/'));
  if (dir) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path, PNG.sync.write(png));
}
export function create(w, h) {
  const p = new PNG({ width: w, height: h });
  p.data.fill(0);
  return p;
}
export function blit(dst, src, dx, dy, sx = 0, sy = 0, sw = src.width, sh = src.height) {
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const si = ((sy + y) * src.width + (sx + x)) * 4;
    const di = ((dy + y) * dst.width + (dx + x)) * 4;
    if (dx + x < 0 || dy + y < 0 || dx + x >= dst.width || dy + y >= dst.height) continue;
    if (src.data[si + 3] === 0) continue;
    dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1]; dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = src.data[si + 3];
  }
}
export function scale(src, k) {
  const out = create(src.width * k, src.height * k);
  for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
    const si = (Math.floor(y / k) * src.width + Math.floor(x / k)) * 4, di = (y * out.width + x) * 4;
    out.data.set(src.data.subarray(si, si + 4), di);
  }
  return out;
}
export function grid(png, step, rgba = [255, 0, 255, 120]) {
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (x % step === 0 || y % step === 0) { const i = (y * png.width + x) * 4; png.data.set(rgba, i); }
  }
}
export function bbox(png) {
  let x0 = png.width, y0 = png.height, x1 = -1, y1 = -1;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] > 0) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

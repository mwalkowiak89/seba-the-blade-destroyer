/**
 * Ekstrakcja propsów z sheetu green-screen (assets/raw/props/blade-stands-source.jpeg):
 *  - masywna łopata (jeden długi sprite, dokładnie BLADE_TILES kafli szerokości),
 *  - stojaki A-frame (sheet, kotwica dół-środek), skalowane do wysokości STAND_H.
 * Skala wynika z długości łopaty (32 kafle); figurka referencyjna Seby w źródle (~90 px) daje po przeskalowaniu ~48 px = zgodnie z grą.
 */
import fs from 'node:fs';
import jpeg from 'jpeg-js';
import { create, save } from './png.mjs';

const SRC = 'assets/raw/props/blade-stands-source.jpeg';
const BLADE_TILES = 32, TILE = 16, STAND_H = 62, PALETTE = 14;
const ROWS = {
  blade:  { x: 20, y: 160, w: 990, h: 130 },
  stands: { x: 20, y: 338, w: 990, h: 160 },
};
const img = jpeg.decode(fs.readFileSync(SRC), { useTArray: true });
const W = img.width, H = img.height;
const alpha = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = img.data[i * 4], g = img.data[i * 4 + 1], b = img.data[i * 4 + 2];
  const green = (g > 150 && g - Math.max(r, b) > 55) || (g > 200 && r > 150 && Math.abs(r - b) < 30 && g - Math.max(r, b) > 25);
  alpha[i] = green ? 0 : 255;
}
for (let i = 0; i < W * H; i++) { if (!alpha[i]) continue; const r = img.data[i * 4], g = img.data[i * 4 + 1], b = img.data[i * 4 + 2]; const m = Math.max(r, b); if (g > m + 40) img.data[i * 4 + 1] = m + 20; }

function segments(rect, gap = 4, minArea = 400) {
  const colHas = new Uint8Array(rect.w);
  for (let x = 0; x < rect.w; x++) for (let y = rect.y; y < rect.y + rect.h; y++) if (alpha[y * W + rect.x + x]) { colHas[x] = 1; break; }
  const segs = []; let start = -1, g = 0;
  for (let x = 0; x <= rect.w; x++) { const has = x < rect.w && colHas[x]; if (has) { if (start < 0) start = x; g = 0; } else if (start >= 0 && ++g >= gap) { segs.push([start, x - g]); start = -1; g = 0; } }
  if (start >= 0) segs.push([start, rect.w - 1]);
  const out = [];
  for (const [sx, ex] of segs) { let y0 = 1e9, y1 = -1, n = 0; for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = sx; x <= ex; x++) if (alpha[y * W + rect.x + x]) { n++; y0 = Math.min(y0, y); y1 = Math.max(y1, y); } if (n >= minArea) out.push({ x0: rect.x + sx, x1: rect.x + ex, y0, y1 }); }
  return out;
}
function downscale(b, k) {
  const sw = b.x1 - b.x0 + 1, sh = b.y1 - b.y0 + 1, ow = Math.max(1, Math.round(sw / k)), oh = Math.max(1, Math.round(sh / k));
  const px = [];
  for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
    let r = 0, g = 0, bl = 0, a = 0, cnt = 0;
    for (let yy = Math.floor(oy * k); yy < Math.min(sh, Math.floor((oy + 1) * k)); yy++) for (let xx = Math.floor(ox * k); xx < Math.min(sw, Math.floor((ox + 1) * k)); xx++) { const i = (b.y0 + yy) * W + (b.x0 + xx); cnt++; if (!alpha[i]) continue; a++; r += img.data[i * 4]; g += img.data[i * 4 + 1]; bl += img.data[i * 4 + 2]; }
    if (cnt && a / cnt >= 0.5) px.push({ x: ox, y: oy, r: r / a, g: g / a, b: bl / a });
  }
  return { w: ow, h: oh, px };
}
function kmeans(samples, k, iters = 12) {
  let centers = []; const step = Math.max(1, Math.floor(samples.length / k));
  for (let i = 0; i < k; i++) centers.push({ ...samples[Math.min(samples.length - 1, i * step)] });
  for (let it = 0; it < iters; it++) { const acc = centers.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (const s of samples) { let bi = 0, bd = Infinity; for (let c = 0; c < centers.length; c++) { const d = (s.r - centers[c].r) ** 2 + (s.g - centers[c].g) ** 2 + (s.b - centers[c].b) ** 2; if (d < bd) { bd = d; bi = c; } } acc[bi].r += s.r; acc[bi].g += s.g; acc[bi].b += s.b; acc[bi].n++; }
    centers = acc.map((a, i) => (a.n ? { r: a.r / a.n, g: a.g / a.n, b: a.b / a.n } : centers[i])); }
  return centers.map((c) => ({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) }));
}
const nearest = (pal, s) => { let bi = 0, bd = Infinity; for (let c = 0; c < pal.length; c++) { const d = (s.r - pal[c].r) ** 2 + (s.g - pal[c].g) ** 2 + (s.b - pal[c].b) ** 2; if (d < bd) { bd = d; bi = c; } } return pal[bi]; };
const OUT = [43, 47, 54];
function paint(f, pal, dst, ox, oy) {
  const filled = new Set();
  for (const p of f.px) { const c = nearest(pal, p); dst.data.set([c.r, c.g, c.b, 255], ((oy + p.y) * dst.width + ox + p.x) * 4); filled.add(`${p.x},${p.y}`); }
  for (const p of f.px) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = p.x + dx, ny = p.y + dy; if (filled.has(`${nx},${ny}`)) continue; const X = ox + nx, Y = oy + ny; if (X < 0 || Y < 0 || X >= dst.width || Y >= dst.height) continue; const i = (Y * dst.width + X) * 4; if (dst.data[i + 3] === 0) dst.data.set([...OUT, 255], i); }
}

// --- łopata: skala z długości ---
const bladeSeg = segments(ROWS.blade, 8, 5000).sort((a, b) => (b.x1 - b.x0) - (a.x1 - a.x0))[0];
const K = (bladeSeg.x1 - bladeSeg.x0 + 1) / (BLADE_TILES * TILE - 2); // -2: miejsce na kontur
const blade = downscale(bladeSeg, K);
const standSegs = segments(ROWS.stands, 6, 2000);
const samples = [...blade.px, ...standSegs.flatMap((s) => downscale(s, K).px)];
const pal = kmeans(samples, PALETTE); pal.push({ r: 255, g: 255, b: 255 });

const bladeImg = create(BLADE_TILES * TILE, blade.h + 2);
paint(blade, pal, bladeImg, 1, 1);
// profil: górna krawędź (y pierwszego piksela) i dolna per kolumna – do wyrównania kolizji i stojaków
const top = [], bottom = [];
for (let x = 0; x < bladeImg.width; x++) { let t = -1, b = -1; for (let y = 0; y < bladeImg.height; y++) if (bladeImg.data[(y * bladeImg.width + x) * 4 + 3]) { if (t < 0) t = y; b = y; } top.push(t); bottom.push(b); }
const flatTop = Math.min(...top.filter((v) => v >= 0).slice(40, 300)); // górna powierzchnia głównej części (bez kołnierza nasady)
save(bladeImg, 'assets/sprites/props/blade-big.png');

// --- stojaki A-frame: wybierz 4 najszersze (pomiń wąskie słupki), skaluj do STAND_H, wspólna klatka ---
const stands = standSegs.map((s) => ({ s, w: s.x1 - s.x0 + 1, h: s.y1 - s.y0 + 1 })).filter((o) => o.w / o.h > 0.55).slice(0, 4)
  .map((o) => downscale(o.s, o.h / STAND_H));
const FW = Math.max(...stands.map((f) => f.w)) + 2, FH = STAND_H + 2;
const sheet = create(FW * stands.length, FH);
stands.forEach((f, i) => paint(f, pal, sheet, i * FW + Math.floor((FW - f.w) / 2), FH - 1 - f.h));
save(sheet, 'assets/sprites/props/stands.png');

fs.writeFileSync('assets/raw/props/props.json', JSON.stringify({
  blade: { file: 'assets/sprites/props/blade-big.png', w: bladeImg.width, h: bladeImg.height, tiles: BLADE_TILES, flatTop, bottom: bottom.filter((_, i) => i % 16 === 8) },
  stands: { file: 'assets/sprites/props/stands.png', frameW: FW, frameH: FH, cols: stands.length, clips: Object.fromEntries(stands.map((_, i) => [`s${i}`, { frames: [i], fps: 1 }])), anchor: 'bottom', anchorX: Math.floor(FW / 2) },
}, null, 2));
console.log(`OK: łopata ${bladeImg.width}x${bladeImg.height} (K=${K.toFixed(2)}, płaska góra y=${flatTop}), stojaki ${stands.length}× ${FW}x${FH}`);

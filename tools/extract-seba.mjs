/**
 * Ekstrakcja klatek Seby z wygenerowanego sheetu na green screenie (assets/raw/seba-ai/source.jpeg).
 *
 *  1. chroma-key zieleni → alfa,
 *  2. w zadanych prostokątach wierszy: spójne plamy → klatki (łączone po nakładaniu się w X), sortowane od lewej,
 *  3. downscale (box filter, próg alfa) do skali gry + kwantyzacja do wspólnej palety (k-means),
 *  4. wyrównanie: stopy do dołu klatki, środek bboxa w poziomie; jednolity rozmiar klatki,
 *  5. zapis sheetu assets/sprites/player/seba.png + assets/raw/seba-ai/seba.sheet.json (dla build-assets).
 *
 * Uruchomienie: npm run assets (wywoływane z build-assets) lub node tools/extract-seba.mjs
 */
import fs from 'node:fs';
import jpeg from 'jpeg-js';
import { create, save, blit } from './png.mjs';

const SRC = 'assets/raw/seba-ai/source.jpeg';
const OUT_SHEET = 'assets/sprites/player/seba.png';
const OUT_JSON = 'assets/raw/seba-ai/seba.sheet.json';
const OUT_PORTRAIT = 'assets/sprites/ui/portrait.png';
const DENSITY = 1;

/** Docelowa wysokość stojącej postaci (px) – ~ hitbox 42 + margines na kask. */
const TARGET_HEIGHT = 48; // natywny low-res: hitbox 42 px + kask
const PALETTE_SIZE = 30; // zachowaj modelunek twarzy, odblasków i ubrań przy natywnej skali
const OUTLINE = [43, 47, 54];  // kontur 1 px jak w sprite'ach otoczenia

// Prostokąty wierszy w źródle (2048x2048) i mapowanie na klipy.
const ROWS = {
  idle:     { x: 30, y: 314, w: 840, h: 176 },
  run:      { x: 890, y: 314, w: 1150, h: 176 },
  jump:     { x: 30, y: 580, w: 860, h: 153 },
  fire:     { x: 940, y: 580, w: 860, h: 153 },   // 1-4 prosto, 5-6 w górę
  kneel:    { x: 30, y: 1074, w: 790, h: 111 },   // strzelanie z klęku → crouch
  prone:    { x: 1010, y: 1092, w: 940, h: 90 },  // czołganie / strzał leżąc
  die:      { x: 30, y: 1279, w: 940, h: 60 },
  face:     { x: 1125, y: 1748, w: 290, h: 215 }, // spokojna twarz (dolny rząd) → portret
};

// --- dekodowanie + chroma key ------------------------------------------------
const img = jpeg.decode(fs.readFileSync(SRC), { useTArray: true });
const W = img.width, H = img.height;
const alpha = new Uint8Array(W * H);
const MUZZLE_ROWS = [ROWS.fire, ROWS.kneel];
for (let i = 0; i < W * H; i++) {
  const r = img.data[i * 4], g = img.data[i * 4 + 1], b = img.data[i * 4 + 2];
  const isGreen = (g > 150 && g - Math.max(r, b) > 55) || (g > 200 && r > 150 && Math.abs(r - b) < 30 && g - Math.max(r, b) > 25); // tło + jasnozielone pola etykiet
  // błyski wylotu (pomarańcz) usuwamy – gra ma własny muzzle flash, a błyski sklejają klatki
  const x = i % W, y = Math.floor(i / W);
  // Kolor skóry mieści się w zakresie błysków. Maska dotyczy tylko pasa broni
  // w klatkach ognia, nigdy twarzy, kasku, portretu ani pozostałych animacji.
  const inMuzzleBand = MUZZLE_ROWS.some((row) =>
    x >= row.x && x < row.x + row.w && y >= row.y + row.h * 0.4 && y < row.y + row.h);
  const isFlash = inMuzzleBand && ((r > 200 && r >= g - 5 && b < 170)
    || (r > 220 && g > 200 && b < 240 && r - b > 20));
  alpha[i] = isGreen || isFlash ? 0 : 255;
}
// despill: zielona obwódka na krawędziach → przyciągnij G do max(R,B)
for (let i = 0; i < W * H; i++) {
  if (!alpha[i]) continue;
  const r = img.data[i * 4], g = img.data[i * 4 + 1], b = img.data[i * 4 + 2];
  const m = Math.max(r, b);
  if (g > m + 40 && !(r > 150 && g > 150)) img.data[i * 4 + 1] = m + 20;
}

/** Usuwa z maski małe oderwane plamki (iskry, resztki etykiet) w prostokącie. */
function removeSpecks(rect, minArea = 120) {
  const seen = new Uint8Array(W * H);
  for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) {
    const i0 = y * W + x;
    if (!alpha[i0] || seen[i0]) continue;
    const comp = [i0]; seen[i0] = 1; const stack = [i0];
    while (stack.length) {
      const j = stack.pop(); const jx = j % W, jy = (j - jx) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = jx + dx, ny = jy + dy;
        if (nx < rect.x || ny < rect.y || nx >= rect.x + rect.w || ny >= rect.y + rect.h) continue;
        const k = ny * W + nx;
        if (alpha[k] && !seen[k]) { seen[k] = 1; stack.push(k); comp.push(k); }
      }
    }
    if (comp.length < minArea) for (const k of comp) alpha[k] = 0;
  }
}

// --- klatki w prostokącie: podział po lukach w projekcji kolumnowej -----------
function blobs(rect) {
  removeSpecks(rect);
  const colHas = new Uint8Array(rect.w);
  for (let x = 0; x < rect.w; x++) for (let y = rect.y; y < rect.y + rect.h; y++) if (alpha[y * W + rect.x + x]) { colHas[x] = 1; break; }
  const segs = [];
  let start = -1, gap = 0;
  for (let x = 0; x <= rect.w; x++) {
    const has = x < rect.w && colHas[x];
    if (has) { if (start < 0) start = x; gap = 0; }
    else if (start >= 0 && ++gap >= 3) { segs.push([start, x - gap]); start = -1; gap = 0; }
  }
  if (start >= 0) segs.push([start, rect.w - 1]);
  const out = [];
  for (const [sx, ex] of segs) {
    let y0 = rect.y + rect.h, y1 = rect.y - 1, n = 0;
    for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = sx; x <= ex; x++) if (alpha[y * W + rect.x + x]) { n++; y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    if (n >= 1500) out.push({ x0: rect.x + sx, x1: rect.x + ex, y0, y1, n });
  }
  if (process.env.DEBUG_SEGS) console.log(rect, out.map((o) => `${o.x0}-${o.x1}(${o.x1 - o.x0 + 1})`).join(' '));
  return out;
}

// --- wymazanie karabinu ------------------------------------------------------
/**
 * Usuwa karabin z klatki: w każdym wierszu piksele "metalu" (ciemne, nisko nasycone) leżące poza obrysem ciała
 * wyznaczonym przez jasne piksele (kurtka hi-vis, skóra, kask) są wycinane. Broń gracza to wyłącznie nakładka Makity.
 */
function eraseRifle(b, margin = 2) {
  const isMetal = (i) => { const r = img.data[i * 4], g = img.data[i * 4 + 1], bl = img.data[i * 4 + 2]; const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl); return mx < 190 && mx - mn < 45; };
  const isBright = (i) => { const r = img.data[i * 4], g = img.data[i * 4 + 1], bl = img.data[i * 4 + 2];
    return (g > 170 && r > 140 && bl < 130 && g - r > 15) || (r > 170 && g > 110 && g < 205 && bl > 70 && bl < 175 && r > g) || (r > 190 && g > 190 && bl > 190); };
  // karabin uniesiony nad głowę (strzał w górę): wiersze powyżej najwyższego jasnego piksela – metal do usunięcia
  let topBright = b.y1;
  for (let y = b.y0; y <= b.y1 && topBright === b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const i = y * W + x; if (alpha[i] && isBright(i)) { topBright = y; break; } }
  for (let y = b.y0; y < topBright; y++) for (let x = b.x0; x <= b.x1; x++) { const i = y * W + x; if (alpha[i] && isMetal(i)) alpha[i] = 0; }
  for (let y = b.y0; y <= b.y1; y++) {
    let left = Infinity, right = -Infinity;
    for (let x = b.x0; x <= b.x1; x++) {
      const i = y * W + x;
      if (!alpha[i]) continue;
      const r = img.data[i * 4], g = img.data[i * 4 + 1], bl = img.data[i * 4 + 2];
      const bright = (g > 170 && r > 140 && bl < 130 && g - r > 15) // hi-vis (G wyraźnie > R; żółć błysku ma R ≥ G)
        || (r > 170 && g > 110 && g < 205 && bl > 70 && bl < 175 && r > g) // skóra
        || (r > 190 && g > 190 && bl > 190);                       // kask / biel
      if (bright) { left = Math.min(left, x); right = Math.max(right, x); }
    }
    if (right < 0) continue; // wiersz bez ciała (np. same nogawki) – nie ruszamy
    // tylko przód postaci (wszystkie klatki źródłowe patrzą w prawo) – z tyłu są nogi/plecak, których nie ruszamy
    for (let x = right + margin + 1; x <= b.x1; x++) {
      const i = y * W + x;
      if (!alpha[i]) continue;
      const r = img.data[i * 4], g = img.data[i * 4 + 1], bl = img.data[i * 4 + 2];
      const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl);
      if (mx < 190 && mx - mn < 45) alpha[i] = 0; // metal / czerń karabinu
    }
  }
}
const RIFLE_ROWS = new Set(['fire', 'prone']);

// --- downscale z progiem alfa -------------------------------------------------
function downscale(b, k) {
  const sw = b.x1 - b.x0 + 1, sh = b.y1 - b.y0 + 1;
  const ow = Math.ceil(sw / k), oh = Math.ceil(sh / k);
  const px = []; // {x,y,r,g,b}
  for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
    let r = 0, g = 0, bl = 0, a = 0, cnt = 0;
    for (let yy = Math.floor(oy * k); yy < Math.min(sh, Math.floor((oy + 1) * k)); yy++) for (let xx = Math.floor(ox * k); xx < Math.min(sw, Math.floor((ox + 1) * k)); xx++) {
      const i = (b.y0 + yy) * W + (b.x0 + xx); cnt++;
      if (!alpha[i]) continue;
      a++; r += img.data[i * 4]; g += img.data[i * 4 + 1]; bl += img.data[i * 4 + 2];
    }
    if (cnt && a / cnt >= 0.5) px.push({ x: ox, y: oy, r: r / a, g: g / a, b: bl / a });
  }
  return { w: ow, h: oh, px };
}

// --- kwantyzacja k-means do wspólnej palety ----------------------------------
function kmeans(samples, k, iters = 12) {
  let centers = [];
  const step = Math.max(1, Math.floor(samples.length / k));
  for (let i = 0; i < k; i++) centers.push({ ...samples[Math.min(samples.length - 1, i * step)] });
  for (let it = 0; it < iters; it++) {
    const acc = centers.map(() => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (const s of samples) {
      let bi = 0, bd = Infinity;
      for (let c = 0; c < centers.length; c++) { const d = (s.r - centers[c].r) ** 2 + (s.g - centers[c].g) ** 2 + (s.b - centers[c].b) ** 2; if (d < bd) { bd = d; bi = c; } }
      acc[bi].r += s.r; acc[bi].g += s.g; acc[bi].b += s.b; acc[bi].n++;
    }
    centers = acc.map((a, i) => (a.n ? { r: a.r / a.n, g: a.g / a.n, b: a.b / a.n } : centers[i]));
  }
  return centers.map((c) => ({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) }));
}
const nearest = (pal, s) => { let bi = 0, bd = Infinity; for (let c = 0; c < pal.length; c++) { const d = (s.r - pal[c].r) ** 2 + (s.g - pal[c].g) ** 2 + (s.b - pal[c].b) ** 2; if (d < bd) { bd = d; bi = c; } } return pal[bi]; };

// --- główny przebieg ------------------------------------------------------------
const rowBlobs = Object.fromEntries(Object.entries(ROWS).map(([k, r]) => [k, blobs(r)]));
for (const [row, list] of Object.entries(rowBlobs)) if (RIFLE_ROWS.has(row)) for (const b of list) eraseRifle(b);
const idleH = Math.max(...rowBlobs.idle.map((b) => b.y1 - b.y0 + 1));
const K = idleH / TARGET_HEIGHT;
console.log('klatki per wiersz:', Object.fromEntries(Object.entries(rowBlobs).map(([k, v]) => [k, v.length])), '| skala 1/' + K.toFixed(2));

const frames = {}; // clip → [{w,h,px}]
const PORTRAIT = 20;
for (const [row, list] of Object.entries(rowBlobs)) frames[row] = list.map((b) => downscale(b, row === 'face' ? (b.y1 - b.y0 + 1) / PORTRAIT : K));

const samples = Object.entries(frames).filter(([k]) => k !== 'face').flatMap(([, fs]) => fs.flatMap((f) => f.px));
const palette = kmeans(samples, PALETTE_SIZE);
palette.push({ r: 255, g: 255, b: 255 }, { r: 20, g: 22, b: 28 }); // biel kasku i czerń obrysów zawsze dostępne

// klipy: indeksy w wierszach (od lewej)
const CLIPS = {
  idle:      { row: 'idle', idx: [0, 1, 2, 3, 4, 5], fps: 6, loop: true },
  run:       { row: 'run', idx: [0, 1, 2, 3, 4, 5, 6, 7, 8], fps: 14, loop: true },
  run_shoot: { row: 'run', idx: [0, 1, 2, 3, 4, 5, 6, 7, 8], fps: 14, loop: true },
  shoot:     { row: 'fire', idx: [0, 1, 2, 3], fps: 10, loop: true },
  shoot_up:  { row: 'fire', idx: [4, 5], fps: 8, loop: true },
  prone:     { row: 'prone', idx: [0, 1, 2], fps: 6, loop: true },
  jump:      { row: 'jump', idx: [1], fps: 1, loop: false },
  spin:      { row: 'jump', idx: [2, 3, 4, 5], fps: 12, loop: true },
  hurt:      { row: 'die', idx: [0], fps: 1, loop: true },
  dead:      { row: 'die', idx: [4], fps: 1, loop: true },
};
const list = []; const clips = {};
for (const [name, c] of Object.entries(CLIPS)) {
  const avail = frames[c.row];
  const idx = c.idx.filter((i) => i < avail.length);
  if (idx.length !== c.idx.length) console.warn(`klip ${name}: wiersz ${c.row} ma ${avail.length} klatek, brakuje ${c.idx.length - idx.length}`);
  clips[name] = { frames: idx.map((_, i) => list.length + i), fps: c.fps, loop: c.loop };
  for (const i of idx) list.push({ ...avail[i], spin: name === 'spin' });
}
const FW = Math.max(...list.map((f) => f.w)) + 4, FH = Math.max(...list.map((f) => f.h)) + 4;
const cols = 8, rows = Math.ceil(list.length / cols);
const sheet = create(FW * cols, FH * rows);
list.forEach((f, i) => {
  const cx = (i % cols) * FW, cy = Math.floor(i / cols) * FH;
  // stopy do dołu klatki (z 1 px zapasu na kontur); klatki koziołka – środek bboxa na wysokości połowy hitboxa
  const ox = Math.floor((FW - f.w) / 2);
  const oy = f.spin ? Math.round(FH - 21 - f.h / 2) : FH - 2 - f.h;
  const filled = new Set();
  for (const p of f.px) {
    const c = nearest(palette, p);
    sheet.data.set([c.r, c.g, c.b, 255], ((cy + oy + p.y) * sheet.width + (cx + ox + p.x)) * 4);
    filled.add(`${p.x},${p.y}`);
  }
  // kontur: przezroczyste piksele stykające się z sylwetką (4-sąsiedztwo) – spójna gęstość z kaflami/wrogami
  for (const p of f.px) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = p.x + dx, ny = p.y + dy;
    if (filled.has(`${nx},${ny}`)) continue;
    const X = cx + ox + nx, Y = cy + oy + ny;
    if (X < cx || Y < cy || X >= cx + FW || Y >= cy + FH) continue;
    const idx = (Y * sheet.width + X) * 4;
    if (sheet.data[idx + 3] === 0) sheet.data.set([...OUTLINE, 255], idx);
  }
});
save(sheet, OUT_SHEET);

// portret (PORTRAIT x PORTRAIT)
const face = frames.face[0];
if (face) {
  const port = create(PORTRAIT, PORTRAIT);
  const ox = Math.floor((PORTRAIT - face.w) / 2), oy = Math.max(0, PORTRAIT - face.h);
  for (const p of face.px) { const x = ox + p.x, y = oy + p.y; if (x >= 0 && y >= 0 && x < PORTRAIT && y < PORTRAIT) port.data.set([Math.round(p.r), Math.round(p.g), Math.round(p.b), 255], (y * PORTRAIT + x) * 4); }
  save(port, OUT_PORTRAIT);
}

const meta = {
  file: OUT_SHEET, frameW: FW, frameH: FH, cols, clips,
  anchor: 'bottom', anchorX: Math.floor(FW / 2), density: DENSITY,
  // dłoń (względem środek-stopy): stojąc ~60% wysokości, w klęku niżej – korekta ręczna po podglądzie
  pivots: { idle: { x: 5, y: -15 }, stand: { x: 5, y: -27 }, up: { x: 9, y: -19 }, crouch: { x: 9, y: -22 }, prone: { x: 24, y: -7 } },
};
fs.writeFileSync(OUT_JSON, JSON.stringify(meta, null, 2));
console.log(`OK: ${list.length} klatek ${FW}x${FH}, paleta ${palette.length}`);

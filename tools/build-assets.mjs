/**
 * Pipeline zasobów: assets/raw (CC0: Warped City / ansimuz) → assets/sprites, assets/tilesets,
 * assets/backgrounds + manifest TS z koordynatami klatek (src/assets/manifest.generated.ts).
 *
 * Uruchomienie: npm run assets
 * Podmiana grafiki 1:1: podmień PNG w assets/raw/... zachowując nazwy i liczbę klatek, odpal ponownie.
 */
import fs from 'node:fs';
import { load, save, create, blit, bbox, scale } from './png.mjs';

/** Gęstość pikseli gry (musi zgadzać się z CONFIG.view.pixelScale). Sheety 1x są podbijane ×D. */
const D = 1;
import { px, rect, hline, vline, line, circle, recolor, flipX, rotate45, rotate90ccw, hex } from './pixel.mjs';
import { drawSky, drawSiteMid, drawSiteNear, drawSkyBlades, SKY_HORIZON } from './site-backgrounds.mjs';

const RAW = 'assets/raw/warped-city';

// Ekstrakcja klatek Seby z wygenerowanego sheetu (green screen) – jeśli źródło istnieje.
if (fs.existsSync('assets/raw/seba-ai/source.jpeg')) {
  const { execFileSync } = await import('node:child_process');
  execFileSync(process.execPath, ['tools/extract-seba.mjs'], { stdio: 'inherit' });
}
const manifest = { version: Date.now().toString(36), sheets: {}, images: {}, tiles: {} };

const frames = (dir, prefix, n) => Array.from({ length: n }, (_, i) => load(`${RAW}/${dir}/${prefix}-${i + 1}.png`));
const single = (path) => [load(`${RAW}/${path}`)];

function unionBbox(imgs) {
  let u = null;
  for (const i of imgs) { const b = bbox(i); if (!b) continue; u = u ? { x0: Math.min(u.x0, b.x0), y0: Math.min(u.y0, b.y0), x1: Math.max(u.x1, b.x1), y1: Math.max(u.y1, b.y1) } : { ...b }; }
  return u;
}
function crop(img, r) { const out = create(r.x1 - r.x0 + 1, r.y1 - r.y0 + 1); blit(out, img, 0, 0, r.x0, r.y0, out.width, out.height); return out; }

/** Pakuje klatki (równe rozmiary) w sheet o `cols` kolumnach. */
function pack(imgs, cols) {
  const fw = imgs[0].width, fh = imgs[0].height, rows = Math.ceil(imgs.length / cols);
  const sheet = create(fw * cols, fh * rows);
  imgs.forEach((im, i) => blit(sheet, im, (i % cols) * fw, Math.floor(i / cols) * fh));
  return { sheet, frameW: fw, frameH: fh, cols };
}

const scalePt = (p) => (p ? { x: p.x * D, y: p.y * D } : p);
const scaleMap = (m) => (m ? Object.fromEntries(Object.entries(m).map(([k, v]) => [k, scalePt(v)])) : m);

/** Zapisuje sheet do manifestu. Wejście ma gęstość 1x – podbijane ×D (nearest), kotwice/pivoty przeliczane. */
function emitSheet(name, file, packed, clips, extra = {}) {
  const sheet = scale(packed.sheet, D);
  save(sheet, file);
  const e = { ...extra };
  if (e.anchorX !== undefined) e.anchorX *= D;
  if (e.anchorY !== undefined) e.anchorY *= D;
  if (e.pivots) e.pivots = scaleMap(e.pivots);
  if (e.muzzle) e.muzzle = scaleMap(e.muzzle);
  manifest.sheets[name] = { file, frameW: packed.frameW * D, frameH: packed.frameH * D, cols: packed.cols, clips, density: D, ...e };
}

// ---------------------------------------------------------------------------
// Palety
// ---------------------------------------------------------------------------
/** Kolory-znaczniki hełmu malowanego przez paintHelmet (potem mapowane paletą postaci). */
const H = { base: '#5b6577', hi: '#8f9db0', visor: '#101822', glow: '#2fb9b0', lamp: '#ffe36b', stripe: '#c8ccd0', pants: '#3a3f4a' };
const HAIR = new Set(['93278f', 'c51aea']);
const SKIN = new Set(['ffb164', 'b15c51']);
const JACKET = new Set(['ffd800', 'ec7809']);

/**
 * Seba – technik turbin: fryzura → biały kask wspinaczkowy z czołówką z przodu (twarz zostaje widoczna),
 * na kurtce poziomy pas odblaskowy. Działa na każdej klatce niezależnie (kierunek twarzy z położenia skóry).
 */
function paintHelmet(img) {
  const out = { width: img.width, height: img.height, data: Buffer.from(img.data) };
  const W = img.width, Hh = img.height;
  const key = (x, y) => (x < 0 || y < 0 || x >= W || y >= Hh || img.data[(y * W + x) * 4 + 3] === 0) ? null : img.data.subarray((y * W + x) * 4, (y * W + x) * 4 + 3).toString('hex');
  let x0 = W, y0 = Hh, x1 = -1, y1 = -1;
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (HAIR.has(key(x, y))) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) return out;
  const set = (x, y, c) => out.data.set(hex(c), (y * W + x) * 4);
  // kask: włosy → biała skorupa, górna krawędź jaśniejsza, dolna krawędź (rant) ciemniejsza
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!HAIR.has(key(x, y))) continue;
    const top = !HAIR.has(key(x, y - 1)) && !SKIN.has(key(x, y - 1));
    const bottom = !HAIR.has(key(x, y + 1));
    set(x, y, top ? H.hi : bottom ? H.visor : H.base);
  }
  // kierunek twarzy = strona, po której jest skóra
  const cx = (x0 + x1) / 2;
  let bal = 0;
  for (let y = y0; y <= y1 + 3; y++) for (let x = x0 - 1; x <= x1 + 1; x++) if (SKIN.has(key(x, y))) bal += x > cx ? 1 : -1;
  const faceRight = bal >= 0;
  // czołówka: 2 piksele na przedniej krawędzi kasku w 1/3 wysokości
  const yl = y0 + Math.max(1, Math.floor((y1 - y0) / 3));
  const xs = [];
  for (let x = x0; x <= x1; x++) if (HAIR.has(key(x, yl))) xs.push(x);
  if (xs.length >= 3) {
    const fx = faceRight ? xs[xs.length - 1] : xs[0];
    set(fx, yl, H.lamp); set(faceRight ? fx - 1 : fx + 1, yl, H.glow);
  }
  // pas odblaskowy: rząd pikseli kurtki ~6 px pod kaskiem (klatka piersiowa) + drugi 3 px niżej
  for (const dy of [6, 9]) {
    const y = y1 + dy;
    for (let x = 0; x < W; x++) if (JACKET.has(key(x, y))) set(x, y, H.stripe);
  }
  // długie spodnie: skóra poniżej kurtki (uda) → materiał spodni
  for (let y = y1 + 22; y < Hh; y++) for (let x = 0; x < W; x++) if (SKIN.has(key(x, y))) set(x, y, H.pants);
  return out;
}

/** Warped City player → Seba, technik turbin: kurtka hi-vis, ciemne spodnie robocze, czarne buty, biały kask. */
const SEBA_PALETTE = {
  '#ffd800': '#e6ff3d', // kurtka → hi-vis limonka
  '#ec7809': '#9bb800', // kurtka cień
  '#ffb164': '#f1c9a5', // skóra (jasna karnacja)
  '#b15c51': '#b98868', // skóra cień
  '#442b61': '#2f333b', // rajstopy → spodnie robocze
  '#81709a': '#4a505c', // nakolanniki / cień spodni
  '#a096d1': '#1c1f27', // buty czarne
  '#fcfcfc': '#6b7280', // podeszwa / szew
  '#ff2245': '#ff7a1a', // detal → karabińczyk uprzęży
  [H.base]: '#eef1f5', [H.hi]: '#ffffff', [H.visor]: '#b9c0c9', [H.glow]: '#2b2f3a', [H.lamp]: '#ffe36b', [H.stripe]: '#c8ccd0', [H.pants]: '#3a3f4a',
};
/** Blaszak – biegacz: metal, czerwony wizjer. */
const RUNNER_PALETTE = {
  '#ffd800': '#7d8794', '#ec7809': '#4b5563',
  '#ffb164': '#aab3bf', '#b15c51': '#6b7482', // skóra → metal
  '#442b61': '#1c2029', '#81709a': '#3a4250', '#a096d1': '#2b3038',
  '#fcfcfc': '#d9dee5', '#ff2245': '#ff2a2a',
  [H.base]: '#3a4250', [H.hi]: '#6b7482', [H.visor]: '#101010', [H.glow]: '#ff2a2a', [H.lamp]: '#ff2a2a', [H.stripe]: '#4b5563', [H.pants]: '#aab3bf',
};

// ---------------------------------------------------------------------------
// Gracz (Seba)
// ---------------------------------------------------------------------------
{
  const clipsSrc = {
    idle: frames('player/idle', 'idle', 4),
    run: frames('player/run', 'run', 8),
    run_shoot: frames('player/run-shoot', 'run-shoot', 8),
    shoot: single('player/shoot/shoot.png'),
    crouch: single('player/crouch/crouch.png'),
    hurt: single('player/hurt/hurt.png'),
    jump: frames('player/jump', 'jump', 4),
    spin: frames('player/back-jump', 'back-jump', 7),
  };
  const all = Object.values(clipsSrc).flat();
  const u = unionBbox(all);
  u.y1 = 66; // stopy zawsze w ostatnim wierszu klatki źródłowej
  const fps = { idle: 6, run: 14, run_shoot: 14, shoot: 1, crouch: 1, hurt: 1, jump: 8, spin: 14 };
  const loop = { jump: false, spin: true };
  const clips = {}; const list = [];
  for (const [name, imgs] of Object.entries(clipsSrc)) {
    clips[name] = { frames: imgs.map((_, i) => list.length + i), fps: fps[name], loop: loop[name] ?? true };
    list.push(...imgs.map((im) => paintHelmet(crop(im, u))));
  }
  const anchorX = 38 - u.x0; // środek postaci w klatce (idle: 28..48)
  // Seba: docelowy sheet z wygenerowanej grafiki (tools/extract-seba.mjs) ma pierwszeństwo;
  // przerobiona postać z Warped City zostaje jako fallback.
  const AI_SHEET = 'assets/raw/seba-ai/seba.sheet.json';
  if (fs.existsSync(AI_SHEET)) {
    manifest.sheets.seba = JSON.parse(fs.readFileSync(AI_SHEET, 'utf8'));
    manifest.sebaSource = 'seba-ai';
  } else {
    const seba = pack(list.map((im) => recolor({ ...im, data: Buffer.from(im.data) }, SEBA_PALETTE)), 8);
    emitSheet('seba', 'assets/sprites/player/seba.png', seba, clips, {
      anchor: 'bottom', anchorX,
      // punkt dłoni (względem kotwicy: środek-stopy) dla nakładki broni
      pivots: { stand: { x: 48 - 38, y: 27 - 67 }, crouch: { x: 44 - 38, y: 44 - 67 } },
    });
  }

  // Biegacz – blaszak: te same klatki biegu w palecie metalu
  const runnerList = [...clipsSrc.run, ...clipsSrc.hurt].map((im) => recolor(paintHelmet(crop(im, u)), RUNNER_PALETTE));
  const runner = pack(runnerList, 9);
  emitSheet('runner', 'assets/sprites/enemies/runner.png', runner, {
    run: { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 16, loop: true },
    jump: { frames: [3], fps: 1, loop: true },
    hurt: { frames: [8], fps: 1, loop: true },
  }, { anchor: 'bottom', anchorX });
}

// ---------------------------------------------------------------------------
// Dron, wieżyczka (snajper), pocisk, trafienie, eksplozja
// ---------------------------------------------------------------------------
{
  const drone = frames('misc/drone', 'drone', 4); const u = unionBbox(drone);
  const p = pack(drone.map((im) => crop(im, u)), 4);
  emitSheet('drone', 'assets/sprites/enemies/drone.png', p, { patrol: { frames: [0, 1, 2, 3], fps: 10, loop: true }, charge: { frames: [0, 1, 2, 3], fps: 20, loop: true }, return: { frames: [0, 1, 2, 3], fps: 10, loop: true } },
    { anchor: 'center', anchorX: Math.round(p.frameW / 2), anchorY: 16 });

  const turret = frames('misc/turret', 'turret', 6); const ut = unionBbox(turret);
  const pt = pack(turret.map((im) => crop(im, ut)), 6);
  emitSheet('turret', 'assets/sprites/enemies/turret.png', pt, { idle: { frames: [0], fps: 1, loop: true }, aim: { frames: [1, 2, 3, 4, 5], fps: 10, loop: false }, cooldown: { frames: [0], fps: 1, loop: true } },
    { anchor: 'bottom', anchorX: Math.round(pt.frameW / 2) });

  const shot = frames('misc/shot', 'shot', 3);
  const ps = pack(shot, 3);
  emitSheet('shot', 'assets/sprites/fx/shot.png', ps, { fly: { frames: [0, 1, 2], fps: 18, loop: true } }, { anchor: 'center', anchorX: 8, anchorY: 5 });

  const hit = frames('misc/shot-hit', 'shot-hit', 3);
  const ph = pack(hit, 3);
  emitSheet('shotHit', 'assets/sprites/fx/shot-hit.png', ph, { play: { frames: [0, 1, 2], fps: 24, loop: false } }, { anchor: 'center', anchorX: 7, anchorY: 5 });

  const expl = frames('misc/enemy-explosion', 'enemy-explosion', 6);
  const pe = pack(expl, 6);
  emitSheet('explosion', 'assets/sprites/fx/explosion.png', pe, { play: { frames: [0, 1, 2, 3, 4, 5], fps: 16, loop: false } }, { anchor: 'center', anchorX: 27, anchorY: 26 });
}

// ---------------------------------------------------------------------------
// Makita DIY – wkrętarka akumulatorowa (bez tarczy): 3 orientacje × 2 klatki obrotu bitu
// ---------------------------------------------------------------------------
{
  const F = 28; // rozmiar klatki
  function drawMakita(frame) {
    const im = create(F, F);
    const oy = 11; // oś lufy w wierszu 13
    // korpus (teal Makity) z wentylacją
    rect(im, 4, oy - 1, 12, 6, '#1ba39c'); rect(im, 4, oy - 1, 12, 1, '#4ed6cc'); rect(im, 4, oy + 4, 12, 1, '#0d6b66');
    rect(im, 3, oy, 1, 4, '#0d6b66'); for (let x = 6; x < 12; x += 2) px(im, x, oy + 1, '#0d6b66');
    // bateria z tyłu + uchwyt ze spustem
    rect(im, 1, oy, 3, 5, '#2b2f3a'); px(im, 1, oy, '#5a6170');
    rect(im, 6, oy + 5, 3, 6, '#2b2f3a'); rect(im, 6, oy + 10, 4, 2, '#1c1f27'); px(im, 7, oy + 6, '#5a6170');
    px(im, 10, oy + 5, '#ffb300');
    // uchwyt wiertarski (chuck) – stożek
    rect(im, 16, oy, 4, 4, '#8a8f99'); rect(im, 16, oy, 4, 1, '#c3c8d1'); rect(im, 20, oy + 1, 2, 2, '#6b7280');
    // bit/wkrętak – obracający się (naprzemienne rowki)
    rect(im, 22, oy + 1, 5, 2, '#b8bec8'); px(im, 22 + (frame ? 1 : 0), oy + 1, '#e5e9ef'); px(im, 24 + (frame ? 1 : 0), oy + 2, '#6b7280'); px(im, 26, oy + 1, '#ffffff');
    return im;
  }
  const h0 = drawMakita(0), h1 = drawMakita(1);
  const pivot = { x: 6, y: 13 }; // dłoń na uchwycie
  // pion: obrót o 90° CCW → lufa w górę; pivot (x,y) → (y, F-1-x)
  const v0 = rotate90ccw(h0), v1 = rotate90ccw(h1);
  const vPivot = { x: pivot.y, y: F - 1 - pivot.x };
  // skos: obrót o 45° wokół pivota, pivot umieszczony w (8, 19)
  const dPivot = { x: 8, y: 19 };
  const d0 = rotate45(h0, F, F, pivot.x, pivot.y, dPivot.x, dPivot.y), d1 = rotate45(h1, F, F, pivot.x, pivot.y, dPivot.x, dPivot.y);
  const p = pack([h0, h1, d0, d1, v0, v1], 6);
  emitSheet('makita', 'assets/sprites/player/makita.png', p, {
    horizontal: { frames: [0, 1], fps: 30, loop: true },
    diagonal: { frames: [2, 3], fps: 30, loop: true },
    vertical: { frames: [4, 5], fps: 30, loop: true },
  }, { anchor: 'pivot', pivots: { horizontal: pivot, diagonal: dPivot, vertical: vPivot }, muzzle: { horizontal: { x: 27, y: 12 }, diagonal: { x: 22, y: 5 }, vertical: { x: 12, y: 0 } } });
}

// ---------------------------------------------------------------------------
// VFX rysowane: muzzle flash (2 kl.), ostrze piły – pocisk wroga (2 kl.)
// ---------------------------------------------------------------------------
{
  const mk = (k) => { const im = create(12, 12); const c = 5;
    if (k === 0) { rect(im, c - 1, c - 1, 3, 3, '#ffffff'); hline(im, 1, c, 10, '#ffe36b'); vline(im, c, 1, 10, '#ffe36b'); line(im, 2, 2, 8, 8, '#ffb300'); line(im, 8, 2, 2, 8, '#ffb300'); }
    else { rect(im, c - 1, c - 1, 3, 3, '#fff5c0'); hline(im, 3, c, 6, '#ffb300'); vline(im, c, 3, 6, '#ffb300'); }
    return im; };
  const p = pack([mk(0), mk(1)], 2);
  emitSheet('muzzle', 'assets/sprites/fx/muzzle.png', p, { flash: { frames: [0, 1], fps: 30, loop: false } }, { anchor: 'center', anchorX: 5, anchorY: 5 });

  const saw = (k) => { const im = create(12, 12); const cx = 5, cy = 5;
    circle(im, cx, cy, 3.5, '#c9ced6', true); circle(im, cx, cy, 3.5, '#8a909b');
    for (let t = 0; t < 8; t++) { const a = (t / 8) * Math.PI * 2 + (k ? Math.PI / 8 : 0); px(im, Math.round(cx + Math.cos(a) * 5), Math.round(cy + Math.sin(a) * 5), '#f2f4f7'); }
    px(im, cx, cy, '#ff2a2a'); return im; };
  // wkręt montażowy (pocisk gracza): łeb sześciokątny z tyłu, trzpień z gwintem, ostry czubek; 2 klatki obrotu (gwint przesunięty)
  const screw = (k) => { const im = create(14, 6); const cy = 3;
    rect(im, 0, cy - 2, 3, 4, '#8a909b'); rect(im, 0, cy - 2, 3, 1, '#c3c8d1'); rect(im, 0, cy + 1, 3, 1, '#4b5563'); px(im, 1, cy - 1, '#2b2f36'); // łeb
    rect(im, 3, cy - 1, 8, 2, '#b8bec8'); hline(im, 3, cy - 1, 8, '#e5e9ef'); // trzpień
    for (let x = 3 + (k ? 1 : 0); x < 11; x += 2) { px(im, x, cy - 1, '#6b7280'); px(im, x + 1, cy, '#6b7280'); } // gwint
    px(im, 11, cy - 1, '#b8bec8'); px(im, 11, cy, '#b8bec8'); px(im, 12, cy, '#e5e9ef'); px(im, 13, cy, '#ffffff'); // czubek
    return im; };
  const psc = pack([screw(0), screw(1)], 2);
  emitSheet('screw', 'assets/sprites/fx/screw.png', psc, { spin: { frames: [0, 1], fps: 30, loop: true } }, { anchor: 'center', anchorX: 10, anchorY: 3 });

  const ps = pack([saw(0), saw(1)], 2);
  emitSheet('saw', 'assets/sprites/fx/saw.png', ps, { spin: { frames: [0, 1], fps: 24, loop: true } }, { anchor: 'center', anchorX: 5, anchorY: 5 });
}

// ---------------------------------------------------------------------------
// Tileset industrialny 16x16: blacha ryflowana z nitami, krawędzie, słupy, rury
// + kafle platform semi-solid: łopata (nasada/środek/końcówka, cieniowana), kozioł, sekcja wieży, kołyska, kontener
// ---------------------------------------------------------------------------
{
  const T = 16;
  const C = { K: '#161a20', P0: '#3b4048', P1: '#4f565f', P2: '#656d78', P3: '#7d8692', HI: '#98a1ad', R: '#b8c0ca', RUST: '#7a4a2e', RUST2: '#9a5c34', Y: '#d9a72c', YD: '#8a6a1a', YL: '#f2c230', G1: '#2f5f6b', G2: '#3f8291' };
  const tiles = [];
  const tile = (fn) => { const im = create(T, T); fn(im); tiles.push(im); return tiles.length - 1; };
  const rivet = (im, x, y) => { px(im, x, y, C.HI); px(im, x + 1, y + 1, C.K); };

  const plateBase = (im) => {
    rect(im, 0, 0, T, T, C.P1);
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if ((x + y) % 4 === 0) px(im, x, y, C.P0); // ryflowanie ukośne
    hline(im, 0, 0, T, C.P2); vline(im, 0, 0, T, C.P2); hline(im, 0, T - 1, T, C.P0); vline(im, T - 1, 0, T, C.P0);
  };
  manifest.tiles.plate = tile((im) => { plateBase(im); rivet(im, 2, 2); rivet(im, T - 4, 2); rivet(im, 2, T - 4); rivet(im, T - 4, T - 4); });
  manifest.tiles.plateB = tile((im) => { plateBase(im); rivet(im, 2, 2); rivet(im, T - 4, T - 4);
    rect(im, 5, 6, 7, 5, C.P0); hline(im, 5, 6, 7, C.K); hline(im, 5, 8, 7, C.K); hline(im, 5, 10, 7, C.K); vline(im, T - 4, 3, 5, C.RUST); px(im, T - 4, 8, C.RUST2); });
  manifest.tiles.edgeTop = tile((im) => { hline(im, 0, 0, T, '#e8cfa8'); hline(im, 0, 1, T, C.P3); hline(im, 0, 2, T, C.K); for (let x = 1; x < T; x += 4) px(im, x, 0, '#fff0d0'); });
  manifest.tiles.edgeBottom = tile((im) => { hline(im, 0, T - 1, T, C.K); hline(im, 0, T - 2, T, C.P0); });
  manifest.tiles.edgeLeft = tile((im) => { vline(im, 0, 0, T, C.HI); vline(im, 1, 0, T, C.K); });
  manifest.tiles.edgeRight = tile((im) => { vline(im, T - 1, 0, T, '#b9a48a'); vline(im, T - 2, 0, T, C.K); });
  // słup wsporczy, rura (plan drugi)
  manifest.tiles.column = tile((im) => { rect(im, 5, 0, 6, T, C.P0); vline(im, 5, 0, T, C.P3); vline(im, 10, 0, T, C.K); for (let y = 3; y < T; y += 6) rivet(im, 7, y); });
  manifest.tiles.columnTop = tile((im) => { rect(im, 3, 0, 10, 3, C.P2); hline(im, 3, 0, 10, C.HI); hline(im, 3, 2, 10, C.K); rect(im, 5, 3, 6, T - 3, C.P0); vline(im, 5, 3, T - 3, C.P3); vline(im, 10, 3, T - 3, C.K); });
  manifest.tiles.pipe = tile((im) => { rect(im, 6, 0, 4, T, C.G1); vline(im, 6, 0, T, C.G2); vline(im, 9, 0, T, C.K); rect(im, 5, 6, 6, 2, C.P2); hline(im, 5, 7, 6, C.K); });
  manifest.tiles.pipeTop = tile((im) => { rect(im, 6, 4, 4, T - 4, C.G1); vline(im, 6, 4, T - 4, C.G2); vline(im, 9, 4, T - 4, C.K); rect(im, 4, 2, 8, 3, C.P2); hline(im, 4, 4, 8, C.K); });

  // --- łopata: profil w górnych 10 px kafla; grzbiet oświetlony (ciepła biel) → spód w cieniu (szaro-niebieski) ---
  const bladeCol = (im, x, top, th) => {
    for (let k = 0; k < th; k++) { const u = k / th; px(im, x, top + k, u < 0.2 ? '#fff4e0' : u < 0.5 ? '#f1ede6' : u < 0.72 ? '#c9ced5' : u < 0.9 ? '#8f98a3' : '#5e6873'); }
    px(im, x, top - 1, '#3a3f4a'); px(im, x, top + th, C.K);
  };
  manifest.tiles.bladeRoot = tile((im) => { for (let x = 0; x < T; x++) bladeCol(im, x, 1, 10); rect(im, 0, 0, 4, 12, '#b9c0c9'); vline(im, 0, 0, 12, C.K); px(im, 2, 3, C.K); px(im, 2, 8, C.K); });
  manifest.tiles.bladeMid = tile((im) => { for (let x = 0; x < T; x++) bladeCol(im, x, 1, 10); vline(im, 8, 2, 8, '#dfe3e8'); });
  manifest.tiles.bladeTip = tile((im) => { for (let x = 0; x < T; x++) { const t = x / T; bladeCol(im, x, 1 + Math.round(3 * t), Math.max(2, Math.round(10 * (1 - t * 0.8)))); } });
  // kozioł montażowy (A-frame) pod łopatą – kafel poniżej platformy
  manifest.tiles.trestle = tile((im) => { for (let k = 0; k < 13; k++) { const sp = Math.round(k * 0.45); px(im, 8 - sp, k, C.YL); px(im, 8 + sp, k, C.YL); px(im, 8 - sp - 1, k, C.K); px(im, 8 + sp + 1, k, C.K); } hline(im, 5, 8, 7, C.YL); hline(im, 5, 9, 7, C.YD); rect(im, 1, 13, 15, 2, '#3a3f4a'); hline(im, 1, 15, 15, C.K); rect(im, 5, 0, 7, 2, '#2b2f36'); });

  // --- sekcja wieży leżąca: cylinder 14 px, kołnierze na końcach; kołyska w kaflu poniżej ---
  const cyl = (im) => { rect(im, 0, 1, T, 14, '#c9cfd6'); rect(im, 0, 3, T, 4, '#f4f6f8'); hline(im, 0, 2, T, '#fff0d0'); rect(im, 0, 10, T, 3, '#9aa3ad'); rect(im, 0, 13, T, 2, '#6f7a86'); hline(im, 0, 0, T, C.K); hline(im, 0, 15, T, C.K); };
  manifest.tiles.towerM = tile((im) => { cyl(im); px(im, 7, 4, '#ffffff'); px(im, 7, 11, '#5e6873'); });
  manifest.tiles.towerL = tile((im) => { cyl(im); rect(im, 0, 0, 4, 16, '#8a94a3'); vline(im, 0, 0, 16, C.K); vline(im, 2, 1, 14, '#b8c0ca'); px(im, 2, 3, C.K); px(im, 2, 8, C.K); px(im, 2, 12, C.K); });
  manifest.tiles.towerR = tile((im) => { cyl(im); rect(im, 12, 0, 4, 16, '#8a94a3'); vline(im, 15, 0, 16, C.K); vline(im, 13, 1, 14, '#b8c0ca'); px(im, 13, 3, C.K); px(im, 13, 8, C.K); px(im, 13, 12, C.K); });
  manifest.tiles.cradle = tile((im) => { rect(im, 2, 0, 12, 5, '#4a505c'); hline(im, 2, 1, 12, '#7d8792'); hline(im, 2, 4, 12, C.K); rect(im, 4, 5, 3, 11, '#3a3f4a'); rect(im, 9, 5, 3, 11, '#3a3f4a'); hline(im, 2, 15, 12, C.K); });

  // --- kontener techniczny (dach = platforma) ---
  // kontener techniczny: blacha falista, ciepłe podświetlenie od słońca (góra + prawa krawędź), drzwi po prawej
  const cont = (im, l, r, top) => {
    rect(im, 0, 0, T, T, '#2e86c1'); for (let x = 2; x < T - 1; x += 3) vline(im, x, top ? 2 : 0, top ? T - 2 : T, '#1f5f8a');
    if (top) { hline(im, 0, 0, T, '#9ad7ff'); for (let x = 0; x < T; x += 4) rect(im, x, 1, 2, 1, C.YL); }
    if (l) { vline(im, 0, 0, T, C.K); vline(im, 1, 0, T, '#1f5f8a'); }
    if (r) { vline(im, T - 1, 0, T, '#8fd3ff'); vline(im, T - 2, 0, T, '#5dade2'); rect(im, T - 7, top ? 3 : 0, 4, top ? T - 3 : T, '#2e86c1'); vline(im, T - 5, top ? 3 : 0, top ? T - 3 : T, '#1f5f8a'); if (top) px(im, T - 4, 8, '#ffe36b'); }
    else px(im, T - 1, 5, '#5dade2');
  };
  manifest.tiles.contL = tile((im) => cont(im, true, false, true)); manifest.tiles.contM = tile((im) => cont(im, false, false, true)); manifest.tiles.contR = tile((im) => cont(im, false, true, true)); manifest.tiles.contLR = tile((im) => cont(im, true, true, true));
  manifest.tiles.contBL = tile((im) => cont(im, true, false, false)); manifest.tiles.contBM = tile((im) => cont(im, false, false, false)); manifest.tiles.contBR = tile((im) => cont(im, false, true, false)); manifest.tiles.contBLR = tile((im) => cont(im, true, true, false));

  // --- WIELKA łopata (platforma 2-rzędowa, 32 px grubości u nasady): górny rząd = grzbiet, dolny = spód w cieniu ---
  const bigBladeCol = (im, x, top, th, part) => { // part: 0 górny kafel, 1 dolny
    for (let k = 0; k < th; k++) {
      const y = top + k - part * T; if (y < 0 || y >= T) continue;
      const u = k / th; px(im, x, y, u < 0.12 ? '#fff4e0' : u < 0.4 ? '#f1ede6' : u < 0.6 ? '#dfe3e8' : u < 0.78 ? '#b9c0c9' : u < 0.92 ? '#8f98a3' : '#5e6873');
    }
    const y0 = top - 1 - part * T, y1 = top + th - part * T; if (y0 >= 0 && y0 < T) px(im, x, y0, '#3a3f4a'); if (y1 >= 0 && y1 < T) px(im, x, y1, C.K);
  };
  const bigRoot = (part) => tile((im) => { for (let x = 0; x < T; x++) bigBladeCol(im, x, 1, 28, part); if (part === 0) { rect(im, 0, 0, 5, T, '#b9c0c9'); vline(im, 0, 0, T, C.K); px(im, 2, 4, C.K); px(im, 2, 11, C.K); } else { rect(im, 0, 0, 5, 14, '#9aa3ad'); vline(im, 0, 0, 14, C.K); px(im, 2, 3, C.K); px(im, 2, 9, C.K); } });
  const bigMid = (part) => tile((im) => { for (let x = 0; x < T; x++) bigBladeCol(im, x, 1, 28, part); if (part === 0) vline(im, 8, 2, 13, '#dfe3e8'); });
  const bigTip = (part) => tile((im) => { for (let x = 0; x < T; x++) { const t = x / T; bigBladeCol(im, x, 1 + Math.round(8 * t), Math.max(3, Math.round(28 * (1 - t * 0.85))), part); } });
  manifest.tiles.bigRootT = bigRoot(0); manifest.tiles.bigRootB = bigRoot(1);
  manifest.tiles.bigMidT = bigMid(0); manifest.tiles.bigMidB = bigMid(1);
  manifest.tiles.bigTipT = bigTip(0); manifest.tiles.bigTipB = bigTip(1);
  // duży kozioł (16 szer., pełna wysokość kafla) – powtarzany w dół
  manifest.tiles.trestleBig = tile((im) => { for (let k = 0; k < T; k++) { const sp = 2 + Math.round(k * 0.3); px(im, 8 - sp, k, C.YL); px(im, 8 + sp, k, C.YL); px(im, 8 - sp - 1, k, C.K); px(im, 8 + sp + 1, k, C.K); px(im, 8 + sp - 1, k, '#ffe08a'); } hline(im, 4, 7, 9, C.YL); hline(im, 4, 8, 9, C.YD); });
  manifest.tiles.trestleBigFoot = tile((im) => { for (let k = 0; k < 12; k++) { const sp = 2 + Math.round((k + 16) * 0.3); px(im, 8 - sp, k, C.YL); px(im, 8 + sp, k, C.YL); px(im, 8 - sp - 1, k, C.K); px(im, 8 + sp + 1, k, C.K); } rect(im, 0, 12, 16, 3, '#3a3f4a'); hline(im, 0, 15, 16, C.K); });

  const p = pack(tiles, 8);
  save(p.sheet, 'assets/tilesets/industrial.png');
  manifest.images.tileset = { file: 'assets/tilesets/industrial.png', tileSize: T, worldTile: T, cols: p.cols };
}

// ---------------------------------------------------------------------------
// Boss – skrzydło turbiny jako sprite (3 palety faz × [całe, pęknięte]) + rdzeń (2 klatki pulsu)
// ---------------------------------------------------------------------------
{
  const W = 28, H = 96, WL = 28; // WL = długość wingletu (CONFIG.boss.wingletLength)
  const K = '#050912';
  const PAL = [
    { l: '#c3c8d1', m: '#7d8794', d: '#3f4753' },
    { l: '#f5c08a', m: '#d9782a', d: '#7a3b0f' },
    { l: '#ff9a90', m: '#c8302a', d: '#5e1310' },
  ];
  const wing = (pal, cracked) => {
    const im = create(W, H);
    rect(im, 0, 0, W, H, K);
    rect(im, 1, 1, W - 2, H - 2, pal.m);
    hline(im, 1, 1, W - 2, pal.l); vline(im, 1, 1, H - 2, pal.l); hline(im, 1, H - 2, W - 2, pal.d); vline(im, W - 2, 1, H - 2, pal.d);
    // płyty pancerne + nity
    for (let k = 10; k < H - 6; k += 12) { hline(im, 2, k, W - 4, K); px(im, 4, k + 3, pal.l); px(im, W - 5, k + 3, pal.l); px(im, 5, k + 4, K); px(im, W - 4, k + 4, K); }
    // receptory odgromowe na krawędzi natarcia (prawa krawędź; klatka odbijana dla lewej)
    for (let k = 8; k < H - 6; k += 16) { rect(im, W - 2, k, 2, 2, '#5ec8ff'); px(im, W - 1, k, '#dff6ff'); }
    if (!cracked) {
      // winglet – jaśniejsza końcówka ze znacznikiem
      rect(im, 2, H - WL, W - 4, WL - 2, pal.l); hline(im, 2, H - WL, W - 4, '#ffffff');
      for (let k = H - WL + 3; k < H - 3; k += 6) hline(im, 3, k, W - 6, pal.m);
      rect(im, W / 2 - 2, H - WL / 2 - 2, 4, 4, '#ffb300'); px(im, W / 2 - 1, H - WL / 2 - 1, '#ffe36b');
    } else {
      // pęknięcia rozchodzące się od piasty
      for (const [dx, dy, len] of [[-1, -1, 30], [1, -1, 22], [-1, 1, 26], [1, 1, 34], [0, -1, 40], [0, 1, 38]]) {
        let x = W / 2, y = H / 2; for (let i = 0; i < len; i++) { px(im, Math.round(x), Math.round(y), K); if (i % 3 === 0) px(im, Math.round(x) + 1, Math.round(y), '#ff2a2a'); x += dx * (0.35 + ((i * 7) % 3) * 0.2); y += dy * 0.9; }
      }
    }
    // piasta
    rect(im, W / 2 - 5, H / 2 - 5, 10, 10, K); rect(im, W / 2 - 4, H / 2 - 4, 8, 8, pal.d);
    if (!cracked) { rect(im, W / 2 - 2, H / 2 - 2, 4, 4, pal.l); px(im, W / 2 - 1, H / 2 - 1, '#ffffff'); }
    return im;
  };
  const frames = []; for (const pal of PAL) { frames.push(wing(pal, false)); frames.push(wing(pal, true)); }
  const pw = pack(frames, 6);
  emitSheet('bossWing', 'assets/sprites/boss/wing.png', pw, {
    p1: { frames: [0], fps: 1 }, p1c: { frames: [1], fps: 1 }, p2: { frames: [2], fps: 1 }, p2c: { frames: [3], fps: 1 }, p3: { frames: [4], fps: 1 }, p3c: { frames: [5], fps: 1 },
  }, { anchor: 'center', anchorX: W / 2, anchorY: H / 2 });
  const core = (k) => { const im = create(16, 16); const r = k ? 6 : 5; circle(im, 8, 8, r + 2, '#7a1a1a', true); circle(im, 8, 8, r, k ? '#ff8a80' : '#ff2a2a', true); circle(im, 8, 8, 2, '#ffffff', true); return im; };
  emitSheet('bossCore', 'assets/sprites/boss/core.png', pack([core(0), core(1)], 2), { pulse: { frames: [0, 1], fps: 6, loop: true } }, { anchor: 'center', anchorX: 8, anchorY: 8 });
}

// ---------------------------------------------------------------------------
// Pociski wrogów jako sprite'y: wyładowanie, odłamek kompozytu, mina energetyczna
// ---------------------------------------------------------------------------
{
  const bolt = (k) => { const im = create(14, 6); const c1 = k ? '#dff6ff' : '#5ec8ff'; let y = 3; for (let x = 0; x < 14; x++) { y = 3 + ((x + k) % 4 < 2 ? -1 : 1) * (x % 2); px(im, x, y, c1); px(im, x, y + 1, k ? '#5ec8ff' : '#2b8fd6'); } rect(im, 6, 2, 2, 2, '#ffffff'); return im; };
  emitSheet('bolt', 'assets/sprites/fx/bolt.png', pack([bolt(0), bolt(1)], 2), { fly: { frames: [0, 1], fps: 24, loop: true } }, { anchor: 'center', anchorX: 7, anchorY: 3 });
  const shard = (k) => { const im = create(8, 8); if (k) { rect(im, 0, 2, 8, 4, '#e5e9ef'); hline(im, 0, 5, 8, '#7d8794'); rect(im, 6, 2, 2, 1, '#2b2f36'); } else { rect(im, 2, 0, 4, 8, '#e5e9ef'); vline(im, 5, 0, 8, '#7d8794'); rect(im, 2, 6, 1, 2, '#2b2f36'); } return im; };
  emitSheet('shard', 'assets/sprites/fx/shard.png', pack([shard(0), shard(1)], 2), { spin: { frames: [0, 1], fps: 12, loop: true } }, { anchor: 'center', anchorX: 4, anchorY: 4 });
  const mine = (k) => { const im = create(12, 12); circle(im, 6, 6, 5, k ? '#2b6f8f' : '#1f4f66', true); circle(im, 6, 6, k ? 4 : 3, k ? '#dff6ff' : '#5ec8ff', true); rect(im, 5, 5, 2, 2, '#2b2f36'); return im; };
  emitSheet('mine', 'assets/sprites/fx/mine.png', pack([mine(0), mine(1)], 2), { pulse: { frames: [0, 1], fps: 8, loop: true } }, { anchor: 'center', anchorX: 6, anchorY: 6 });
}

// ---------------------------------------------------------------------------
// HUD – ramki i segmenty jako PNG (retro metal z nitami i rdzą), rozmiar dyskretny (narożniki)
// ---------------------------------------------------------------------------
{
  const K = '#161a20', P0 = '#3b4048', P1 = '#4f565f', P3 = '#8a93a0', HI = '#aab3bf', RUST = '#7a4a2e';
  const panel = (w, h, insets) => {
    const im = create(w, h);
    rect(im, 0, 0, w, h, K); rect(im, 1, 1, w - 2, h - 2, P1);
    hline(im, 1, 1, w - 2, P3); vline(im, 1, 1, h - 2, P3); hline(im, 1, h - 2, w - 2, P0); vline(im, w - 2, 1, h - 2, P0);
    for (const [x, y] of [[2, 2], [w - 4, 2], [2, h - 4], [w - 4, h - 4]]) { px(im, x, y, HI); px(im, x + 1, y + 1, K); }
    vline(im, w - 7, 2, 5, RUST); px(im, w - 7, 7, '#9a5c34');
    for (const [x, y, iw, ih] of insets) { rect(im, x, y, iw, ih, K); rect(im, x + 1, y + 1, iw - 2, ih - 2, '#23272e'); hline(im, x + 1, y + ih - 2, iw - 2, '#5a616b'); }
    return im;
  };
  // panel gracza: portret 20x20 w ramce 24x24 + bateria 10×(5+1) w wgłębieniu + miejsce na etykietę
  const pp = panel(98, 28, [[2, 2, 24, 24], [28, 2, 68, 11]]);
  save(pp, 'assets/sprites/ui/panel-player.png'); manifest.images.hudPlayer = { file: 'assets/sprites/ui/panel-player.png', w: pp.width, h: pp.height };
  const ps = panel(60, 28, [[3, 14, 54, 11]]);
  save(ps, 'assets/sprites/ui/panel-score.png'); manifest.images.hudScore = { file: 'assets/sprites/ui/panel-score.png', w: ps.width, h: ps.height };
  const pb = panel(128, 20, [[4, 4, 120, 8]]);
  save(pb, 'assets/sprites/ui/panel-boss.png'); manifest.images.hudBoss = { file: 'assets/sprites/ui/panel-boss.png', w: pb.width, h: pb.height };
  // segmenty baterii: off, zielony, żółty, czerwony (5x8)
  const seg = (c, d) => { const im = create(5, 8); rect(im, 0, 0, 5, 8, c); if (d) { rect(im, 0, 6, 5, 2, d); px(im, 1, 1, '#ffffff'); } return im; };
  const segs = pack([seg('#2f343b'), seg('#3ddc84', '#1c7a48'), seg('#ffb300', '#8a5f00'), seg('#ff3b3b', '#7a1a1a')], 4);
  emitSheet('hudSeg', 'assets/sprites/ui/segments.png', segs, { off: { frames: [0], fps: 1 }, green: { frames: [1], fps: 1 }, yellow: { frames: [2], fps: 1 }, red: { frames: [3], fps: 1 } }, { anchor: 'center', anchorX: 0, anchorY: 0 });
  // głośnik: włączony / wyciszony (10x8)
  const spk = (muted) => { const im = create(10, 8); const c = muted ? '#7d8794' : '#2fb9b0'; rect(im, 0, 2, 3, 4, c); rect(im, 3, 1, 2, 6, c); vline(im, 5, 0, 8, c);
    if (muted) { for (const [x, y] of [[7, 1], [8, 2], [9, 3], [9, 1], [7, 3]]) px(im, x, y, '#ff3b3b'); } else { vline(im, 7, 2, 4, c); vline(im, 9, 1, 6, c); } return im; };
  emitSheet('hudSpeaker', 'assets/sprites/ui/speaker.png', pack([spk(false), spk(true)], 2), { on: { frames: [0], fps: 1 }, muted: { frames: [1], fps: 1 } }, { anchor: 'center', anchorX: 0, anchorY: 0 });
}

// ---------------------------------------------------------------------------
// Portret Seby (HUD) 20x20 – z ekstraktora (twarz ze sheetu) albo rysowany
// ---------------------------------------------------------------------------
if (manifest.sebaSource === 'seba-ai') {
  manifest.images.portrait = { file: 'assets/sprites/ui/portrait.png', w: 20, h: 20 };
} else {
  const im = create(20, 20);
  rect(im, 4, 1, 12, 7, '#eef1f5'); rect(im, 3, 3, 14, 5, '#eef1f5'); hline(im, 5, 1, 10, '#ffffff'); // kask
  hline(im, 3, 8, 14, '#b9c0c9'); // rant kasku
  rect(im, 8, 3, 4, 3, '#2b2f3a'); rect(im, 9, 4, 2, 1, '#ffe36b'); // czołówka
  rect(im, 5, 9, 10, 7, '#f1c9a5'); rect(im, 5, 14, 10, 2, '#b98868'); // twarz
  px(im, 7, 10, '#2b2f3a'); px(im, 12, 10, '#2b2f3a'); // oczy
  rect(im, 6, 13, 8, 2, '#8a6a52'); rect(im, 8, 13, 4, 1, '#f1c9a5'); // zarost
  rect(im, 3, 16, 14, 4, '#e6ff3d'); hline(im, 3, 17, 14, '#c8ccd0'); px(im, 10, 19, '#ff7a1a'); // kurtka hi-vis + pas odblaskowy + karabińczyk
  save(scale(im, D), 'assets/sprites/ui/portrait.png');
  manifest.images.portrait = { file: 'assets/sprites/ui/portrait.png', w: 20, h: 20 };
}

// ---------------------------------------------------------------------------
// Tła parallax – plac budowy farmy wiatrowej o świcie (generowane, tools/site-backgrounds.mjs)
// ---------------------------------------------------------------------------
{
  // Zewnętrzna grafika ma pierwszeństwo: assets/raw/art/backgrounds/{sky-source|sky,site-mid,site-near}.png (PNG, natywna skala)
  const ART = 'assets/raw/art/backgrounds';
  const external = (names) => { for (const n of names) if (fs.existsSync(`${ART}/${n}.png`)) return load(`${ART}/${n}.png`); return null; };
  const sky = external(['sky-source', 'sky']) ?? drawSky(); save(sky, 'assets/backgrounds/sky.png');
  if (sky.width !== 384 || sky.height !== 216) console.warn(`UWAGA: sky.png ma ${sky.width}x${sky.height}, oczekiwano 384x216`);
  manifest.images.sky = { file: 'assets/backgrounds/sky.png', w: sky.width, h: sky.height };
  // animowane łopaty turbin: 6 klatek obrotu w jednym pasku
  const BF = 6; const blades = Array.from({ length: BF }, (_, i) => drawSkyBlades(i, BF));
  const pb = pack(blades, BF); save(pb.sheet, 'assets/backgrounds/sky-blades.png');
  // uwaga: tła są już w gęstości canvasu – bez podbijania (nie przez emitSheet)
  manifest.sheets.skyBlades = { file: 'assets/backgrounds/sky-blades.png', frameW: pb.frameW, frameH: pb.frameH, cols: BF, clips: { spin: { frames: [0, 1, 2, 3, 4, 5], fps: 5, loop: true } }, anchor: 'center', anchorX: 0, anchorY: 0, density: D, y: SKY_HORIZON - 60 };
  const mid = external(['site-mid']) ?? drawSiteMid(); save(mid, 'assets/backgrounds/site-mid.png');
  manifest.images.siteMid = { file: 'assets/backgrounds/site-mid.png', w: mid.width, h: mid.height };
  const near = external(['site-near']) ?? drawSiteNear(); save(near, 'assets/backgrounds/site-near.png');
  manifest.images.siteNear = { file: 'assets/backgrounds/site-near.png', w: near.width, h: near.height };
}

// ---------------------------------------------------------------------------
// Manifest TS
// ---------------------------------------------------------------------------
const ts = `/* WYGENEROWANE przez tools/build-assets.mjs – nie edytuj ręcznie. */
export const MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;
`;
fs.mkdirSync('src/assets', { recursive: true });
fs.writeFileSync('src/assets/manifest.generated.ts', ts);
console.log('OK:', Object.keys(manifest.sheets).join(', '), '| tiles:', Object.keys(manifest.tiles).length);

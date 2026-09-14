/**
 * Pipeline zasobów: assets/raw (CC0: Warped City / ansimuz) → assets/sprites, assets/tilesets,
 * assets/backgrounds + manifest TS z koordynatami klatek (src/assets/manifest.generated.ts).
 *
 * Uruchomienie: npm run assets
 * Podmiana grafiki 1:1: podmień PNG w assets/raw/... zachowując nazwy i liczbę klatek, odpal ponownie.
 */
import fs from 'node:fs';
import { load, save, create, blit, bbox } from './png.mjs';
import { px, rect, hline, vline, line, circle, recolor, flipX, rotate45, rotate90ccw, hex } from './pixel.mjs';
import { drawSky, drawSiteMid, drawSiteNear } from './site-backgrounds.mjs';

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

function emitSheet(name, file, packed, clips, extra = {}) {
  save(packed.sheet, file);
  manifest.sheets[name] = { file, frameW: packed.frameW, frameH: packed.frameH, cols: packed.cols, clips, ...extra };
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
// Makita DIY – wkrętarka z tarczą tnącą: 3 orientacje × 2 klatki tarczy
// ---------------------------------------------------------------------------
{
  const F = 28; // rozmiar klatki
  function drawMakita(bladeFrame) {
    const im = create(F, F);
    const oy = 11; // oś lufy w wierszu 13
    // korpus (teal Makity)
    rect(im, 4, oy - 1, 11, 6, '#1ba39c'); rect(im, 4, oy - 1, 11, 1, '#4ed6cc'); rect(im, 4, oy + 4, 11, 1, '#0d6b66');
    rect(im, 3, oy, 1, 4, '#0d6b66');
    // bateria z tyłu + uchwyt
    rect(im, 1, oy, 3, 5, '#2b2f3a'); px(im, 1, oy, '#5a6170');
    rect(im, 6, oy + 5, 3, 6, '#2b2f3a'); rect(im, 6, oy + 10, 4, 2, '#1c1f27'); px(im, 7, oy + 6, '#5a6170');
    // spust / znacznik
    px(im, 10, oy + 5, '#ffb300');
    // uchwyt tarczy (chuck)
    rect(im, 15, oy, 3, 4, '#8a8f99'); rect(im, 15, oy, 3, 1, '#c3c8d1');
    // tarcza tnąca (promień 5), zęby zależne od klatki
    const cx = 22, cy = oy + 2;
    circle(im, cx, cy, 4, '#b8bec8', true); circle(im, cx, cy, 4, '#7c838f');
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + (bladeFrame ? Math.PI / 8 : 0);
      px(im, Math.round(cx + Math.cos(a) * 5.2), Math.round(cy + Math.sin(a) * 5.2), '#e5e9ef');
    }
    px(im, cx, cy, '#2b2f3a'); px(im, cx + 1, cy - 1, '#ffffff');
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
  }, { anchor: 'pivot', pivots: { horizontal: pivot, diagonal: dPivot, vertical: vPivot }, muzzle: { horizontal: { x: 27, y: 13 }, diagonal: { x: 23, y: 4 }, vertical: { x: 13, y: 0 } } });
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
  const ps = pack([saw(0), saw(1)], 2);
  emitSheet('saw', 'assets/sprites/fx/saw.png', ps, { spin: { frames: [0, 1], fps: 24, loop: true } }, { anchor: 'center', anchorX: 5, anchorY: 5 });
}

// ---------------------------------------------------------------------------
// Tileset industrialny 16x16 (paleta Warped City)
// ---------------------------------------------------------------------------
{
  const T = 16;
  const C = { K: '#050912', P0: '#08202f', P1: '#0d3344', P2: '#13506a', P3: '#1d6c86', R: '#2fb9b0', RUST: '#6e3a2b', RUST2: '#8a4a2f', G1: '#1a5b6b', G2: '#0d7b89', Y: '#c9a227', YD: '#7a6118' };
  const tiles = [];
  const tile = (fn) => { const im = create(T, T); fn(im); tiles.push(im); return tiles.length - 1; };

  const plateBase = (im) => { rect(im, 0, 0, T, T, C.P1); // płyta
    // delikatna faktura
    for (let y = 2; y < T; y += 5) for (let x = (y % 2) * 2; x < T; x += 6) px(im, x, y, C.P0);
  };
  const rivets = (im, pts) => pts.forEach(([x, y]) => { px(im, x, y, C.R); px(im, x + 1, y + 1, C.K); });

  manifest.tiles.plate = tile((im) => { plateBase(im); rivets(im, [[2, 2], [12, 2], [2, 12], [12, 12]]); });
  manifest.tiles.plateB = tile((im) => { plateBase(im); rivets(im, [[2, 2], [12, 12]]); // płyta z wentylem i rdzą
    rect(im, 5, 6, 6, 4, C.P0); hline(im, 5, 7, 6, C.K); hline(im, 5, 9, 6, C.K); vline(im, 11, 3, 4, C.RUST); px(im, 11, 7, C.RUST2); });
  // nakładki krawędzi (przezroczyste tło)
  manifest.tiles.edgeTop = tile((im) => { hline(im, 0, 0, T, C.P3); hline(im, 0, 1, T, C.P2); hline(im, 0, 2, T, C.K); });
  manifest.tiles.edgeBottom = tile((im) => { hline(im, 0, T - 1, T, C.K); hline(im, 0, T - 2, T, C.P0); });
  manifest.tiles.edgeLeft = tile((im) => { vline(im, 0, 0, T, C.P2); vline(im, 1, 0, T, C.K); });
  manifest.tiles.edgeRight = tile((im) => { vline(im, T - 1, 0, T, C.P0); vline(im, T - 2, 0, T, C.K); });
  // krata pomostowa (one-way) – dziury przezroczyste, wsporniki pod spodem
  const grate = (im, left, right) => {
    hline(im, 0, 0, T, C.G2); hline(im, 0, 1, T, C.G1);
    for (let y = 2; y < 6; y++) for (let x = 0; x < T; x++) if ((x + y) % 3 !== 0) px(im, x, y, y % 2 ? C.G1 : C.P0);
    hline(im, 0, 6, T, C.K);
    // wsporniki
    if (left) { rect(im, 1, 7, 2, 4, C.P2); px(im, 1, 10, C.K); }
    if (right) { rect(im, T - 3, 7, 2, 4, C.P2); px(im, T - 2, 10, C.K); }
    // pasy ostrzegawcze na czole
    for (let x = 0; x < T; x++) px(im, x, 1, Math.floor(x / 2) % 2 ? C.Y : C.YD);
  };
  manifest.tiles.grate = tile((im) => grate(im, false, false));
  manifest.tiles.grateL = tile((im) => grate(im, true, false));
  manifest.tiles.grateR = tile((im) => grate(im, false, true));
  manifest.tiles.grateLR = tile((im) => grate(im, true, true));
  // dekoracje planu drugiego: słup wsporczy, rura pionowa, kabel
  manifest.tiles.column = tile((im) => { rect(im, 5, 0, 6, T, C.P0); vline(im, 5, 0, T, C.P2); vline(im, 10, 0, T, C.K); for (let y = 3; y < T; y += 6) { px(im, 7, y, C.R); px(im, 8, y + 1, C.K); } });
  manifest.tiles.columnTop = tile((im) => { rect(im, 3, 0, 10, 3, C.P2); hline(im, 3, 2, 10, C.K); rect(im, 5, 3, 6, T - 3, C.P0); vline(im, 5, 3, T - 3, C.P2); vline(im, 10, 3, T - 3, C.K); });
  manifest.tiles.pipe = tile((im) => { rect(im, 6, 0, 4, T, C.G1); vline(im, 6, 0, T, C.G2); vline(im, 9, 0, T, C.K); rect(im, 5, 6, 6, 2, C.P2); hline(im, 5, 7, 6, C.K); });
  manifest.tiles.pipeTop = tile((im) => { rect(im, 6, 4, 4, T - 4, C.G1); vline(im, 6, 4, T - 4, C.G2); vline(im, 9, 4, T - 4, C.K); rect(im, 4, 2, 8, 3, C.P2); hline(im, 4, 4, 8, C.K); });
  const p = pack(tiles, 8);
  save(p.sheet, 'assets/tilesets/industrial.png');
  manifest.images.tileset = { file: 'assets/tilesets/industrial.png', tileSize: T, cols: p.cols };
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
  save(im, 'assets/sprites/ui/portrait.png');
  manifest.images.portrait = { file: 'assets/sprites/ui/portrait.png', w: 20, h: 20 };
}

// ---------------------------------------------------------------------------
// Tła parallax – plac budowy farmy wiatrowej o świcie (generowane, tools/site-backgrounds.mjs)
// ---------------------------------------------------------------------------
{
  const sky = drawSky(); save(sky, 'assets/backgrounds/sky.png');
  manifest.images.sky = { file: 'assets/backgrounds/sky.png', w: sky.width, h: sky.height };
  const mid = drawSiteMid(); save(mid, 'assets/backgrounds/site-mid.png');
  manifest.images.siteMid = { file: 'assets/backgrounds/site-mid.png', w: mid.width, h: mid.height };
  const near = drawSiteNear(); save(near, 'assets/backgrounds/site-near.png');
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

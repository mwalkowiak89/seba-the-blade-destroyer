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

const RAW = 'assets/raw/warped-city';
const manifest = { sheets: {}, images: {}, tiles: {} };

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
/** Warped City player → Seba: niebiesko-szary kombinezon roboczy, ciemny kask. */
const SEBA_PALETTE = {
  '#ffd800': '#4f8fd6', // kurtka → kombinezon jasny
  '#ec7809': '#2c5aa0', // kurtka cień → kombinezon cień
  '#93278f': '#3c4656', // włosy → kask ciemny
  '#c51aea': '#6b7a90', // włosy highlight → kask highlight
  '#a096d1': '#9fb0c4', // lawenda → jasny metal
  '#442b61': '#242a38', // spodnie → ciemnoszare
  '#81709a': '#55607a',
  '#ff2245': '#ffb300', // detal → pomarańczowy znacznik (gogle)
};
/** Blaszak – biegacz: metal, czerwony wizjer. */
const RUNNER_PALETTE = {
  '#ffd800': '#7d8794', '#ec7809': '#4b5563',
  '#93278f': '#2b3038', '#c51aea': '#4a5260', '#a096d1': '#8a94a3',
  '#ffb164': '#aab3bf', '#b15c51': '#6b7482', // skóra → metal
  '#442b61': '#1c2029', '#81709a': '#3a4250',
  '#fcfcfc': '#d9dee5', '#ff2245': '#ff2a2a',
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
    list.push(...imgs.map((im) => crop(im, u)));
  }
  const anchorX = 38 - u.x0; // środek postaci w klatce (idle: 28..48)
  const seba = pack(list.map((im) => recolor({ ...im, data: Buffer.from(im.data) }, SEBA_PALETTE)), 8);
  emitSheet('seba', 'assets/sprites/player/seba.png', seba, clips, {
    anchor: 'bottom', anchorX,
    // punkt dłoni (względem kotwicy: środek-stopy) dla nakładki broni
    pivots: { stand: { x: 48 - 38, y: 27 - 67 }, crouch: { x: 44 - 38, y: 44 - 67 } },
  });

  // Biegacz – blaszak: te same klatki biegu w palecie metalu
  const runnerList = [...clipsSrc.run, ...clipsSrc.hurt].map((im) => recolor(crop(im, u), RUNNER_PALETTE));
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
// Portret Seby (HUD) 20x20 – kask + gogle ochronne
// ---------------------------------------------------------------------------
{
  const im = create(20, 20);
  rect(im, 4, 2, 12, 6, '#3c4656'); rect(im, 3, 4, 14, 4, '#3c4656'); hline(im, 5, 2, 10, '#6b7a90'); // kask
  rect(im, 5, 8, 10, 8, '#ffb164'); rect(im, 5, 14, 10, 2, '#b15c51'); // twarz
  rect(im, 4, 8, 12, 4, '#242a38'); rect(im, 5, 9, 4, 2, '#2fb9b0'); rect(im, 11, 9, 4, 2, '#2fb9b0'); px(im, 6, 9, '#ffffff'); px(im, 12, 9, '#ffffff'); // gogle
  rect(im, 8, 13, 4, 1, '#050912'); // usta
  rect(im, 3, 16, 14, 4, '#4f8fd6'); rect(im, 3, 16, 14, 1, '#2c5aa0'); // kołnierz kombinezonu
  save(im, 'assets/sprites/ui/portrait.png');
  manifest.images.portrait = { file: 'assets/sprites/ui/portrait.png', w: 20, h: 20 };
}

// ---------------------------------------------------------------------------
// Tła parallax (kopie 1:1) + generowana warstwa rusztowań
// ---------------------------------------------------------------------------
{
  const a = load(`${RAW}/background/skyline-a.png`), b = load(`${RAW}/background/skyline-b.png`);
  const sky = create(a.width + b.width, a.height); blit(sky, a, 0, 0); blit(sky, b, a.width, 0);
  save(sky, 'assets/backgrounds/skyline.png');
  manifest.images.skyline = { file: 'assets/backgrounds/skyline.png', w: sky.width, h: sky.height };
  for (const [name, f] of [['buildingsFar', 'buildings-bg.png'], ['buildingsNear', 'near-buildings-bg.png']]) {
    const im = load(`${RAW}/background/${f}`); save(im, `assets/backgrounds/${f}`);
    manifest.images[name] = { file: `assets/backgrounds/${f}`, w: im.width, h: im.height };
  }

  // Warstwa 3: rusztowania, siatka ogrodzenia, kable + propsy z fasad Warped City
  const W = 320, H = 240; const im = create(W, H);
  const C = { K: '#050912', D: '#0a2737', M: '#07465b', L: '#0d7b89' };
  for (let x = 8; x < W; x += 64) { rect(im, x, 60, 3, H - 60, C.D); vline(im, x, 60, H - 60, C.M); vline(im, x + 2, 60, H - 60, C.K); }
  for (const y of [96, 152]) { hline(im, 0, y, W, C.M); hline(im, 0, y + 1, W, C.K); }
  for (let x = 8; x < W; x += 64) { line(im, x + 3, 152, x + 63, 96, C.D); line(im, x + 3, 96, x + 63, 152, C.D); }
  // siatka ogrodzenia w dolnej części
  for (let y = 162; y < 206; y += 8) for (let x = 0; x < W; x += 8) { px(im, x + (y % 16 === 2 ? 0 : 4), y, C.D); }
  hline(im, 0, 158, W, C.L); hline(im, 0, 159, W, C.K); hline(im, 0, 208, W, C.L); hline(im, 0, 209, W, C.K);
  // kable zwisające między słupami
  for (let x = 8; x < W; x += 64) for (let i = 0; i < 64; i++) { const t = i / 64; const yy = 62 + Math.round(Math.sin(t * Math.PI) * 10); px(im, (x + i) % W, yy, C.K); px(im, (x + i) % W, yy + 1, C.D); }
  // propsy z fasady (rury, skrzynki)
  const facade = load(`${RAW}/facade.png`);
  blit(im, facade, 40, 100, 160, 96, 48, 32);   // rury
  blit(im, facade, 200, 96, 176, 144, 32, 32);  // panel
  const box1 = load(`${RAW}/control-box-1.png`), box3 = load(`${RAW}/control-box-3.png`), ant = load(`${RAW}/antenna.png`);
  blit(im, box1, 140, 178); blit(im, box3, 236, 178); blit(im, ant, 292, 0);
  save(im, 'assets/backgrounds/scaffold.png');
  manifest.images.scaffold = { file: 'assets/backgrounds/scaffold.png', w: W, h: H };
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

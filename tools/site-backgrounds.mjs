/**
 * Tła parallax (px canvasu, gęstość 2x → 640x480) – plac montażu turbin o zachodzie słońca,
 * kompozycja wg mockupu (assets/raw/reference/mockup-scene.jpeg):
 *  - sky      (0.05): gradient zachodu, chmury, wzgórza, farma wiatrowa (łopaty animowane osobno)
 *  - siteMid  (0.3):  wielka wieża turbiny (poza kadr), czerwony żuraw kratownicowy, sylwetki zaplecza
 *  - siteNear (0.7):  gigantyczna łopata na kozłach montażowych, sekcja wieży na naczepie, płot, kontenery, barierki
 */
import { create } from './png.mjs';
import { px, rect, hline, vline, line, circle } from './pixel.mjs';

const K = '#2b2f36';
const WHITE = '#f4f6f8', W1 = '#e2e6ea', W2 = '#c9cfd6', W3 = '#a5adb7', W4 = '#7e8792';
export const SKY_W = 640, SKY_H = 480, SKY_HORIZON = 372;

// ---------------------------------------------------------------------------
export function drawSky(W = SKY_W, H = SKY_H, horizon = SKY_HORIZON) {
  const im = create(W, H);
  // zachód: ciepłe pomarańcze/róże jak w mockupie
  const bands = ['#7a6aa6', '#9a76a8', '#b8829e', '#d38f8e', '#e69c7f', '#f0a874', '#f5b46d', '#f8c070', '#fbcc7c', '#fdd88e', '#fee3a4'];
  for (let y = 0; y < horizon; y++) {
    const t = y / horizon; const f = t * bands.length; const i = Math.min(bands.length - 1, Math.floor(f)); const frac = f - i;
    const c = i < bands.length - 1 && frac > 0.6 && ((x) => x)(y % 2 === 0) && frac > 0.6 + 0.4 * ((y >> 1) % 2) ? bands[i + 1] : bands[i];
    hline(im, 0, y, W, c);
  }
  // słońce nisko + odblask
  circle(im, 470, 330, 30, '#fbd27a', true); circle(im, 470, 330, 22, '#ffe39a', true); circle(im, 470, 330, 12, '#fff6d0', true);
  for (let y = 300; y < horizon; y += 4) hline(im, 380, y, 180, y % 8 === 0 ? '#fbd27a' : '#f9c98a');
  // chmury: płaskie warstwowe, ciemniejsze od dołu (kontrast jak w mockupie)
  const cloud = (x, y, w, h) => {
    rect(im, x + 6, y, w - 12, h, '#f2c9b2'); rect(im, x, y + h / 2, w, h, '#f2c9b2'); rect(im, x + 12, y - h / 2, w - 30, h / 2, '#f8dccb');
    hline(im, x + 2, y + h + h / 2 - 1, w - 4, '#c98f86'); hline(im, x + 8, y + h + h / 2, w - 16, '#b07d7d');
    for (let i = 0; i < 4; i++) rect(im, x + 10 + i * (w / 4), y + h / 2 + 2, w / 8, 2, '#e6b5a5');
  };
  cloud(30, 60, 140, 10); cloud(230, 110, 120, 8); cloud(420, 40, 170, 12); cloud(120, 180, 90, 6); cloud(300, 230, 200, 10); cloud(520, 200, 110, 8);
  // wzgórza i pola
  for (let x = 0; x < W; x++) {
    const h1 = 18 + Math.round(8 * Math.sin(x / 46) + 5 * Math.sin(x / 19 + 1));
    vline(im, x, horizon - h1, h1, '#8f9d7a');
    const h2 = 6 + Math.round(4 * Math.sin(x / 27 + 2));
    vline(im, x, horizon - h2, h2 + 1, '#6f8664');
  }
  rect(im, 0, horizon, W, H - horizon, '#7a8c66'); hline(im, 0, horizon, W, '#5b7050');
  // wieże turbin na horyzoncie (łopaty w drawSkyBlades)
  for (const [x, h] of SKY_TURBINES) { const base = horizon - 8 - (x % 9); for (let y = base - h; y < base; y++) { const w = 2 + Math.round(((y - (base - h)) / h) * 3); rect(im, x - Math.floor(w / 2), y, w, 1, y % 3 ? W2 : W1); } px(im, x, base - h, W3); }
  return im;
}

/** Pozycje turbin na niebie: [x, wysokość wieży, faza]. */
const SKY_TURBINES = [[44, 60, 0], [110, 40, 1], [190, 72, 2], [286, 50, 0.5], [350, 64, 1.5], [540, 56, 2.5], [600, 40, 1]];

/** Nakładka z łopatami – `frames` klatek obrotu (przezroczysta, ta sama szerokość co niebo). */
export function drawSkyBlades(frame, frames, W = SKY_W, H = 160, top = SKY_HORIZON - 150) {
  const im = create(W, H);
  const rot = (frame / frames) * (2 * Math.PI / 3);
  for (const [x, h, ph] of SKY_TURBINES) {
    const base = SKY_HORIZON - 8 - (x % 9); const hy = base - h - top; const r = h * 0.48;
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + ph + rot + (k * 2 * Math.PI) / 3;
      line(im, x, hy, Math.round(x + Math.cos(a) * r), Math.round(hy + Math.sin(a) * r), WHITE);
      line(im, x + 1, hy, Math.round(x + 1 + Math.cos(a) * r * 0.9), Math.round(hy + Math.sin(a) * r * 0.9), W2);
    }
    circle(im, x, hy, 2, W3, true);
  }
  return im;
}

// ---------------------------------------------------------------------------
/** Wieża turbiny (cylinder zwężający się ku górze) wychodząca poza kadr, z pierścieniami sekcji. */
function bigTower(im, x, groundY, wBase, wTop) {
  for (let y = 0; y < groundY; y++) {
    const t = y / groundY; const w = Math.round(wTop + (wBase - wTop) * t);
    const x0 = x - Math.floor(w / 2);
    rect(im, x0, y, w, 1, '#c8ccd2');
    rect(im, x0, y, Math.round(w * 0.18), 1, '#e6e9ed');
    rect(im, x0 + Math.round(w * 0.18), y, Math.round(w * 0.12), 1, '#d8dce1');
    rect(im, x0 + Math.round(w * 0.72), y, Math.round(w * 0.28), 1, '#a8afb8');
    rect(im, x0 + w - Math.round(w * 0.1), y, Math.round(w * 0.1), 1, '#8d95a0');
    px(im, x0, y, K); px(im, x0 + w - 1, y, K);
  }
  for (const ry of [90, 230, 360]) { const w = Math.round(wTop + (wBase - wTop) * (ry / groundY)); rect(im, x - Math.floor(w / 2) - 1, ry, w + 2, 4, '#9aa3ad'); hline(im, x - Math.floor(w / 2) - 1, ry + 4, w + 2, K); hline(im, x - Math.floor(w / 2) - 1, ry, w + 2, '#e6e9ed'); }
  // drzwi serwisowe u podstawy
  rect(im, x - 6, groundY - 30, 12, 30, '#6f7a86'); rect(im, x - 4, groundY - 28, 8, 26, '#4a505c'); px(im, x + 2, groundY - 16, '#ffe36b');
}

/** Żuraw gąsienicowy z kratownicowym wysięgnikiem (czerwony). */
export function crane(im, x, groundY, boomLen, angleDeg, color = '#b8382a', dark = '#6f1f14', light = '#e0664f') {
  rect(im, x - 30, groundY - 12, 60, 12, K); rect(im, x - 26, groundY - 10, 52, 8, '#4a505c'); for (let i = -26; i < 26; i += 6) rect(im, x + i, groundY - 6, 3, 3, K);
  rect(im, x - 22, groundY - 32, 44, 20, color); rect(im, x - 22, groundY - 32, 44, 2, light); rect(im, x - 22, groundY - 14, 44, 2, dark);
  rect(im, x - 34, groundY - 30, 14, 16, '#3b4a63'); rect(im, x - 32, groundY - 28, 10, 6, '#a9d6f5'); rect(im, x - 32, groundY - 20, 10, 2, '#25314a');
  rect(im, x + 20, groundY - 26, 12, 10, K); rect(im, x + 22, groundY - 24, 8, 6, '#3a3f4a');
  const a = (-angleDeg * Math.PI) / 180;
  const bx0 = x, by0 = groundY - 32;
  const ex = bx0 + Math.cos(a) * boomLen, ey = by0 + Math.sin(a) * boomLen;
  const nx = Math.cos(a + Math.PI / 2) * 4, ny = Math.sin(a + Math.PI / 2) * 4;
  for (const s of [-1, 1]) { line(im, bx0 + nx * s, by0 + ny * s, ex + nx * s, ey + ny * s, color); line(im, bx0 + nx * s * 1.3, by0 + ny * s * 1.3, ex + nx * s * 1.3, ey + ny * s * 1.3, dark); }
  for (let t = 0; t < boomLen; t += 10) {
    const px0 = bx0 + Math.cos(a) * t, py0 = by0 + Math.sin(a) * t, px1 = bx0 + Math.cos(a) * (t + 10), py1 = by0 + Math.sin(a) * (t + 10);
    line(im, px0 + nx, py0 + ny, px1 - nx, py1 - ny, dark);
    line(im, px0 - nx, py0 - ny, px0 + nx, py0 + ny, light);
  }
  const hookLen = 40 + (x % 17);
  vline(im, Math.round(ex), Math.round(ey), hookLen, K); vline(im, Math.round(ex) + 1, Math.round(ey), hookLen, '#5e6873');
  rect(im, Math.round(ex) - 3, Math.round(ey) + hookLen, 7, 6, '#f2c230'); rect(im, Math.round(ex) - 1, Math.round(ey) + hookLen + 6, 3, 4, K);
}

export function drawSiteMid(W = 960, H = 400) {
  const im = create(W, H);
  const g = H - 24;
  rect(im, 0, g, W, 24, '#a89f8c'); hline(im, 0, g, W, '#7d766a'); for (let x = 0; x < W; x += 9) px(im, x + (x % 5), g + 6 + (x % 13), '#948c7a');
  // sylwetki zaplecza (dalsze, przygaszone)
  for (const [x, w, h] of [[40, 70, 40], [560, 50, 30], [760, 90, 46], [880, 40, 26]]) { rect(im, x, g - h, w, h, '#8c9aa6'); rect(im, x, g - h, w, 3, '#b3bec8'); for (let i = 6; i < w - 6; i += 12) rect(im, x + i, g - h + 8, 6, 8, '#6d7a86'); }
  // duże turbiny za placem (statyczne łopaty)
  for (const [tx, th, ph] of [[500, 190, 0.4], [860, 150, 1.9]]) {
    for (let y = g - th; y < g; y++) { const w = 4 + Math.round(((y - (g - th)) / th) * 8); rect(im, tx - Math.floor(w / 2), y, w, 1, W2); px(im, tx - Math.floor(w / 2), y, WHITE); px(im, tx + Math.floor(w / 2) - 1, y, W3); }
    rect(im, tx - 9, g - th - 8, 16, 9, W2); rect(im, tx - 9, g - th - 8, 16, 2, WHITE); hline(im, tx - 9, g - th, 16, K);
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + ph + (k * 2 * Math.PI) / 3; const r = th * 0.5;
      for (let i = 0; i < r; i++) { const tw = i < r * 0.7 ? 3 : 2; const bx = Math.round(tx + Math.cos(a) * i), by = Math.round(g - th - 4 + Math.sin(a) * i); rect(im, bx - 1, by - 1, tw, tw, i % 5 === 0 ? W1 : WHITE); px(im, bx + 1, by + 1, W3); } }
    circle(im, tx, g - th - 4, 4, W3, true); circle(im, tx, g - th - 4, 2, W1, true);
  }
  bigTower(im, 300, g, 150, 100);
  crane(im, 560, g, 300, 62);
  // maszt oświetleniowy
  vline(im, 170, g - 140, 140, K); vline(im, 171, g - 140, 140, '#5e6873'); rect(im, 160, g - 148, 22, 8, '#4a505c'); for (let i = 0; i < 3; i++) rect(im, 162 + i * 7, g - 146, 4, 4, '#ffe36b');
  // ogrodzenie w oddali
  for (let x = 0; x < W; x += 60) { vline(im, x, g - 26, 26, '#6f7a86'); } hline(im, 0, g - 25, W, '#8d95a0'); hline(im, 0, g - 14, W, '#8d95a0');
  return im;
}

// ---------------------------------------------------------------------------
/** Gigantyczna łopata (profil aerodynamiczny) leżąca na kozłach – nasada po lewej. */
function giantBlade(im, x, y, L) {
  for (let i = 0; i < L; i++) {
    const t = i / L;
    const th = Math.round(t < 0.12 ? 58 - 40 * (1 - t / 0.12) ** 2 : 58 * (1 - (t - 0.12) / 0.88) ** 1.15 + 4);
    const cy = y + Math.round(18 * t * t) - Math.round(th / 2);
    rect(im, x + i, cy, 1, th, WHITE);
    rect(im, x + i, cy + Math.round(th * 0.15), 1, Math.round(th * 0.3), '#ffffff');
    rect(im, x + i, cy + Math.round(th * 0.62), 1, Math.round(th * 0.22), W1);
    rect(im, x + i, cy + th - Math.round(th * 0.16), 1, Math.round(th * 0.16), W2);
    px(im, x + i, cy + th - 1, W3); px(im, x + i, cy, W2);
    px(im, x + i, cy - 1, K); px(im, x + i, cy + th, K);
    if (i % 90 === 0 && i > 0) vline(im, x + i, cy + 2, th - 4, '#d3d8de'); // szwy segmentów
  }
  // kołnierz nasady z otworami
  rect(im, x - 14, y - 32, 16, 64, W2); rect(im, x - 14, y - 32, 4, 64, W3); for (let k = -26; k < 30; k += 10) rect(im, x - 8, y + k, 4, 4, K); vline(im, x - 14, y - 32, 64, K);
}

function trestle(im, x, y, h) {
  // kozioł montażowy: żółte belki w kształcie A + gumowa poduszka
  const w = Math.round(h * 0.9);
  for (let k = 0; k < h; k++) { const spread = Math.round((k / h) * (w / 2)); px(im, x - spread, y + k, '#f2c230'); px(im, x - spread + 1, y + k, '#f2c230'); px(im, x + spread, y + k, '#f2c230'); px(im, x + spread - 1, y + k, '#f2c230'); px(im, x - spread - 1, y + k, K); px(im, x + spread + 1, y + k, K); }
  rect(im, x - Math.round(w * 0.3), y + Math.round(h * 0.55), Math.round(w * 0.6), 3, '#f2c230'); rect(im, x - Math.round(w * 0.3), y + Math.round(h * 0.55) + 3, Math.round(w * 0.6), 1, K);
  rect(im, x - 10, y - 5, 20, 6, '#2b2f36'); rect(im, x - 8, y - 4, 16, 2, '#4a505c');
  rect(im, x - Math.round(w / 2) - 4, y + h, w + 8, 4, '#3a3f4a'); hline(im, x - Math.round(w / 2) - 4, y + h + 3, w + 8, K);
}

/** Sekcja wieży na naczepie niskopodwoziowej. */
function towerOnTrailer(im, x, groundY) {
  const L = 200, Dm = 84; const y = groundY - 40 - Dm;
  // naczepa
  rect(im, x + 10, groundY - 30, L - 20, 14, '#f2c230'); rect(im, x + 10, groundY - 30, L - 20, 3, '#ffe08a'); rect(im, x + 10, groundY - 18, L - 20, 2, K);
  for (const wx of [x + 30, x + 62, x + L - 70, x + L - 38]) { circle(im, wx, groundY - 10, 10, K, true); circle(im, wx, groundY - 10, 6, '#4a505c', true); circle(im, wx, groundY - 10, 2, '#8d95a0', true); }
  rect(im, x + 20, groundY - 40, L - 40, 10, '#4a505c');
  // cylinder
  rect(im, x, y, L, Dm, W2); rect(im, x, y + 6, L, Math.round(Dm * 0.25), WHITE); rect(im, x, y + Math.round(Dm * 0.28), L, Math.round(Dm * 0.2), W1);
  rect(im, x, y + Math.round(Dm * 0.7), L, Math.round(Dm * 0.2), W3); rect(im, x, y + Dm - 6, L, 6, W4);
  hline(im, x, y, L, K); hline(im, x, y + Dm - 1, L, K);
  // kołnierz z przodu (otwór) – widoczne wnętrze
  rect(im, x + L - 14, y - 3, 14, Dm + 6, '#8a94a3'); circle(im, x + L - 7, y + Dm / 2, Dm / 2 - 6, '#4a505c', true); circle(im, x + L - 7, y + Dm / 2, Dm / 2 - 12, '#2b2f36', true);
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) px(im, Math.round(x + L - 7 + Math.cos(a) * (Dm / 2 - 3)), Math.round(y + Dm / 2 + Math.sin(a) * (Dm / 2 - 3)), K);
  vline(im, x, y - 2, Dm + 4, K); rect(im, x, y - 2, 6, Dm + 4, '#9aa3ad');
  for (let i = x + 30; i < x + L - 20; i += 40) { vline(im, i, y + 8, Dm - 16, '#dfe3e8'); }
}

function container(im, x, y, w, h, color, dark, light) {
  rect(im, x, y, w, h, color);
  for (let i = 4; i < w - 4; i += 6) rect(im, x + i, y + 3, 2, h - 6, dark);
  rect(im, x, y, w, 2, light); rect(im, x, y + h - 2, w, 2, K); rect(im, x, y, 2, h, K); rect(im, x + w - 2, y, 2, h, K);
  rect(im, x + w - 16, y + 4, 12, h - 8, color); rect(im, x + w - 10, y + 4, 2, h - 8, dark); rect(im, x + w - 8, y + h / 2 - 2, 3, 3, '#ffe36b');
  rect(im, x + 6, y + 6, 18, 6, light);
}

function fence(im, x, y, L) {
  for (let i = 0; i < L; i += 72) {
    rect(im, x + i, y, 3, 36, '#5e6873'); rect(im, x + i, y, 1, 36, K);
    for (let yy = y + 4; yy < y + 32; yy += 4) for (let xx = x + i + 6; xx < x + i + 70 && xx < x + L; xx += 4) px(im, xx + (yy % 8 === 0 ? 0 : 2), yy, '#7f8993');
    hline(im, x + i, y + 2, Math.min(72, L - i), '#8d95a0'); hline(im, x + i, y + 34, Math.min(72, L - i), '#8d95a0');
    rect(im, x + i - 6, y + 36, 15, 4, '#4a505c');
  }
}

function barrier(im, x, y) {
  rect(im, x, y, 3, 18, '#c0392b'); rect(im, x + 52, y, 3, 18, '#c0392b');
  for (let i = 0; i < 56; i += 8) rect(im, x + i, y + 2, 8, 6, Math.floor(i / 8) % 2 ? '#ffffff' : '#e03b2c');
  hline(im, x, y + 1, 56, K); hline(im, x, y + 8, 56, K);
}

function sign(im, x, y) {
  rect(im, x, y, 20, 16, '#ffe36b'); rect(im, x + 2, y + 2, 16, 12, '#2b2f36'); rect(im, x + 8, y + 4, 4, 6, '#ffe36b'); rect(im, x + 8, y + 11, 4, 2, '#ffe36b');
  vline(im, x + 9, y + 16, 26, K); vline(im, x + 10, y + 16, 26, '#5e6873');
}

export function drawSiteNear(W = 1120, H = 200) {
  const im = create(W, H);
  const g = H - 12;
  rect(im, 0, g, W, 12, '#a29a89'); hline(im, 0, g, W, '#6f6a60'); for (let x = 0; x < W; x += 96) vline(im, x, g, 12, '#8f8a7d');
  fence(im, 0, g - 40, 300); fence(im, 860, g - 40, 260);
  towerOnTrailer(im, 20, g);
  // gigantyczna łopata na dwóch kozłach
  const by = g - 70;
  trestle(im, 330, by + 10, 60); trestle(im, 900, by + 22, 48);
  giantBlade(im, 260, by, 780);
  container(im, 1040, g - 44, 80, 44, '#c0392b', '#7d2318', '#e07b6c');
  barrier(im, 560, g - 18); barrier(im, 760, g - 18);
  sign(im, 700, g - 42);
  return im;
}

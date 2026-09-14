/**
 * Tła parallax: plac budowy farmy wiatrowej o świcie (generowane proceduralnie).
 *  - sky      (0.1): gradient świtu, słońce, chmury, pola i farma wiatrowa na horyzoncie
 *  - siteMid  (0.4): żurawie gąsienicowe, częściowo postawiona turbina, sekcje wieży
 *  - siteNear (0.7): kontenery, łopata na stojakach, sekcja wieży, ogrodzenie budowlane, szpule kabli
 */
import { create } from './png.mjs';
import { px, rect, hline, vline, line, circle } from './pixel.mjs';

const K = '#2b2f36';           // obrys
const WHITE = '#f4f6f8', WHITE_D = '#c9cfd6', WHITE_DD = '#9aa3ad';

// ---------------------------------------------------------------------------
export const SKY_HORIZON = 166;
export function drawSky(W = 384, H = 216, horizon = SKY_HORIZON) {
  const im = create(W, H);
  // zachód słońca: granat → fiolet → róż → pomarańcz → złoto przy horyzoncie
  const bands = ['#5b5f9c', '#7a6aa6', '#9a76a8', '#b8829e', '#d38f8e', '#e69c7f', '#f0a874', '#f5b46d', '#f8c070', '#fbcc7c', '#fdd88e'];
  for (let y = 0; y < horizon; y++) {
    const t = y / horizon;
    const i = Math.min(bands.length - 1, Math.floor(t * bands.length));
    // dithering na granicach pasm
    const frac = t * bands.length - i;
    const c = frac > 0.7 && (y + (frac > 0.85 ? 0 : 1)) % 2 === 0 && i < bands.length - 1 ? bands[i + 1] : bands[i];
    hline(im, 0, y, W, c);
  }
  // słońce nisko nad horyzontem + odblask
  circle(im, 300, 136, 16, '#fbd27a', true); circle(im, 300, 136, 12, '#ffe39a', true); circle(im, 300, 136, 7, '#fff6d0', true);
  for (let y = 126; y < horizon; y += 3) hline(im, 250, y, 100, y % 6 === 0 ? '#fbd27a' : '#f9c98a');
  // odległa wieża turbiny (warstwa 0.1, przygaszona, ~34 px u podstawy) – poza centrum kadru
  for (let y = 18; y < horizon; y++) { const t = (y - 18) / (horizon - 18); const w = Math.round(18 + 16 * t); const x0 = 96 - Math.floor(w / 2);
    rect(im, x0, y, w, 1, '#c9b7ad'); rect(im, x0, y, Math.round(w * 0.25), 1, '#d9cbc2'); rect(im, x0 + w - Math.round(w * 0.3), y, Math.round(w * 0.3), 1, '#b3a29b'); }
  rect(im, 84, 8, 26, 11, '#cdbcb3'); rect(im, 84, 8, 26, 2, '#dccfc7'); hline(im, 84, 18, 26, '#a3948d');
  for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + 0.6 + (k * 2 * Math.PI) / 3; line(im, 100, 13, Math.round(100 + Math.cos(a) * 60), Math.round(13 + Math.sin(a) * 60), '#d9cbc2'); }
  // chmury (płaskie, różowawe od dołu)
  const cloud = (x, y, w) => {
    rect(im, x + 3, y, w - 6, 3, '#f6d6c6'); rect(im, x, y + 2, w, 3, '#f6d6c6'); rect(im, x + 6, y - 2, w - 14, 2, '#fbe4d6');
    hline(im, x + 1, y + 5, w - 2, '#d99a95'); hline(im, x + 4, y + 6, w - 8, '#c08590');
  };
  cloud(10, 40, 60); cloud(150, 24, 44); cloud(250, 60, 50); cloud(60, 86, 36); cloud(200, 100, 70); cloud(330, 34, 46);
  // pola i wzgórza na horyzoncie
  for (let x = 0; x < W; x++) {
    const h1 = 8 + Math.round(4 * Math.sin(x / 23) + 3 * Math.sin(x / 9 + 1));
    vline(im, x, horizon - h1, h1, '#86a98f');
    const h2 = 3 + Math.round(2 * Math.sin(x / 13 + 2));
    vline(im, x, horizon - h2, h2 + 1, '#6f9a7a');
  }
  rect(im, 0, horizon, W, H - horizon, '#7d9a72');
  hline(im, 0, horizon, W, '#5f8a66');
  // farma wiatrowa na horyzoncie – wieże (łopaty w animowanej nakładce drawSkyBlades)
  for (const [x, h] of SKY_TURBINES) { const base = horizon - 4 - (x % 5); vline(im, x, base - h, h, WHITE_D); px(im, x, base - h, WHITE_DD); }
  return im;
}

/** Pozycje turbin na niebie: [x, wysokość wieży, faza]. */
const SKY_TURBINES = [[18, 22, 0], [52, 16, 1], [140, 26, 2], [180, 18, 0.5], [216, 24, 1.5], [340, 20, 2.5], [372, 15, 1]];

/** Nakładka z łopatami – `frames` klatek obrotu (przezroczysta, ta sama szerokość co niebo). */
export function drawSkyBlades(frame, frames, W = 384, H = 70, top = SKY_HORIZON - 60) {
  const im = create(W, H);
  const rot = (frame / frames) * (2 * Math.PI / 3);
  for (const [x, h, ph] of SKY_TURBINES) {
    const base = SKY_HORIZON - 4 - (x % 5); const hy = base - h - top;
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + ph + rot + (k * 2 * Math.PI) / 3; line(im, x, hy, Math.round(x + Math.cos(a) * h * 0.45), Math.round(hy + Math.sin(a) * h * 0.45), WHITE); }
    px(im, x, hy, WHITE_DD);
  }
  return im;
}

// ---------------------------------------------------------------------------
/** Żuraw gąsienicowy z kratownicowym wysięgnikiem. */
export function crane(im, x, groundY, boomLen, angleDeg, color = '#d64a2a', dark = '#8e2f1a') {
  // gąsienice + nadwozie
  rect(im, x - 14, groundY - 6, 28, 6, K); rect(im, x - 12, groundY - 5, 24, 4, '#4a505c'); for (let i = -12; i < 12; i += 3) px(im, x + i, groundY - 3, K);
  rect(im, x - 10, groundY - 16, 20, 10, color); rect(im, x - 10, groundY - 16, 20, 1, '#f08a5d'); rect(im, x - 10, groundY - 7, 20, 1, dark);
  rect(im, x - 16, groundY - 15, 7, 8, '#3b4a63'); rect(im, x - 15, groundY - 14, 5, 3, '#a9d6f5'); // kabina
  rect(im, x + 9, groundY - 13, 6, 5, K); // przeciwwaga
  // wysięgnik kratownicowy
  const a = (-angleDeg * Math.PI) / 180;
  const ex = x + Math.cos(a) * boomLen, ey = groundY - 16 + Math.sin(a) * boomLen;
  const nx = Math.cos(a + Math.PI / 2) * 2, ny = Math.sin(a + Math.PI / 2) * 2;
  line(im, x + nx, groundY - 16 + ny, Math.round(ex + nx), Math.round(ey + ny), color);
  line(im, x - nx, groundY - 16 - ny, Math.round(ex - nx), Math.round(ey - ny), color);
  for (let t = 0; t < boomLen; t += 6) {
    const bx = x + Math.cos(a) * t, by = groundY - 16 + Math.sin(a) * t;
    line(im, Math.round(bx + nx), Math.round(by + ny), Math.round(bx + Math.cos(a) * 6 - nx), Math.round(by + Math.sin(a) * 6 - ny), dark);
  }
  // lina + hak
  const hookLen = 18 + (x % 11);
  vline(im, Math.round(ex), Math.round(ey), hookLen, K);
  rect(im, Math.round(ex) - 1, Math.round(ey) + hookLen, 3, 3, '#f2c230');
  return { hx: Math.round(ex), hy: Math.round(ey) + hookLen + 3 };
}

/** Łopata turbiny (poziomo, lekko wygięta), długość L, grubość ~6. */
function blade(im, x, y, L, dir = 1) {
  for (let i = 0; i < L; i++) {
    const t = i / L;
    const th = Math.max(1, Math.round(6 * (1 - t * 0.85)));
    const dy = Math.round(-4 * t * t);
    const xx = x + i * dir;
    vline(im, xx, y + dy - Math.floor(th / 2), th, WHITE);
    px(im, xx, y + dy - Math.floor(th / 2), WHITE_D);
    px(im, xx, y + dy - Math.floor(th / 2) + th - 1, WHITE_DD);
    if (i % 2 === 0) px(im, xx, y + dy - Math.floor(th / 2) + th, '#6f7a86');
  }
  rect(im, x - (dir < 0 ? 4 : 0), y - 4, 4, 8, WHITE_D); // nasada
}

/** Sekcja wieży leżąca (walec z kołnierzami). */
export function towerSection(im, x, y, L, D) {
  rect(im, x, y, L, D, WHITE_D); rect(im, x, y + 1, L, Math.floor(D / 3), WHITE); rect(im, x, y + D - Math.floor(D / 4), L, Math.floor(D / 4), WHITE_DD);
  hline(im, x, y, L, K); hline(im, x, y + D - 1, L, K);
  rect(im, x, y - 1, 3, D + 2, '#8a94a3'); rect(im, x + L - 3, y - 1, 3, D + 2, '#8a94a3');
  vline(im, x, y - 1, D + 2, K); vline(im, x + L - 1, y - 1, D + 2, K);
  for (let i = 8; i < L - 4; i += 12) px(im, x + i, y + 2, '#e5e9ef');
}

/** Częściowo postawiona turbina: wieża, gondola, jedna łopata w górze. */
export function standingTurbine(im, x, groundY, h, withBlade = true) {
  for (let y = groundY - h; y < groundY; y++) {
    const t = (y - (groundY - h)) / h; const w = 4 + Math.round(t * 6);
    hline(im, x - Math.floor(w / 2), y, w, WHITE_D); px(im, x - Math.floor(w / 2), y, WHITE); px(im, x + Math.floor(w / 2) - 1, y, WHITE_DD);
  }
  rect(im, x - 8, groundY - h - 6, 14, 7, WHITE_D); rect(im, x - 8, groundY - h - 6, 14, 2, WHITE); hline(im, x - 8, groundY - h, 14, K);
  if (withBlade) { for (let i = 0; i < 44; i++) { const th = Math.max(1, Math.round(5 * (1 - i / 44))); rect(im, x + 5 - Math.floor(th / 2), groundY - h - 8 - i, th, 1, i % 2 ? WHITE : '#ffffff'); } }
  circle(im, x + 5, groundY - h - 3, 2, '#8a94a3', true);
}

export function drawSiteMid(W = 576, H = 150) {
  const im = create(W, H);
  const g = H - 12;
  // ziemia: żwir/utwardzony plac
  rect(im, 0, g, W, 12, '#b9b19f'); hline(im, 0, g, W, '#8f8a7d');
  for (let x = 0; x < W; x += 5) px(im, x + (x % 3), g + 3 + (x % 7), '#a19a8a');
  standingTurbine(im, 520, g, 100, true);
  crane(im, 250, g, 120, 66);
  towerSection(im, 40, g - 20, 90, 20); towerSection(im, 60, g - 38, 70, 18);
  towerSection(im, 380, g - 22, 100, 22);
  // kontenery biurowe zaplecza
  for (const [x, c] of [[160, '#ecf0f1'], [186, '#ecf0f1']]) { rect(im, x, g - 14, 24, 14, c); rect(im, x + 3, g - 11, 5, 5, '#a9d6f5'); rect(im, x + 14, g - 11, 5, 5, '#a9d6f5'); hline(im, x, g - 14, 24, K); vline(im, x, g - 14, 14, K); }
  // maszt oświetleniowy
  vline(im, 120, g - 60, 60, K); rect(im, 116, g - 64, 9, 4, '#4a505c'); rect(im, 117, g - 63, 2, 2, '#ffe36b'); rect(im, 121, g - 63, 2, 2, '#ffe36b');
  return im;
}

// ---------------------------------------------------------------------------
function container(im, x, y, w, h, color, dark, light) {
  rect(im, x, y, w, h, color);
  for (let i = 2; i < w - 2; i += 3) vline(im, x + i, y + 1, h - 2, dark);      // blacha falista
  rect(im, x, y, w, 1, light); rect(im, x, y + h - 1, w, 1, K); vline(im, x, y, h, K); vline(im, x + w - 1, y, h, K);
  rect(im, x + w - 7, y + 2, 5, h - 4, color); vline(im, x + w - 5, y + 2, h - 4, dark); px(im, x + w - 4, y + Math.floor(h / 2), '#ffe36b'); // drzwi + zamek
  rect(im, x + 3, y + 3, 8, 3, light); // logo/numer
}

function fence(im, x, y, L) {
  for (let i = 0; i < L; i += 36) {
    vline(im, x + i, y, 18, K); vline(im, x + i + 1, y, 18, '#7a828f');
    for (let yy = y + 2; yy < y + 16; yy += 3) for (let xx = x + i + 3; xx < x + i + 35 && xx < x + L; xx += 3) px(im, xx + (yy % 2), yy, '#ff8a3d');
    hline(im, x + i, y + 1, Math.min(36, L - i), '#ff8a3d');
    rect(im, x + i - 4, y + 18, 10, 2, '#4a505c'); // stopa betonowa
  }
}

function cableReel(im, x, y, r) {
  circle(im, x, y, r, '#8b5a2b', true); circle(im, x, y, r, K); circle(im, x, y, r - 3, '#2b2f36', true); circle(im, x, y, r - 4, '#3a3f4a', true); px(im, x, y, '#8b5a2b');
}

export function drawSiteNear(W = 768, H = 72) {
  const im = create(W, H);
  const g = H - 8;
  // płyty drogowe / żwir
  rect(im, 0, g, W, 8, '#a8a294'); hline(im, 0, g, W, '#6f6a60'); for (let x = 0; x < W; x += 48) vline(im, x, g, 8, '#8f8a7d');
  // ogrodzenie budowlane (za obiektami)
  fence(im, 0, g - 20, 120); fence(im, 300, g - 20, 72); fence(im, 580, g - 20, 72);
  // kontenery (część piętrowo)
  container(im, 10, g - 22, 56, 22, '#2e86c1', '#1f5f8a', '#5dade2');
  container(im, 66, g - 22, 56, 22, '#c0392b', '#7d2318', '#e07b6c');
  container(im, 38, g - 44, 56, 22, '#27ae60', '#186e3d', '#58d68d');
  container(im, 520, g - 22, 56, 22, '#7f8c8d', '#4d5656', '#aab7b8');
  container(im, 660, g - 22, 56, 22, '#e67e22', '#9c4f0c', '#f5b041'); container(im, 716, g - 22, 52, 22, '#2e86c1', '#1f5f8a', '#5dade2');
  // łopata na kozłach montażowych (żółte A-frame)
  const trestle = (tx) => { for (let k = 0; k < 14; k++) { const sp = Math.round(k * 0.45); px(im, tx - sp, g - 14 + k, '#f2c230'); px(im, tx + sp, g - 14 + k, '#f2c230'); px(im, tx - sp - 1, g - 14 + k, K); px(im, tx + sp + 1, g - 14 + k, K); } hline(im, tx - 3, g - 6, 7, '#f2c230'); rect(im, tx - 8, g - 1, 17, 1, K); rect(im, tx - 3, g - 17, 7, 3, '#2b2f36'); };
  trestle(160); trestle(268);
  blade(im, 140, g - 22, 190, 1);
  // barierki czerwono-białe
  const barrier = (x) => { rect(im, x, g - 9, 2, 9, '#c0392b'); rect(im, x + 26, g - 9, 2, 9, '#c0392b'); for (let i = 0; i < 28; i += 4) rect(im, x + i, g - 8, 4, 3, Math.floor(i / 4) % 2 ? '#ffffff' : '#e03b2c'); hline(im, x, g - 9, 28, K); };
  barrier(330); barrier(600);
  // sekcja wieży na naczepie
  towerSection(im, 380, g - 34, 96, 26);
  rect(im, 376, g - 8, 104, 5, '#f2c230'); hline(im, 376, g - 4, 104, K); for (const wx of [392, 404, 452, 464]) { circle(im, wx, g - 3, 3, K, true); px(im, wx, g - 3, '#8d95a0'); }
  // szpule kabli
  cableReel(im, 128, g - 9, 8); cableReel(im, 498, g - 7, 6);
  // tabliczka ostrzegawcza
  rect(im, 348, g - 30, 10, 8, '#ffe36b'); rect(im, 349, g - 29, 8, 6, '#2b2f36'); rect(im, 352, g - 28, 2, 3, '#ffe36b'); px(im, 352, g - 24, '#ffe36b'); vline(im, 352, g - 22, 14, K);
  return im;
}

import fs from 'node:fs';
import { create } from './png.mjs';
import { px, rect, hline, line, circle } from './pixel.mjs';

// Wspólne materiały maszyn: kremowy kompozyt, stal w cieniu, bursztynowe oznaczenia.
export const MACHINE_PALETTE = {
  '#442b61': '#414a53', '#a096d1': '#909b9b', '#fcfcfc': '#f3e7ca',
  '#ffd800': '#d9ac57', '#ec7809': '#916443', '#00fff0': '#ff6450',
};
export const IMPACT_PALETTE = {
  '#00fff0': '#fff3ca', '#00b9ff': '#ffc063', '#008df0': '#b65c38',
};
export const EXPLOSION_PALETTE = {
  '#fcfcfc': '#fff3dc', '#fffc2e': '#ffdc87', '#ffa939': '#f7aa56',
  '#e56335': '#d97142', '#ce2038': '#964f42', '#8a0b41': '#50424a', '#030303': '#242b36',
};

export const BLADE_ART_PROFILE = JSON.parse(fs.readFileSync(new URL('../src/entities/boss/blade-profile.json', import.meta.url), 'utf8'));
const edges = (y) => {
  const rows = BLADE_ART_PROFILE.rows;
  for (let i = 1; i < rows.length; i++) if (y <= rows[i][0]) {
    const [a, l, r] = rows[i - 1], [b, nl, nr] = rows[i], t = (y - a) / (b - a);
    return [Math.round(l + (nl - l) * t), Math.round(r + (nr - r) * t)];
  }
  return [19, 20];
};

/** Pojedyncza aerodynamiczna łopata: cylindryczna nasada i zwężona końcówka. */
export function turbineWing(phase, cracked) {
  const { width, height } = BLADE_ART_PROFILE, im = create(width, height);
  const palettes = [
    ['#fff7e5', '#e2e4da', '#b4c2c1', '#718792'],
    ['#fff0d4', '#d7d5c1', '#a9b6b1', '#697e89'],
    ['#e8d9c2', '#c2c3b8', '#93a7a8', '#596d7d'],
  ];
  const pal = palettes[phase], outline = '#384b5b';
  for (let y = 0; y < height; y++) {
    const [left, right] = edges(y);
    for (let x = left; x < right; x++) {
      const t = (x - left) / Math.max(1, right - left - 1);
      px(im, x, y, x === left || x === right - 1 || y === 0 ? outline
        : t < .18 ? pal[0] : t < .62 ? pal[1] : t < .84 ? pal[2] : pal[3]);
    }
  }
  // Metalowy kołnierz wyłącznie przy nasadzie — reszta to gładki kompozyt.
  for (let y = 2; y < 10; y++) {
    const [left, right] = edges(y);
    hline(im, left + 1, y, right - left - 2, y === 2 ? '#e2ded0' : y === 9 ? '#3d515c' : '#8b9ca2');
  }
  for (const x of [8, 13, 18, 23]) { rect(im, x, 5, 2, 3, '#354953'); px(im, x, 5, '#e5e9de'); }
  // Delikatny szew i podłużne ślady zużycia na krawędzi natarcia.
  for (let y = 15; y < 111; y++) {
    const [left, right] = edges(y);
    if (right - left > 8) px(im, right - 4, y, pal[2]);
    if ((y * 7) % 19 < 2 && right - left > 6) px(im, left + 2, y, '#a0aaa3');
  }
  rect(im, 11, 19, 7, 3, '#819694'); hline(im, 12, 19, 4, '#eaf0df');
  for (const y of [38, 76, 98]) { const [left] = edges(y); px(im, left + 1, y, '#d0e4df'); }
  // Koniec podatny na ostrzał: pasy ostrzegawcze, nie dodatkowa skrzynka.
  for (let y = height - 28; y < height - 2; y++) {
    const [left, right] = edges(y);
    if (y % 12 < 5) hline(im, left + 1, y, Math.max(1, right - left - 2), '#ce774d');
  }
  // Odsłonięcie rdzenia w fazie 3 rozrywa poszycie w połowie łopaty.
  if (cracked) {
    circle(im, 16, 64, 7, '#2b3945', true);
    for (const [x, y, mx, my] of [[4, 28, 12, 48], [26, 37, 20, 51], [13, 102, 17, 82]]) {
      line(im, 16, 64, mx, my, '#3a3d42'); line(im, mx, my, x, y, '#485760');
      line(im, 16, 65, mx + 1, my, '#c57b50');
    }
  } else { hline(im, 12, 62, 9, pal[2]); hline(im, 12, 63, 8, pal[0]); }
  // Detale nigdy nie wychodzą poza ten sam profil, który definiuje kolizje.
  for (let y = 0; y < height; y++) {
    const [left, right] = edges(y);
    for (let x = 0; x < width; x++) if (x < left || x >= right) im.data[(y * width + x) * 4 + 3] = 0;
  }
  return im;
}

/** Gondola z wałem wirnika, obudową generatora, wentylacją i łożyskiem obrotu. */
export function nacelleFrame() {
  const im = create(48, 28), edge = '#293d4a';
  rect(im, 9, 3, 34, 20, edge); rect(im, 7, 6, 38, 15, edge);
  rect(im, 10, 4, 31, 4, '#fff1d7'); rect(im, 9, 8, 34, 9, '#d9e0d7');
  rect(im, 9, 17, 34, 5, '#99afb2'); hline(im, 10, 21, 31, '#647d8b');
  rect(im, 26, 6, 14, 2, '#bdc9c0');
  for (let x = 28; x < 40; x += 3) rect(im, x, 9, 1, 7, '#647f8c');
  rect(im, 13, 9, 9, 9, '#b7c6c1'); hline(im, 14, 10, 7, '#f6ebcf');
  rect(im, 15, 13, 4, 2, '#728c97'); px(im, 21, 16, edge);
  rect(im, 5, 8, 5, 11, '#506d7c'); rect(im, 3, 10, 4, 7, '#bac9c5');
  rect(im, 0, 12, 5, 3, '#e4e8dc'); hline(im, 0, 15, 5, '#657d8a');
  rect(im, 22, 23, 13, 4, edge); hline(im, 23, 23, 11, '#b2c4c0');
  hline(im, 23, 25, 11, '#647b84');
  rect(im, 39, 2, 3, 2, edge); px(im, 40, 1, '#ffac60');
  for (const x of [12, 19, 26]) px(im, x, 20, '#ebdcc2');
  return im;
}

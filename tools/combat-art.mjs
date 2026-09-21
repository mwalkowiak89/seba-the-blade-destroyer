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

/** Rozmiar i kotwica pozostają zgodne z dotychczasowym bossem 28×96. */
export function turbineWing(phase, cracked) {
  const im = create(28, 96);
  const pal = [
    ['#fff1d5', '#d8d6c7', '#a1adb0', '#596775'],
    ['#ffe0aa', '#c6b696', '#8e9493', '#555b66'],
    ['#edcba9', '#a18d7b', '#777c80', '#424b58'],
  ][phase];
  const edge = '#252e3b';
  // Delikatnie wyoblony profil: jasny grzbiet, szeroki półton, chłodny spód.
  for (let y = 0; y < 96; y++) {
    const inset = y < 3 ? 2 - Math.floor(y / 2) : y > 91 ? Math.floor((y - 90) / 2) : 0;
    for (let x = inset; x < 28 - inset; x++) {
      const u = (x - inset) / (27 - inset * 2);
      px(im, x, y, x === inset || x === 27 - inset || y === 0 || y === 95 ? edge
        : u < .16 ? pal[0] : u < .56 ? pal[1] : u < .8 ? pal[2] : pal[3]);
    }
  }
  // Wzmocniony kołnierz korzenia, śruby i szwy kompozytu.
  rect(im, 1, 2, 26, 8, '#68747b');
  hline(im, 2, 2, 24, pal[0]); hline(im, 2, 9, 24, edge);
  for (const x of [4, 10, 17, 23]) { rect(im, x, 5, 2, 2, edge); px(im, x, 5, '#dedac7'); }
  for (const y of [25, 63]) {
    hline(im, 2, y, 24, pal[2]); hline(im, 3, y + 1, 20, pal[0]);
    px(im, 4, y - 2, edge); px(im, 23, y - 2, edge);
  }
  // Oznaczenia serwisowe i nieregularne przetarcia, deterministyczne w każdym buildzie.
  rect(im, 8, 15, 10, 5, '#535e65'); hline(im, 10, 16, 6, '#c7c5b6');
  for (let i = 0; i < 16 + phase * 9; i++) {
    const x = 3 + i * 7 % 21, y = 12 + i * 17 % 77;
    hline(im, x, y, 1 + i % 3, i % 3 ? pal[2] : '#8b6b51');
  }
  // Receptory odgromowe: chłodne punkty światła na krawędzi natarcia.
  for (const y of [16, 34, 58, 76, 88]) { rect(im, 25, y, 3, 3, edge); px(im, 26, y, '#b8e1de'); }
  // Wrażliwy winglet zaczyna się dokładnie na granicy hitboxa (96 - 28).
  hline(im, 1, 68, 26, edge); hline(im, 2, 69, 24, '#e8b15d');
  for (let x = 2; x < 26; x++) px(im, x, 70, Math.floor(x / 3) % 2 ? edge : '#e8b15d');
  if (!cracked) {
    rect(im, 9, 77, 10, 10, edge); rect(im, 10, 78, 8, 8, '#9e4b34');
    rect(im, 12, 79, 4, 6, '#ffbd69'); rect(im, 13, 80, 2, 3, '#fff3d1');
    hline(im, 8, 89, 12, pal[3]);
  }
  // Okrągła piasta zamiast prostokątnej płytki.
  circle(im, 14, 48, 9, edge, true); circle(im, 14, 48, 7, '#788389', true);
  circle(im, 14, 48, 5, cracked ? '#342d36' : '#b9b9aa', true);
  for (const [x, y] of [[14, 41], [7, 48], [21, 48], [14, 55]]) px(im, x, y, pal[0]);
  if (cracked) {
    for (const [x, y, bendX, bendY] of [[3, 18, 8, 35], [24, 26, 19, 39], [2, 79, 9, 63], [25, 91, 18, 67]]) {
      line(im, 14, 48, bendX, bendY, edge); line(im, bendX, bendY, x, y, edge);
      line(im, 14, 49, bendX + 1, bendY, '#cd6541');
    }
  } else { rect(im, 12, 46, 4, 4, '#4b5963'); px(im, 12, 46, pal[0]); }
  return im;
}

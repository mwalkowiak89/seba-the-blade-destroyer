import { create } from './png.mjs';
import { px, rect, hline, vline, rotate45, rotate90ccw } from './pixel.mjs';

// Korpus wkrętarki rysowany w natywnej siatce gry; pozostałe kierunki
// powstają z tej samej klatki, razem z punktem dłoni i końcem bitu.
export function buildMakita() {
  const size = 40;
  const pivot = { x: 13, y: 22 };
  const muzzle = { x: 33, y: 16 };
  const diagonalPivot = { x: 16, y: 27 };
  const vertical = (p) => ({ x: p.y, y: size - 1 - p.x });
  const diagonal = (p) => ({
    x: Math.round(diagonalPivot.x + (p.x - pivot.x + p.y - pivot.y) * Math.SQRT1_2),
    y: Math.round(diagonalPivot.y + (p.y - pivot.y - p.x + pivot.x) * Math.SQRT1_2),
  });
  const draw = (frame) => {
    const im = create(size, size);
    const edge = '#17252b', rubber = '#29373b', steel = '#8faaa9';
    // Profil silnika: zaokrąglony tył, turkusowy grzbiet, gumowe narożniki.
    rect(im, 5, 12, 15, 9, edge); rect(im, 4, 14, 2, 5, edge);
    rect(im, 7, 11, 10, 1, edge); rect(im, 6, 13, 13, 6, '#21877f');
    hline(im, 7, 12, 11, '#72bfb0'); hline(im, 6, 13, 12, '#45a79a');
    hline(im, 6, 19, 12, '#145d5e'); hline(im, 8, 20, 9, '#10464e');
    rect(im, 5, 14, 3, 5, rubber); vline(im, 5, 14, 4, '#536967');
    // Otwory wentylacyjne, tabliczka i przetarcia na obudowie.
    for (const x of [9, 11, 13]) vline(im, x, 14, 2, '#163e43');
    rect(im, 9, 17, 6, 2, '#18383c'); hline(im, 10, 17, 4, '#c9ddcc');
    px(im, 17, 14, '#c4d5bd'); px(im, 7, 18, '#75b7a8');
    // Uchwyt pod silnikiem, spust i akumulator wsuwany od dołu.
    rect(im, 11, 20, 6, 8, edge); rect(im, 12, 21, 3, 6, rubber);
    vline(im, 15, 21, 5, '#26766e'); px(im, 12, 22, '#677777');
    hline(im, 12, 25, 3, '#101f28'); rect(im, 16, 21, 2, 3, edge);
    px(im, 16, 21, '#bc7951'); px(im, 17, 22, '#e3bd80');
    rect(im, 9, 27, 11, 5, edge); rect(im, 10, 28, 9, 3, '#34464a');
    hline(im, 10, 28, 8, '#63827c'); hline(im, 10, 31, 8, '#0d1c23');
    rect(im, 17, 28, 2, 2, '#25867a'); px(im, 11, 29, '#bdd789');
    // Przekładnia i regulacja momentu: metalowe pierścienie z radełkowaniem.
    rect(im, 19, 13, 4, 8, edge); rect(im, 19, 14, 3, 6, steel);
    hline(im, 19, 13, 3, '#dee3ce'); hline(im, 19, 19, 3, '#576d75');
    vline(im, 21, 14, 5, '#506368'); px(im, 19, 16, '#f1e4be');
    rect(im, 23, 14, 5, 6, edge); rect(im, 23, 15, 4, 4, '#455759');
    for (const x of [23, 25]) vline(im, x, 15, 3, '#899d99');
    hline(im, 23, 14, 3, '#b4c6b8'); hline(im, 23, 19, 4, '#14252e');
    // Stalowy bit, dwa układy rowków widoczne wyłącznie podczas pracy.
    rect(im, 28, 15, 4, 3, edge); hline(im, 28, 15, 3, '#d8decb');
    hline(im, 28, 16, 5, '#829a9d'); hline(im, 29, 17, 2, '#4a626e');
    for (let x = 29 + frame; x < 32; x += 2) px(im, x, 16, '#e6e8d2');
    px(im, 32, 16, '#fff1cd');
    return im;
  };
  const horizontal = [draw(0), draw(1)];
  return {
    frames: [...horizontal,
      ...horizontal.map((im) => rotate45(im, size, size, pivot.x, pivot.y, diagonalPivot.x, diagonalPivot.y)),
      ...horizontal.map(rotate90ccw)],
    pivots: { horizontal: pivot, diagonal: diagonalPivot, vertical: vertical(pivot) },
    muzzle: { horizontal: muzzle, diagonal: diagonal(muzzle), vertical: vertical(muzzle) },
  };
}

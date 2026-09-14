/**
 * Port 1:1 skryptu tools/art/gen-sky.py (PIL) na prymitywy pipeline'u – generuje sky-source.png 384x216
 * z paletą ze specyfikacji. Wynik ląduje w assets/raw/art/backgrounds/ i NADPISUJE proceduralne niebo (build-assets).
 * Uruchomienie: node tools/art/gen-sky.mjs
 */
import { create, save } from '../png.mjs';
import { rect, circle, hex } from '../pixel.mjs';

const WIDTH = 384, HEIGHT = 216, HORIZON_Y = 166;
const C_VIOLET = '#7a6aa6', C_PINK = '#d38f8e', C_AMBER = '#f0a874', C_GOLD = '#fbcc7c', C_SUN = '#ffe39a';
const C_HILLS = '#414b4e', C_CLOUD_DARK = '#a8645f', C_TOWER = '#8c8296';

const img = create(WIDTH, HEIGHT);
// PIL rectangle jest inkluzywne (x1, y1) – odwzorowujemy +1
const R = (x0, y0, x1, y1, c) => rect(img, x0, y0, x1 - x0 + 1, y1 - y0 + 1, c);

// 1. Gradient nieba – 4 pasma
for (const [y0, y1, c] of [[0, 45, C_VIOLET], [45, 90, C_PINK], [90, 135, C_AMBER], [135, HORIZON_Y, C_GOLD]]) R(0, y0, WIDTH, y1, c);

// 2. Słońce (elipsa poświaty + dysk)
const ellipse = (x0, y0, x1, y1, c) => { const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2;
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) img.data.set(hex(c), (y * WIDTH + x) * 4); };
const sun_x = 240, sun_y = 148, sun_r = 16;
ellipse(sun_x - sun_r - 4, sun_y - sun_r - 2, sun_x + sun_r + 4, sun_y + sun_r + 2, C_AMBER);
circle(img, sun_x, sun_y, sun_r, C_SUN, true);

// 3. Płaskie chmury pikselowe
const cloud = (x, y, w, h) => { R(x, y, x + w, y + h - 2, C_GOLD); R(x + 2, y + h - 2, x + w - 2, y + h, C_CLOUD_DARK); };
cloud(40, 50, 60, 8); cloud(180, 75, 90, 10); cloud(310, 40, 50, 7);

// 4. Daleka wieża po lewej (<30 px) – trapez (45,166) (49,30) (55,30) (59,166)
for (let y = 30; y <= HORIZON_Y; y++) { const t = (y - 30) / (HORIZON_Y - 30); const xl = 49 - 4 * t, xr = 55 + 4 * t; R(Math.round(xl), y, Math.round(xr), y, C_TOWER); }

// 5. Wzgórza / ziemia od horyzontu w dół
R(0, HORIZON_Y, WIDTH, HEIGHT, C_HILLS);

save(img, 'assets/raw/art/backgrounds/sky-source.png');
console.log('Zapisano assets/raw/art/backgrounds/sky-source.png (384x216)');

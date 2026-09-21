import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from '../tools/png.mjs';

const source = fs.readFileSync('src/assets/manifest.generated.ts', 'utf8');
const manifest = JSON.parse(source.slice(source.indexOf('=') + 1, source.lastIndexOf('as const;')));
let checkedFrames = 0;
for (const [name, def] of Object.entries(manifest.sheets)) {
  const image = load(def.file);
  assert.equal(image.width, def.cols * def.frameW, `${name}: szerokość atlasu`);
  assert.equal(image.height % def.frameH, 0, `${name}: wysokość atlasu`);
  const total = def.cols * image.height / def.frameH;
  const used = new Set();
  for (const [clip, anim] of Object.entries(def.clips)) {
    assert(anim.frames.length > 0 && anim.fps > 0, `${name}/${clip}: pusty klip`);
    for (const frame of anim.frames) {
      assert(Number.isInteger(frame) && frame >= 0 && frame < total, `${name}/${clip}: klatka poza atlasem`);
      used.add(frame);
    }
  }
  for (const frame of used) {
    let visible = 0;
    const x0 = frame % def.cols * def.frameW, y0 = Math.floor(frame / def.cols) * def.frameH;
    for (let y = y0; y < y0 + def.frameH; y++) for (let x = x0; x < x0 + def.frameW; x++) {
      if (image.data[(y * image.width + x) * 4 + 3] > 0) visible++;
    }
    assert(visible > 0, `${name}: przezroczysta klatka ${frame}`);
    checkedFrames++;
  }
}
for (const [name, def] of Object.entries(manifest.images)) {
  const image = load(def.file);
  if (def.w !== undefined) assert.equal(image.width, def.w, `${name}: szerokość`);
  if (def.h !== undefined) assert.equal(image.height, def.h, `${name}: wysokość`);
}
// Regresja globalnej maski błysku: wcześniej usuwała skórę z portretu (21 pikseli zamiast 74).
const portrait = load(manifest.images.portrait.file);
let skinPixels = 0;
for (let i = 0; i < portrait.data.length; i += 4) {
  const [r, g, b, a] = portrait.data.subarray(i, i + 4);
  if (a > 0 && r > g + 20 && g > b + 10) skinPixels++;
}
assert(skinPixels >= 40, 'portret: maska błysku usunęła odcienie skóry');
const bladeDef = manifest.images.bladeBig, blade = load(bladeDef.file);
for (let x = 1; x < blade.width - 1; x++) {
  assert(blade.data[(bladeDef.flatTop * blade.width + x) * 4 + 3] > 0, `łopata: niewidoczna powierzchnia pod stopami w kolumnie ${x}`);
}
console.log(`ASSET TEST OK: ${checkedFrames} klatek; portret zachował ${skinPixels} piksele skóry`);

// Obroty nie mogą ucinać baterii/bitu ani umieszczać kotwic poza klatką.
const weapon = manifest.sheets.makita, weaponImage = load(weapon.file);
for (const orientation of ['horizontal', 'diagonal', 'vertical']) {
  for (const point of [weapon.pivots[orientation], weapon.muzzle[orientation]]) {
    assert(point.x >= 0 && point.x < weapon.frameW && point.y >= 0 && point.y < weapon.frameH, `broń/${orientation}: kotwica poza klatką`);
  }
  for (const frame of weapon.clips[orientation].frames) {
    const x0 = frame % weapon.cols * weapon.frameW;
    for (let y = 0; y < weapon.frameH; y++) for (let x = 0; x < weapon.frameW; x++) {
      if (x !== 0 && y !== 0 && x !== weapon.frameW - 1 && y !== weapon.frameH - 1) continue;
      assert.equal(weaponImage.data[(y * weaponImage.width + x0 + x) * 4 + 3], 0, `broń/${orientation}: grafika dotyka krawędzi atlasu`);
    }
  }
}
console.log('WEAPON ASSET OK: 6 klatek bez przycięcia, kotwice w granicach');

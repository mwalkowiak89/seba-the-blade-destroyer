import { MANIFEST } from './manifest.generated';
import { Assets } from '../render/Assets';
import { SpriteSheet, type SheetDef } from './SpriteSheet';

export type SheetName = keyof typeof MANIFEST.sheets;
export type ImageName = keyof typeof MANIFEST.images;

/**
 * Ładuje wszystko z manifestu (sheety, obrazy, czcionkę) przed startem gry.
 * Po załadowaniu: Sheets.get('seba'), Images.get('skyline').
 */
export class Sheets {
  private static map = new Map<string, SpriteSheet>();
  static get(name: SheetName): SpriteSheet {
    const s = Sheets.map.get(name);
    if (!s) throw new Error(`Sheet nie załadowany: ${name}`);
    return s;
  }
  static tryGet(name: SheetName): SpriteSheet | undefined { return Sheets.map.get(name); }
  static set(name: string, sheet: SpriteSheet): void { Sheets.map.set(name, sheet); }
}

export class Images {
  static get(name: ImageName): HTMLImageElement {
    const img = Assets.image(name);
    if (!img) throw new Error(`Obraz nie załadowany: ${name}`);
    return img;
  }
  static tryGet(name: ImageName): HTMLImageElement | undefined { return Assets.image(name); }
}

export const PIXEL_FONT = 'KenneyPixel';

export async function loadAllAssets(onProgress?: (done: number, total: number) => void): Promise<void> {
  const sheetEntries = Object.entries(MANIFEST.sheets) as [string, SheetDef][];
  const imageEntries = Object.entries(MANIFEST.images) as [string, { file: string }][];
  const total = sheetEntries.length + imageEntries.length + 1;
  let done = 0;
  const tick = () => onProgress?.(++done, total);

  // wersja z manifestu w query stringu – podmiana PNG nie utknie w cache przeglądarki
  const url = (file: string) => `${file}?v=${MANIFEST.version}`;
  await Promise.all([
    ...sheetEntries.map(async ([name, def]) => {
      const img = await Assets.loadImage(`sheet:${name}`, url(def.file));
      Sheets.set(name, new SpriteSheet(img, def));
      tick();
    }),
    ...imageEntries.map(async ([name, def]) => { await Assets.loadImage(name, url(def.file)); tick(); }),
    loadFont().then(tick),
  ]);
}

async function loadFont(): Promise<void> {
  try {
    const face = new FontFace(PIXEL_FONT, 'url(assets/fonts/KenneyPixel.ttf)');
    await face.load();
    (document.fonts as unknown as { add(f: FontFace): void }).add(face);
  } catch {
    // brak czcionki (np. file:// bez CORS) – HUD użyje monospace
  }
}

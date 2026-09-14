/**
 * Warstwa wizualna oddzielona od logiki encji.
 *
 * Każda encja posiada `visual: Visual` i wywołuje `visual.draw(ctx, params)`.
 * Na etapie prototypu używamy PlaceholderVisual (prostokąty + lufa).
 * Podmiana na grafikę docelową = przypisanie SpriteSheetVisual z tymi samymi nazwami klipów
 * (`anim`), bez zmian w PlayerController / EnemyBase / Boss.
 */
import { Sheets, type SheetName } from '../assets/AssetLoader';
import { D } from '../assets/SpriteSheet';

export interface DrawParams {
  /** Lewy-górny róg hitboxa w przestrzeni świata. */
  x: number;
  y: number;
  w: number;
  h: number;
  facing: 1 | -1;
  /** Nazwa klipu animacji (idle, run, crouch, jump, hurt, aim, charge, ...). */
  anim: string;
  /** Czas życia animacji (s) – do wyliczania klatki. */
  time: number;
  /** Kierunek celowania (znormalizowany) – placeholder rysuje lufę. */
  aim?: { x: number; y: number };
  /** Obrót w radianach (koziołek). */
  rotation?: number;
  /** Nadpisanie koloru (np. faza enrage bossa). */
  tint?: string;
  /** Biały flash (trafienie). */
  flash?: boolean;
  alpha?: number;
}

export interface Visual {
  draw(ctx: CanvasRenderingContext2D, p: DrawParams): void;
}

export interface PlaceholderStyle {
  color: string;
  accent?: string;
  /** Kształt bazowy. */
  shape?: 'rect' | 'circle' | 'diamond';
  /** Czy rysować lufę/kierunek. */
  barrel?: boolean;
  barrelLength?: number;
  /** Znacznik "twarzy" po stronie, w którą encja jest zwrócona. */
  faceMarker?: boolean;
  outline?: string;
}

export class PlaceholderVisual implements Visual {
  constructor(private style: PlaceholderStyle) {}

  draw(ctx: CanvasRenderingContext2D, p: DrawParams): void {
    const s = this.style;
    const color = p.flash ? '#ffffff' : (p.tint ?? s.color);
    const accent = p.flash ? '#ffffff' : (s.accent ?? '#ffffff');
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;

    ctx.save();
    if (p.alpha !== undefined) ctx.globalAlpha = p.alpha;
    ctx.translate(Math.round(cx), Math.round(cy));
    if (p.rotation) ctx.rotate(p.rotation);

    ctx.fillStyle = color;
    switch (s.shape ?? 'rect') {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(p.w, p.h) / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -p.h / 2);
        ctx.lineTo(p.w / 2, 0);
        ctx.lineTo(0, p.h / 2);
        ctx.lineTo(-p.w / 2, 0);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        if (s.outline) {
          ctx.strokeStyle = s.outline;
          ctx.lineWidth = 1;
          ctx.strokeRect(-p.w / 2 + 0.5, -p.h / 2 + 0.5, p.w - 1, p.h - 1);
        }
    }

    // Znacznik zwrotu: jasny kwadrat w górnej części po stronie `facing`.
    if (s.faceMarker !== false && !p.rotation) {
      ctx.fillStyle = accent;
      const mx = p.facing > 0 ? p.w / 2 - 4 : -p.w / 2 + 1;
      ctx.fillRect(mx, -p.h / 2 + 3, 3, 3);
    }

    // Lufa: gruba linia w kierunku celowania.
    if (s.barrel && p.aim && !p.rotation) {
      const len = s.barrelLength ?? 10;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -1);
      ctx.lineTo(p.aim.x * (p.w / 2 + len), -1 + p.aim.y * (p.h / 2 + len));
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** Definicja klipu animacji klatkowej. */
export interface AnimClip {
  /** Indeksy klatek w sprite sheecie (liczone rzędami od lewej do prawej). */
  frames: readonly number[];
  fps: number;
  loop?: boolean;
}

/**
 * Wizual oparty o SpriteSheet z manifestu (odpowiednik AnimatedSprite2D).
 * Nazwa `anim` = nazwa klipu; brak klipu → `fallback`.
 * Kotwica z definicji sheetu: 'bottom' (stopy = dół hitboxa) lub 'center' (środek hitboxa).
 */
export class SpriteSheetVisual implements Visual {
  constructor(
    private sheetName: SheetName,
    private opts: { fallback?: string; offsetX?: number; offsetY?: number; placeholder?: Visual } = {},
  ) {}

  draw(ctx: CanvasRenderingContext2D, p: DrawParams): void {
    const sheet = Sheets.tryGet(this.sheetName);
    if (!sheet) { this.opts.placeholder?.draw(ctx, p); return; }
    const def = sheet.def;
    const frame = sheet.frameAt(p.anim, p.time, this.opts.fallback ?? 'idle');
    const ax = def.anchorX ?? sheet.frameW / 2;
    let x = p.x + p.w / 2 + (this.opts.offsetX ?? 0) * p.facing;
    let y: number, ay: number;
    if (def.anchor === 'center') { y = p.y + p.h / 2; ay = def.anchorY ?? sheet.frameH / 2; }
    else { y = p.y + p.h; ay = sheet.frameH; }
    y += this.opts.offsetY ?? 0;
    if (p.rotation) { // obrót wokół środka hitboxa (koziołek)
      y = p.y + p.h / 2; ay = sheet.frameH - (p.h / 2) * D;
    }
    sheet.drawAnchored(ctx, frame, x, y, ax, ay, { flipX: p.facing < 0, rotation: p.rotation, alpha: p.alpha, flash: p.flash });
  }
}

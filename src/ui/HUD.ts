import { CONFIG } from '../core/Config';
import { Images, PIXEL_FONT } from '../assets/AssetLoader';
import type { PlayerController } from '../entities/player/PlayerController';
import type { TurbineBoss } from '../entities/boss/TurbineBoss';

const FONT = (px: number) => `${px}px ${PIXEL_FONT}, monospace`;

/** Kenney Pixel nie ma polskich znaków – transliteracja do ASCII, żeby nie mieszać krojów. */
const PL: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z', Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z', '–': '-' };
export const ascii = (t: string) => t.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ–]/g, (c) => PL[c] ?? c);
const C = { K: '#050912', P0: '#08202f', P1: '#0d3344', P2: '#13506a', P3: '#1d6c86', R: '#2fb9b0', Y: '#c9a227' };

/** HUD w stylu industrialnym: portret w ramce, segmentowy pasek HP (baterie), pixel font. */
export class HUD {
  private phaseBanner = '';
  private phaseBannerTimer = 0;

  showBanner(text: string, seconds = 1.6): void {
    this.phaseBanner = text;
    this.phaseBannerTimer = seconds;
  }

  update(dt: number): void {
    if (this.phaseBannerTimer > 0) this.phaseBannerTimer -= dt;
  }

  /** Metalowa obudowa: obrys, płyta, krawędź światła/cienia. */
  private panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = C.K; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = C.P1; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = C.P3; ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2);
    ctx.fillStyle = C.P0; ctx.fillRect(x + 1, y + h - 2, w - 2, 1); ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
    // nity w rogach
    ctx.fillStyle = C.R;
    ctx.fillRect(x + 2, y + 2, 1, 1); ctx.fillRect(x + w - 3, y + 2, 1, 1); ctx.fillRect(x + 2, y + h - 3, 1, 1); ctx.fillRect(x + w - 3, y + h - 3, 1, 1);
  }

  draw(ctx: CanvasRenderingContext2D, player: PlayerController, score: number, boss: TurbineBoss | null, time: number): void {
    const W = CONFIG.view.width;
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = FONT(16);

    // --- portret ---
    const px = 6, py = 6;
    this.panel(ctx, px, py, 28, 28);
    const portrait = Images.tryGet('portrait');
    if (portrait) ctx.drawImage(portrait, px + 4, py + 4);
    else { ctx.fillStyle = '#4f8fd6'; ctx.fillRect(px + 6, py + 6, 16, 16); }

    // --- pasek HP: segmenty-baterie w obudowie ---
    const segs = 10, segW = 6, segH = 8, gap = 1;
    const bx = px + 32, by = py;
    const barW = segs * (segW + gap) + 5, barH = segH + 6;
    this.panel(ctx, bx, by, barW, barH);
    const f = player.health.fraction;
    const lit = Math.ceil(f * segs);
    const col = f > 0.5 ? '#3ddc84' : f > 0.25 ? '#ffb300' : '#ff3b3b';
    const colDark = f > 0.5 ? '#1c7a48' : f > 0.25 ? '#8a5f00' : '#7a1a1a';
    for (let i = 0; i < segs; i++) {
      const sx = bx + 3 + i * (segW + gap), sy = by + 3;
      const on = i < lit && !(f <= 0.25 && f > 0 && Math.floor(time * 6) % 2 === 0 && i === lit - 1);
      ctx.fillStyle = on ? col : C.P0;
      ctx.fillRect(sx, sy, segW, segH);
      if (on) { ctx.fillStyle = colDark; ctx.fillRect(sx, sy + segH - 2, segW, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(sx + 1, sy + 1, 1, 1); }
    }
    // etykieta i wartość
    ctx.fillStyle = '#ffffff';
    ctx.fillText(ascii('SEBA'), bx, by + barH + 1);
    ctx.fillStyle = C.R;
    ctx.fillText(ascii(`${Math.ceil(player.health.current)}`), bx + 40, by + barH + 1);

    // --- punkty ---
    ctx.textAlign = 'right';
    ctx.fillStyle = C.Y;
    ctx.fillText(ascii('SCORE'), W - 8, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(score.toString().padStart(6, '0'), W - 8, 18);
    ctx.textAlign = 'left';

    // --- boss ---
    if (boss && boss.alive) {
      const bw = 96, bh = 8, bxx = Math.round((W - bw) / 2) + 6, byy = 6;
      this.panel(ctx, bxx - 3, byy - 3, bw + 6, bh + 6);
      ctx.fillStyle = C.P0; ctx.fillRect(bxx, byy, bw, bh);
      ctx.fillStyle = boss.tint; ctx.fillRect(bxx, byy, Math.round(bw * boss.health.fraction), bh);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bxx, byy, Math.round(bw * boss.health.fraction), 1);
      ctx.fillStyle = '#ffffff';
      for (const t of CONFIG.boss.phaseThresholds.slice(1)) ctx.fillRect(Math.round(bxx + bw * t), byy - 1, 1, bh + 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff9a90';
      ctx.fillText(ascii(CONFIG.boss.name), W / 2, byy + bh + 4);
      ctx.textAlign = 'left';
    }

    // --- baner fazy ---
    if (this.phaseBannerTimer > 0 && Math.floor(time * 8) % 2 === 0) {
      ctx.textAlign = 'center';
      ctx.font = FONT(24);
      ctx.fillStyle = C.K; ctx.fillText(ascii(this.phaseBanner), W / 2 + 1, 41);
      ctx.fillStyle = '#ffdd59'; ctx.fillText(ascii(this.phaseBanner), W / 2, 40);
    }
    ctx.restore();
  }

  drawOverlay(ctx: CanvasRenderingContext2D, title: string, subtitle: string, color: string): void {
    const W = CONFIG.view.width, H = CONFIG.view.height;
    ctx.save();
    ctx.fillStyle = 'rgba(5,9,18,0.6)';
    ctx.fillRect(0, 0, W, H);
    this.panel(ctx, 40, H / 2 - 28, W - 80, 56);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONT(32);
    ctx.fillStyle = C.K; ctx.fillText(ascii(title), W / 2 + 1, H / 2 - 9);
    ctx.fillStyle = color; ctx.fillText(ascii(title), W / 2, H / 2 - 10);
    ctx.font = FONT(16);
    ctx.fillStyle = '#ddd';
    ctx.fillText(ascii(subtitle), W / 2, H / 2 + 12);
    ctx.restore();
  }

  drawHint(ctx: CanvasRenderingContext2D, alpha: number, gamepad = false): void {
    const W = CONFIG.view.width, H = CONFIG.view.height;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONT(16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(ascii(
      gamepad
        ? 'D-PAD/GAŁKA: RUCH   A: SKOK   B/X/RT: OGIEŃ   DÓŁ+A: ZESKOK'
        : 'STRZAŁKI: RUCH   Z: SKOK   X: OGIEŃ   DÓŁ+Z: ZESKOK',
    ), W / 2, H - 14);
    ctx.restore();
  }

  static drawLoading(ctx: CanvasRenderingContext2D, done: number, total: number): void {
    const W = CONFIG.view.width, H = CONFIG.view.height;
    ctx.fillStyle = '#050912';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0d3344'; ctx.fillRect(W / 2 - 60, H / 2, 120, 6);
    ctx.fillStyle = '#2fb9b0'; ctx.fillRect(W / 2 - 60, H / 2, Math.round(120 * (total ? done / total : 0)), 6);
    ctx.font = '8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#c3c8d1';
    ctx.fillText(ascii('ŁADOWANIE...'), W / 2, H / 2 - 6);
  }
}

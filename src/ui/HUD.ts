import { CONFIG } from '../core/Config';
import { Images, PIXEL_FONT } from '../assets/AssetLoader';
import type { PlayerController } from '../entities/player/PlayerController';
import type { TurbineBoss } from '../entities/boss/TurbineBoss';

const D = CONFIG.view.pixelScale;
const FONT = (px: number) => `${px}px ${PIXEL_FONT}, monospace`;
/** Paleta HUD: retro metal z rdzą (jak w mockupie). */
const C = { K: '#161a20', P0: '#3b4048', P1: '#4f565f', P2: '#656d78', P3: '#8a93a0', HI: '#aab3bf', RUST: '#7a4a2e', Y: '#d9a72c', G: '#3ddc84', GD: '#1c7a48', T: '#2fb9b0' };

/** Kenney Pixel nie ma polskich znaków – transliteracja do ASCII, żeby nie mieszać krojów. */
const PL: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z', Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z', '–': '-' };
export const ascii = (t: string) => t.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ–]/g, (c) => PL[c] ?? c);

/** HUD w stylu retro-industrialnym: ramka z nitami i rdzą, portret, segmentowy pasek HP (bateria), pixel font. Rysowany w px canvasu. */
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

  private label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
    const t = ascii(text);
    ctx.fillStyle = C.K; ctx.fillText(t, x + 2, y + 2);
    ctx.fillStyle = color; ctx.fillText(t, x, y);
  }

  /** Metalowa obudowa: obrys, płyta, krawędzie, nity w rogach, zaciek rdzy. */
  private panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = C.K; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = C.P1; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = C.P3; ctx.fillRect(x + 2, y + 2, w - 4, 2); ctx.fillRect(x + 2, y + 2, 2, h - 4);
    ctx.fillStyle = C.P0; ctx.fillRect(x + 2, y + h - 4, w - 4, 2); ctx.fillRect(x + w - 4, y + 2, 2, h - 4);
    ctx.fillStyle = C.RUST; ctx.fillRect(x + w - 14, y + 4, 3, 10); ctx.fillRect(x + w - 13, y + 14, 1, 6);
    ctx.fillStyle = C.HI;
    for (const [rx, ry] of [[x + 5, y + 5], [x + w - 8, y + 5], [x + 5, y + h - 8], [x + w - 8, y + h - 8]]) { ctx.fillRect(rx, ry, 3, 3); ctx.fillStyle = C.K; ctx.fillRect(rx + 2, ry + 2, 1, 1); ctx.fillStyle = C.HI; }
  }

  /** Wgłębiony ekran (ciemne pole z jasną dolną krawędzią). */
  private inset(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = C.K; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#23272e'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.fillStyle = C.P2; ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
  }

  draw(ctx: CanvasRenderingContext2D, player: PlayerController, score: number, boss: TurbineBoss | null, time: number): void {
    const W = CONFIG.view.width * D;
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = FONT(24);

    // --- panel gracza: portret + bateria + etykieta ---
    const px = 12, py = 12, pw = 268, ph = 84;
    this.panel(ctx, px, py, pw, ph);
    this.inset(ctx, px + 8, py + 8, 56, 56);
    const portrait = Images.tryGet('portrait');
    if (portrait) ctx.drawImage(portrait, px + 16, py + 16, 40, 40);
    else { ctx.fillStyle = '#4f8fd6'; ctx.fillRect(px + 20, py + 20, 32, 32); }
    ctx.fillStyle = C.P3; ctx.fillRect(px + 14, py + 66, 44, 4); // półka pod portretem

    const segs = 10, segW = 14, segH = 18, gap = 2;
    const bx = px + 74, by = py + 10;
    this.inset(ctx, bx, by, segs * (segW + gap) + 10, segH + 12);
    const f = player.health.fraction;
    const lit = Math.ceil(f * segs);
    const col = f > 0.5 ? C.G : f > 0.25 ? '#ffb300' : '#ff3b3b';
    const colDark = f > 0.5 ? C.GD : f > 0.25 ? '#8a5f00' : '#7a1a1a';
    for (let i = 0; i < segs; i++) {
      const sx = bx + 6 + i * (segW + gap), sy = by + 6;
      const on = i < lit && !(f <= 0.25 && f > 0 && Math.floor(time * 6) % 2 === 0 && i === lit - 1);
      ctx.fillStyle = on ? col : '#2f343b'; ctx.fillRect(sx, sy, segW, segH);
      if (on) { ctx.fillStyle = colDark; ctx.fillRect(sx, sy + segH - 4, segW, 4); ctx.fillStyle = '#e9ffe9'; ctx.fillRect(sx + 2, sy + 2, 2, 2); ctx.fillStyle = '#bfffd8'; ctx.fillRect(sx + 2, sy + 5, 1, segH - 10); }
    }
    ctx.fillStyle = C.P3; ctx.fillRect(bx + segs * (segW + gap) + 10, by + 10, 4, segH - 8); // biegun baterii
    this.label(ctx, 'SEBA', bx + 6, by + segH + 20, '#e6e9ed');
    this.label(ctx, `${Math.ceil(player.health.current)}`, bx + 96, by + segH + 20, C.G);

    // --- punkty (panel prawy) ---
    const sw = 160, sx0 = W - 12 - sw;
    this.panel(ctx, sx0, 12, sw, 84);
    ctx.textAlign = 'right';
    this.label(ctx, 'SCORE', sx0 + sw - 12, 20, C.Y);
    this.inset(ctx, sx0 + 12, 50, sw - 24, 34);
    this.label(ctx, score.toString().padStart(6, '0'), sx0 + sw - 20, 56, '#ffffff');
    ctx.textAlign = 'left';

    // --- boss ---
    if (boss && boss.alive) {
      const bw = 200, bh = 14, bxx = Math.round((W - bw) / 2), byy = 112; // pod panelami gracza i wyniku
      this.panel(ctx, bxx - 10, byy - 8, bw + 20, bh + 40);
      this.inset(ctx, bxx - 4, byy - 2, bw + 8, bh + 4);
      ctx.fillStyle = boss.tint; ctx.fillRect(bxx, byy, Math.round(bw * boss.health.fraction), bh);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bxx, byy, Math.round(bw * boss.health.fraction), 3);
      ctx.fillStyle = '#ffffff';
      for (const t of CONFIG.boss.phaseThresholds.slice(1)) ctx.fillRect(Math.round(bxx + bw * t), byy - 2, 2, bh + 4);
      ctx.textAlign = 'center';
      this.label(ctx, CONFIG.boss.name, W / 2, byy + bh + 8, '#ff9a90');
      ctx.textAlign = 'left';
    }

    // --- baner fazy ---
    if (this.phaseBannerTimer > 0 && Math.floor(time * 8) % 2 === 0) {
      ctx.textAlign = 'center';
      ctx.font = FONT(40);
      this.label(ctx, this.phaseBanner, W / 2, 180, '#ffdd59');
    }
    ctx.restore();
  }

  drawOverlay(ctx: CanvasRenderingContext2D, title: string, subtitle: string, color: string): void {
    const W = CONFIG.view.width * D, H = CONFIG.view.height * D;
    ctx.save();
    ctx.fillStyle = 'rgba(5,9,18,0.6)';
    ctx.fillRect(0, 0, W, H);
    this.panel(ctx, 80, H / 2 - 60, W - 160, 120);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONT(56);
    this.label(ctx, title, W / 2, H / 2 - 18, color);
    ctx.font = FONT(24);
    this.label(ctx, subtitle, W / 2, H / 2 + 28, '#ddd');
    ctx.restore();
  }

  drawHint(ctx: CanvasRenderingContext2D, alpha: number, gamepad = false): void {
    const W = CONFIG.view.width * D, H = CONFIG.view.height * D;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONT(24);
    this.label(ctx, gamepad
      ? 'D-PAD/GAŁKA: RUCH   A: SKOK   B/X/RT: OGIEŃ   DÓŁ+A: LEŻENIE'
      : 'STRZAŁKI: RUCH   Z: SKOK   X: OGIEŃ   DÓŁ: LEŻENIE   DÓŁ+Z: ZESKOK', W / 2, H - 26, '#ffffff');
    ctx.restore();
  }

  /** Ikona głośnika (prawy dolny róg) + podpowiedź, gdy przeglądarka czeka na gest użytkownika. */
  drawAudioState(ctx: CanvasRenderingContext2D, muted: boolean, unlocked: boolean): void {
    const W = CONFIG.view.width * D, H = CONFIG.view.height * D;
    const x = W - 30, y = H - 26, s = 2;
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = muted || !unlocked ? '#7d8794' : C.T;
    ctx.fillRect(x, y + 2 * s, 3 * s, 4 * s); ctx.fillRect(x + 3 * s, y + s, 2 * s, 6 * s); ctx.fillRect(x + 5 * s, y, s, 8 * s);
    if (muted || !unlocked) { ctx.fillStyle = '#ff3b3b'; for (const [dx, dy] of [[7, 1], [8, 2], [9, 3], [9, 1], [7, 3]]) ctx.fillRect(x + dx * s, y + dy * s, s, s); }
    else { ctx.fillRect(x + 7 * s, y + 2 * s, s, 4 * s); ctx.fillRect(x + 9 * s, y + s, s, 6 * s); }
    if (!unlocked) {
      ctx.font = FONT(24); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      this.label(ctx, 'DOWOLNY KLAWISZ: DŹWIĘK', x - 8, H - 4, '#ffffff');
    }
    ctx.restore();
  }

  static drawLoading(ctx: CanvasRenderingContext2D, done: number, total: number): void {
    const W = CONFIG.view.width * D, H = CONFIG.view.height * D;
    ctx.fillStyle = '#161a20';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3b4048'; ctx.fillRect(W / 2 - 120, H / 2, 240, 12);
    ctx.fillStyle = '#2fb9b0'; ctx.fillRect(W / 2 - 120, H / 2, Math.round(240 * (total ? done / total : 0)), 12);
    ctx.font = '16px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#c3c8d1';
    ctx.fillText('LADOWANIE...', W / 2, H / 2 - 10);
  }
}

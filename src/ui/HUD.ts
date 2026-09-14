import { CONFIG } from '../core/Config';
import { Images, PIXEL_FONT, Sheets } from '../assets/AssetLoader';
import type { PlayerController } from '../entities/player/PlayerController';
import type { TurbineBoss } from '../entities/boss/TurbineBoss';

const D = CONFIG.view.pixelScale;
const FONT = (px: number) => `${px}px ${PIXEL_FONT}, monospace`;
const K = '#161a20';

/** Kenney Pixel nie ma polskich znaków – transliteracja do ASCII, żeby nie mieszać krojów. */
const PL: Record<string, string> = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z', Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z', '–': '-' };
export const ascii = (t: string) => t.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ–]/g, (c) => PL[c] ?? c);

/**
 * HUD z gotowych PNG (ramki, segmenty baterii, ikona głośnika) + pixel font.
 * Dyskretny: panele ~30 px wysokości w narożnikach; rysowany w px canvasu (= jednostki świata przy pixelScale 1).
 */
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
    ctx.fillStyle = K; ctx.fillText(t, x + 1, y + 1);
    ctx.fillStyle = color; ctx.fillText(t, x, y);
  }

  draw(ctx: CanvasRenderingContext2D, player: PlayerController, score: number, boss: TurbineBoss | null, time: number): void {
    const W = CONFIG.view.width * D;
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = FONT(16);

    // --- panel gracza (lewy górny róg): portret + bateria + etykieta ---
    const panel = Images.tryGet('hudPlayer');
    const px = 2, py = 2;
    if (panel) ctx.drawImage(panel, px, py);
    const portrait = Images.tryGet('portrait');
    if (portrait) ctx.drawImage(portrait, px + 3, py + 3);
    const segs = Sheets.tryGet('hudSeg');
    const f = player.health.fraction;
    const lit = Math.ceil(f * 10);
    const clip = f > 0.5 ? 'green' : f > 0.25 ? 'yellow' : 'red';
    for (let i = 0; i < 10; i++) {
      const on = i < lit && !(f <= 0.25 && f > 0 && Math.floor(time * 6) % 2 === 0 && i === lit - 1);
      const sx = px + 30 + i * 6, sy = py + 2;
      if (segs) segs.drawAnchored(ctx, segs.frameAt(on ? clip : 'off', 0, 'off'), sx, sy, 0, 0);
      else { ctx.fillStyle = on ? '#3ddc84' : '#2f343b'; ctx.fillRect(sx, sy, 5, 8); }
    }
    this.label(ctx, 'SEBA', px + 28, py + 13, '#e6e9ed');
    this.label(ctx, `${Math.ceil(player.health.current)}`, px + 64, py + 13, '#3ddc84');

    // --- punkty (prawy górny róg) ---
    const sp = Images.tryGet('hudScore');
    const sw = sp?.width ?? 60, sx0 = W - 2 - sw;
    if (sp) ctx.drawImage(sp, sx0, 2);
    ctx.textAlign = 'right';
    this.label(ctx, 'SCORE', sx0 + sw - 4, 2, '#d9a72c');
    this.label(ctx, score.toString().padStart(6, '0'), sx0 + sw - 6, 14, '#ffffff');
    ctx.textAlign = 'left';

    // --- boss (pod panelami, wyśrodkowany) ---
    if (boss && boss.alive) {
      const bp = Images.tryGet('hudBoss');
      const bw = bp?.width ?? 128, bx = Math.round((W - bw) / 2), by = 2;
      if (bp) ctx.drawImage(bp, bx, by);
      // wypełnienie paska: piksele w kolorze fazy (w wgłębieniu 120x8 → pasek 118x6)
      ctx.fillStyle = boss.tint; ctx.fillRect(bx + 5, by + 5, Math.round(118 * boss.health.fraction), 6);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx + 5, by + 5, Math.round(118 * boss.health.fraction), 1);
      ctx.fillStyle = '#ffffff';
      for (const t of CONFIG.boss.phaseThresholds.slice(1)) ctx.fillRect(Math.round(bx + 5 + 118 * t), by + 4, 1, 8);
      ctx.textAlign = 'center';
      this.label(ctx, CONFIG.boss.name, W / 2, by + 22, '#ff9a90');
      ctx.textAlign = 'left';
    }

    // --- baner fazy ---
    if (this.phaseBannerTimer > 0 && Math.floor(time * 8) % 2 === 0) {
      ctx.textAlign = 'center';
      ctx.font = FONT(24);
      this.label(ctx, this.phaseBanner, W / 2, 60, '#ffdd59');
    }
    ctx.restore();
  }

  drawOverlay(ctx: CanvasRenderingContext2D, title: string, subtitle: string, color: string): void {
    const W = CONFIG.view.width * D, H = CONFIG.view.height * D;
    ctx.save();
    ctx.fillStyle = 'rgba(5,9,18,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONT(32);
    this.label(ctx, title, W / 2, H / 2 - 12, color);
    ctx.font = FONT(16);
    this.label(ctx, subtitle, W / 2, H / 2 + 14, '#ddd');
    ctx.restore();
  }

  drawHint(ctx: CanvasRenderingContext2D, alpha: number, gamepad = false): void {
    const W = CONFIG.view.width * D, H = CONFIG.view.height * D;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONT(16);
    this.label(ctx, gamepad
      ? 'D-PAD/GAŁKA: RUCH   A: SKOK   B/X/RT: OGIEŃ   DÓŁ: LEŻENIE'
      : 'STRZAŁKI: RUCH   Z: SKOK   X: OGIEŃ   DÓŁ: LEŻENIE   DÓŁ+Z: ZESKOK', W / 2, H - 12, '#ffffff');
    ctx.restore();
  }

  /** Ikona głośnika (prawy dolny róg) + podpowiedź, gdy przeglądarka czeka na gest użytkownika. */
  drawAudioState(ctx: CanvasRenderingContext2D, muted: boolean, unlocked: boolean): void {
    const W = CONFIG.view.width * D, H = CONFIG.view.height * D;
    const spk = Sheets.tryGet('hudSpeaker');
    const x = W - 16, y = H - 12;
    ctx.save();
    ctx.globalAlpha = 0.85;
    if (spk) spk.drawAnchored(ctx, spk.frameAt(muted || !unlocked ? 'muted' : 'on', 0, 'on'), x, y, 0, 0);
    if (!unlocked) {
      ctx.font = FONT(16); ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      this.label(ctx, 'DOWOLNY KLAWISZ: DŹWIĘK', x - 4, H - 2, '#ffffff');
    }
    ctx.restore();
  }

  static drawLoading(ctx: CanvasRenderingContext2D, done: number, total: number): void {
    const W = CONFIG.view.width * D, H = CONFIG.view.height * D;
    ctx.fillStyle = '#161a20';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#3b4048'; ctx.fillRect(W / 2 - 60, H / 2, 120, 6);
    ctx.fillStyle = '#2fb9b0'; ctx.fillRect(W / 2 - 60, H / 2, Math.round(120 * (total ? done / total : 0)), 6);
    ctx.font = '8px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#c3c8d1';
    ctx.fillText('LADOWANIE...', W / 2, H / 2 - 6);
  }
}

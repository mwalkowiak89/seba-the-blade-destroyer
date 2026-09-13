import { CONFIG } from '../core/Config';
import type { PlayerController } from '../entities/player/PlayerController';
import type { TurbineBoss } from '../entities/boss/TurbineBoss';

/** HUD: pasek HP gracza, licznik punktów, pasek HP bossa, komunikaty stanu gry. */
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

  draw(ctx: CanvasRenderingContext2D, player: PlayerController, score: number, boss: TurbineBoss | null, time: number): void {
    const W = CONFIG.view.width;
    ctx.save();
    ctx.font = '8px monospace';
    ctx.textBaseline = 'top';

    // HP gracza
    const hpW = 80, hpH = 6, hx = 8, hy = 8;
    ctx.fillStyle = '#000';
    ctx.fillRect(hx - 1, hy - 1, hpW + 2, hpH + 2);
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(hx, hy, hpW, hpH);
    const f = player.health.fraction;
    ctx.fillStyle = f > 0.5 ? '#2ecc71' : f > 0.25 ? '#f1c40f' : '#e74c3c';
    ctx.fillRect(hx, hy, Math.round(hpW * f), hpH);
    ctx.fillStyle = '#fff';
    ctx.fillText(`SEBA ${Math.ceil(player.health.current)}`, hx, hy + hpH + 2);

    // Punkty
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE ${score.toString().padStart(6, '0')}`, W - 8, 8);
    ctx.textAlign = 'left';

    // Boss
    if (boss && boss.alive) {
      const bw = 160, bh = 5, bx = (W - bw) / 2, by = 8;
      ctx.fillStyle = '#000';
      ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = boss.tint;
      ctx.fillRect(bx, by, Math.round(bw * boss.health.fraction), bh);
      // znaczniki progów faz
      ctx.fillStyle = '#fff';
      for (const t of CONFIG.boss.phaseThresholds.slice(1)) ctx.fillRect(Math.round(bx + bw * t), by - 1, 1, bh + 2);
      ctx.textAlign = 'center';
      ctx.fillText(CONFIG.boss.name, W / 2, by + bh + 2);
      ctx.textAlign = 'left';
    }

    // Baner fazy
    if (this.phaseBannerTimer > 0 && Math.floor(time * 8) % 2 === 0) {
      ctx.textAlign = 'center';
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ffdd59';
      ctx.fillText(this.phaseBanner, W / 2, 40);
    }
    ctx.restore();
  }

  drawOverlay(ctx: CanvasRenderingContext2D, title: string, subtitle: string, color: string): void {
    const W = CONFIG.view.width, H = CONFIG.view.height;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px monospace';
    ctx.fillStyle = color;
    ctx.fillText(title, W / 2, H / 2 - 10);
    ctx.font = '8px monospace';
    ctx.fillStyle = '#ddd';
    ctx.fillText(subtitle, W / 2, H / 2 + 10);
    ctx.restore();
  }

  drawHint(ctx: CanvasRenderingContext2D, alpha: number, gamepad = false): void {
    const W = CONFIG.view.width, H = CONFIG.view.height;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '8px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(
      gamepad
        ? 'D-PAD/GAŁKA: ruch/celowanie   A: skok   B/X/RT: ogień   DÓŁ+A: zeskok'
        : 'STRZAŁKI: ruch/celowanie   Z: skok   X: ogień   DÓŁ+Z: zeskok',
      W / 2, H - 18,
    );
    ctx.restore();
  }
}

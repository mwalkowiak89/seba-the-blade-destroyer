import { Game } from './core/Game';

/**
 * Punkt wejścia. Tutaj docelowo: preload sprite sheetów / SFX przed startem, np.
 *   await Assets.loadImage('seba', 'assets/sprites/seba.png');
 *   Sfx.register('shoot', 'assets/sfx/makita.wav');
 */
function boot(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement | null;
  if (!canvas) throw new Error('Brak elementu <canvas id="game">');
  const game = new Game(canvas);
  game.start();
  // dostęp z konsoli do debugowania
  (window as unknown as { game: Game }).game = game;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

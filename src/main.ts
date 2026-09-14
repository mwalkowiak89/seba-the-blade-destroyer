import { Game } from './core/Game';
import { AudioEngine } from './audio/AudioEngine';
import { Jukebox } from './audio/Jukebox';
import { Sfx } from './render/Audio';

/**
 * Punkt wejścia. Tutaj docelowo: preload sprite sheetów / SFX przed startem, np.
 *   await Assets.loadImage('seba', 'assets/sprites/seba.png');
 *   Sfx.register('shoot', 'assets/sfx/makita.wav');
 */
function boot(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement | null;
  if (!canvas) throw new Error('Brak elementu <canvas id="game">');
  const game = new Game(canvas);
  void game.start();
  // dostęp z konsoli do debugowania
  (window as unknown as { game: Game; audio: unknown }).game = game;
  (window as unknown as { audio: unknown }).audio = { engine: AudioEngine, jukebox: Jukebox, sfx: Sfx };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

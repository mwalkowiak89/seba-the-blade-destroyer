import { loadAllAssets } from '../src/assets/AssetLoader';
import { Input } from '../src/core/Input';
import { GameScene } from '../src/scenes/GameScene';
import { PRONE } from '../src/entities/player/PlayerStates';
import { Runner } from '../src/entities/enemies/Runner';
import { Sniper } from '../src/entities/enemies/Sniper';
import { Drone } from '../src/entities/enemies/Drone';
import { TurbineBoss } from '../src/entities/boss/TurbineBoss';

const shots = {
  start: { camera: 0, player: 72, feet: 208, prone: false },
  blade: { camera: 416, player: 640, feet: 96, prone: false },
  tunnel: { camera: 1152, player: 1264, feet: 208, prone: true },
  arena: { camera: 2688, player: 2752, feet: 208, prone: false },
  combat: { camera: 0, player: 72, feet: 208, prone: false },
  boss1: { camera: 2688, player: 2752, feet: 208, prone: false },
  boss2: { camera: 2688, player: 2752, feet: 208, prone: false },
  boss3: { camera: 2688, player: 2752, feet: 208, prone: false },
  bossSweep: { camera: 2688, player: 2752, feet: 208, prone: false },
};
async function start(): Promise<void> {
  await loadAllAssets();
  const input = new Input(window);
  const canvas = document.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-scene]'));
  function show(key: keyof typeof shots): void {
    const shot = shots[key], scene = new GameScene(input);
    scene.camera.x = shot.camera;
    scene.player.x = shot.player;
    scene.player.y = shot.feet - scene.player.h;
    scene.player.onGround = true;
    if (shot.prone) scene.player.setState(PRONE, scene);
    if (key === 'combat') {
      const runner = new Runner(150, 168); runner.age = .2;
      scene.spawnEnemy(runner);
      scene.spawnEnemy(new Drone(226, 86));
      // Marker snajpera znajduje się kafel nad podłożem (208 - 16).
      scene.spawnEnemy(new Sniper(310, 192));
      scene.fx.spawn('shotHit', 180, 178);
    }
    if (key.startsWith('boss')) {
      const boss = new TurbineBoss(shot.camera, 208);
      const phase = key === 'boss3' ? 2 : key === 'boss1' ? 0 : 1;
      boss.fsm.forcePhase(phase, boss, scene);
      boss.x = shot.camera + 265; boss.y = 48; boss.facing = -1;
      boss.hitFlash = 0;
      if (key === 'bossSweep') boss.setHorizontal(18);
      scene.spawnEnemy(boss);
    }
    scene.draw(ctx);
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.scene === key));
    document.querySelector('#status')!.textContent = `Kamera: ${shot.camera} px · natywna rozdzielczość 384 × 216`;
  }
  for (const button of buttons) button.addEventListener('click', () => show(button.dataset.scene as keyof typeof shots));
  show('start');
}
start().catch((error) => { document.querySelector('#status')!.textContent = `Błąd zasobów: ${error.message}`; });

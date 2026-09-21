import { loadAllAssets } from '../src/assets/AssetLoader';
import { Input } from '../src/core/Input';
import { GameScene } from '../src/scenes/GameScene';
import { PRONE } from '../src/entities/player/PlayerStates';

const shots = {
  start: { camera: 0, player: 72, feet: 208, prone: false },
  blade: { camera: 416, player: 640, feet: 96, prone: false },
  tunnel: { camera: 1152, player: 1264, feet: 208, prone: true },
  arena: { camera: 2688, player: 2752, feet: 208, prone: false },
};
async function start(): Promise<void> {
  await loadAllAssets();
  const input = new Input(window);
  const canvas = document.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-scene]');
  function show(key: keyof typeof shots): void {
    const shot = shots[key], scene = new GameScene(input);
    scene.camera.x = shot.camera;
    scene.player.x = shot.player;
    scene.player.y = shot.feet - scene.player.h;
    scene.player.onGround = true;
    if (shot.prone) scene.player.setState(PRONE, scene);
    scene.draw(ctx);
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.scene === key));
    document.querySelector('#status')!.textContent = `Kamera: ${shot.camera} px · natywna rozdzielczość 384 × 216`;
  }
  for (const button of buttons) button.addEventListener('click', () => show(button.dataset.scene as keyof typeof shots));
  show('start');
}
start().catch((error) => { document.querySelector('#status')!.textContent = `Błąd zasobów: ${error.message}`; });

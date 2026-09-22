import { loadAllAssets } from '../src/assets/AssetLoader';
import { Input } from '../src/core/Input';
import { GameScene } from '../src/scenes/GameScene';
import { PRONE } from '../src/entities/player/PlayerStates';
import { Runner } from '../src/entities/enemies/Runner';
import { Sniper } from '../src/entities/enemies/Sniper';
import { Drone } from '../src/entities/enemies/Drone';
import { TurbineBoss } from '../src/entities/boss/TurbineBoss';
import { weaponPreview } from './weapon-visual';
import { NacelleThrow } from '../src/entities/boss/BossPhases';
import { CONFIG } from '../src/core/Config';

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
  bossThrow: { camera: 2688, player: 2752, feet: 208, prone: false },
  bossFlight: { camera: 2688, player: 2752, feet: 208, prone: false },
  bossPlay: { camera: 2688, player: 2752, feet: 208, prone: false },
};
async function start(): Promise<void> {
  await loadAllAssets();
  const input = new Input(window);
  const canvas = document.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-scene]'));
  const showWeapon = weaponPreview();
  let animation = 0;
  function show(key: keyof typeof shots | 'weapon'): void {
    cancelAnimationFrame(animation);
    if (key === 'weapon') {
      showWeapon(ctx);
      for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.scene === key));
      document.querySelector('#status')!.textContent = 'Broń w dłoni: spoczynek, odrzut, celowanie i leżenie';
      return;
    }
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
    if (key.startsWith('boss') && key !== 'bossPlay') {
      const boss = new TurbineBoss(shot.camera, 208);
      const phase = key === 'boss3' ? 2 : key === 'boss2' || key === 'bossSweep' ? 1 : 0;
      boss.fsm.forcePhase(phase, boss, scene);
      boss.x = shot.camera + 265; boss.y = 48; boss.facing = -1;
      boss.hitFlash = 0;
      if (key === 'bossSweep') boss.setHorizontal(18);
      if (key === 'bossThrow' || key === 'bossFlight') {
        const attack = new NacelleThrow(); attack.start(boss, scene);
        if (key === 'bossFlight') {
          attack.update(boss, CONFIG.boss.nacelle.telegraph, scene);
          for (let i = 0; i < 20; i++) scene.enemyBullets.update(1 / 60, scene);
        }
      }
      scene.spawnEnemy(boss);
    }
    scene.draw(ctx);
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.scene === key));
    document.querySelector('#status')!.textContent = `Kamera: ${shot.camera} px · natywna rozdzielczość 384 × 216`;
    if (key === 'bossPlay') {
      document.querySelector('#status')!.textContent = 'Walka z bossem · strzałki/WASD: ruch · Z/K/Spacja: skok · X/J: ogień · R: restart po przegranej';
      canvas.focus();
      let last = performance.now(), accumulator = 0;
      const frame = (now: number): void => {
        accumulator += Math.min((now - last) / 1000, CONFIG.view.fixedStep * CONFIG.view.maxStepsPerFrame);
        last = now;
        while (accumulator >= CONFIG.view.fixedStep) {
          input.update(); scene.update(CONFIG.view.fixedStep);
          if (scene.wantsRestart) { show('bossPlay'); return; }
          accumulator -= CONFIG.view.fixedStep;
        }
        scene.draw(ctx);
        animation = requestAnimationFrame(frame);
      };
      animation = requestAnimationFrame(frame);
    }
  }
  for (const button of buttons) button.addEventListener('click', () => show(button.dataset.scene as keyof typeof shots | 'weapon'));
  show('start');
}
start().catch((error) => { document.querySelector('#status')!.textContent = `Błąd zasobów: ${error.message}`; });

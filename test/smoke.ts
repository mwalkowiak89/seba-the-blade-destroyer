/**
 * Headless smoke test: mockuje minimalny DOM/canvas i przebiega poziom "botem"
 * (bieg w prawo, ogień, skok co chwilę), sprawdzając kluczowe niezmienniki.
 * Uruchomienie: npm test
 */
import { GameScene } from '../src/scenes/GameScene';
import { Input, KEY_BINDINGS, type Action } from '../src/core/Input';
import { CONFIG } from '../src/core/Config';
import { Tile } from '../src/world/Level';

// ---- mock DOM ----------------------------------------------------------
const listeners: Record<string, ((e: unknown) => void)[]> = {};
(globalThis as any).window = {
  addEventListener: (t: string, fn: (e: unknown) => void) => { (listeners[t] ??= []).push(fn); },
  innerWidth: 1280, innerHeight: 720,
};
(globalThis as any).Image = class { onload?: () => void; src = ''; width = 0; height = 0; };
(globalThis as any).Audio = class { cloneNode() { return this; } play() { return Promise.resolve(); } };

const ctx = new Proxy({}, { get: (_t, prop) => (prop === 'measureText' ? () => ({ width: 0 }) : () => undefined), set: () => true }) as unknown as CanvasRenderingContext2D;

function press(code: string) { listeners.keydown.forEach((fn) => fn({ code, preventDefault() {} })); }
function release(code: string) { listeners.keyup.forEach((fn) => fn({ code })); }
function setAction(a: Action, down: boolean) { const c = KEY_BINDINGS[a][0]; down ? press(c) : release(c); }

// ---- test --------------------------------------------------------------
let failures = 0;
function check(cond: boolean, msg: string) { if (!cond) { failures++; console.error('FAIL:', msg); } else console.log('ok  :', msg); }

const input = new Input(window as any);
const scene = new GameScene(input);
const step = CONFIG.view.fixedStep;
function tick(n = 1) { for (let i = 0; i < n; i++) { input.update(); scene.update(step); scene.draw(ctx); } }

const startX = scene.player.x;
tick(10);
check(scene.player.onGround, 'gracz stoi na ziemi po starcie');

// strzał w miejscu
setAction('fire', true); tick(15); setAction('fire', false);
let bullets = 0; scene.playerBullets.forEachActive(() => bullets++);
check(bullets >= 2, `ogień automatyczny spawnuje pociski (${bullets})`);

// strzał w górę stojąc
setAction('up', true); tick(2);
check(scene.player.aim.x === 0 && scene.player.aim.y === -1, 'celowanie pionowo w górę w miejscu');
setAction('up', false);

// kucanie
setAction('down', true); tick(2);
check(scene.player.state.name === 'prone' && scene.player.h === CONFIG.player.proneHeight, 'leżenie obniża hurtbox do 50%');
setAction('down', false); tick(2);

// skok – stała trajektoria
setAction('jump', true); tick(1); setAction('jump', false);
check(scene.player.state.name === 'jump', 'skok wchodzi w stan jump');
let peak = scene.player.y;
for (let i = 0; i < 60; i++) { tick(); peak = Math.min(peak, scene.player.y); if (scene.player.onGround && scene.player.vy >= 0 && i > 5) break; }
const jumpH = startX >= 0 ? (scene.player.y - peak) : 0;
check(jumpH > 55 && jumpH < 90, `wysokość skoku ${jumpH.toFixed(1)} px (oczekiwane 55–90)`);

// ściana kamery: próba cofnięcia się
setAction('left', true); tick(60); setAction('left', false);
check(scene.player.x >= scene.camera.x - 0.01, 'lewa krawędź kamery blokuje gracza');

// bot: biegnij w prawo, strzelaj, skacz cyklicznie – aż do bossa lub game over
setAction('right', true); setAction('fire', true);
let frames = 0; let maxEnemies = 0; let sawRunner = false, sawSniper = false, sawDrone = false; let bossSpawned = false;
scene.events.on('boss:spawned', () => { bossSpawned = true; });
const phases: number[] = [];
scene.events.on('boss:phase', ({ to }) => phases.push(to));
scene.events.on('enemy:died', ({ enemy }) => { if (enemy.kind === 'runner') sawRunner = true; if (enemy.kind === 'sniper') sawSniper = true; if (enemy.kind === 'drone') sawDrone = true; });
let jumpHold = 0;
function botWantsJump(): boolean {
  const p = scene.player, lvl = scene.level, ts = lvl.tileSize;
  if (!p.onGround) return false;
  const footRow = Math.floor((p.bottom + 1) / ts);
  const aheadX = p.x + p.w + 22;
  // szczelina przed nami (brak podłoża w kolumnie z przodu i pod nią)
  let gap = true;
  for (let r = footRow; r < lvl.rows; r++) if (lvl.tileAt(Math.floor(aheadX / ts), r) !== Tile.Empty) { gap = false; break; }
  // ściana przed nami na wysokości stóp
  const wall = lvl.tileAt(Math.floor((p.x + p.w + 6) / ts), footRow - 1) === Tile.Solid;
  return gap || wall || frames % 75 === 0;
}
while (frames < 60 * 150 && scene.state === 'playing' && !bossSpawned) {
  if (jumpHold > 0) { jumpHold--; if (jumpHold === 0) setAction('jump', false); }
  else if (botWantsJump()) { setAction('jump', true); jumpHold = 2; }
  // w powietrzu celuj po skosie w górę, żeby trafiać snajperów/drony
  if (frames % 90 < 45) setAction('up', true); else setAction('up', false);
  tick(); frames++;
  maxEnemies = Math.max(maxEnemies, (scene as any).enemies.length);
  if (frames % 240 === 0) scene.player.health.heal(100); // bot nie gra dobrze – testujemy przebieg poziomu, nie balans
  if (Number.isNaN(scene.player.x)) { check(false, 'NaN w pozycji gracza'); break; }
}
setAction('up', false);
console.log(`bot: ${frames} klatek, x=${scene.player.x.toFixed(0)}, hp=${scene.player.health.current}, score=${scene.score}, stan=${scene.state}`);
check(scene.player.x > startX + 1500, 'gracz pokonał znaczną część poziomu');
check(maxEnemies > 0, `wrogowie się spawnują (max jednocześnie ${maxEnemies})`);
console.log(`zabici: runner=${sawRunner} sniper=${sawSniper} drone=${sawDrone}`);
check(bossSpawned || scene.state !== 'playing', 'dotarcie do bossa lub zgon (brak zawieszenia)');

if (bossSpawned) {
  check(scene.camera.locked && Math.abs(scene.camera.x - (scene as any).arenaX) < 0.01, 'kamera zablokowana na arenie');
  // walka z bossem: stój, celuj w górę/skos, skacz na zamach
  setAction('right', false);
  let f2 = 0;
  const boss = () => (scene as any).boss;
  while (f2 < 60 * 180 && scene.state === 'playing') {
    const b = boss();
    if (b) {
      const dx = b.cx - scene.player.cx;
      setAction('right', dx > 40); setAction('left', dx < -40 && scene.player.x > scene.camera.x + 20);
      setAction('up', b.cy < scene.player.cy - 20);
    }
    if (f2 % 30 === 0) setAction('jump', true); else if (f2 % 30 === 2) setAction('jump', false);
    tick(); f2++;
    if (f2 % 90 === 0) scene.player.health.heal(100); // bot nieśmiertelny na potrzeby testu faz
  }
  console.log(`boss: ${f2} klatek, fazy=${phases.join(',')}, stan=${scene.state}, score=${scene.score}`);
  check(phases.includes(1) && phases.includes(2), 'boss przeszedł przez fazy 2 i 3');
  check(scene.state === 'victory', 'boss pokonany → victory');
}

console.log(failures === 0 ? '\nSMOKE TEST OK' : `\nSMOKE TEST: ${failures} błędów`);
process.exit(failures === 0 ? 0 : 1);

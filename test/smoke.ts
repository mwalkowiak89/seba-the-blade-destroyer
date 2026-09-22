/**
 * Headless smoke test: mockuje minimalny DOM/canvas i przebiega poziom "botem"
 * (bieg w prawo, ogień, skok co chwilę), sprawdzając kluczowe niezmienniki.
 * Uruchomienie: npm test
 */
import { GameScene } from '../src/scenes/GameScene';
import { Input, KEY_BINDINGS, type Action } from '../src/core/Input';
import { CONFIG } from '../src/core/Config';
import { Tile } from '../src/world/Level';
import { PRONE, FALL } from '../src/entities/player/PlayerStates';
import { Sheets } from '../src/assets/AssetLoader';
import { SpriteSheet } from '../src/assets/SpriteSheet';
import { MANIFEST } from '../src/assets/manifest.generated';
import { TurbineBoss } from '../src/entities/boss/TurbineBoss';
import { NacelleThrow } from '../src/entities/boss/BossPhases';
import { bulletHitsRect, type Bullet } from '../src/entities/weapons/Bullet';

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
let bestX = 0, stuckFrames = 0;
while (frames < 60 * 150 && scene.state === 'playing' && !bossSpawned) {
  if (jumpHold > 0) { jumpHold--; if (jumpHold === 0) setAction('jump', false); }
  else if (botWantsJump()) { setAction('jump', true); jumpHold = 2; }
  // bot nie umie korzystać z platform – po 6 s bez postępu przeskakuje trudny odcinek (smoke test, nie AI)
  if (scene.player.x > bestX + 4) { bestX = scene.player.x; stuckFrames = 0; } else if (++stuckFrames > 360) { scene.player.x += 200; scene.player.y = 100; scene.camera.x = Math.max(scene.camera.x, scene.player.x - 100); stuckFrames = 0; }
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
  while (f2 < 60 * 240 && scene.state === 'playing') {
    const b = boss();
    if (b && f2 % 20 === 0 && b.vulnerable && !b.isDying) b.takeHit(25, scene); // bot nie celuje w winglet – symulujemy trafienia
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

// Regresje tunelu z ekranu 3: testujemy kontroler bez przeciwników i teleportów bota.
function tunnelScene(): GameScene {
  for (const action of Object.keys(KEY_BINDINGS) as Action[]) setAction(action, false);
  input.update();
  const world = new GameScene(input);
  world.camera.x = 3 * CONFIG.view.width;
  world.player.x = 79 * world.level.tileSize;
  world.player.y = 13 * world.level.tileSize - CONFIG.player.standHeight;
  world.player.onGround = true;
  world.player.setState(PRONE, world);
  return world;
}
function playerTick(world: GameScene, n = 1): void {
  for (let i = 0; i < n; i++) { input.update(); world.player.update(step, world); }
}
function overlapsSolid(world: GameScene): boolean {
  const p = world.player, ts = world.level.tileSize;
  for (let r = Math.floor(p.y / ts); r <= Math.floor((p.bottom - 0.001) / ts); r++) {
    for (let c = Math.floor(p.x / ts); c <= Math.floor((p.x + p.w - 0.001) / ts); c++) {
      if (world.level.tileAt(c, r) === Tile.Solid) return true;
    }
  }
  return false;
}
const tunnel = tunnelScene();
playerTick(tunnel, 2);
check(tunnel.player.h === CONFIG.player.proneHeight && !overlapsSolid(tunnel), 'puszczenie dół w tunelu nie wciska gracza w sufit');
setAction('jump', true); playerTick(tunnel); setAction('jump', false);
check(tunnel.player.state.name === 'prone' && !overlapsSolid(tunnel), 'skok w tunelu jest blokowany bez miejsca do wstania');
setAction('right', true); playerTick(tunnel, 300); setAction('right', false);
check(tunnel.player.x >= 88 * tunnel.level.tileSize && tunnel.player.h === CONFIG.player.standHeight && !overlapsSolid(tunnel), 'gracz wyczołguje się z tunelu i wstaje po wyjściu');

const hurtInTunnel = tunnelScene();
hurtInTunnel.player.takeDamage(10, hurtInTunnel.player.cx - 20, hurtInTunnel);
check(hurtInTunnel.player.h === CONFIG.player.proneHeight && !overlapsSolid(hurtInTunnel), 'trafienie w tunelu zachowuje niski hitbox');
playerTick(hurtInTunnel, 30);
check(hurtInTunnel.player.state.name === 'prone' && !overlapsSolid(hurtInTunnel), 'po odrzucie gracz wraca do czołgania pod sufitem');

const platform = tunnelScene();
platform.player.x = 32 * platform.level.tileSize;
platform.player.y = 6 * platform.level.tileSize - platform.player.h;
platform.camera.x = CONFIG.view.width;
setAction('down', true); setAction('jump', true); playerTick(platform, 3);
check(platform.player.bottom > 6 * platform.level.tileSize, 'dół + skok nadal pozwala zeskoczyć przez łopatę');

// Podwójny skok: rzeczywiste krawędzie wejścia, bez bezpośredniej zmiany prędkości.
for (const action of Object.keys(KEY_BINDINGS) as Action[]) setAction(action, false);
input.update();
const jumping = new GameScene(input);
playerTick(jumping, 15);
const floorY = jumping.player.y;
setAction('jump', true); playerTick(jumping, 12);
const heldVelocity = jumping.player.vy;
check(heldVelocity > CONFIG.player.jumpVelocity + 150, 'przytrzymanie skoku nie wywołuje drugiego odbicia');
setAction('jump', false); playerTick(jumping, 10);
setAction('jump', true); playerTick(jumping);
check(jumping.player.vy < -400, 'drugie naciśnięcie daje odbicie w powietrzu');
setAction('jump', false); playerTick(jumping, 4);
const beforeThird = jumping.player.vy;
setAction('jump', true); playerTick(jumping);
check(jumping.player.vy > beforeThird, 'trzecie naciśnięcie nie daje kolejnego odbicia');
setAction('jump', false);
let doublePeak = jumping.player.y;
for (let i = 0; i < 100; i++) { playerTick(jumping); doublePeak = Math.min(doublePeak, jumping.player.y); if (jumping.player.onGround) break; }
check(floorY - doublePeak > 130 && jumping.player.onGround, 'podwójny skok daje większy zasięg i kończy się lądowaniem');
playerTick(jumping, 2);
setAction('jump', true); playerTick(jumping, 8);
setAction('jump', false); playerTick(jumping, 8);
setAction('jump', true); playerTick(jumping);
check(jumping.player.vy < -400, 'lądowanie odnawia dodatkowy skok');
// Zejście z krawędzi również zostawia jedno ratunkowe odbicie.
for (const action of Object.keys(KEY_BINDINGS) as Action[]) setAction(action, false);
input.update();
const ledge = new GameScene(input);
ledge.player.y = 80;
playerTick(ledge, 2);
setAction('jump', true); playerTick(ledge);
check(ledge.player.vy < -400, 'po spadnięciu z krawędzi można wykonać skok w powietrzu');
setAction('jump', false); playerTick(ledge, 4);
const ledgeVelocity = ledge.player.vy;
setAction('jump', true); playerTick(ledge);
check(ledge.player.vy > ledgeVelocity, 'po zejściu z krawędzi dostępne jest tylko jedno odbicie');

// Rejestrujemy rzeczywisty punkt rysowania broni i porównujemy z pozycją błysku.
const weaponDef = MANIFEST.sheets.makita;
let drawnTip = { x: NaN, y: NaN };
class WeaponProbe extends SpriteSheet {
  override drawAnchored(_ctx: CanvasRenderingContext2D, frame: number, x: number, y: number, ax: number, ay: number, opts: { flipX?: boolean; flipY?: boolean } = {}): void {
    const orientation = frame < 2 ? 'horizontal' : frame < 4 ? 'diagonal' : 'vertical';
    const tip = weaponDef.muzzle[orientation];
    drawnTip = { x: x + (tip.x - ax) * (opts.flipX ? -1 : 1), y: y + (tip.y - ay) * (opts.flipY ? -1 : 1) };
  }
}
Sheets.set('makita', new WeaponProbe({} as HTMLImageElement, weaponDef));
const weaponCases: { name: string; actions: Action[]; air?: boolean }[] = [
  { name: 'prawo', actions: [] },
  { name: 'lewo', actions: ['left'] },
  { name: 'pierwszy strzał w górę', actions: ['up'] },
  { name: 'skos w górę', actions: ['right', 'up'] },
  { name: 'skos w dół i w lewo', actions: ['left', 'down'], air: true },
  { name: 'pionowo w dół', actions: ['down'], air: true },
  { name: 'leżąc', actions: ['down'] },
];
for (const example of weaponCases) {
  for (const action of Object.keys(KEY_BINDINGS) as Action[]) setAction(action, false);
  input.update();
  const world = new GameScene(input);
  playerTick(world, 10);
  if (example.air) { world.player.y = 80; world.player.setState(FALL, world); }
  for (const action of [...example.actions, 'fire'] as Action[]) setAction(action, true);
  playerTick(world);
  world.player.draw(ctx);
  const p = world.player;
  check(Math.hypot(drawnTip.x - p.muzzle.x, drawnTip.y - p.muzzle.y) < .01, `wylot pokrywa się z bitem podczas odrzutu: ${example.name}`);
  let shotAtTip = false;
  world.playerBullets.forEachActive((b) => {
    shotAtTip ||= Math.hypot(b.x - (drawnTip.x + p.aim.x * 2), b.y - (drawnTip.y + p.aim.y * 2)) < .01;
  });
  check(shotAtTip, `pierwszy pocisk wychodzi z bitu przed odrzutem: ${example.name}`);
  setAction('fire', false); playerTick(world);
  world.player.draw(ctx);
  check(Math.hypot(drawnTip.x - p.muzzle.x, drawnTip.y - p.muzzle.y) < .01, `błysk pozostaje przy bicie po strzale: ${example.name}`);
}

// Zwężona łopata nie może zachowywać dawnego prostokątnego hitboxa.
const shapedBoss = new TurbineBoss(0, 208);
shapedBoss.x = 180; shapedBoss.y = 40;
for (const horizontal of [false, true]) for (const facing of [1, -1] as const) for (const tilt of [0, .25]) {
  shapedBoss.setVertical();
  if (horizontal) shapedBoss.setHorizontal(18);
  shapedBoss.facing = facing; shapedBoss.tilt = tilt;
  const tip = shapedBoss.bladePoint(18, 110), empty = shapedBoss.bladePoint(1, 110), body = shapedBoss.bladePoint(16, 60);
  check(shapedBoss.hitZone(tip.x, tip.y, .2) === 'weak', `końcówka łopaty pozostaje trafialna: ${horizontal}/${facing}/${tilt}`);
  check(shapedBoss.hitZone(empty.x, empty.y, .2) === 'none' && !shapedBoss.overlaps({ x: empty.x, y: empty.y, w: .2, h: .2 }), 'pusta przestrzeń przy zwężeniu nie trafia ani nie rani');
  check(shapedBoss.hitZone(body.x, body.y, .2) === 'armor', 'szeroka część łopaty pozostaje pancerzem');
}
shapedBoss.coreExposed = true; shapedBoss.shakeOffset = 2;
check(shapedBoss.hitZone(shapedBoss.cx + 2, shapedBoss.cy, 1) === 'core', 'rdzeń trafialny po obrocie i przesunięciu grafiki');

for (const action of Object.keys(KEY_BINDINGS) as Action[]) setAction(action, false);
input.update();
const throwingWorld = new GameScene(input), throwBoss = new TurbineBoss(0, 208);
throwBoss.x = 280; throwBoss.y = 48;
const throwing = new NacelleThrow(), throwCfg = CONFIG.boss.nacelle;
throwing.start(throwBoss, throwingWorld);
const target = { ...throwBoss.nacelleTarget! };
throwingWorld.player.x += 80;
throwing.update(throwBoss, throwCfg.telegraph - .01, throwingWorld);
let nacelles: Bullet[] = [];
throwingWorld.enemyBullets.forEachActive((b) => nacelles.push(b));
check(nacelles.length === 0 && throwBoss.holdingNacelle, 'nacella nie rani podczas zapowiedzi rzutu');
check(throwBoss.nacelleTarget?.x === target.x, 'cel rzutu nie śledzi gracza po zapowiedzi');
throwing.update(throwBoss, .02, throwingWorld);
throwingWorld.enemyBullets.forEachActive((b) => nacelles.push(b));
check(nacelles.length === 1 && nacelles[0].kind === 'nacelle' && !throwBoss.holdingNacelle, 'jeden rzut wypuszcza dokładnie jedną gondolę');
const nacelle = nacelles[0];
check(nacelle.hitsTerrain && nacelle.damage === throwCfg.damage, 'gondola ma kolizję z terenem i skonfigurowane obrażenia');
check(bulletHitsRect(nacelle, { x: nacelle.x + 20, y: nacelle.y, w: 2, h: 2 }) && !bulletHitsRect(nacelle, { x: nacelle.x, y: nacelle.y + 16, w: 2, h: 2 }), 'gondola używa płaskiego prostokąta, nie nadmiernie dużego promienia');
// Izolujemy balistykę od platform, aby sprawdzić ustalony punkt lądowania.
nacelle.hitsTerrain = false;
throwingWorld.enemyBullets.update(throwCfg.flightTime, throwingWorld);
check(Math.hypot(nacelle.x - target.x, nacelle.y - target.y) < .01, 'łuk rzutu kończy się w zapowiedzianym punkcie');
check(throwing.update(throwBoss, throwCfg.flightTime + throwCfg.recovery + .01, throwingWorld) && !throwBoss.movementLocked && !throwBoss.nacelleTarget, 'po rzucie znika znacznik i boss odzyskuje ruch');
throwingWorld.enemyBullets.clear();
throwing.start(throwBoss, throwingWorld); throwBoss.cancelAttack();
throwing.update(throwBoss, 2, throwingWorld);
nacelles = []; throwingWorld.enemyBullets.forEachActive((b) => nacelles.push(b));
check(nacelles.length === 0 && !throwBoss.holdingNacelle && !throwBoss.nacelleTarget, 'przerwanie fazy anuluje przygotowany rzut');
const impact = throwingWorld.enemyBullets.spawn({ owner: 'enemy', kind: 'nacelle', x: 80, y: 183, vx: 0, vy: 120, damage: 24, hitsTerrain: true })!;
throwingWorld.enemyBullets.update(.12, throwingWorld);
check(!impact.active, 'cała bryła gondoli rozbija się o podłoże, zanim środek wniknie w ziemię');

// Izolowana platforma jednokierunkowa: zatrzymuje opadanie, przepuszcza lot od dołu.
const platformWorld = Object.create(throwingWorld) as GameScene;
Object.defineProperty(platformWorld, 'level', { value: { tileSize: 16, tileAt: (col: number, row: number) => row === 6 && col === 4 ? Tile.OneWay : Tile.Empty } });
const fallingNacelle = throwingWorld.enemyBullets.spawn({ owner: 'enemy', kind: 'nacelle', x: 72, y: 80, vx: 0, vy: 200, damage: 24, hitsTerrain: true })!;
throwingWorld.enemyBullets.update(.06, platformWorld);
check(!fallingNacelle.active, 'opadająca nacella rozbija się o platformę');
const risingNacelle = throwingWorld.enemyBullets.spawn({ owner: 'enemy', kind: 'nacelle', x: 72, y: 116, vx: 0, vy: -200, damage: 24, hitsTerrain: true })!;
throwingWorld.enemyBullets.update(.08, platformWorld);
check(risingNacelle.active, 'nacella przelatuje pod platformą podczas wznoszenia');
throwingWorld.enemyBullets.clear();

const damageWorld = new GameScene(input);
playerTick(damageWorld, 10);
const incoming = damageWorld.enemyBullets.spawn({ owner: 'enemy', kind: 'nacelle', x: damageWorld.player.cx, y: damageWorld.player.cy, vx: 0, vy: 0, damage: throwCfg.damage, hitsTerrain: false })!;
damageWorld.update(step);
check(damageWorld.player.health.current === CONFIG.player.maxHp - throwCfg.damage && !incoming.active, 'trafienie gondolą odbiera 24 HP i usuwa pocisk');
damageWorld.update(step);
check(damageWorld.player.health.current === CONFIG.player.maxHp - throwCfg.damage, 'jedna gondola nie zadaje obrażeń wielokrotnie');

for (let phase = 0; phase < 3; phase++) {
  const phaseWorld = new GameScene(input), phaseBoss = new TurbineBoss(0, 208);
  phaseBoss.x = 280; phaseBoss.y = 48;
  phaseBoss.fsm.forcePhase(phase, phaseBoss, phaseWorld);
  let sawNacelle = false;
  for (let i = 0; i < 1200 && !sawNacelle; i++) {
    phaseBoss.runAttackCycle(step, phaseWorld);
    phaseWorld.enemyBullets.forEachActive((b) => { if (b.kind === 'nacelle') sawNacelle = true; });
  }
  check(sawNacelle, `rzut nacellą jest w sekwencji fazy ${phase + 1}`);
}

// Sterowanie dotykowe przechodzi przez ten sam kontroler gracza co klawiatura.
const mobileInput = new Input(window as any), mobileScene = new GameScene(mobileInput);
const mobileTick = (n = 1) => { for (let i = 0; i < n; i++) { mobileInput.update(); mobileScene.update(step); } };
mobileTick(20);
const mobileStart = mobileScene.player.x;
mobileInput.setTouchActions(1, ['right']); mobileInput.setTouchActions(2, ['fire']);
mobileInput.setTouchActions(3, ['jump']); mobileInput.setTouchActions(3, []);
mobileTick(10);
let mobileShots = 0; mobileScene.playerBullets.forEachActive(() => mobileShots++);
check(mobileScene.player.x > mobileStart && !mobileScene.player.onGround && mobileShots > 0, 'dotyk jednocześnie porusza Sebą, skacze i strzela w prawdziwej scenie');
mobileInput.setTouchActions(4, ['jump']); mobileInput.setTouchActions(4, []); mobileTick();
check(mobileScene.player.vy < -200, 'drugie dotknięcie skoku odbija Sebę w powietrzu');
mobileInput.clearTouch(); mobileTick();
check(!mobileInput.held('right') && !mobileInput.held('fire'), 'zwolnienie panelu kończy ruch i ogień');

console.log(failures === 0 ? '\nSMOKE TEST OK' : `\nSMOKE TEST: ${failures} błędów`);
process.exit(failures === 0 ? 0 : 1);

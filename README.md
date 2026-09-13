# Seba the Blade Destroyer — prototyp (sprint 1)

Run-and-gun 2D w duchu Contry (NES). HTML5 / Canvas 2D / TypeScript, bundlowany esbuildem
do jednego pliku bez zależności runtime — build działa nawet z `file://`.

## Uruchomienie

Gotowy build jest w `dist/game.js`. Wystarczy otworzyć `index.html` w przeglądarce
(albo dowolny statyczny serwer, np. `python3 -m http.server`).

```bash
npm install          # tylko do developmentu (esbuild + tsc)
npm run watch        # dev server z hot-rebuildem: http://localhost:8000
npm run build        # dist/game.js + sourcemap
npm run build:prod   # zminifikowany
npm run typecheck
npm test             # headless smoke test: bot przechodzi poziom i pokonuje bossa
```

## Sterowanie

| Akcja | Klawisze |
|---|---|
| Ruch / celowanie | Strzałki lub WASD |
| Skok (koziołek) | Z / K / Spacja |
| Ogień (auto) | X / J |
| Kucanie | Dół |
| Zeskok przez platformę | Dół + Skok |
| Restart | R / Enter |

**Gamepad** (standard mapping, np. Xbox / Steam Deck): D-pad lub lewa gałka – ruch/celowanie,
**A** – skok, **B / X / RT** – ogień, **Start** – restart. Mapowanie w `GAMEPAD_BINDINGS` (`src/core/Input.ts`).
Chrome zgłasza pad dopiero po pierwszym naciśnięciu dowolnego przycisku.

Celowanie 8-kierunkowe wg reguł Contry: stojąc – prosto lub w górę; w biegu – prosto,
skos góra/dół; w kuckach – prosto; w powietrzu – dowolny z 8 kierunków.

## Architektura (`src/`)

```
core/      Config (WSZYSTKIE parametry balansu), Game (pętla 60 Hz), Input, Camera, Pool, EventBus
render/    Visual (PlaceholderVisual / SpriteSheetVisual), Particles, Assets, Audio (stub SFX)
world/     Level (tilemapa ASCII 16px), Physics (AABB vs grid + one-way), TestLevel (dane)
entities/
  Entity, HealthComponent
  player/  PlayerController + PlayerStates (FSM) + Aim (reguły 8 kierunków)
  weapons/ WeaponBase, MakitaGun, Bullet (BulletPool)
  enemies/ EnemyBase, Runner, Sniper, Drone
  boss/    BossFSM (generyczne fazy + AttackPattern), BossPhases (ataki), TurbineBoss
scenes/    GameScene (orkiestracja, spawny, kolizje, arena), WorldContext (interfejs dla encji)
ui/        HUD
```

### Podmiana placeholderów na grafikę
Każda encja rysuje się przez `visual.draw(ctx, { anim, time, facing, aim, ... })`.
Placeholder = `PlaceholderVisual`. Docelowo:

```ts
const img = await Assets.loadImage('seba', 'assets/sprites/seba.png');
player.visual = new SpriteSheetVisual(img, 32, 32, {
  idle: { frames: [0], fps: 1 }, run: { frames: [1, 2, 3, 4], fps: 12 },
  crouch: { frames: [5], fps: 1 }, jump: { frames: [6, 7, 8, 9], fps: 12 }, fall: { frames: [6], fps: 1 },
  hurt: { frames: [10], fps: 1 }, dead: { frames: [11], fps: 1 },
});
```
Nazwy klipów = nazwy stanów FSM (`PlayerStateName`) / tryby wrogów / `phase1..3` bossa.
Dźwięk: `Sfx.register('shoot', 'assets/sfx/makita.wav')` — wywołania `Sfx.play(...)` są już w kodzie.

### Boss — dodawanie ataków
`BossPhases.ts`: nowy atak = klasa implementująca `AttackPattern<TurbineBoss>` (`start`, `update → done`),
dopisana do listy wzorców fazy w `createTurbinePhases()`. Przejścia faz emitują `boss:phase` na `EventBus`.

### Poziom
`world/TestLevel.ts` — 8 ekranów po 20×15 znaków (`#` blok, `=` platforma one-way, `P/S/D/R/B/X` markery).

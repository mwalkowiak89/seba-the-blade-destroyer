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
| Wycisz | M (pad: Select) |

**Gamepad** (standard mapping, np. Xbox / Steam Deck): D-pad lub lewa gałka – ruch/celowanie,
**A** – skok, **B / X / RT** – ogień, **Start** – restart. Mapowanie w `GAMEPAD_BINDINGS` (`src/core/Input.ts`).
Chrome zgłasza pad dopiero po pierwszym naciśnięciu dowolnego przycisku.

Celowanie 8-kierunkowe wg reguł Contry: stojąc – prosto lub w górę; w biegu – prosto,
skos góra/dół; w kuckach – prosto; w powietrzu – dowolny z 8 kierunków.

## Zasoby i pipeline

Grafika: paczka **Warped City** (ansimuz, CC0) na postać/wrogów/VFX + czcionki **Kenney** (CC0); tła i tileset generowane
proceduralnie (plac budowy farmy wiatrowej o świcie) – szczegóły w `assets/CREDITS.md`.
Surowe pliki leżą w `assets/raw/`, a `npm run assets` (`tools/build-assets.mjs`) generuje z nich:

- `assets/sprites/player/seba.png` – z wygenerowanego sheetu `assets/raw/seba-ai/source.jpeg` przez `tools/extract-seba.mjs`
  (chroma-key, cięcie klatek, downscale + paleta); `makita.png` (3 orientacje × 2 klatki tarczy),
- `assets/sprites/enemies/{runner,drone,turret}.png`, `assets/sprites/fx/{shot,shot-hit,explosion,muzzle,saw}.png`,
- `assets/tilesets/industrial.png` (płyty z nitami, kraty one-way, słupy, rury – autotiling po sąsiadach w `TileRenderer`),
- `assets/backgrounds/` (3 warstwy parallax generowane w `tools/site-backgrounds.mjs`: niebo o świcie z farmą wiatrową 0.1,
  żurawie i stawiana turbina 0.4, kontenery/łopaty/ogrodzenie 0.7),
- `src/assets/manifest.generated.ts` – rozmiary klatek, klipy (nazwa → indeksy + fps), kotwice, punkty dłoni/wylotu broni.

**Podmiana grafiki 1:1**: podmień PNG w `assets/raw/...` (te same nazwy i liczba klatek) i odpal `npm run assets`.
Nazwy klipów = nazwy stanów FSM (`idle, run, run_shoot, shoot, crouch, jump, spin, hurt`) / trybów wrogów.

Pixel-perfect: wirtualna rozdzielczość 320×240, skalowanie całkowite z letterboxem (odpowiednik `viewport` + `keep`),
`image-rendering: pixelated` + `imageSmoothingEnabled = false` (Nearest), pozycje kamery i sprite'ów zaokrąglane do pełnych pikseli.

## Audio (chiptune syntezowany w Web Audio)

Bez plików audio – wszystko generowane w locie w stylu NES (`src/audio/`):
- `Synth.ts` – efekty jak w jsfxr (pulse/triangle/noise, poślizg częstotliwości, arpeggio, filtr), renderowane raz do bufora;
  definicje w `SfxDefs.ts` (shoot, jump, land, hurt, enemy_hit, explosion, boss_phase, sniper_aim, drone_bomb, …).
- `Music.ts` – sekwencer 4-kanałowy (2× pulse, triangle, noise) na zegarze AudioContext; utwory w `Songs.ts`
  (notacja krokowa: `E4` nuta, `.` przedłużenie, `-` pauza, `K/S/H` perkusja). Motyw poziomu, motyw bossa, dżingle.
- `Jukebox.ts` – przełączanie utworów zdarzeniami (`boss:spawned`, `boss:died`, `player:died`).
- Buczenie tarczy tnącej to pętla oscylatorów (`Sfx.setLoop('saw', …)`), głośniejsza podczas ognia.
- Głośności w `CONFIG.audio`. Kontekst odblokowuje się pierwszym klawiszem/klikiem (polityka autoplay przeglądarek).

**Podmiana na nagrania**: `Sfx.register('shoot', 'assets/sfx/shoot.wav')` – dany efekt gra z pliku zamiast z syntezatora.

## Architektura (`src/`)

```
core/      Config (WSZYSTKIE parametry balansu), Game (pętla 60 Hz), Input, Camera, Pool, EventBus
render/    Visual (PlaceholderVisual / SpriteSheetVisual), Parallax, TileRenderer, Fx (animacje jednorazowe), Particles, Audio (stub SFX)
assets/    AssetLoader (preload sheetów/obrazów/czcionki), SpriteSheet (kotwice, flash), manifest.generated.ts
audio/     AudioEngine (kontekst, tory, mute), Synth + SfxDefs (efekty), Music + Songs (sekwencer, utwory), Jukebox
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

### Wizuale
Każda encja rysuje się przez `visual.draw(ctx, { anim, time, facing, aim, ... })`. `SpriteSheetVisual('nazwa')`
rozwiązuje sheet z manifestu leniwie – gdy zasoby nie są załadowane (headless test), rysuje `PlaceholderVisual`.
Broń gracza to osobna nakładka (`makita`) obracana do 8 kierunków przez 3 orientacje bazowe + odbicia X/Y.
Dźwięk: `Sfx.register('shoot', 'assets/sfx/makita.wav')` — wywołania `Sfx.play(...)` są już w kodzie.

### Boss — dodawanie ataków
`BossPhases.ts`: nowy atak = klasa implementująca `AttackPattern<TurbineBoss>` (`start`, `update → done`),
dopisana do listy wzorców fazy w `createTurbinePhases()`. Przejścia faz emitują `boss:phase` na `EventBus`.

### Poziom
`world/TestLevel.ts` — 8 ekranów po 20×15 znaków (`#` blok, `=` platforma one-way, `P/S/D/R/B/X` markery).

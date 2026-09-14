# Zasoby graficzne – źródła i licencje

Wszystkie użyte zasoby są na licencji **CC0 1.0 (public domain)** – bez obowiązku kredytowania,
ale kredytujemy z wdzięczności.

| Zasób | Autor / źródło | Licencja | Użycie |
|---|---|---|---|
| **Warped City** (postać, dron, wieżyczka, pociski, eksplozja) | ansimuz — https://ansimuz.itch.io/warped-city | CC0 | `assets/raw/warped-city/` → pipeline → `assets/sprites`, `assets/backgrounds` |
| **Kenney Fonts** (Kenney Pixel, Kenney Mini) | Kenney — https://kenney.nl/assets/kenney-fonts | CC0 | `assets/fonts/` (HUD) |

## Seba – docelowy sprite (assets/raw/seba-ai/source.jpeg)

Wygenerowany sheet postaci (dostarczony przez autora projektu, green screen). `tools/extract-seba.mjs` wycina klatki
(chroma-key, segmentacja po lukach kolumn, usunięcie błysków, plamek i **karabinu** – jedyną bronią jest nakładka Makity), skaluje do ~48 px z kwantyzacją do wspólnej
palety i pakuje w `assets/sprites/player/seba.png`; portret HUD to twarz z tego samego sheetu. Klipy: idle, run,
run_shoot, shoot, shoot_up, crouch (klęk), jump, spin (koziołek), hurt, dead.

## Modyfikacje (tools/build-assets.mjs)

- **Seba (fallback, gdy brak seba-ai)** = postać z Warped City przerobiona proceduralnie na technika turbin wiatrowych (`paintHelmet` + `SEBA_PALETTE`
  w pipeline): fryzura → biały kask wspinaczkowy z czołówką, kurtka → hi-vis limonka z pasami odblaskowymi,
  uda → długie ciemne spodnie robocze, buty czarne, detal → pomarańczowy karabińczyk uprzęży. Twarz pozostaje widoczna.
- **Tła parallax** (niebo o świcie, farma wiatrowa, żurawie gąsienicowe, stawiana turbina, sekcje wieży, kontenery, łopata
  na stojakach, ogrodzenie budowlane) – rysowane proceduralnie w `tools/site-backgrounds.mjs`.
- **Biegacz („blaszak")** = klatki biegu tej samej postaci w palecie metalu z czerwonym wizjerem.
- **Makita DIY** (wkrętarka z tarczą), **piła** (pocisk wroga), **muzzle flash**, **portret**, **tileset industrialny 16×16**
  (płyty pancerne z nitami, kraty pomostowe, słupy, rury) oraz **warstwa rusztowań** – narysowane proceduralnie w pipeline,
  w palecie Warped City.
- Boss „Skrzydło Turbiny" jest rysowany w kodzie (`TurbineBoss.draw`) – do podmiany na sprite w kolejnym sprincie.

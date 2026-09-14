# Zasoby graficzne – źródła i licencje

Wszystkie użyte zasoby są na licencji **CC0 1.0 (public domain)** – bez obowiązku kredytowania,
ale kredytujemy z wdzięczności.

| Zasób | Autor / źródło | Licencja | Użycie |
|---|---|---|---|
| **Warped City** (postać, dron, wieżyczka, pociski, eksplozja, tła parallax, fasady/propsy) | ansimuz — https://ansimuz.itch.io/warped-city | CC0 | `assets/raw/warped-city/` → pipeline → `assets/sprites`, `assets/backgrounds` |
| **Kenney Fonts** (Kenney Pixel, Kenney Mini) | Kenney — https://kenney.nl/assets/kenney-fonts | CC0 | `assets/fonts/` (HUD) |

## Modyfikacje (tools/build-assets.mjs)

- **Seba** = postać z Warped City po *palette swapie* (kurtka i skóra → niebieski kombinezon z rękawicami, buty) oraz
  proceduralnym **hełmie**: piksele fryzury → zamknięty hełm, twarz → wizjer ze świecącą szczeliną (`paintHelmet` w pipeline).
- **Biegacz („blaszak")** = klatki biegu tej samej postaci w palecie metalu z czerwonym wizjerem.
- **Makita DIY** (wkrętarka z tarczą), **piła** (pocisk wroga), **muzzle flash**, **portret**, **tileset industrialny 16×16**
  (płyty pancerne z nitami, kraty pomostowe, słupy, rury) oraz **warstwa rusztowań** – narysowane proceduralnie w pipeline,
  w palecie Warped City.
- Boss „Skrzydło Turbiny" jest rysowany w kodzie (`TurbineBoss.draw`) – do podmiany na sprite w kolejnym sprincie.

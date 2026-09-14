# Specyfikacja assetów – „Seba the Blade Destroyer”

Cel: przenieść kadr z `assets/raw/reference/mockup-scene.jpeg` 1:1 do gry. Silnik: własny (TypeScript + Canvas 2D),
renderowanie **wyłącznie blitami PNG** z filtrem Nearest, bez shaderów. Wszystko poniżej wynika z kodu (`src/core/Config.ts`,
`src/scenes/GameScene.ts`, `src/render/TileRenderer.ts`, `tools/build-assets.mjs`).

## 1. Rozdzielczość bazowa i skala piksela

| Parametr | Wartość |
|---|---|
| Viewport natywny | **384 × 216 px** (16:9), skalowany całkowicie (2×, 3×, …) z letterboxem |
| Skala piksela | **1:1** – 1 px tekstury = 1 px natywny. Żadnych elementów w 2× / 0,5× (mixele) |
| Wysokość poziomu | 240 px (15 kafli); kamera pokazuje dolne 216 px – górne 24 px to niebo (`cameraOffsetY = 24`) |
| Kafel | **16 × 16 px** |
| Seba | ~48 px wysokości (hitbox 14 × 42), stopy na dolnej krawędzi klatki. Kontur 1 px ciemny (#2b2f36) |
| Podłoga grywalna | górna krawędź na **y = 184 px ekranu** (wiersz 13 kafli = 208 w świecie) |

Współrzędne w tym dokumencie: **px ekranu** (0 = góra viewportu 384×216).

## 2. Tła pod parallax (osobne PNG, alfa 8-bit)

Warstwy są rysowane w przestrzeni ekranu, **powtarzane w poziomie** (muszą się bezszwowo tilować lewo↔prawo),
przewijane z zadanym `scroll` względem kamery. Kolejność od tyłu:

| Warstwa | Plik | Rozmiar | Scroll | Zawartość | Linia ziemi (y ekranu) |
|---|---|---|---|---|---|
| Niebo | `sky.png` (lub `sky-source.png`) | **384 × 216**, bez alfy (kryjąca) | 0.05 | gradient zachodu, słońce, chmury, wzgórza/pola, **przygaszona daleka wieża** (≤ 30 px u podstawy, wtopiona w gradient). **Bez turbin** – są osobną warstwą | horyzont **166** |
| Odległe turbiny (animacja) | `sky-blades.png` | pasek klatek: **N × (384 × 70)** obok siebie (np. 6 klatek = 2304 × 70) | 0.05 | wieże (statyczne w każdej klatce) + łopaty obrócone o 1/N pełnego obrotu (3 łopaty → 120°/N) | góra paska na y = **106** |
| Plan średni | `site-mid.png` | **576–768 × 150**, alfa | 0.3 | czerwony żuraw gąsienicowy, stawiana turbina, sekcje masztów, zaplecze, maszt oświetleniowy | stopy obiektów na **172** |
| Plan bliski | `site-near.png` | **768 × 72**, alfa | 0.7 | płot, barierki, kontenery, szpule, znaki – **bez łopaty i sekcji wieży** (są grywalne, patrz §3) | stopy obiektów na **178** |

Zasady:
- szerokość dowolna, ale **krawędź lewa musi łączyć się z prawą** (powtarzanie);
- pas ziemi w warstwie (od linii ziemi w dół) będzie w większości zasłonięty przez podłogę grywalną (od 184) – widoczne 6–12 px;
- światło zachodu **wypalone w teksturze** (patrz §5); żadnych półprzezroczystych gradientów – twarde piksele;
- jeśli coś ma się animować (łopaty, migające lampy), dostarczyć pasek klatek równej wielkości + fps.

Jeśli wygodniej: możecie oddać **jeden plik warstwy 384 × 216 z alfą** (pozycja 1:1 w kadrze), a ja wyznaczę szerokość
powtarzania – ale bezszwowość na krawędziach i tak musi być zrobiona przez grafika.

## 3. Rekwizyty grywalne (łopata, sekcja wieży, kontenery) – **kafle, nie duże sprajty**

Kolizja jest kaflowa (16 px), a długość platform jest zmienna w poziomie, więc rekwizyty stanowiące platformy oddajemy
jako **zestawy kafli** układane w runy. Duże jednorodne sprajty (Sprite2D) zostawiamy dla dekoracji bez kolizji (żuraw,
naczepa w tle).

### 3a. Wielka łopata – **sprite 32 kafli** (`assets/raw/props/blade-stands-source.jpeg` → `tools/extract-props.mjs`)
Masywna łopata to jeden PNG 512×62 (`blade-big.png`) + sheet stojaków A-frame (`stands.png`, 62 px). Run `L` o długości
dokładnie 32 kafli rysuje ten sprite (górna powierzchnia = krawędź kolizji), stojaki w 1/6, 1/2, 5/6 długości dopełnione
kolumnami do ziemi. Runy `L` innej długości używają kafli poniżej.

### 3b. Łopata kaflowa (platforma semi-solid, 2 rzędy)
Rysowana w 2 rzędach kafli (32 px grubości u nasady). Kolizja: górna krawędź górnego rzędu (wskok od dołu, zeskok DÓŁ+SKOK).

| Kafel | Rozmiar | Uwagi |
|---|---|---|
| `bigRootT` / `bigRootB` | 16 × 16 każdy (razem 16 × 32) | kołnierz nasady z otworami na śruby (lewy koniec) |
| `bigMidT` / `bigMidB` | 16 × 16 | **tilowany w poziomie** – szwy segmentów co kilka kafli mile widziane jako wariant `bigMid2` |
| `bigTipT` / `bigTipB` | 16 × 16 (lub 32 × 16 dla dłuższego zwężenia) | końcówka; można oddać 2 kafle zwężenia |
| `trestleBig` / `trestleBigFoot` | 16 × 16 | żółty kozioł montażowy: segment powtarzany w pion + stopa |

Cieniowanie: grzbiet oświetlony słońcem (ciepła biel #fff4e0 → #f1ede6), spód w cieniu (#8f98a3 → #5e6873), kontur 1 px.

### 3c. Mała łopata (platforma 1-rzędowa)
`bladeRoot`, `bladeMid`, `bladeTip` – 16 × 16, profil w górnych 10 px; `trestle` 16 × 16 pod końcami.

### 3d. Sekcja wieży (platforma 1-rzędowa)
`towerL`, `towerM` (tilowany), `towerR` – 16 × 16, cylinder 14 px z kołnierzami; `cradle` 16 × 16 (kołyska) pod końcami.
Sekcja **na naczepie** w planie bliskim → osobny sprajt dekoracyjny PNG (np. 120 × 44), bez kolizji.

### 3e. Kontener (blok kolizyjny i dach-platforma)
Dach: `contL`, `contM`, `contR`, `contLR`; korpus: `contBL`, `contBM`, `contBR`, `contBLR` – 16 × 16.
Kolory wg mockupu (niebieski, czerwony, zielony, pomarańczowy) – każdy kolor to osobny komplet 8 kafli (albo 1 komplet +
paleta do przemalowania, jeśli trzymacie stałe indeksy kolorów).

## 4. Kafelki podłoża (TileSet) – **16 × 16**

Przy Sebie 48 px to proporcje Contry (bohater = 3 kafle). 32 × 32 zmniejszyłoby dwukrotnie granulację poziomu
(platformy, tunele 32 px do czołgania) – nie chcemy tego.

| Kafel | Opis |
|---|---|
| `plate`, `plateB` | blacha ryflowana z nitami; wariant B z włazem/kratką i rdzą |
| `edgeTop`, `edgeBottom`, `edgeLeft`, `edgeRight` | **nakładki** krawędzi z alfą (autotiling: rysowane, gdy sąsiad nie jest pełny); `edgeTop` z ciepłym podświetleniem |
| `column`, `columnTop`, `pipe`, `pipeTop` | dekoracje planu drugiego pod platformami / na ziemi |
| (opcjonalnie) `grate*` | krata pomostowa – jeśli chcecie wariant podłogi z kratownicy |

Dostarczyć jako **jeden atlas PNG** (siatka 16 px, dowolna liczba kolumn) + lista nazw kafli w kolejności (index → nazwa),
albo osobne pliki `nazwa.png` – pipeline sam spakuje.

## 5. Oświetlenie i klimat – kolory **wypalone w teksturach**

Canvas 2D bez shaderów: nie ma CanvasModulate ani per-pixel lighting. Mamy tylko globalną półprzezroczystą warstwę tintu
(obecnie mgiełka ~10%) – nadaje się na delikatne ujednolicenie, **nie** zastąpi światła kierunkowego.

Dlatego: ciepłe światło zachodu (prawa/górna krawędź obiektów) i chłodny cień (lewo/dół) **w teksturze**. Wspólna paleta
sceny (można rozszerzyć, ale trzymać rodziny):

```
niebo:        #5b5f9c #7a6aa6 #9a76a8 #b8829e #d38f8e #e69c7f #f0a874 #f5b46d #f8c070 #fbcc7c #fdd88e
słońce:       #fbd27a #ffe39a #fff6d0
kompozyt:     #fff4e0 #f1ede6 #dfe3e8 #b9c0c9 #8f98a3 #5e6873      (łopaty, sekcje wieży)
stal:         #161a20 #3b4048 #4f565f #656d78 #7d8692 #98a1ad #b8c0ca  (podłoga, ramki HUD)
rdza:         #7a4a2e #9a5c34
ostrzegawcze: #f2c230 #d9a72c #8a6a1a (żółty), #c0392b #e03b2c (czerwony), #ffffff
kontenery:    #2e86c1/#1f5f8a/#5dade2  #c0392b/#7d2318/#e07b6c  #27ae60/#186e3d/#58d68d  #e67e22/#9c4f0c/#f5b041
hi-vis Seby:  #e6ff3d #9bb800 ; kask #eef1f5 #b9c0c9 ; kontur #2b2f36
```

## 5a. Nadpisywanie warstw gotową grafiką
Pipeline (`npm run assets`) najpierw szuka plików w `assets/raw/art/backgrounds/`: `sky-source.png` lub `sky.png`,
`site-mid.png`, `site-near.png`. Jeśli plik istnieje – jest używany zamiast wersji proceduralnej (ostrzeżenie przy złym
rozmiarze). Przykład generatora nieba: `tools/art/gen-sky.py` (PIL) i jego port `tools/art/gen-sky.mjs` (Node, bez zależności).

## 6. Format plików i zasady techniczne

- **PNG-24 z alfą** (nie JPEG, nie green-screen; przezroczystość prawdziwa). Bez antyaliasingu, bez gradientów płynnych,
  bez półpikseli – każdy piksel na siatce.
- Klatki animacji: jeden pasek/atlas o **stałym rozmiarze klatki**, ułożone rzędami od lewej; podać fps.
- Kotwice: postacie – **stopy na dolnej krawędzi klatki, środek w połowie szerokości**; obiekty latające – środek klatki.
- Nazwy plików = nazwy w manifeście (ASCII, kebab-case). Struktura:
  ```
  assets/raw/art/backgrounds/{sky,sky-blades,site-mid,site-near}.png
  assets/raw/art/tiles/{plate,plateB,edgeTop,...,bigMidT,...}.png   (lub tileset.png + tiles.txt)
  assets/raw/art/props/{tower-trailer,crane,...}.png
  assets/raw/art/player/<klip>-<n>.png   (jeśli redraw Seby: idle, run, shoot, shoot_up, prone, jump, spin, hurt, dead)
  ```
- Podmiana jest **1:1 po nazwach** – `npm run assets` pakuje sheety, generuje manifest i wersjonuje pliki (cache-busting).

## 7. Co dostaniecie ode mnie po odbiorze
Podpięcie warstw i kafli w pipeline (`tools/build-assets.mjs`), korekta linii ziemi/scrolli, screeny porównawcze
gra vs mockup, i – jeśli zajdzie potrzeba – globalny tint zachodu (jedna wartość w `GameScene.draw`).

# Oprawa według referencji — wrzesień 2026

Punkt odniesienia: `Gemini_Generated_Image_watlntwatlntwatl.jpeg`.

Wbudowane narzędzie ImageGen wygenerowało dwa nowe źródła; obraz referencyjny służył jako wskazówka stylistyczna. Pliki oryginalnej referencji i poprzednie źródła zostały zachowane.

- `assets/raw/art/backgrounds/sky-reference.png`: niebo; eksport nearest do 384×216, przewijanie 0.05 i naprzemienne odbicie eliminujące szwy.
- `assets/raw/art/backgrounds/site-reference.png`: przezroczysty plac montażu; pipeline obcina wyłącznie dolny przezroczysty margines i eksportuje na szerokość 384 px. Przewijanie 0.3; podpory dochodzą do y=184 ekranu.
- `assets/backgrounds/{sky,site-mid,site-near}.png`: zasoby uruchomieniowe; sceneria i niebo są osobnymi warstwami, płot i nawierzchnia przewijają się z prędkością 0.7.
- `assets/tilesets/industrial.png`: nowe kafle pomostu (zużyta stal, kraty, ranty i rury), nadal zgodne z kolizją 16 px.

Odtwarzanie: `npm run assets && npm run build:prod`. Zasoby źródłowe są w repozytorium; ponowny build nie wymaga wywołania AI.

Ta zmiana podnosi jakość otoczenia i dopasowuje kolorystykę do referencji. Postać korzysta z dotychczasowej grafiki źródłowej, ale ma poprawiony eksport: maska błysku nie usuwa już skóry z twarzy i portretu, a paleta ma 32 kolory. W spoczynku broń znajduje się przy opuszczonej dłoni. Wrogowie i boss zachowują dotychczasowe sheety; nie jest to pełne odtworzenie wszystkich elementów referencji 1:1.

Duża łopata w tle jest dekoracją; platformy grywalne nadal wynikają z tilemapy. Eksport grywalnej łopaty wyrównuje górny obrys do płaskiej krawędzi kolizji, aby Seba nie wisiał nad grafiką. Podpory są zakotwiczone stopami na podłożu. Kontenery mają przygaszoną paletę stali, przetarcia i zamki; wolnostojące rury z pierwszego planu zostały usunięte.

Kontrola: `npm test` sprawdza przebieg poziomu, podwójny skok, tunele i 113 używanych klatek atlasów. `npm run preview:visual` udostępnia statyczną galerię fragmentów poziomu pod `/test/visual.html` (nie symuluje walki).

## Prompty użyte w ImageGen

### Sceneria

Use case: stylized-concept. Asset type: transparent PNG scenery layer for a side-scrolling pixel-art game, not a finished screenshot. Input image 1 is ONLY the art-direction reference. Create a wide panorama of an industrial wind-turbine assembly site, matching the reference's exceptionally detailed hand-pixelled 16-bit metal, rust, warm cream highlights and cool violet-gray shadows. Main objects: tall cylindrical turbine tower on the left, red lattice crawler crane near center, gigantic horizontal ivory turbine blade on heavy A-frame stands across lower middle, open cylindrical tower segment on a low trailer at left, fence, shipping containers, cables and work lamps along bottom. Side-on orthographic composition for a run-and-gun game. All objects rest on a common ground baseline at 94 percent of image height. Tower rises beyond top; crane top at 12 percent height. Blade body between 60 and 76 percent height with open space under it. Make the left and right edges sparse so they can repeat horizontally. Output a landscape 1536 by 864 PNG with TRUE transparent background and transparent sky between every object, including through crane lattice and beneath blade; no checkerboard painted in image. Crisp pixel-art edges, no smooth 3D, no photography, no text, no UI, no character, no enemies, no gameplay foreground floor. Warm sunset lighting from the upper right. Keep intricate rivets, cables, panel seams, flanges, grated supports, precise convincing industrial proportions. The image is a usable transparent environment layer.

### Niebo

Use case: stylized-concept. Asset type: seamless horizontal sunset sky background for a 2D pixel-art run-and-gun game. Input image 1 is the art-style reference only. Create only the SKY behind the scene, with absolutely no tower, no machinery, no turbines, no foreground, no text, no HUD, no characters. Panoramic 1536x864 opaque PNG. Match the reference: muted slate mauve high sky, layered peach dusty pink clouds with irregular sculpted forms and darker violet undersides, golden amber and pale yellow light toward the low horizon at 90 percent height. Clouds occupy middle and upper regions with varied sizes and thin long illuminated edges. Crisp expertly hand-pixelled 16-bit game art, deliberate pixel clusters and subtly dithered tonal transitions, no rounded cartoon capsule clouds, no smooth photorealistic gradients, no white outlines. Subtle atmospheric hills only in the lowest 5 percent. Both vertical edges should visually join seamlessly when tiled horizontally. Rich warm sunset illumination and nuanced color depth as in the reference, pleasant contrast, no giant sun disk.

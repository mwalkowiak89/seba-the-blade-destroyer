from PIL import Image, ImageDraw

WIDTH, HEIGHT = 384, 216
HORIZON_Y = 166

# Paleta ze specyfikacji
C_VIOLET = (122, 106, 166)  # #7a6aa6
C_PINK   = (211, 143, 142)  # #d38f8e
C_AMBER  = (240, 168, 116)  # #f0a874
C_GOLD   = (251, 204, 124)  # #fbcc7c
C_SUN    = (255, 227, 154)  # #ffe39a
C_HILLS  = (65, 75, 78)     # wzgórza
C_CLOUD_DARK = (168, 100, 95)
C_TOWER  = (140, 130, 150)

img = Image.new("RGB", (WIDTH, HEIGHT))
draw = ImageDraw.Draw(img)

# 1. Gradient nieba
bands = [
    (0, 45, C_VIOLET),
    (45, 90, C_PINK),
    (90, 135, C_AMBER),
    (135, HORIZON_Y, C_GOLD)
]
for y_start, y_end, color in bands:
    draw.rectangle([0, y_start, WIDTH, y_end], fill=color)

# 2. Słońce
sun_x, sun_y, sun_r = 240, 148, 16
draw.ellipse([sun_x - sun_r - 4, sun_y - sun_r - 2, sun_x + sun_r + 4, sun_y + sun_r + 2], fill=C_AMBER)
draw.ellipse([sun_x - sun_r, sun_y - sun_r, sun_x + sun_r, sun_y + sun_r], fill=C_SUN)

# 3. Płaskie chmury pikselowe
def draw_pixel_cloud(x, y, w, h):
    draw.rectangle([x, y, x + w, y + h - 2], fill=C_GOLD)
    draw.rectangle([x + 2, y + h - 2, x + w - 2, y + h], fill=C_CLOUD_DARK)

draw_pixel_cloud(40, 50, 60, 8)
draw_pixel_cloud(180, 75, 90, 10)
draw_pixel_cloud(310, 40, 50, 7)

# 4. Daleka wieża po lewej (<30 px)
draw.polygon([(45, HORIZON_Y), (49, 30), (55, 30), (59, HORIZON_Y)], fill=C_TOWER)

# 5. Wzgórza i linia horyzontu (y = 166)
draw.rectangle([0, HORIZON_Y, WIDTH, HEIGHT], fill=C_HILLS)

img.save("assets/raw/art/backgrounds/sky-source.png")
print("Zapisano sky-source.png (384x216)")

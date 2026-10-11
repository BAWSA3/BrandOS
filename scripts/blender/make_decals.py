"""Decal textures for the stations (keycap legends, ID plate, serial sticker, chevrons).
Run: python3 scripts/blender/make_decals.py  -> scripts/blender/decals/*.png"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "decals")
os.makedirs(OUT, exist_ok=True)
MONO = "/System/Library/Fonts/Menlo.ttc"
SANS = "/System/Library/Fonts/HelveticaNeue.ttc"
INK, BLUE, BONE = (28, 28, 30, 255), (0, 71, 255, 255), (244, 244, 246, 255)


def font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()


# keycap legends: transparent PNGs, one glyph each
for i, ch in enumerate("BUILD.EXE" + "⌘↵⇧"):
    im = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f = font(SANS, 150, 1) if ch.isalnum() or ch == "." else font("/System/Library/Fonts/Apple Symbols.ttf", 170)
    l, t, r, b = d.textbbox((0, 0), ch, font=f)
    d.text(((256 - (r - l)) / 2 - l, (256 - (b - t)) / 2 - t), ch, font=f, fill=INK if i < 9 else BLUE)
    im.save(os.path.join(OUT, f"key{i}.png"))

# per-archetype keycap legends (name + symbols, 12 keys) and ID plates
ARCHES = {"build-exe": "BUILD.EXE", "arc": "ARC", "entropy": "ENTROPY", "foresight": "FORESIGHT", "freq": "FREQ",
          "null": "NULL", "relay": "RELAY", "source": "SOURCE"}
SYMS = "⌘↵⇧⌥⎋⇥⌫◆●▲■★"
for slug, name in ARCHES.items():
    d_ = os.path.join(OUT, slug)
    os.makedirs(d_, exist_ok=True)
    chars = (name + SYMS)[:12]
    for i, ch in enumerate(chars):
        im = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        alpha = ch.isalnum() or ch == "."
        f = font(SANS, 150, 1) if alpha else font("/System/Library/Fonts/Apple Symbols.ttf", 170)
        l, t, r, b = d.textbbox((0, 0), ch, font=f)
        d.text(((256 - (r - l)) / 2 - l, (256 - (b - t)) / 2 - t), ch, font=f, fill=INK if i < len(name) else BLUE)
        im.save(os.path.join(d_, f"key{i}.png"))
    im = Image.new("RGBA", (1024, 384), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((8, 8, 1016, 376), 36, outline=INK, width=10)
    fs = 150 if len(name) <= 9 else 120
    d.text((60, 52), name, font=font(SANS, fs, 1), fill=INK)
    d.text((64, 250), "BRAND STATION  ·  BRANDOS", font=font(MONO, 58), fill=BLUE)
    im.save(os.path.join(d_, "plate.png"))

# NULL's shield emblem (embossed look comes from the material)
im = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.polygon([(256, 40), (440, 110), (420, 300), (256, 470), (92, 300), (72, 110)], outline=(60, 62, 70, 255), width=18)
d.polygon([(256, 140), (330, 300), (182, 300)], fill=(60, 62, 70, 255))
im.save(os.path.join(OUT, "shield.png"))

# FREQ checker floor + RELAY server-rack face
im = Image.new("RGB", (512, 512), BONE[:3])
d = ImageDraw.Draw(im)
for i in range(8):
    for j in range(8):
        if (i + j) % 2:
            d.rectangle((i * 64, j * 64, i * 64 + 63, j * 64 + 63), fill=(0, 71, 255))
im.save(os.path.join(OUT, "checker.png"))
im = Image.new("RGB", (512, 1024), (18, 20, 26))
d = ImageDraw.Draw(im)
for k in range(16):
    y = 20 + k * 62
    d.rectangle((20, y, 492, y + 50), outline=(70, 74, 86), width=4)
    for j in range(10):
        d.rectangle((60 + j * 40, y + 18, 84 + j * 40, y + 32), fill=(40, 44, 54))
im.save(os.path.join(OUT, "rack.png"))

# station ID plate (brushed-metal look comes from the material; this is the print)
im = Image.new("RGBA", (1024, 384), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
d.rounded_rectangle((8, 8, 1016, 376), 36, outline=INK, width=10)
d.text((60, 52), "BUILD.EXE", font=font(SANS, 150, 1), fill=INK)
d.text((64, 250), "STATION 0002  ·  BRANDOS", font=font(MONO, 62), fill=BLUE)
im.save(os.path.join(OUT, "plate.png"))

# serial sticker
im = Image.new("RGBA", (768, 384), BONE)
d = ImageDraw.Draw(im)
d.rectangle((0, 0, 767, 383), outline=INK, width=8)
d.rectangle((0, 0, 767, 92), fill=INK)
d.text((28, 14), "BRANDOS / STN", font=font(MONO, 60), fill=BONE)
for k, line in enumerate(("S/N  BOS-0002-BX", "24V ⎓ 2.1A   IP20", "MADE BY BRANDOS")):
    d.text((28, 118 + k * 82), line, font=font(MONO, 56), fill=INK)
im.save(os.path.join(OUT, "serial.png"))

# chevron warning strip (Klein blue + ink)
im = Image.new("RGBA", (1024, 160), BONE)
d = ImageDraw.Draw(im)
for x in range(-160, 1024, 80):
    d.polygon([(x, 160), (x + 40, 160), (x + 200, 0), (x + 160, 0)], fill=BLUE if (x // 80) % 2 else INK)
im.save(os.path.join(OUT, "chevron.png"))
# CRT content: a tall strip of code (light blue on transparent), scrolled on the screen
import random
random.seed(4)
lines = [
    "> brandos boot --station 0002", "  loading taste engine ........ ok", "  mounting archetype BUILD.EXE ... ok",
    "> scan @handle --deep", "  posts 240  voice 0.91  fit 0.84", "  pillars: building · creator · web3",
    "  score   72  ▲4", "> build floor --next workstation", "  [████████████░░░░] 74%",
    "  compile station.exe", "  link brand_dna.o pass.o", "  ok  (0.42s)", "> deploy --to board", "  live ✓",
]
W_, H_ = 512, 2048
im = Image.new("RGBA", (W_, H_), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
f = font(MONO, 30)
y = 10
while y < H_ - 40:
    for ln in lines:
        if y > H_ - 40:
            break
        d.text((22, y), ln, font=f, fill=(170, 205, 255, 255) if not ln.startswith(">") else (255, 255, 255, 255))
        y += 44
    y += 44
im.save(os.path.join(OUT, "crt_code.png"))
print("decals ->", OUT, sorted(os.listdir(OUT)))

"""Creates the web images in assets/ from the desktop project's pictures.

Trims white/transparent margins (like the desktop app does) and saves small
WebP files, so the page loads fast. Also creates the app icons.

Run (needs Pillow):
    python tools/prepare_images.py [path\\to\\Kassensturz\\assets]
"""

import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "Kassensturz" / "assets"
OUT = ROOT / "assets"

NAMES = [
    "coin_1_cent", "coin_2_cent", "coin_5_cent", "coin_10_cent", "coin_20_cent",
    "coin_50_cent", "coin_1_euro", "coin_2_euro",
    "note_5_euro", "note_10_euro", "note_20_euro", "note_50_euro",
    "note_100_euro", "note_200_euro", "note_500_euro",
]
COIN_BOX = (132, 132)  # 3x the 44 px shown on screen, sharp on high-DPI displays
NOTE_BOX = (216, 132)


def trim(im, threshold=40):
    alpha = im.getchannel("A").point(lambda v: 255 if v > 16 else 0)
    if alpha.getbbox():
        im = im.crop(alpha.getbbox())
    diff = ImageChops.difference(im.convert("RGB"), Image.new("RGB", im.size, "white")).convert("L")
    content = ImageChops.multiply(diff.point(lambda v: 255 if v > threshold else 0),
                                  im.getchannel("A").point(lambda v: 255 if v > 16 else 0))
    box = content.getbbox()
    return im.crop(box) if box else im


def clear_background(im, tolerance=28):
    """Make the white photo background around a coin transparent.

    Only white that is connected to the picture's edge is removed (flood fill),
    so bright spots inside the coin stay untouched.
    """
    from PIL import ImageDraw, ImageFilter
    rgb = im.convert("RGB")
    diff = ImageChops.difference(rgb, Image.new("RGB", im.size, "white")).convert("L")
    mask = diff.point(lambda v: 255 if v <= tolerance else 0)  # near-white = 255
    w, h = mask.size
    for x, y in [(x, 0) for x in range(0, w, 8)] + [(x, h - 1) for x in range(0, w, 8)] + \
                [(0, y) for y in range(0, h, 8)] + [(w - 1, y) for y in range(0, h, 8)]:
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
    background = mask.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.GaussianBlur(1.2))
    im = im.copy()
    im.putalpha(ImageChops.subtract(im.getchannel("A"), background))
    return im


def main():
    OUT.mkdir(exist_ok=True)
    for name in NAMES:
        with Image.open(SOURCE / f"{name}.png") as im:
            im = im.convert("RGBA")
            if name.startswith("coin"):
                im = clear_background(im)
            im = trim(im)
            im.thumbnail(COIN_BOX if name.startswith("coin") else NOTE_BOX, Image.LANCZOS)
            im.save(OUT / f"{name}.webp", quality=86, method=6)
    with Image.open(SOURCE / "kassensturz.png") as icon:
        icon = icon.convert("RGBA")
        for size in (192, 512):
            icon.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png", optimize=True)
        icon.resize((180, 180), Image.LANCZOS).save(OUT / "apple-touch-icon.png", optimize=True)
        icon.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    total = sum(p.stat().st_size for p in OUT.iterdir())
    print(f"{len(list(OUT.iterdir()))} files, {total / 1024:.0f} KB in {OUT}")


if __name__ == "__main__":
    main()

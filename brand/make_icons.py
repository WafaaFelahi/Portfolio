import sys, os
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert("RGB")
cx, cy, side = 537, 488, 820           # the emblem (x 182-892, y 135-840) with breathing room
crop = im.crop((cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2))

def rounded(img, radius_ratio=0.2):
    s = img.size[0]
    mask = Image.new("L", (s * 4, s * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, s * 4 - 1, s * 4 - 1), radius=int(s * 4 * radius_ratio), fill=255)
    mask = mask.resize((s, s), Image.LANCZOS)
    rgba = img.convert("RGBA")
    rgba.putalpha(mask)
    return rgba

def sized(s, sharpen=False):
    t = crop.resize((s, s), Image.LANCZOS)
    if sharpen:
        t = t.filter(ImageFilter.UnsharpMask(radius=0.6, percent=80, threshold=2))
    return t

# Browser tab icons: rounded, transparent corners
for s in (16, 32, 48):
    rounded(sized(s, sharpen=True)).save(os.path.join(out, f"favicon-{s}x{s}.png"))
ico_src = rounded(sized(256))
ico_src.save(os.path.join(out, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
# Home-screen / PWA icons
sized(180).save(os.path.join(out, "apple-touch-icon.png"))        # iOS rounds it itself; must be opaque
rounded(sized(192)).save(os.path.join(out, "icon-192.png"))
rounded(sized(512)).save(os.path.join(out, "icon-512.png"))
for f in sorted(os.listdir(out)):
    print(f, os.path.getsize(os.path.join(out, f)), "bytes")

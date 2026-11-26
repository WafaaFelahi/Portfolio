"""Lunossa simplified mark for small sizes: moon half (left) + lotus half (right).
One shape list drives both the SVG and the rasterised PNGs."""
import sys, os
from PIL import Image, ImageDraw

NAVY = "#020617"
MOON_LIGHT, MOON_DARK, MARIA, RIM = "#eef2fb", "#b9c4dc", "#9aa7c4", "#a8c7ff"
PETAL, PETAL_EDGE, GOLD = "#ffffff", "#020617", "#e3c27e"

# 64x64 design grid. Paths: list of ("M",x,y) / ("C",x1,y1,x2,y2,x,y) / ("L",x,y) / ("Z",)
MOON_HALF = [("M", 32, 11), ("C", 20.4, 11, 11, 20.4, 11, 32), ("C", 11, 43.6, 20.4, 53, 32, 53), ("Z",)]
MARIA_SPOTS = [(22, 25, 4.2, 3.2), (19, 36, 3.0, 2.4), (26, 42, 3.4, 2.6)]   # cx, cy, rx, ry
OUTER = [("M", 32, 47.5), ("C", 41, 38.5, 51, 33.5, 60, 34.5), ("C", 57.5, 46, 46, 51, 32, 47.5), ("Z",)]
MID = [("M", 32, 46), ("C", 35, 33, 41.5, 21.5, 52, 14.5), ("C", 57, 29, 50, 43, 32, 46), ("Z",)]
CENTRE = [("M", 32, 46), ("C", 44, 38, 43.5, 19, 32, 8.5), ("Z",)]
HEART = (32, 42, 3.4)
DX, DY = -3.5, 0.5   # optical centring of the whole mark


def path_d(p):
    out = []
    for seg in p:
        k = seg[0]
        out.append(k + (" " + " ".join(f"{v:g}" for v in seg[1:]) if len(seg) > 1 else ""))
    return " ".join(out)


def svg():
    maria = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{a}" ry="{b}" fill="{MARIA}"/>' for x, y, a, b in MARIA_SPOTS)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{MOON_LIGHT}"/><stop offset="1" stop-color="{MOON_DARK}"/></linearGradient>
    <clipPath id="c"><path d="{path_d(MOON_HALF)}"/></clipPath>
  </defs>
  <rect width="64" height="64" rx="14" fill="{NAVY}"/>
  <g transform="translate(-3.5 0.5)">
  <path d="{path_d(MOON_HALF)}" fill="url(#m)"/>
  <g clip-path="url(#c)">{maria}</g>
  <path d="M32 11C20.4 11 11 20.4 11 32C11 43.6 20.4 53 32 53" fill="none" stroke="{RIM}" stroke-opacity=".55" stroke-width="1.2"/>
  <path d="{path_d(OUTER)}" fill="{PETAL}" stroke="{PETAL_EDGE}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="{path_d(MID)}" fill="{PETAL}" stroke="{PETAL_EDGE}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="{path_d(CENTRE)}" fill="{PETAL}" stroke="{PETAL_EDGE}" stroke-width="1.6" stroke-linejoin="round"/>
  <circle cx="{HEART[0]}" cy="{HEART[1]}" r="{HEART[2]}" fill="{GOLD}"/>
  </g>
</svg>
'''


def flatten(p, k):
    pts, cur = [], (0, 0)
    for seg in p:
        if seg[0] == "M" or seg[0] == "L":
            cur = ((seg[1] + DX) * k, (seg[2] + DY) * k); pts.append(cur)
        elif seg[0] == "C":
            x0, y0 = cur
            x1, y1, x2, y2, x3, y3 = ((seg[1] + DX) * k, (seg[2] + DY) * k, (seg[3] + DX) * k, (seg[4] + DY) * k, (seg[5] + DX) * k, (seg[6] + DY) * k)
            for i in range(1, 25):
                t = i / 24; u = 1 - t
                pts.append((u**3*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t**3*x3, u**3*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t**3*y3))
            cur = (x3, y3)
    return pts


def raster(size, rounded=True):
    SS = 16
    k = size * SS / 64
    W = size * SS
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle((0, 0, W - 1, W - 1), radius=int(14 * k), fill=NAVY)
    else:
        d.rectangle((0, 0, W, W), fill=NAVY)
    # moon half with a diagonal light→dark gradient, clipped to its shape
    grad = Image.new("RGBA", (W, W))
    gd = ImageDraw.Draw(grad)
    a = tuple(int(MOON_LIGHT[i:i + 2], 16) for i in (1, 3, 5)); b = tuple(int(MOON_DARK[i:i + 2], 16) for i in (1, 3, 5))
    for i in range(2 * W):
        t = i / (2 * W)
        c = tuple(int(a[j] + (b[j] - a[j]) * t) for j in range(3))
        gd.line([(i, 0), (0, i)], fill=c + (255,), width=2)
    mask = Image.new("L", (W, W), 0)
    md = ImageDraw.Draw(mask)
    md.polygon(flatten(MOON_HALF, k), fill=255)
    img.paste(grad, (0, 0), mask)
    maria = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    mad = ImageDraw.Draw(maria)
    for x, y, rx, ry in MARIA_SPOTS:
        mad.ellipse(((x + DX - rx) * k, (y + DY - ry) * k, (x + DX + rx) * k, (y + DY + ry) * k), fill=MARIA)
    img.paste(maria, (0, 0), Image.composite(maria, Image.new("RGBA", (W, W)), mask).split()[3])
    rim = flatten(MOON_HALF, k)[:-1]
    rim_layer = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    ImageDraw.Draw(rim_layer).line(rim, fill=(168, 199, 255, 140), width=max(1, int(1.2 * k)))
    img.alpha_composite(rim_layer)
    for shape in (OUTER, MID, CENTRE):
        pts = flatten(shape, k)
        d.polygon(pts, fill=PETAL)
        d.line(pts + [pts[0]], fill=PETAL_EDGE, width=max(1, int(1.6 * k)), joint="curve")
    x, y, r = HEART
    d.ellipse(((x + DX - r) * k, (y + DY - r) * k, (x + DX + r) * k, (y + DY + r) * k), fill=GOLD)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, "favicon.svg"), "w", encoding="utf-8").write(svg())
    for s in (16, 32, 48):
        raster(s).save(os.path.join(out, f"favicon-{s}x{s}.png"))
    raster(256).save(os.path.join(out, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    print("mark written to", out)

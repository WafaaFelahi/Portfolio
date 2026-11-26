"""Lunossa emblem: left half = real moon (NASA texture on a sphere),
right half = crystal lotus cut through its heart. Order follows the example."""
import sys
import numpy as np
from PIL import Image, ImageFilter

moon_tex_path, lotus_path, out_path = sys.argv[1:4]
N = 1024                      # master canvas
cx = cy = N // 2
R = 330                       # disc radius
BG = np.array([2, 6, 23], np.float32) / 255.0   # #020617

canvas = np.ones((N, N, 3), np.float32) * BG

# --- soft lunar glow behind the whole emblem ---------------------------------
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / R
glow = np.exp(-np.clip(d - 1.0, 0, None) * 6.0) * 0.14
canvas += glow[..., None] * np.array([0.62, 0.72, 0.95], np.float32)

# --- left half: the moon, rendered as a lit sphere ---------------------------
tex = np.asarray(Image.open(moon_tex_path).convert("RGB"), np.float32) / 255.0
H, W = tex.shape[:2]
x = (xx - cx) / R
y = -(yy - cy) / R
inside = (x * x + y * y) <= 1.0
z = np.sqrt(np.clip(1 - x * x - y * y, 0, 1))
# matches the hero: THREE.SphereGeometry rotated π/2 about Y
u = 0.5 + np.arctan2(x, z) / (2 * np.pi)          # 0° longitude at the centre of the map
v = 0.5 + np.arcsin(np.clip(y, -1, 1)) / np.pi
col = np.clip(u * (W - 1), 0, W - 1).astype(int)
row = np.clip((1 - v) * (H - 1), 0, H - 1).astype(int)
moon = tex[row, col]
moon = moon * np.array([0.93, 0.97, 1.08], np.float32)            # cool moonlight cast
L = np.array([0.38, 0.32, 0.86]); L = L / np.linalg.norm(L)
lam = np.clip(x * L[0] + y * L[1] + z * L[2], 0, 1)
shade = 0.55 + 0.75 * np.power(lam, 0.7)
rim = np.power(1 - np.clip(z, 0, 1), 3.0)
moon = moon * shade[..., None] + rim[..., None] * np.array([0.72, 0.83, 1.0]) * 0.55
# anti-aliased disc edge
edge = np.clip((1.0 - np.sqrt(x * x + y * y)) * R, 0, 1)
left = (xx < cx).astype(np.float32)
a_moon = edge * left
canvas = canvas * (1 - a_moon[..., None]) + np.clip(moon, 0, 1) * a_moon[..., None]

# --- right half: the crystal lotus, cut through its heart --------------------
lot = Image.open(lotus_path).convert("RGB")
# flower bounds in the 1080x1920 artwork; heart sits at x ≈ 560
heart_x, top, bottom = 560, 395, 1422
src = lot.crop((heart_x, top, 1080, bottom))
scale = (2 * R * 1.14) / (bottom - top)          # petals reach a little past the disc, like the example
src = src.resize((max(1, int(src.width * scale)), int(src.height * scale)), Image.LANCZOS)
arr = np.asarray(src, np.float32) / 255.0
lum = arr @ np.array([0.299, 0.587, 0.114], np.float32)
# mask: keep the luminous flower, drop the dark sky, sparkles and smoke
bright = np.clip((lum - 0.34) / 0.22, 0, 1)
# smoke is distinctly blue; pearl petals stay close to neutral white
blue_excess = arr[..., 2] - arr[..., 0]
not_smoke = np.clip(1 - (blue_excess - 0.14) * 8, 0, 1)
m = Image.fromarray((bright * not_smoke * 255).astype(np.uint8))
m = m.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))   # erase specks
m = m.filter(ImageFilter.MaxFilter(15)).filter(ImageFilter.MinFilter(15)) # close small holes inside petals
m = m.filter(ImageFilter.GaussianBlur(1.6))
mask = np.asarray(m, np.float32) / 255.0
ph, pw = mask.shape
ox, oy = cx, cy - ph // 2                         # cut edge on the centre line, vertically centred
sub = canvas[oy:oy + ph, ox:ox + pw]
mh, mw = sub.shape[:2]
a = mask[:mh, :mw, None]
canvas[oy:oy + ph, ox:ox + pw] = sub * (1 - a) + arr[:mh, :mw] * a

Image.fromarray((np.clip(canvas, 0, 1) * 255).astype(np.uint8)).save(out_path)
print("emblem saved", out_path)

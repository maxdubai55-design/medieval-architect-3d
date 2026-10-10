"""Animatique OTANE : anime les cases des planches de storyboard, une par une.

Chaque case est recadrée dans la planche, puis animée par :
  - un mouvement de caméra (travelling, zoom, panoramique, roulis) sur l'image ;
  - des effets lumineux posés aux bons endroits (réacteurs, tirs, écrans, hologrammes, alarmes,
    faisceaux, vortex du Sillage) ;
  - des particules (poussière, débris, pollen, fumée), un tremblé caméra pour les combats ;
  - le titre de la case et sa légende en sous-titre.

Usage : python3 animatic/animatic.py CONFIG sortie.mp4 [fps] [temps,de,controle]
CONFIG est un module de animatic/ (cfg_sc1, cfg_sc2, cfg_sc3, cfg_planches34) qui définit SEGS.
Les personnages et décors ne bougent pas : c'est un « motion board », pas une animation de personnages.
"""
import importlib
import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
W, H = 1280, 720
UP = 3  # facteur de sur-échantillonnage des cases
XF = 0.6  # durée des fondus enchaînés

SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
SANS = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
SANS_M = '/usr/share/fonts/opentype/inter/Inter-Medium.otf'
GOLD = (222, 184, 110)
RED = (1.0, 0.18, 0.15)
GOLDF = (1.0, 0.8, 0.4)


# --------------------------------------------------------------------------- outils

def smooth(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def keys(ks, t):
    """Interpolation douce entre images clés [(t, valeurs...)]."""
    if t <= ks[0][0]:
        return ks[0][1:]
    for a, b in zip(ks, ks[1:]):
        if t <= b[0]:
            u = smooth((t - a[0]) / (b[0] - a[0]))
            return tuple(x + (y - x) * u for x, y in zip(a[1:], b[1:]))
    return ks[-1][1:]


def noise1(x, seed=0):
    """Bruit 1D lissé, déterministe, dans [-1, 1]."""
    i = math.floor(x)
    f = x - i

    def h(n):
        n = (n * 374761393 + seed * 668265263) & 0xffffffff
        n = (n ^ (n >> 13)) * 1274126177 & 0xffffffff
        return ((n ^ (n >> 16)) & 0xffff) / 32767.5 - 1

    u = f * f * (3 - 2 * f)
    return h(i) * (1 - u) + h(i + 1) * u


def flick(t, seed, speed=9.0, depth=0.35):
    return 1 - depth * 0.5 + depth * 0.5 * noise1(t * speed, seed)


def col(c, a):
    return tuple(float(x * a) for x in c)


def ip(x, y):
    return int(x), int(y)


# --------------------------------------------------------------------------- précalculs

rng = np.random.default_rng(11)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIGNETTE = (1 - 0.42 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.4).clip(0.35, 1)[..., None]
BOTTOM = (1 - 0.6 * np.clip((yy - (H - 230)) / 230, 0, 1) ** 1.5)[..., None]
GRAIN = [rng.normal(0, 0.028, (H, W, 1)).astype(np.float32) for _ in range(8)]


def load_panel(p):
    src = Image.open(p['src']).convert('RGB')
    crop = src.crop(tuple(p['box']))
    big = crop.resize((crop.width * UP, crop.height * UP), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return np.asarray(big).astype(np.float32) / 255.0, crop.size


def text_layer(lines, width=W, shadow=True):
    """Rend un bloc de lignes centrées en RGBA numpy (H, W, 4)."""
    img = Image.new('RGBA', (width, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    blocks = []
    for txt, font, size, c in lines:
        f = ImageFont.truetype(font, size)
        bb = d.textbbox((0, 0), txt or ' ', font=f)
        blocks.append((txt, f, c, bb[3] - bb[1] + int(size * 0.45)))
    total = sum(b[3] for b in blocks)
    y = (H - total) / 2
    for txt, f, c, h in blocks:
        if txt:
            tw = d.textlength(txt, font=f)
            x = (width - tw) / 2
            if shadow:
                d.text((x + 2, y + 2), txt, font=f, fill=(0, 0, 0, 200))
            d.text((x, y), txt, font=f, fill=tuple(c) + (255,))
        y += h
    return np.asarray(img).astype(np.float32) / 255.0


def wrap(d, text, font, maxw):
    words, rows, cur = text.split(), [], ''
    for w_ in words:
        test = (cur + ' ' + w_).strip()
        if d.textlength(test, font=font) <= maxw:
            cur = test
        else:
            rows.append(cur)
            cur = w_
    rows.append(cur)
    return rows


def caption_layer(text):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(SANS, 27)
    rows = wrap(d, text, f, 1040)
    lh = 38
    y = H - 46 - lh * len(rows)
    for r in rows:
        tw = d.textlength(r, font=f)
        x = (W - tw) / 2
        for dx, dy in ((2, 2), (0, 2), (2, 0)):
            d.text((x + dx, y + dy), r, font=f, fill=(0, 0, 0, 220))
        d.text((x, y), r, font=f, fill=(242, 238, 228, 255))
        y += lh
    return np.asarray(img).astype(np.float32) / 255.0


def title_layer(p):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    small = ImageFont.truetype(SANS_M, 15)
    big = ImageFont.truetype(SERIF, 38)
    lab = p['label']
    d.text((50, 42), lab, font=small, fill=(0, 0, 0, 200))
    d.text((48, 40), lab, font=small, fill=GOLD + (255,))
    d.line([(48, 66), (48 + d.textlength(lab, font=small), 66)], fill=GOLD + (160,), width=1)
    t = p['title'].upper()
    d.text((50, 78), t, font=big, fill=(0, 0, 0, 210))
    d.text((48, 76), t, font=big, fill=GOLD + (255,))
    return np.asarray(img).astype(np.float32) / 255.0


def over(frame, layer, a=1.0):
    if a <= 0:
        return frame
    al = layer[..., 3:4] * a
    return frame * (1 - al) + layer[..., :3] * al


# --------------------------------------------------------------------------- rendu d'une case

class PanelRenderer:
    def __init__(self, p):
        self.p = p
        self.src, (self.cw, self.ch) = load_panel(p)
        self.cap = caption_layer(p['text'])
        self.tit = title_layer(p)
        seed = sum(ord(ch) * (j + 1) for j, ch in enumerate(p['id'])) % 1000
        self.r = np.random.default_rng(seed)
        self.seed = seed
        # particules et tirs pré-tirés, déterministes
        self.parts = {}
        for i, f in enumerate(p['fx']):
            k = f[0]
            if k in ('dust', 'pollen'):
                n = f[1]
                self.parts[i] = dict(x=self.r.uniform(0, self.cw, n), y=self.r.uniform(0, self.ch, n),
                                     vx=self.r.normal(0, 2.5, n), vy=self.r.normal(-1.5 if k == 'pollen' else 0.4, 2.0, n),
                                     s=self.r.uniform(0.6, 1.8, n), ph=self.r.uniform(0, 6.28, n))
            if k == 'sparks':
                n, (x0, y0, x1, y1) = f[1], f[2]
                self.parts[i] = dict(x=self.r.uniform(x0, x1, n), y=self.r.uniform(y0, y1, n),
                                     ph=self.r.uniform(0, 6.28, n), sp=self.r.uniform(1.5, 4, n))
            if k == 'bolts':
                n, regions = f[1], f[2]
                times = np.sort(self.r.uniform(0.2, p['dur'] - 0.4, n))
                lst = []
                for t0 in times:
                    x0, y0, x1, y1 = regions[self.r.integers(len(regions))]
                    lst.append((float(t0), self.r.uniform(x0, x1), self.r.uniform(y0, y1)))
                self.parts[i] = lst
            if k == 'streaks':
                n = f[1]
                self.parts[i] = dict(x=self.r.uniform(0, W, n), y=self.r.uniform(0, H, n),
                                     sp=self.r.uniform(900, 2200, n), ln=self.r.uniform(20, 90, n),
                                     b=self.r.uniform(0.15, 0.6, n))
            if k == 'water':
                x0, y0, x1, y1 = f[1]
                n = 50
                self.parts[i] = dict(x=self.r.uniform(x0, x1, n), y0=y0, y1=y1, ph=self.r.uniform(0, 1, n),
                                     sp=self.r.uniform(0.35, 0.7, n))
            if k == 'smoke':
                x0, y0, x1, y1 = f[1]
                n = 14
                self.parts[i] = dict(x=self.r.uniform(x0, x1, n), y=self.r.uniform(y0, y1, n),
                                     r=self.r.uniform(25, 60, n), ph=self.r.uniform(0, 1, n), vx=self.r.normal(3, 3, n))

    def cam(self, lt):
        cx, cy, w = keys(self.p['cam'], lt)
        w = min(w, self.cw)
        h = w * 9 / 16
        if h > self.ch:
            h = self.ch
            w = h * 16 / 9
        sh = self.p.get('shake', 0)
        kick = 0
        for f in self.p['fx']:
            if f[0] == 'kick' and lt >= f[1]:
                kick += f[2] * math.exp(-(lt - f[1]) * 4)
        amp = (sh + kick) * w / W
        cx += amp * noise1(lt * 6, self.seed) + 0.3 * amp * noise1(lt * 23, self.seed + 3)
        cy += amp * noise1(lt * 6, self.seed + 7) + 0.3 * amp * noise1(lt * 23, self.seed + 9)
        x0 = min(max(cx - w / 2, 0), self.cw - w)
        y0 = min(max(cy - h / 2, 0), self.ch - h)
        roll = self.p.get('roll', 0) * noise1(lt * 1.3, self.seed + 21)
        return x0, y0, w, h, roll

    def render(self, lt):
        p = self.p
        x0, y0, w, h, roll = self.cam(lt)
        s = w * UP / W
        if roll:
            # roulis : rotation autour du centre de l'écran, avec une marge de zoom pour ne pas voir les bords
            z = 1 + abs(math.radians(roll)) * 1.2
            a = math.radians(roll)
            ca, sa = math.cos(a) * s / z, math.sin(a) * s / z
            cxs, cys = (x0 + w / 2) * UP, (y0 + h / 2) * UP
            M = np.float32([[ca, -sa, cxs - ca * W / 2 + sa * H / 2], [sa, ca, cys - sa * W / 2 - ca * H / 2]])
        else:
            M = np.float32([[s, 0, x0 * UP], [0, s, y0 * UP]])
        frame = cv2.warpAffine(self.src, M, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                               borderMode=cv2.BORDER_REFLECT)
        k = W / w  # pixels écran par pixel de case

        def S(x, y):
            return (x - x0) * k, (y - y0) * k

        hw, hh = W // 2, H // 2
        glowL = np.zeros((hh, hw, 3), np.float32)   # sources lumineuses, floutées en halo
        addL = np.zeros((H, W, 3), np.float32)      # ajout direct, net
        softL = None                                # nappes très floues (rayons, fumée)
        mult = 1.0
        for i, f in enumerate(p['fx']):
            kind = f[0]
            if kind == 'glow':
                _, x, y, r, c, inten, mode, *arg = f
                if mode == 'flick':
                    a = flick(lt, i + self.seed, 11, 0.5)
                elif mode == 'pulse':
                    a = 0.55 + 0.45 * math.sin(lt * 6.283 * arg[0] + i)
                elif mode == 'fade':  # s'éteint à partir de arg[0] secondes
                    a = (1 - smooth((lt - arg[0]) / 1.5)) * flick(lt, i, 11, 0.4)
                elif mode == 'on':  # s'allume à arg[0] secondes
                    a = smooth((lt - arg[0]) / 0.4) * (0.8 + 0.2 * math.sin(lt * 5))
                elif mode == 'steady':
                    a = 1.0
                else:  # ramp : s'allume jusqu'à arg[0] secondes
                    a = 0.25 + 0.75 * smooth(lt / arg[0]) * flick(lt, i, 14, 0.3)
                if a > 0.01:
                    sx, sy = S(x, y)
                    cv2.circle(glowL, ip(sx / 2, sy / 2), max(1, int(r * k / 2)), col(c, inten * a), -1, cv2.LINE_AA)
            elif kind == 'alarm':
                _, freq, depth = f
                a = max(0.0, math.sin(lt * 6.283 * freq)) ** 2 * depth
                frame = frame * (1 - 0.35 * a) + np.float32(RED) * 0.22 * a * (1 - yy[..., None] / H * 0.6)
            elif kind == 'bolts':
                _, n, regions, (dx, dy), c, life = f
                L = 260
                for (t0, bx, by) in self.parts[i]:
                    u = (lt - t0) / life
                    if 0 <= u <= 1:
                        hx, hy = bx + dx * L * u, by + dy * L * u
                        tx, ty = hx - dx * 40, hy - dy * 40
                        a, b = S(hx, hy), S(tx, ty)
                        fade = 1 - u * 0.5
                        cv2.line(addL, ip(*a), ip(*b), col((1, 0.9, 0.85), 1.6 * fade), max(1, int(k * 1.2)), cv2.LINE_AA)
                        cv2.line(glowL, ip(a[0] / 2, a[1] / 2), ip(b[0] / 2, b[1] / 2), col(c, 2.2 * fade),
                                 max(2, int(k * 2.5)), cv2.LINE_AA)
            elif kind == 'boom':
                _, t0, x, y, r = f
                u = lt - t0
                if 0 <= u < 1.6:
                    e = math.exp(-u * 3.2)
                    sx, sy = S(x, y)
                    rr = int(r * k / 2 * (0.25 + 0.45 * min(1, u * 4)))
                    cv2.circle(glowL, ip(sx / 2, sy / 2), max(2, rr), col((1.0, 0.62, 0.28), 1.5 * e), -1, cv2.LINE_AA)
                    cv2.circle(glowL, ip(sx / 2, sy / 2), max(1, rr // 2), col((1, 1, 1), 1.6 * e), -1, cv2.LINE_AA)
                    mult += 0.15 * math.exp(-u * 9)
            elif kind == 'streaks':
                _, n, (dx, dy), br = f
                P = self.parts[i]
                for j in range(n):
                    px = (P['x'][j] + dx * P['sp'][j] * lt) % (W + 200) - 100
                    py = (P['y'][j] + dy * P['sp'][j] * lt) % (H + 200) - 100
                    ln = P['ln'][j]
                    c = float(P['b'][j] * br)
                    cv2.line(addL, ip(px, py), ip(px - dx * ln, py - dy * ln), (c, c, c * 1.05), 1, cv2.LINE_AA)
            elif kind in ('dust', 'pollen'):
                n = f[1]
                c, br = (f[2], f[3]) if kind == 'dust' else ((1.0, 0.95, 0.7), 0.35)
                P = self.parts[i]
                px = (P['x'] + P['vx'] * lt) % self.cw
                py = (P['y'] + P['vy'] * lt + 2 * np.sin(lt * 0.8 + P['ph'])) % self.ch
                tw = 0.6 + 0.4 * np.sin(lt * 2.0 + P['ph'])
                for j in range(n):
                    sx, sy = S(px[j], py[j])
                    if 0 <= sx < W and 0 <= sy < H:
                        cv2.circle(addL, ip(sx, sy), max(1, int(P['s'][j] * k / 3)), col(c, br * tw[j]), -1, cv2.LINE_AA)
            elif kind == 'sparks':
                _, n, _, c = f
                P = self.parts[i]
                tw = np.clip(np.sin(lt * P['sp'] + P['ph']), 0, 1) ** 6
                for j in range(n):
                    if tw[j] > 0.05:
                        sx, sy = S(P['x'][j], P['y'][j])
                        cv2.circle(glowL, ip(sx / 2, sy / 2), max(1, int(k / 2)), col(c, 1.4 * tw[j]), -1, cv2.LINE_AA)
            elif kind == 'screen':
                _, ax, ay, bx, by, c, inten = f
                (sx0, sy0), (sx1, sy1) = S(ax, ay), S(bx, by)
                sx0, sy0, sx1, sy1 = int(max(0, sx0)), int(max(0, sy0)), int(min(W, sx1)), int(min(H, sy1))
                if sx1 > sx0 and sy1 > sy0:
                    a = inten * (0.7 + 0.3 * noise1(lt * 13, i + self.seed)) * (0.6 if (int(lt * 24) % 37 == 0) else 1)
                    scan = (0.5 + 0.5 * np.sin((yy[sy0:sy1, sx0:sx1] + lt * 60) * 0.9)) * 0.5 + 0.5
                    addL[sy0:sy1, sx0:sx1] += scan[..., None] * np.float32(c) * a
            elif kind == 'glitch':
                _, (ax, ay, bx, by), *rate = f
                (sx0, sy0), (sx1, sy1) = S(ax, ay), S(bx, by)
                sx0, sy0, sx1, sy1 = int(max(0, sx0)), int(max(0, sy0)), int(min(W, sx1)), int(min(H, sy1))
                if noise1(lt * 3, 99 + i) > (rate[0] if rate else 0.35) and sy1 - sy0 > 20 and sx1 > sx0:
                    for g in range(4):
                        ry = int(sy0 + (sy1 - sy0) * abs(noise1(lt * 17 + g * 5, g)))
                        rh = 3 + g * 2
                        off = int(14 * noise1(lt * 31, g + 50))
                        band = frame[ry:ry + rh, sx0:sx1].copy()
                        frame[ry:ry + rh, sx0:sx1] = np.roll(band, off, axis=1)
            elif kind in ('glints', 'twinkle'):
                c0 = f[2] if len(f) > 2 else (1, 1, 1)
                for j, (x, y) in enumerate(f[1]):
                    a = max(0.0, math.sin(lt * (1.3 if kind == 'glints' else 2.1) + j * 2.1)) ** (12 if kind == 'glints' else 4)
                    if a > 0.02:
                        sx, sy = S(x, y)
                        if kind == 'glints':
                            L = int(18 * k / 2 * a + 2)
                            c = col(c0, 1.6 * a)
                            cv2.line(addL, ip(sx - L, sy), ip(sx + L, sy), c, 1, cv2.LINE_AA)
                            cv2.line(addL, ip(sx, sy - L), ip(sx, sy + L), c, 1, cv2.LINE_AA)
                        cv2.circle(glowL, ip(sx / 2, sy / 2), max(2, int(k)), col(c0, 1.2 * a), -1, cv2.LINE_AA)
            elif kind == 'rays':
                _, x, y, c, inten = f
                if softL is None:
                    softL = np.zeros((hh, hw, 3), np.float32)
                sx, sy = S(x, y)
                for j in range(7):
                    ang = math.radians(60 + j * 10 + 3 * noise1(lt * 0.3, j))
                    a = inten * (0.5 + 0.5 * noise1(lt * 0.5, j + 20))
                    L = 2000
                    wdt = math.radians(2.2 + j % 3)
                    pts = np.array([[sx / 2, sy / 2],
                                    [(sx + L * math.cos(ang - wdt)) / 2, (sy + L * math.sin(ang - wdt)) / 2],
                                    [(sx + L * math.cos(ang + wdt)) / 2, (sy + L * math.sin(ang + wdt)) / 2]], np.int32)
                    cv2.fillConvexPoly(softL, pts, col(c, a), cv2.LINE_AA)
            elif kind == 'smoke':
                _, (ax, ay, bx, by), c, inten = f
                if softL is None:
                    softL = np.zeros((hh, hw, 3), np.float32)
                P = self.parts[i]
                for j in range(len(P['x'])):
                    u = (P['ph'][j] + lt * 0.08) % 1
                    x = P['x'][j] + P['vx'][j] * lt
                    y = P['y'][j] - (by - ay) * 0.6 * u
                    sx, sy = S(x, y)
                    a = inten * math.sin(u * 3.14)
                    cv2.circle(softL, ip(sx / 2, sy / 2), int(P['r'][j] * (0.6 + u) * k / 2), col(c, a), -1, cv2.LINE_AA)
            elif kind == 'water':
                P = self.parts[i]
                for j in range(len(P['x'])):
                    u = (P['ph'][j] + lt * P['sp'][j]) % 1
                    yv = P['y0'] + (P['y1'] - P['y0']) * u
                    a, b = S(P['x'][j], yv), S(P['x'][j], yv + 6)
                    c = float(0.18 * math.sin(u * 3.14))
                    cv2.line(glowL, ip(a[0] / 2, a[1] / 2), ip(b[0] / 2, b[1] / 2), (c, c, c), 1, cv2.LINE_AA)
            elif kind == 'birds':
                for j, (x, y) in enumerate(f[1]):
                    bx = x + 6 * math.sin(lt * 0.4 + j) + lt * (1.5 if j == 0 else -1.2)
                    by = y + 3 * math.sin(lt * 0.9 + j * 2)
                    sx, sy = S(bx, by)
                    flap = math.sin(lt * 9 + j * 1.7)
                    sz = 7 * k / 3
                    pts = np.array([[sx - sz, sy - sz * 0.6 * flap], [sx, sy], [sx + sz, sy - sz * 0.6 * flap]], np.int32)
                    cv2.polylines(frame, [pts], False, (0.35, 0.1, 0.12), max(1, int(k / 2)), cv2.LINE_AA)
            elif kind == 'diamond':
                _, cx, cy, hwid, hhgt = f
                a = 0.3 + 0.7 * smooth((lt - 2.5) / 5) * (0.75 + 0.25 * math.sin(lt * 2.4))
                pts = [S(cx, cy - hhgt), S(cx + hwid, cy), S(cx, cy + hhgt), S(cx - hwid, cy)]
                pts = np.array([[int(px / 2), int(py / 2)] for px, py in pts], np.int32)
                cv2.polylines(glowL, [pts], True, col(GOLDF, 1.1 * a), max(1, int(k)), cv2.LINE_AA)
                c0 = S(cx, cy)
                cv2.circle(glowL, ip(c0[0] / 2, c0[1] / 2), int(10 * k / 2), col(GOLDF, 0.5 * a), -1, cv2.LINE_AA)
            elif kind == 'ringglow':
                # cercle lumineux qui s'éveille (symbole gravé)
                _, cx, cy, r, c, t0 = f
                a = 0.2 + 0.8 * smooth((lt - t0) / 4) * (0.75 + 0.25 * math.sin(lt * 2.4))
                sx, sy = S(cx, cy)
                cv2.circle(glowL, ip(sx / 2, sy / 2), int(r * k / 2), col(c, 1.1 * a), max(1, int(k * 0.8)), cv2.LINE_AA)
                cv2.circle(glowL, ip(sx / 2, sy / 2), int(r * k / 4), col(c, 0.9 * a), max(1, int(k * 0.6)), cv2.LINE_AA)
            elif kind == 'ring':
                # onde lumineuse qui s'élargit depuis un point (balise, Cœur)
                _, cx, cy, rmax, c, period, flat = f
                sx, sy = S(cx, cy)
                for ph in (0.0, 0.5):
                    u = ((lt / period) + ph) % 1
                    a = (1 - u) ** 1.5
                    rr = int(rmax * u * k / 2)
                    if rr > 1:
                        cv2.ellipse(glowL, ip(sx / 2, sy / 2), (rr, max(1, int(rr * flat))), 0, 0, 360, col(c, 1.4 * a),
                                    max(1, int(k)), cv2.LINE_AA)
            elif kind == 'radar':
                _, cx, cy, r, c = f
                sx, sy = S(cx, cy)
                ang = lt * 2.2
                for j in range(12):
                    aa = ang - j * 0.05
                    cv2.line(addL, ip(sx, sy), ip(sx + r * k * math.cos(aa), sy + r * k * math.sin(aa)),
                             col(c, 0.5 * (1 - j / 12)), max(1, int(k / 2)), cv2.LINE_AA)
            elif kind == 'beams':
                # faisceaux de traction : lumière qui court le long des rayons
                _, segs_, c = f
                for j, (ax, ay, bx, by) in enumerate(segs_):
                    a0, b0 = S(ax, ay), S(bx, by)
                    base = 0.35 + 0.15 * math.sin(lt * 3 + j)
                    cv2.line(glowL, ip(a0[0] / 2, a0[1] / 2), ip(b0[0] / 2, b0[1] / 2), col(c, base), max(2, int(k * 3)), cv2.LINE_AA)
                    for q in range(3):
                        u = (lt * 0.6 + q / 3 + j * 0.17) % 1
                        px, py = a0[0] + (b0[0] - a0[0]) * u, a0[1] + (b0[1] - a0[1]) * u
                        cv2.circle(glowL, ip(px / 2, py / 2), max(2, int(k * 2)), col(c, 1.3), -1, cv2.LINE_AA)
            elif kind == 'vortex':
                # tourbillon du Sillage : rotation de l'image autour d'un centre, plus forte au cœur
                _, cx, cy, R, omega = f
                sx, sy = S(cx, cy)
                dxm, dym = xx - sx, yy - sy
                rr = np.sqrt(dxm * dxm + dym * dym)
                ang = (omega * lt) * np.exp(-rr / (R * k))
                ca_, sa_ = np.cos(ang), np.sin(ang)
                mapx = (sx + dxm * ca_ - dym * sa_).astype(np.float32)
                mapy = (sy + dxm * sa_ + dym * ca_).astype(np.float32)
                frame = cv2.remap(frame, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
                pul = 0.5 + 0.5 * math.sin(lt * 2.5)
                cv2.circle(glowL, ip(sx / 2, sy / 2), int(R * k / 12), col((0.6, 0.75, 1.0), 0.1 + 0.08 * pul), -1, cv2.LINE_AA)
            elif kind == 'blind':
                # éclairs aveuglants intermittents
                _, inten = f
                a = max(0.0, noise1(lt * 2.5, 77)) ** 3 * inten
                mult += a
                frame = frame + a * 0.5
            elif kind == 'static':
                # transmissions coupées : bandes de neige brèves
                _, inten = f
                if noise1(lt * 4, 55) > 0.45:
                    y0b = int(abs(noise1(lt * 21, 3)) * (H - 60))
                    band = rng.normal(0.5, 0.25, (40, W, 1)).astype(np.float32)
                    frame[y0b:y0b + 40] = frame[y0b:y0b + 40] * (1 - inten) + band * inten
            elif kind == 'dying':
                for j, (x, y) in enumerate(f[1]):
                    on = noise1(lt * 2.2, j + 70) > -0.1 and noise1(lt * 15, j + 90) > -0.6
                    if on:
                        sx, sy = S(x, y)
                        cv2.circle(glowL, ip(sx / 2, sy / 2), max(1, int(2.2 * k / 2)), (1.3, 0.85, 0.45), -1, cv2.LINE_AA)
            elif kind == 'dark':
                mult *= 1 - f[1]

        if mult != 1.0:
            frame = frame * mult
        g1 = cv2.GaussianBlur(glowL, (0, 0), 3)
        g2 = cv2.GaussianBlur(glowL, (0, 0), 14)
        glow = cv2.resize(g1 * 1.2 + g2 * 1.6, (W, H), interpolation=cv2.INTER_LINEAR)
        if softL is not None:
            glow += cv2.resize(cv2.GaussianBlur(softL, (0, 0), 10), (W, H), interpolation=cv2.INTER_LINEAR)
        frame = frame + glow + addL
        frame = frame / (1 + np.maximum(frame - 1, 0) * 0.5)  # compression douce des hautes lumières
        frame = frame * VIGNETTE * BOTTOM
        # titre de case puis légende
        ta = smooth((lt - 0.3) / 0.6) * (1 - smooth((lt - 3.6) / 0.8))
        frame = over(frame, self.tit, ta)
        ca = smooth((lt - 1.0) / 0.5) * (1 - smooth((lt - (p['dur'] - 0.9)) / 0.5))
        frame = over(frame, self.cap, ca)
        return frame


class CardRenderer:
    def __init__(self, c):
        self.c = c
        self.lay = text_layer(c['lines'])

    def render(self, lt):
        d = self.c['dur']
        a = smooth(lt / 1.0) * (1 - smooth((lt - (d - 1.0)) / 1.0))
        bg = np.zeros((H, W, 3), np.float32) + np.float32([0.02, 0.025, 0.035])
        z = 1 + 0.02 * lt / d
        M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, z)
        lay = cv2.warpAffine(self.lay, M, (W, H), flags=cv2.INTER_LINEAR)
        return over(bg, lay, a)


# --------------------------------------------------------------------------- montage

def load_cfg(name):
    return importlib.import_module(name)


def timeline(cfg):
    out, t = [], 0.0
    for obj in cfg.SEGS:
        trans = obj.get('trans', 'fade')
        start = t - (XF if out and trans == 'fade' else 0)
        out.append(dict(obj=obj, start=start, dur=obj['dur'], trans=trans))
        t = start + obj['dur']
    return out, t


def main():
    cfg = load_cfg(sys.argv[1])
    outp = Path(sys.argv[2])
    fps = int(sys.argv[3]) if len(sys.argv) > 3 else 24
    outp.parent.mkdir(parents=True, exist_ok=True)
    segs, total = timeline(cfg)
    for s in segs:
        s['r'] = PanelRenderer(s['obj']) if s['obj']['kind'] == 'panel' else CardRenderer(s['obj'])
    n = int(round(total * fps))
    only = [float(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else None
    if only is None:
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                               '-r', str(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
                               '-pix_fmt', 'yuv420p', str(outp)], stdin=subprocess.PIPE)
    times = only if only is not None else [i / fps for i in range(n)]
    for fi, t in enumerate(times):
        act = [s for s in segs if s['start'] <= t < s['start'] + s['dur']]
        frame = None
        for s in act:
            f = s['r'].render(t - s['start'])
            if frame is None:
                frame = f
            else:
                a = smooth((t - s['start']) / XF) if s['trans'] == 'fade' else 1.0
                frame = frame * (1 - a) + f * a
        if frame is None:
            frame = np.zeros((H, W, 3), np.float32)
        for s in segs:  # flash blanc d'enchaînement
            if s['trans'] == 'flash' and 0 <= t - s['start'] < 0.35:
                frame = frame + (1 - (t - s['start']) / 0.35) ** 2 * 0.9
        frame = frame + GRAIN[fi % 8]
        rgb = (np.clip(frame, 0, 1) * 255).astype(np.uint8)
        if only is not None:
            Image.fromarray(rgb).save(outp.parent / f'still_{t:06.2f}.jpg', quality=90)
        else:
            ff.stdin.write(rgb.tobytes())
            if fi % 480 == 0:
                print(f'{outp.name} {fi}/{n}', flush=True)
    if only is None:
        ff.stdin.close()
        ff.wait()
        print('vidéo', outp, f'{total:.1f} s', flush=True)


if __name__ == '__main__':
    main()

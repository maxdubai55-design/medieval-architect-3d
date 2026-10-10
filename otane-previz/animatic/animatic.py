"""Animatique OTANE : anime les cases des planches de storyboard, une par une.

Chaque case est recadrée dans la planche, puis animée par :
  - un mouvement de caméra (travelling, zoom, panoramique) sur l'image ;
  - des effets lumineux posés aux bons endroits (réacteurs, tirs, écrans, hologrammes, alarmes) ;
  - des particules (poussière, débris, pollen), un tremblé caméra pour les combats ;
  - le titre de la case et sa légende en sous-titre.

Usage : python3 animatic/animatic.py out/animatic/video.mp4 [fps]
Les personnages et décors ne bougent pas : c'est un « motion board », pas une animation de personnages.
"""
import json
import math
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent
W, H = 1280, 720
UP = 3  # facteur de sur-échantillonnage des cases
FPS = int(sys.argv[2]) if len(sys.argv) > 2 else 24

SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
SERIF_B = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SANS = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
SANS_M = '/usr/share/fonts/opentype/inter/Inter-Medium.otf'
GOLD = (222, 184, 110)

# Rangées d'image (sans bandeau de titre ni légende) et colonnes, en pixels de planche
ROWS = {'planche3': [(108, 455), (574, 938)], 'planche4': [(108, 510), (612, 968)]}
COLS = [(12, 487), (499, 953), (965, 1438)]

ORANGE = (1.0, 0.62, 0.25)
BLUE = (0.45, 0.7, 1.0)
RED = (1.0, 0.18, 0.15)
CYAN = (0.35, 0.85, 1.0)
WARM = (1.0, 0.72, 0.38)
WHITE = (1.0, 1.0, 1.0)
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


# --------------------------------------------------------------------------- cases

PANELS = [
    dict(id='3-1', planche='planche3', r=0, c=0, title='Première alerte', dur=10,
         text="L'alarme retentit dans le hangar d'OTANE. Fara lance l'escadron. L'Indocile décolle.",
         cam=[(0, 165, 160, 300), (2.5, 165, 160, 300), (9, 315, 125, 330)], shake=1.2,
         fx=[('alarm', 1.1, 0.5),
             ('glow', 257, 97, 7, ORANGE, 1.6, 'ramp', 4), ('glow', 300, 108, 7, ORANGE, 1.6, 'ramp', 4),
             ('glow', 418, 68, 3, ORANGE, 1.0, 'flick'), ('glow', 440, 73, 3, ORANGE, 1.0, 'flick'),
             ('glow', 250, 12, 4, WARM, 0.6, 'flick'), ('glow', 350, 8, 4, WARM, 0.6, 'flick'),
             ('dust', 60, WARM, 0.25)],
         trans='fade'),
    dict(id='3-2', planche='planche3', r=0, c=1, title='Première bataille', dur=9,
         text="Balam et Glide combattent ensemble pour la première fois, entre les vaisseaux d'OTANE et les chasseurs ennemis. Ils l'emportent.",
         cam=[(0, 240, 165, 420), (9, 175, 195, 300)], shake=4,
         fx=[('glow', 83, 212, 9, BLUE, 1.8, 'flick'), ('glow', 110, 225, 8, BLUE, 1.6, 'flick'),
             ('glow', 380, 240, 6, BLUE, 1.3, 'flick'), ('glow', 425, 250, 6, BLUE, 1.3, 'flick'),
             ('bolts', 7, [(330, 70, 470, 110), (360, 140, 470, 200)], (-1.0, 0.12), RED, 0.32),
             ('bolts', 3, [(120, 170, 200, 220)], (1.0, -0.25), BLUE, 0.3),
             ('boom', 2.0, 390, 60, 40), ('boom', 5.3, 300, 125, 32), ('boom', 7.4, 420, 200, 36),
             ('streaks', 40, (-1.0, 0.35), 0.5)],
         trans='flash'),
    dict(id='3-3', planche='planche3', r=0, c=2, title='Siraal', dur=9,
         text="Le chasseur noir de Siraal, silhouette de nageoire brisée, plonge sur eux. Trop fort pour eux : ils battent en retraite.",
         cam=[(0, 237, 180, 470), (5.6, 300, 135, 330), (9, 330, 120, 290)], shake=2.5,
         fx=[('glow', 305, 40, 3, RED, 1.2, 'pulse', 1.5), ('glow', 385, 60, 3, RED, 1.2, 'pulse', 1.5),
             ('glow', 220, 120, 3, RED, 1.2, 'pulse', 1.5), ('glow', 330, 140, 3, RED, 1.2, 'pulse', 1.5),
             ('glow', 30, 175, 12, BLUE, 1.6, 'flick'), ('glow', 20, 300, 14, BLUE, 1.6, 'flick'),
             ('bolts', 6, [(300, 120, 360, 160)], (-0.85, 0.55), RED, 0.35),
             ('bolts', 4, [(430, 180, 470, 240)], (-0.55, 0.8), RED, 0.3),
             ('boom', 6.0, 150, 255, 55), ('kick', 6.0, 14),
             ('streaks', 30, (-0.6, 0.8), 0.5)],
         trans='cut'),
    dict(id='3-4', planche='planche3', r=1, c=0, title='La Cadence', dur=11,
         text="Salle de débriefing. Fara explique le réseau de la Cadence et le Miroir, l'outil de prédiction des Mosodes. Balam et Glide écoutent.",
         cam=[(0, 150, 175, 300), (2, 150, 175, 300), (10, 255, 175, 420)], shake=0.6,
         fx=[('screen', 190, 10, 400, 175, CYAN, 0.18), ('screen', 175, 240, 355, 335, CYAN, 0.22),
             ('glow', 432, 85, 22, CYAN, 0.5, 'pulse', 0.6), ('glow', 290, 100, 14, CYAN, 0.55, 'pulse', 0.4),
             ('glow', 250, 285, 10, CYAN, 0.6, 'pulse', 0.5),
             ('sparks', 40, (190, 20, 470, 170), CYAN), ('sparks', 25, (180, 245, 350, 330), CYAN)],
         trans='fade'),
    dict(id='3-5', planche='planche3', r=1, c=1, title='Le bar des docks', dur=11,
         text="Au bar des docks, chez Mara Quell, Balam et Fara se parlent pour la première fois. Glide observe. Autour d'eux, des pilotes de toutes espèces boivent et racontent.",
         cam=[(0, 240, 175, 420), (11, 255, 150, 300)], shake=0.8,
         fx=[('glow', 70, 45, 9, WARM, 0.8, 'flick'), ('glow', 250, 40, 9, WARM, 0.8, 'flick'),
             ('glow', 183, 22, 9, GOLDF, 0.45, 'pulse', 0.3), ('glow', 183, 68, 14, GOLDF, 0.35, 'pulse', 0.3),
             ('glow', 212, 228, 4, WARM, 0.9, 'flick'),
             ('dust', 50, WARM, 0.2)],
         trans='fade'),
    dict(id='3-6', planche='planche3', r=1, c=2, title='Rumeurs', dur=10,
         text="Des rumeurs circulent : le Sillage multiplie les sauvetages suspects. À OTANE, pilotes et personnel se demandent ce qu'il cherche.",
         cam=[(0, 215, 105, 300), (2.5, 215, 105, 300), (10, 240, 190, 430)], shake=0.6,
         fx=[('screen', 105, 12, 300, 170, CYAN, 0.12), ('screen', 300, 12, 470, 135, CYAN, 0.1),
             ('glow', 77, 60, 8, WARM, 0.7, 'flick'), ('dust', 30, WARM, 0.15)],
         trans='fade'),
    dict(id='4-1', planche='planche4', r=0, c=0, title="Les jardins d'Iléa", dur=11,
         text="L'Indocile et son escorte arrivent aux jardins d'Iléa, des habitats agricoles suspendus autour d'OTANE.",
         cam=[(0, 300, 165, 330), (11, 215, 220, 430)], shake=0.4,
         fx=[('glow', 20, 268, 12, BLUE, 1.6, 'flick'), ('glow', 46, 274, 12, BLUE, 1.6, 'flick'),
             ('glow', 300, 233, 3, BLUE, 1.0, 'flick'), ('glow', 15, 375, 4, BLUE, 1.0, 'flick'),
             ('glints', [(100, 112), (395, 185), (330, 262), (130, 300), (440, 270)]),
             ('dust', 25, (0.8, 0.9, 1.0), 0.12)],
         trans='card'),
    dict(id='4-2', planche='planche4', r=0, c=1, title='Au cœur des jardins', dur=11,
         text="Balam et Glide découvrent l'eau courante, la végétation, des bêtes inconnues. Iléa vit sous la protection d'OTANE.",
         cam=[(0, 237, 250, 420), (11, 265, 150, 290)], shake=0.5,
         fx=[('rays', 250, -40, (1.0, 0.95, 0.8), 0.18), ('water', (225, 90, 345, 250)),
             ('pollen', 60), ('birds', [(300, 72), (382, 62)])],
         trans='fade'),
    dict(id='4-3', planche='planche4', r=0, c=2, title='Le signe du Livre', dur=10,
         text="Sur un conduit, Glide reconnaît un signe du Livre des Marées. Il s'approche pour l'examiner.",
         cam=[(0, 230, 220, 420), (2, 230, 220, 420), (10, 315, 130, 260)], shake=0.4,
         fx=[('diamond', 340, 100, 44, 95), ('rays', 200, -60, (1.0, 0.95, 0.8), 0.1), ('dust', 40, GOLDF, 0.2)],
         trans='fade'),
    dict(id='4-4', planche='planche4', r=1, c=0, title="L'avant-poste muet", dur=11,
         text="L'Indocile approche d'un avant-poste frontalier. Aucun signal. Personne ne répond aux appels.",
         cam=[(0, 237, 178, 470), (11, 280, 150, 330)], shake=0.3,
         fx=[('dying', [(265, 32), (300, 90), (150, 52), (360, 118), (395, 42), (210, 120), (330, 60)]),
             ('glow', 15, 236, 12, BLUE, 1.5, 'flick'), ('glow', 46, 266, 12, BLUE, 1.5, 'flick'),
             ('dark', 0.15), ('dust', 30, (0.7, 0.8, 1.0), 0.1)],
         trans='fade'),
    dict(id='4-5', planche='planche4', r=1, c=1, title='Sabotage', dur=10,
         text="Lio, Balam et Glide fouillent l'avant-poste abandonné. Les données ont été effacées. Quelqu'un est entré avant eux.",
         cam=[(0, 240, 180, 420), (10, 255, 195, 280)], shake=0.6,
         fx=[('screen', 180, 150, 360, 290, RED, 0.2), ('glitch', (180, 150, 360, 290)),
             ('glow', 270, 215, 30, RED, 0.35, 'pulse', 0.9), ('glow', 60, 210, 25, RED, 0.18, 'pulse', 0.9),
             ('glow', 195, 18, 6, WHITE, 0.5, 'flick'), ('glow', 330, 12, 6, WHITE, 0.5, 'flick')],
         trans='fade'),
    dict(id='4-6', planche='planche4', r=1, c=2, title="L'attaque de Siraal", dur=10,
         text="Sur le chemin du retour, Siraal attaque de nouveau. Balam et Glide ne s'en sortent qu'en manœuvrant ensemble.",
         cam=[(0, 180, 225, 330), (10, 240, 180, 440)], shake=4,
         fx=[('glow', 20, 226, 13, BLUE, 1.8, 'flick'), ('glow', 112, 282, 12, BLUE, 1.8, 'flick'),
             ('glow', 300, 25, 4, RED, 1.3, 'pulse', 2), ('glow', 440, 50, 4, RED, 1.3, 'pulse', 2),
             ('bolts', 9, [(300, 20, 470, 90)], (-0.5, 0.85), RED, 0.35),
             ('boom', 0.3, 55, 90, 45), ('boom', 3.2, 300, 255, 40), ('boom', 6.3, 420, 310, 50),
             ('kick', 3.2, 8), ('kick', 6.3, 10),
             ('streaks', 45, (-0.9, 0.45), 0.6)],
         trans='flash'),
]

CARDS = {
    'intro': dict(dur=6, lines=[('OTANE', SERIF_B, 96, GOLD), ('Le Cœur des mondes', SERIF, 40, GOLD),
                                 ('', SANS, 20, None), ('Storyboard animé — planches 3 et 4', SANS, 22, (200, 200, 200))]),
    'p4': dict(dur=3.5, lines=[('Planche 4', SERIF, 52, GOLD)]),
    'p3': dict(dur=3.5, lines=[('Planche 3', SERIF, 52, GOLD)]),
    'end': dict(dur=6, lines=[('OTANE', SERIF_B, 72, GOLD), ('Le Cœur des mondes', SERIF, 34, GOLD), ('', SANS, 20, None),
                               ('Christian Bousquet', SERIF, 28, (220, 220, 220)),
                               ('Animatique de travail d’après les planches de storyboard — non contractuelle', SANS, 17, (150, 150, 150))]),
}

# --------------------------------------------------------------------------- précalculs

rng = np.random.default_rng(11)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIGNETTE = (1 - 0.42 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) ** 1.4).clip(0.35, 1)[..., None]
BOTTOM = (1 - 0.6 * np.clip((yy - (H - 230)) / 230, 0, 1) ** 1.5)[..., None]
GRAIN = [rng.normal(0, 0.028, (H, W, 1)).astype(np.float32) for _ in range(8)]


def load_panel(p):
    src = Image.open(ROOT / 'src' / f"{p['planche']}.png").convert('RGB')
    y0, y1 = ROWS[p['planche']][p['r']]
    x0, x1 = COLS[p['c']]
    crop = src.crop((x0, y0, x1, y1))
    big = crop.resize((crop.width * UP, crop.height * UP), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
    return np.asarray(big).astype(np.float32) / 255.0, crop.size


def text_layer(lines, width=W, align='center', shadow=True):
    """Rend un bloc de lignes en RGBA numpy (H, W, 4)."""
    img = Image.new('RGBA', (width, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    blocks = []
    for txt, font, size, col in lines:
        f = ImageFont.truetype(font, size)
        bb = d.textbbox((0, 0), txt or ' ', font=f)
        blocks.append((txt, f, col, bb[3] - bb[1] + int(size * 0.45)))
    total = sum(b[3] for b in blocks)
    y = (H - total) / 2
    for txt, f, col, h in blocks:
        if txt:
            tw = d.textlength(txt, font=f)
            x = (width - tw) / 2
            if shadow:
                d.text((x + 2, y + 2), txt, font=f, fill=(0, 0, 0, 200))
            d.text((x, y), txt, font=f, fill=col + (255,))
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
    num = p['id'].split('-')
    small = ImageFont.truetype(SANS_M, 15)
    big = ImageFont.truetype(SERIF, 38)
    lab = f"PLANCHE {num[0]}  ·  CASE {num[1]}"
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
                n, regions, = f[1], f[2]
                times = np.sort(self.r.uniform(0.2, p['dur'] - 0.4, n))
                lst = []
                for t0 in times:
                    x0, y0, x1, y1 = regions[self.r.integers(len(regions))]
                    lst.append((t0, self.r.uniform(x0, x1), self.r.uniform(y0, y1)))
                self.parts[i] = lst
            if k == 'streaks':
                n = f[1]
                self.parts[i] = dict(x=self.r.uniform(0, W, n), y=self.r.uniform(0, H, n),
                                     sp=self.r.uniform(900, 2200, n), ln=self.r.uniform(20, 90, n),
                                     b=self.r.uniform(0.15, 0.6, n))
            if k == 'water':
                x0, y0, x1, y1 = f[1]
                n = 70
                self.parts[i] = dict(x=self.r.uniform(x0, x1, n), y0=y0, y1=y1, ph=self.r.uniform(0, 1, n),
                                     sp=self.r.uniform(0.35, 0.7, n))

    def cam(self, lt):
        cx, cy, w = keys(self.p['cam'], lt)
        h = w * 9 / 16
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
        return x0, y0, w, h

    def render(self, lt):
        p = self.p
        x0, y0, w, h = self.cam(lt)
        s = w * UP / W
        M = np.float32([[s, 0, x0 * UP], [0, s, y0 * UP]])
        frame = cv2.warpAffine(self.src, M, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                               borderMode=cv2.BORDER_REFLECT)
        k = W / w  # pixels écran par pixel de case

        def S(x, y):
            return (x - x0) * k, (y - y0) * k

        hw, hh = W // 2, H // 2
        glowL = np.zeros((hh, hw, 3), np.float32)   # sources lumineuses, floutées en halo
        addL = np.zeros((H, W, 3), np.float32)      # ajout direct, net
        raysL = None
        mult = 1.0
        for i, f in enumerate(p['fx']):
            kind = f[0]
            if kind == 'glow':
                _, x, y, r, col, inten, mode, *arg = f
                if mode == 'flick':
                    a = flick(lt, i + self.seed, 11, 0.5)
                elif mode == 'pulse':
                    a = 0.55 + 0.45 * math.sin(lt * 6.283 * arg[0] + i)
                else:  # ramp : s'allume jusqu'à arg[0] secondes
                    a = 0.25 + 0.75 * smooth(lt / arg[0]) * flick(lt, i, 14, 0.3)
                sx, sy = S(x, y)
                rr = max(1, int(r * k / 2))
                cv2.circle(glowL, (int(sx / 2), int(sy / 2)), rr, tuple(float(c * inten * a) for c in col), -1, cv2.LINE_AA)
            elif kind == 'alarm':
                _, freq, depth = f
                a = max(0.0, math.sin(lt * 6.283 * freq)) ** 2 * depth
                frame = frame * (1 - 0.35 * a) + np.float32(RED) * 0.22 * a * (1 - yy[..., None] / H * 0.6)
            elif kind == 'bolts':
                _, n, regions, (dx, dy), col, life = f
                L = 260
                for (t0, bx, by) in self.parts[i]:
                    u = (lt - t0) / life
                    if 0 <= u <= 1:
                        hx, hy = bx + dx * L * u, by + dy * L * u
                        tx, ty = hx - dx * 40, hy - dy * 40
                        a, b = S(hx, hy), S(tx, ty)
                        fade = 1 - u * 0.5
                        cv2.line(addL, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])),
                                 tuple(float(c * 1.6 * fade) for c in (1, 0.9, 0.85)), max(1, int(k * 1.2)), cv2.LINE_AA)
                        cv2.line(glowL, (int(a[0] / 2), int(a[1] / 2)), (int(b[0] / 2), int(b[1] / 2)),
                                 tuple(float(c * 2.2 * fade) for c in col), max(2, int(k * 2.5)), cv2.LINE_AA)
            elif kind == 'boom':
                _, t0, x, y, r = f
                u = lt - t0
                if 0 <= u < 1.6:
                    e = math.exp(-u * 3.2)
                    sx, sy = S(x, y)
                    rr = int(r * k / 2 * (0.25 + 0.45 * min(1, u * 4)))
                    cv2.circle(glowL, (int(sx / 2), int(sy / 2)), max(2, rr), tuple(float(c * 1.5 * e) for c in (1.0, 0.62, 0.28)), -1, cv2.LINE_AA)
                    cv2.circle(glowL, (int(sx / 2), int(sy / 2)), max(1, rr // 2), tuple(float(1.6 * e) for _ in range(3)), -1, cv2.LINE_AA)
                    mult += 0.15 * math.exp(-u * 9)
            elif kind == 'streaks':
                _, n, (dx, dy), br = f
                P = self.parts[i]
                for j in range(n):
                    px = (P['x'][j] + dx * P['sp'][j] * lt) % (W + 200) - 100
                    py = (P['y'][j] + dy * P['sp'][j] * lt) % (H + 200) - 100
                    ln = P['ln'][j]
                    c = float(P['b'][j] * br)
                    cv2.line(addL, (int(px), int(py)), (int(px - dx * ln), int(py - dy * ln)), (c, c, c * 1.05), 1, cv2.LINE_AA)
            elif kind in ('dust', 'pollen'):
                n, col, br = f[1], (f[2] if kind == 'dust' else (1.0, 0.95, 0.7)), (f[3] if kind == 'dust' else 0.35)
                P = self.parts[i]
                px = (P['x'] + P['vx'] * lt) % self.cw
                py = (P['y'] + P['vy'] * lt + 2 * np.sin(lt * 0.8 + P['ph'])) % self.ch
                tw = 0.6 + 0.4 * np.sin(lt * 2.0 + P['ph'])
                for j in range(n):
                    sx, sy = S(px[j], py[j])
                    if 0 <= sx < W and 0 <= sy < H:
                        c = tuple(float(cc * br * tw[j]) for cc in col)
                        cv2.circle(addL, (int(sx), int(sy)), max(1, int(P['s'][j] * k / 3)), c, -1, cv2.LINE_AA)
            elif kind == 'sparks':
                _, n, _, col = f
                P = self.parts[i]
                tw = np.clip(np.sin(lt * P['sp'] + P['ph']), 0, 1) ** 6
                for j in range(n):
                    sx, sy = S(P['x'][j], P['y'][j])
                    if tw[j] > 0.05:
                        cv2.circle(glowL, (int(sx / 2), int(sy / 2)), max(1, int(k / 2)), tuple(float(c * 1.4 * tw[j]) for c in col), -1, cv2.LINE_AA)
            elif kind == 'screen':
                _, ax, ay, bx, by, col, inten = f
                (sx0, sy0), (sx1, sy1) = S(ax, ay), S(bx, by)
                sx0, sy0, sx1, sy1 = int(max(0, sx0)), int(max(0, sy0)), int(min(W, sx1)), int(min(H, sy1))
                if sx1 > sx0 and sy1 > sy0:
                    a = inten * (0.7 + 0.3 * noise1(lt * 13, i + self.seed)) * (0.6 if (int(lt * 24) % 37 == 0) else 1)
                    scan = (0.5 + 0.5 * np.sin((yy[sy0:sy1, sx0:sx1] + lt * 60) * 0.9)) * 0.5 + 0.5
                    addL[sy0:sy1, sx0:sx1] += scan[..., None] * np.float32(col) * a
            elif kind == 'glitch':
                _, (ax, ay, bx, by) = f
                (sx0, sy0), (sx1, sy1) = S(ax, ay), S(bx, by)
                sx0, sy0, sx1, sy1 = int(max(0, sx0)), int(max(0, sy0)), int(min(W, sx1)), int(min(H, sy1))
                if noise1(lt * 3, 99) > 0.35 and sy1 - sy0 > 20:
                    for g in range(4):
                        ry = int(sy0 + (sy1 - sy0) * abs(noise1(lt * 17 + g * 5, g)))
                        rh = 3 + g * 2
                        off = int(14 * noise1(lt * 31, g + 50))
                        band = frame[ry:ry + rh, sx0:sx1].copy()
                        frame[ry:ry + rh, sx0:sx1] = np.roll(band, off, axis=1)
            elif kind == 'glints':
                for j, (x, y) in enumerate(f[1]):
                    a = max(0.0, math.sin(lt * 1.3 + j * 2.1)) ** 12
                    if a > 0.02:
                        sx, sy = S(x, y)
                        L = int(18 * k / 2 * a + 2)
                        c = (1.6 * a, 1.6 * a, 1.6 * a)
                        cv2.line(addL, (int(sx - L), int(sy)), (int(sx + L), int(sy)), c, 1, cv2.LINE_AA)
                        cv2.line(addL, (int(sx), int(sy - L)), (int(sx), int(sy + L)), c, 1, cv2.LINE_AA)
                        cv2.circle(glowL, (int(sx / 2), int(sy / 2)), 3, c, -1, cv2.LINE_AA)
            elif kind == 'rays':
                _, x, y, col, inten = f
                if raysL is None:
                    raysL = np.zeros((hh, hw, 3), np.float32)
                sx, sy = S(x, y)
                for j in range(7):
                    ang = math.radians(60 + j * 10 + 3 * noise1(lt * 0.3, j))
                    a = inten * (0.5 + 0.5 * noise1(lt * 0.5, j + 20))
                    L = 2000
                    wdt = math.radians(2.2 + j % 3)
                    pts = np.array([[sx / 2, sy / 2],
                                    [(sx + L * math.cos(ang - wdt)) / 2, (sy + L * math.sin(ang - wdt)) / 2],
                                    [(sx + L * math.cos(ang + wdt)) / 2, (sy + L * math.sin(ang + wdt)) / 2]], np.int32)
                    cv2.fillConvexPoly(raysL, pts, tuple(float(c * a) for c in col), cv2.LINE_AA)
            elif kind == 'water':
                P = self.parts[i]
                for j in range(len(P['x'])):
                    u = (P['ph'][j] + lt * P['sp'][j]) % 1
                    yv = P['y0'] + (P['y1'] - P['y0']) * u
                    a, b = S(P['x'][j], yv), S(P['x'][j], yv + 12)
                    c = float(0.35 * math.sin(u * 3.14))
                    cv2.line(addL, (int(a[0]), int(a[1])), (int(b[0]), int(b[1])), (c, c, c), 1, cv2.LINE_AA)
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
                cv2.polylines(glowL, [pts], True, tuple(float(c * 1.1 * a) for c in GOLDF), max(1, int(k)), cv2.LINE_AA)
                c0 = S(cx, cy)
                cv2.circle(glowL, (int(c0[0] / 2), int(c0[1] / 2)), int(10 * k / 2), tuple(float(c * 0.5 * a) for c in GOLDF), -1, cv2.LINE_AA)
            elif kind == 'dying':
                for j, (x, y) in enumerate(f[1]):
                    on = noise1(lt * 2.2, j + 70) > -0.1 and noise1(lt * 15, j + 90) > -0.6
                    if on:
                        sx, sy = S(x, y)
                        cv2.circle(glowL, (int(sx / 2), int(sy / 2)), max(1, int(2.2 * k / 2)), (1.3, 0.85, 0.45), -1, cv2.LINE_AA)
            elif kind == 'dark':
                mult *= 1 - f[1]

        if mult != 1.0:
            frame = frame * mult
        g1 = cv2.GaussianBlur(glowL, (0, 0), 3)
        g2 = cv2.GaussianBlur(glowL, (0, 0), 14)
        glow = cv2.resize(g1 * 1.2 + g2 * 1.6, (W, H), interpolation=cv2.INTER_LINEAR)
        if raysL is not None:
            glow += cv2.resize(cv2.GaussianBlur(raysL, (0, 0), 10), (W, H), interpolation=cv2.INTER_LINEAR)
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
        lay = self.lay
        if z != 1:
            M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, z)
            lay = cv2.warpAffine(lay, M, (W, H), flags=cv2.INTER_LINEAR)
        return over(bg, lay, a)


# --------------------------------------------------------------------------- montage

def timeline():
    segs = [('card', 'intro'), ('card', 'p3')]
    for p in PANELS:
        if p['id'] == '4-1':
            segs.append(('card', 'p4'))
        segs.append(('panel', p))
    segs.append(('card', 'end'))
    out, t = [], 0.0
    XF = 0.6
    for kind, obj in segs:
        dur = CARDS[obj]['dur'] if kind == 'card' else obj['dur']
        trans = 'fade' if kind == 'card' else obj['trans']
        if trans == 'card':
            trans = 'fade'
        start = t - (XF if out and trans == 'fade' else 0)
        out.append(dict(kind=kind, obj=obj, start=start, dur=dur, trans=trans))
        t = start + dur
    return out, t


def main():
    outp = Path(sys.argv[1])
    outp.parent.mkdir(parents=True, exist_ok=True)
    segs, total = timeline()
    for s in segs:
        s['r'] = PanelRenderer(s['obj']) if s['kind'] == 'panel' else CardRenderer(CARDS[s['obj']])
    meta = [dict(kind=s['kind'], id=(s['obj']['id'] if s['kind'] == 'panel' else s['obj']), start=round(s['start'], 3),
                 dur=s['dur']) for s in segs]
    (outp.parent / 'timeline.json').write_text(json.dumps(dict(total=total, segs=meta), indent=1))
    n = int(round(total * FPS))
    only = None
    if len(sys.argv) > 3:  # images fixes de contrôle : temps séparés par des virgules
        only = [float(x) for x in sys.argv[3].split(',')]
    if only is None:
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                               '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17',
                               '-pix_fmt', 'yuv420p', str(outp)], stdin=subprocess.PIPE)
    times = only if only is not None else [i / FPS for i in range(n)]
    for fi, t in enumerate(times):
        act = [s for s in segs if s['start'] <= t < s['start'] + s['dur']]
        frame = None
        for s in act:
            f = s['r'].render(t - s['start'])
            if frame is None:
                frame = f
            else:
                a = smooth((t - s['start']) / 0.6) if s['trans'] == 'fade' else 1.0
                frame = frame * (1 - a) + f * a
        if frame is None:
            frame = np.zeros((H, W, 3), np.float32)
        # flash blanc d'enchaînement
        for s in segs:
            if s['trans'] == 'flash' and 0 <= t - s['start'] < 0.35:
                frame = frame + (1 - (t - s['start']) / 0.35) ** 2 * 0.9
        frame = frame + GRAIN[fi % 8]
        rgb = (np.clip(frame, 0, 1) * 255).astype(np.uint8)
        if only is not None:
            Image.fromarray(rgb).save(outp.parent / f'still_{t:06.2f}.jpg', quality=90)
        else:
            ff.stdin.write(rgb.tobytes())
            if fi % 240 == 0:
                print(f'{fi}/{n}', flush=True)
    if only is None:
        ff.stdin.close()
        ff.wait()
        print('vidéo', outp, f'{total:.1f} s')


if __name__ == '__main__':
    main()

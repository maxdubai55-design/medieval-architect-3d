"""Outils communs aux configurations d'animatique.

Dans une configuration, les positions s'écrivent en fractions de la case (0 à 1),
la largeur de cadre caméra aussi (1 = toute la largeur de la case).
`case()` convertit tout en pixels de case.
"""
from pathlib import Path

from PIL import Image

import layout

SRC = Path(__file__).resolve().parent / 'src'

ORANGE = (1.0, 0.62, 0.25)
BLUE = (0.45, 0.7, 1.0)
RED = (1.0, 0.18, 0.15)
CYAN = (0.35, 0.85, 1.0)
WARM = (1.0, 0.72, 0.38)
WHITE = (1.0, 1.0, 1.0)
GOLDF = (1.0, 0.8, 0.4)
GREY = (0.55, 0.55, 0.58)

SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
SERIF_B = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SANS = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
GOLD = (222, 184, 110)


def _pt(x, y, w, h):
    return x * w, y * h


def _rect(r, w, h):
    return (r[0] * w, r[1] * h, r[2] * w, r[3] * h)


def scale_fx(f, w, h):
    k = f[0]
    if k in ('glow',):
        return (k, f[1] * w, f[2] * h) + tuple(f[3:])
    if k in ('boom',):
        return (k, f[1], f[2] * w, f[3] * h, f[4])
    if k in ('bolts',):
        return (k, f[1], [_rect(r, w, h) for r in f[2]]) + tuple(f[3:])
    if k in ('screen',):
        return (k,) + _rect(f[1:5], w, h) + tuple(f[5:])
    if k in ('glitch', 'water', 'smoke'):
        return (k, _rect(f[1], w, h)) + tuple(f[2:])
    if k in ('sparks',):
        return (k, f[1], _rect(f[2], w, h)) + tuple(f[3:])
    if k in ('glints', 'dying', 'birds', 'twinkle'):
        return (k, [_pt(x, y, w, h) for x, y in f[1]]) + tuple(f[2:])
    if k in ('rays', 'vortex', 'radar', 'ring', 'ringglow'):
        return (k, f[1] * w, f[2] * h) + tuple(f[3:])
    if k in ('diamond',):
        return (k, f[1] * w, f[2] * h, f[3] * w, f[4] * h)
    if k in ('beams',):
        return (k, [_rect(r, w, h) for r in f[1]]) + tuple(f[2:])
    return f


def case(src, idx, label, title, text, cam, fx=(), dur=8.5, trans='fade', shake=0.6, roll=0.0,
         mood='tension', sfx=()):
    """Une case : src = nom de planche dans animatic/src, idx = 1..6 dans l'ordre de lecture."""
    path = SRC / f'{src}.png'
    box = layout.panels(path)[idx - 1]
    w, h = box[2] - box[0], box[3] - box[1]
    return dict(kind='panel', id=f'{src}-{idx}', src=str(path), box=box, label=label, title=title, text=text,
                cam=[(t, cx * w, cy * h, cw * w) for t, cx, cy, cw in cam],
                fx=[scale_fx(f, w, h) for f in fx], dur=dur, trans=trans, shake=shake, roll=roll,
                mood=mood, sfx=list(sfx))


def card(cid, dur, lines, mood='ouverture', sfx=()):
    return dict(kind='card', id=cid, dur=dur, lines=lines, mood=mood, sfx=list(sfx))


def title_card(cid, sub, dur=5.5, mood='ouverture'):
    return card(cid, dur, [('OTANE', SERIF_B, 90, GOLD), ('Le Cœur des mondes', SERIF, 38, GOLD), ('', SANS, 18, None),
                           (sub, SANS, 22, (205, 205, 205))], mood=mood, sfx=[(0.3, 'swell', 0.6), (4.0, 'chime', 0.3)])


def end_card(cid, mood='final'):
    return card(cid, 5.5, [('OTANE', SERIF_B, 70, GOLD), ('Le Cœur des mondes', SERIF, 32, GOLD), ('', SANS, 18, None),
                           ('Christian Bousquet', SERIF, 28, (220, 220, 220)),
                           ('Animatique de travail d’après les planches de storyboard — non contractuelle', SANS, 17,
                            (150, 150, 150))], mood=mood, sfx=[(0.5, 'swell', 0.4), (3.0, 'chime', 0.3)])


def size(path):
    return Image.open(path).size

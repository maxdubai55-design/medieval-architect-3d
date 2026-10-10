"""Détection automatique des cases d'une planche (2 rangées × 3 colonnes)."""
import numpy as np
from PIL import Image


def _groups(mask):
    g, s = [], None
    for i, v in enumerate(mask):
        if v and s is None:
            s = i
        if not v and s is not None:
            g.append((s, i - 1))
            s = None
    if s is not None:
        g.append((s, len(mask) - 1))
    return g


def panels(path):
    """Renvoie [(x0, y0, x1, y1)] des 6 zones d'image, dans l'ordre de lecture, sans bandeau ni légende."""
    a = np.asarray(Image.open(path).convert('L')).astype(float)
    cols = [g for g in _groups(a[150:900].mean(0) < 22) if g[1] - g[0] >= 3]
    rows = [g for g in _groups(a[:, 100:1350].mean(1) < 22) if g[1] - g[0] >= 2]
    xs = [(cols[i][1] + 5, cols[i + 1][0] - 4) for i in range(3)]
    cap1 = min(g[0] for g in rows if 400 < g[0] < 520)
    gut = max(g[1] for g in rows if cap1 < g[0] < 560)
    cap2 = min(g[0] for g in rows if g[0] > 900)
    ys = [(110, cap1 - 2), (gut + 42, cap2 - 2)]
    return [(x0, y0, x1, y1) for (y0, y1) in ys for (x0, x1) in xs]

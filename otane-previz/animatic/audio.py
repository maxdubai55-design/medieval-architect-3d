"""Bande-son d'une animatique : nappes par blocs d'ambiance + effets calés sur les cases.

Usage : python3 animatic/audio.py CONFIG sortie.wav
Les cases consécutives de même ambiance (`mood`) partagent une nappe musicale ;
les effets (`sfx`), les tirs et les explosions sont placés au temps exact de l'image.
Réutilise le synthétiseur de tools/score.py.
"""
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'tools'))
sys.path.insert(0, str(ROOT))
import score  # noqa: E402
import animatic  # noqa: E402

SR = score.SR
PRE = 0.5


def main():
    cfg = animatic.load_cfg(sys.argv[1])
    out = sys.argv[2]
    segs, total = animatic.timeline(cfg)
    blocks = []
    for s in segs:
        if blocks and blocks[-1]['mood'] == s['obj']['mood']:
            blocks[-1]['segs'].append(s)
        else:
            blocks.append(dict(mood=s['obj']['mood'], segs=[s]))
    mix = np.zeros((int((total + 2) * SR), 2))
    tmp = ROOT.parent / 'out' / 'animatic' / 'blocks'
    tmp.mkdir(parents=True, exist_ok=True)
    for bi, b in enumerate(blocks):
        start = b['segs'][0]['start']
        end = b['segs'][-1]['start'] + b['segs'][-1]['dur']
        cues = []
        for s in b['segs']:
            o = s['obj']
            s0 = s['start'] - start + PRE
            cues += [(s0 + t, k, g) for t, k, g in o.get('sfx', [])]
            if o['kind'] == 'panel':
                for f in o['fx']:
                    if f[0] == 'boom':
                        cues.append((s0 + f[1], 'boom', 0.8))
                pr = animatic.PanelRenderer(o)
                for j, f in enumerate(o['fx']):
                    if f[0] == 'bolts':
                        cues += [(s0 + t0, 'laser', 0.3) for t0, _, _ in pr.parts[j]]
        sc = dict(id=f'{sys.argv[1]}_{bi}', duration=end - start + PRE, music=dict(mood=b['mood']),
                  cues=[list(c) for c in cues], subs=[])
        path = score.render_scene(sc, tmp)
        with wave.open(str(path)) as w:
            a = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32767
        s = int(max(0, start - PRE) * SR)
        e = min(len(mix), s + len(a))
        mix[s:e] += a[: e - s]
        print('bloc', bi, b['mood'], f'{start:.1f}-{end:.1f}', flush=True)
    mix = mix[: int(total * SR)]
    mix = np.tanh(mix * 1.1) * 0.92
    with wave.open(out, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print('audio', out)


if __name__ == '__main__':
    main()

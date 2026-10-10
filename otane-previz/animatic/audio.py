"""Bande-son de l'animatique : nappes par blocs d'ambiance + effets calés sur les cases.

Usage : python3 animatic/audio.py out/animatic/timeline.json out/animatic/audio.wav
Réutilise le synthétiseur de tools/score.py.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'tools'))
sys.path.insert(0, str(ROOT))
import score  # noqa: E402
ARGS = sys.argv[1:3]
sys.argv = sys.argv[:1]
import animatic  # noqa: E402

SR = score.SR

# Effets par case : (temps local, type, gain)
CUES = {
    'intro': [(0.3, 'swell', 0.7), (4.5, 'chime', 0.35)],
    'p3': [(0.4, 'drone', 0.4)],
    '3-1': [(0.2, 'klaxon', 0.55), (1.5, 'hangar', 0.5), (3.0, 'engine', 0.6), (6.5, 'launch', 0.8), (7.2, 'flyby', 0.6)],
    '3-2': [(0.0, 'flyby', 0.7), (0.0, 'combat', 0.5)],
    '3-3': [(0.0, 'roar', 0.7), (5.9, 'alarm', 0.4), (6.6, 'flyby', 0.6)],
    '3-4': [(0.0, 'hum', 0.45), (2.0, 'scan', 0.3), (6.0, 'beep', 0.2)],
    '3-5': [(0.0, 'room', 0.5), (2.5, 'glass', 0.25), (6.0, 'laugh', 0.35), (8.5, 'glass', 0.2)],
    '3-6': [(0.0, 'room', 0.45), (1.0, 'radio', 0.35), (4.0, 'beep', 0.2), (7.0, 'radio', 0.3)],
    'p4': [(0.3, 'chime', 0.3)],
    '4-1': [(0.0, 'engine', 0.5), (1.0, 'swell', 0.5)],
    '4-2': [(0.0, 'tide', 0.5), (0.5, 'field', 0.25), (5.0, 'breath', 0.3)],
    '4-3': [(0.0, 'calm', 0.3), (3.5, 'chime', 0.35), (6.0, 'heart', 0.35)],
    '4-4': [(0.0, 'drone', 0.45), (2.0, 'signal', 0.35), (5.5, 'scan', 0.3), (8.0, 'signal', 0.3)],
    '4-5': [(0.0, 'hum', 0.35), (1.0, 'glitch', 0.4), (4.0, 'beep', 0.25), (6.5, 'glitch', 0.35)],
    '4-6': [(0.0, 'roar', 0.6), (1.2, 'flyby', 0.6), (7.5, 'flyby', 0.5)],
    'end': [(0.5, 'swell', 0.5), (3.0, 'chime', 0.3)],
}

# Blocs d'ambiance musicale : (ids couverts, ambiance)
BLOCKS = [
    (['intro', 'p3'], 'ouverture'),
    (['3-1', '3-2', '3-3'], 'combat'),
    (['3-4', '3-5', '3-6'], 'tension'),
    (['p4', '4-1', '4-2', '4-3'], 'merveille'),
    (['4-4', '4-5'], 'mystère'),
    (['4-6'], 'combat'),
    (['end'], 'final'),
]


def main():
    tl = json.loads(Path(ARGS[0]).read_text())
    segs = {s['id']: s for s in tl['segs']}
    panels = {p['id']: p for p in animatic.PANELS}
    total = tl['total']
    mix = np.zeros((int((total + 2) * SR), 2))
    tmp = ROOT.parent / 'out' / 'animatic' / 'blocks'
    tmp.mkdir(parents=True, exist_ok=True)
    PRE = 0.5
    for bi, (ids, mood) in enumerate(BLOCKS):
        start = segs[ids[0]]['start']
        end = segs[ids[-1]]['start'] + segs[ids[-1]]['dur']
        cues = []
        for i in ids:
            s0 = segs[i]['start'] - start + PRE
            cues += [(s0 + t, k, g) for t, k, g in CUES.get(i, [])]
            p = panels.get(i)
            if p:  # tirs et explosions synchronisés sur l'image
                for f in p['fx']:
                    if f[0] == 'boom':
                        cues.append((s0 + f[1], 'boom', 0.8))
                pr = animatic.PanelRenderer(p)
                for j, f in enumerate(p['fx']):
                    if f[0] == 'bolts':
                        cues += [(s0 + t0, 'laser', 0.3) for t0, _, _ in pr.parts[j]]
        sc = dict(id=f'b{bi}', duration=end - start + 2 * PRE - 0.5, music=dict(mood=mood),
                  cues=[list(c) for c in cues], subs=[])
        path = score.render_scene(sc, tmp)
        with wave.open(str(path)) as w:
            a = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, 2) / 32767
        s = int(max(0, start - PRE) * SR)
        e = min(len(mix), s + len(a))
        mix[s:e] += a[: e - s]
        print('bloc', bi, mood, f'{start:.1f}-{end:.1f}')
    mix = mix[: int(total * SR)]
    mix = np.tanh(mix * 1.1) * 0.92
    with wave.open(ARGS[1], 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print('audio', ARGS[1])


if __name__ == '__main__':
    main()

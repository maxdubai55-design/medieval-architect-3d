"""Bande-son de previz : nappe musicale par ambiance + effets synthétisés aux repères de chaque séquence.

Usage : python3 tools/score.py out/scenes.json out/audio
Sortie : un WAV stéréo 48 kHz par séquence. Son de maquette, pas de mixage définitif.
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.01, r=0.3, hold=0.0):
    """Enveloppe attaque / maintien / déclin exponentiel, en secondes."""
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4))
    rel = np.where(t > a + hold, np.exp(-(t - a - hold) / max(r, 1e-4)), 1.0)
    return e * rel


def lowpass(x, cutoff):
    """Passe-bas un pôle (suffisant pour une maquette)."""
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    # boucle par blocs pour garder une vitesse raisonnable
    b = 1 - a
    for i in range(len(x)):
        acc = b * x[i] + a * acc
        y[i] = acc
    return y


def lp_fast(x, cutoff):
    """Passe-bas approximatif par moyenne glissante (rapide)."""
    k = max(1, int(SR / cutoff / 2))
    c = np.cumsum(np.concatenate([np.zeros(k), x]))
    return (c[k:] - c[:-k]) / k


def noise(d):
    return rng.standard_normal(int(d * SR))


def saw(f, t, harm=8):
    out = np.zeros_like(t)
    for h in range(1, harm + 1):
        out += np.sin(2 * np.pi * f * h * t) / h
    return out


def note(f, d, kind='pad'):
    t = t_axis(d)
    if kind == 'pad':
        x = 0.5 * saw(f * 0.998, t, 5) + 0.5 * saw(f * 1.003, t, 5)
        return lp_fast(x, 900) * env(len(t), a=d * 0.35, r=d * 0.4, hold=d * 0.2)
    if kind == 'pluck':
        x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.1 * np.sin(6 * np.pi * f * t)
        return x * env(len(t), a=0.005, r=d * 0.35)
    if kind == 'bell':
        x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t)
        return x * env(len(t), a=0.002, r=d * 0.3)
    if kind == 'sub':
        return np.sin(2 * np.pi * f * t) * env(len(t), a=0.02, r=d * 0.5, hold=d * 0.2)
    return np.zeros_like(t)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# Progressions d'accords (notes MIDI) par ambiance
MOODS = {
    'ouverture': ([[45, 52, 57, 60], [43, 50, 55, 62], [41, 48, 53, 60], [45, 52, 57, 64]], 9, 0.22, None),
    'tension': ([[40, 47, 50, 55], [41, 48, 51, 56], [40, 47, 50, 55], [39, 46, 50, 54]], 8, 0.16, 'ostinato'),
    'merveille': ([[48, 55, 59, 64], [45, 52, 57, 64], [41, 48, 57, 64], [43, 50, 55, 62]], 8, 0.2, 'bells'),
    'énergie': ([[45, 52, 57, 64], [48, 55, 60, 64], [43, 50, 55, 62], [41, 48, 53, 60]], 4, 0.16, 'pulse'),
    'combat': ([[40, 47, 52, 55], [43, 50, 55, 58], [38, 45, 50, 53], [41, 48, 53, 56]], 4, 0.14, 'drums'),
    'mystère': ([[44, 51, 56, 59], [42, 49, 54, 61], [44, 51, 55, 60], [40, 47, 52, 59]], 10, 0.2, 'bells'),
    'deuil': ([[45, 52, 55, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]], 9, 0.18, 'piano'),
    'final': ([[48, 55, 60, 64], [43, 50, 59, 62], [45, 52, 60, 64], [41, 48, 57, 65]], 8, 0.2, 'bells'),
}


def music(duration, mood):
    chords, bar, gain, extra = MOODS.get(mood, MOODS['tension'])
    n = int(duration * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    t0 = 0.0
    i = 0
    while t0 < duration:
        ch = chords[i % len(chords)]
        d = bar * 1.6
        for k, m in enumerate(ch):
            x = note(hz(m), d, 'pad') * gain / len(ch)
            s = int(t0 * SR)
            e = min(n, s + len(x))
            pan = 0.35 + 0.3 * (k % 2)
            L[s:e] += x[: e - s] * (1 - pan)
            R[s:e] += x[: e - s] * pan
        sub = note(hz(ch[0] - 12), d, 'sub') * gain * 0.6
        s = int(t0 * SR)
        e = min(n, s + len(sub))
        L[s:e] += sub[: e - s]
        R[s:e] += sub[: e - s]
        if extra == 'bells' and i % 2 == 0:
            for j, m in enumerate(ch[1:]):
                b = note(hz(m + 12), 3.0, 'bell') * gain * 0.25
                ss = int((t0 + 1.5 + j * 1.1) * SR)
                ee = min(n, ss + len(b))
                if ss < n:
                    L[ss:ee] += b[: ee - ss] * 0.7
                    R[ss:ee] += b[: ee - ss]
        if extra == 'piano':
            for j in range(4):
                m = ch[(j * 2 + i) % len(ch)] + 12
                b = note(hz(m), 2.5, 'pluck') * gain * 0.35
                ss = int((t0 + j * bar / 4) * SR)
                ee = min(n, ss + len(b))
                if ss < n:
                    L[ss:ee] += b[: ee - ss]
                    R[ss:ee] += b[: ee - ss] * 0.8
        t0 += bar
        i += 1
    if extra in ('ostinato', 'pulse', 'drums'):
        bpm = {'ostinato': 84, 'pulse': 112, 'drums': 96}[extra]
        beat = 60 / bpm
        k = 0
        tb = 0.0
        while tb < duration:
            ch = chords[int(tb / bar) % len(chords)]
            if extra in ('ostinato', 'pulse'):
                m = ch[0] + (12 if k % 2 else 0)
                x = note(hz(m), beat * 0.9, 'pluck') * gain * 0.5
            else:
                x = kick(0.5) * gain * (1.4 if k % 4 == 0 else 0.7)
                if k % 2 == 1:
                    x = taiko(0.6) * gain * 0.9
            s = int(tb * SR)
            e = min(n, s + len(x))
            L[s:e] += x[: e - s]
            R[s:e] += x[: e - s]
            tb += beat / (2 if extra == 'pulse' else 1)
            k += 1
    return L, R


def kick(d=0.5):
    t = t_axis(d)
    f = 50 + 120 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env(len(t), a=0.002, r=0.18)


def taiko(d=0.6):
    t = t_axis(d)
    f = 80 + 60 * np.exp(-t * 20)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.4 * lp_fast(noise(d), 1500)
    return x * env(len(t), a=0.003, r=0.22)


def sweep(d, f0, f1, nz=0.0, cutoff=4000):
    t = t_axis(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * (1 - nz)
    if nz:
        x = x + lp_fast(noise(d), cutoff) * nz * 3
    return x


def sfx(kind, g):
    """Renvoie un signal mono pour un repère donné."""
    if kind in ('impact', 'hit', 'thud', 'punch'):
        d = 0.9
        x = lp_fast(noise(d), 700) * 3 * env(int(d * SR), 0.002, 0.25) + kick(d) * 0.8
        if kind == 'punch':
            x = lp_fast(noise(0.4), 1200) * 3 * env(int(0.4 * SR), 0.001, 0.08) + kick(0.4)
        return x * g
    if kind == 'boom':
        d = 3.0
        x = lp_fast(noise(d), 300) * 4 * env(int(d * SR), 0.01, 0.9) + kick(d) * 1.2
        return x * g
    if kind in ('clank', 'metal', 'crack', 'glass', 'cut', 'switch', 'brake', 'kick'):
        d = 1.2
        base = {'clank': 300, 'metal': 520, 'crack': 2200, 'glass': 3200, 'cut': 180, 'switch': 1500, 'brake': 140, 'kick': 90}[kind]
        x = sum(np.sin(2 * np.pi * base * r * t_axis(d)) for r in (1, 1.37, 2.11, 2.93)) * env(int(d * SR), 0.001, 0.25)
        x += lp_fast(noise(d), base * 3) * env(int(d * SR), 0.001, 0.05) * 3
        if kind in ('cut', 'brake'):
            x = lp_fast(noise(1.5), 400) * 3 * env(int(1.5 * SR), 0.01, 0.6)
        return x * g * 0.6
    if kind in ('beep', 'tick', 'click', 'boot'):
        d = {'beep': 0.18, 'tick': 0.05, 'click': 0.04, 'boot': 0.35}[kind]
        f = {'beep': 1760, 'tick': 3000, 'click': 2400, 'boot': 660}[kind]
        return np.sin(2 * np.pi * f * t_axis(d)) * env(int(d * SR), 0.002, d * 0.6) * g * 0.5
    if kind == 'ticks':
        out = np.zeros(int(6 * SR))
        for i in range(30):
            s = int(i * 0.2 * SR)
            x = lp_fast(noise(0.03), 5000) * env(int(0.03 * SR), 0.001, 0.01) * 2
            out[s:s + len(x)] += x
        return out * g
    if kind in ('knock1', 'knock2', 'knock3'):
        n = int(kind[-1])
        out = np.zeros(int(2 * SR))
        for i in range(n):
            x = taiko(0.25) * 0.8
            s = int(i * 0.28 * SR)
            out[s:s + len(x)] += x
        return out * g
    if kind in ('chime', 'twelve'):
        out = np.zeros(int(5 * SR))
        notes = [76, 79, 83, 88] if kind == 'chime' else [72 + (i * 7) % 24 for i in range(12)]
        for i, m in enumerate(notes):
            x = note(hz(m), 2.5, 'bell') * 0.3
            s = int(i * (0.25 if kind == 'twelve' else 0.4) * SR)
            e = min(len(out), s + len(x))
            out[s:e] += x[: e - s]
        return out * g
    if kind in ('beacon', 'beacon8', 'signal', 'scan'):
        d = {'beacon': 6, 'beacon8': 12, 'signal': 3, 'scan': 2.5}[kind]
        t = t_axis(d)
        if kind == 'scan':
            gate = ((t % 2.5) < 0.9) * 1.0 + (((t % 2.5) > 1.2) & ((t % 2.5) < 1.35)) + (((t % 2.5) > 1.6) & ((t % 2.5) < 1.75))
            return np.sin(2 * np.pi * 220 * t) * np.clip(gate, 0, 1) * g * 0.4
        period = {'beacon': 0.5, 'beacon8': 2.2, 'signal': 0.4}[kind]
        gate = ((t % period) < 0.12).astype(float)
        f = 880 if kind == 'beacon8' else 520 + 300 * (t / d)
        return np.sin(2 * np.pi * f * t) * lp_fast(gate, 200) * g * 0.35
    if kind in ('alarm', 'klaxon', 'lock'):
        d = {'alarm': 3.5, 'klaxon': 5, 'lock': 2.5}[kind]
        t = t_axis(d)
        if kind == 'klaxon':
            x = saw(220, t, 6) * (np.sin(2 * np.pi * 1.2 * t) > 0)
        elif kind == 'lock':
            x = np.sin(2 * np.pi * 1320 * t) * ((t * 8) % 1 < 0.5)
        else:
            x = np.sin(2 * np.pi * np.where((t * 2) % 1 < 0.5, 880, 660) * t)
        return lp_fast(x, 3000) * g * 0.25
    if kind in ('whoosh', 'flyby'):
        d = 1.6
        x = lp_fast(noise(d), 2500) * env(int(d * SR), d * 0.5, 0.3) * 2.5
        return x * g
    if kind in ('rise', 'swell', 'enter', 'jump', 'launch'):
        d = {'rise': 5, 'swell': 6, 'enter': 6, 'jump': 2.5, 'launch': 1.5}[kind]
        x = sweep(d, 80, 900 if kind != 'swell' else 220, nz=0.4, cutoff=3000) * np.linspace(0, 1, int(d * SR)) ** 2
        if kind == 'swell':
            x = sum(note(hz(m), d, 'pad') for m in (57, 64, 69, 73)) * 0.4
        return x * g * 0.6
    if kind in ('emp', 'glitch'):
        d = 1.2
        t = t_axis(d)
        x = np.sign(np.sin(2 * np.pi * 60 * t)) * lp_fast(noise(d), 4000) * env(int(d * SR), 0.001, 0.3)
        return x * g * 0.6
    if kind == 'tear':
        d = 2.0
        return sweep(d, 400, 60, nz=0.6, cutoff=1800) * env(int(d * SR), 0.05, 0.6) * g * 0.6
    if kind in ('scrape', 'spark', 'fizzle'):
        d = {'scrape': 1.4, 'spark': 0.9, 'fizzle': 0.6}[kind]
        x = noise(d) * (np.abs(np.sin(np.arange(int(d * SR)) * 0.013)) ** 6) * 0.8
        return x * env(int(d * SR), 0.01, d * 0.6) * g
    if kind in ('laser',):
        d = 0.35
        return sweep(d, 2400, 300) * env(int(d * SR), 0.001, 0.12) * g * 0.45
    if kind in ('engine', 'engine97', 'roar', 'rumble', 'convoy', 'cruiser', 'engineoff', 'die'):
        d = {'engine': 6, 'engine97': 6, 'roar': 8, 'rumble': 5, 'convoy': 10, 'cruiser': 7, 'engineoff': 3, 'die': 3}[kind]
        t = t_axis(d)
        base = {'engine': 55, 'engine97': 70, 'roar': 45, 'rumble': 40, 'convoy': 38, 'cruiser': 32, 'engineoff': 55, 'die': 60}[kind]
        f = base * (1 + (0.6 * t / d if kind == 'engine97' else 0)) * (1 - (0.7 * t / d if kind in ('engineoff', 'die') else 0))
        ph = 2 * np.pi * np.cumsum(f) / SR
        x = saw(1, ph / (2 * np.pi), 1) * 0 + np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * lp_fast(noise(d), 400) * 4
        if kind == 'engine97':
            x += 0.3 * np.sin(2 * np.pi * 11 / 11 * t) * np.sin(ph * 3)
        return x * env(len(t), d * 0.15, d * 0.4, d * 0.3) * g * 0.35
    if kind in ('drone', 'hum', 'tension', 'tide', 'field', 'memory', 'room', 'hangar', 'calm', 'heart', 'pulse', 'combat', 'theme', 'tractor', 'radio', 'voice', 'branch'):
        d = {'drone': 12, 'hum': 10, 'tension': 8, 'tide': 14, 'field': 4, 'memory': 10, 'room': 10, 'hangar': 8, 'calm': 6, 'heart': 8,
             'pulse': 6, 'combat': 6, 'theme': 14, 'tractor': 5, 'radio': 2.5, 'voice': 8, 'branch': 2}[kind]
        t = t_axis(d)
        if kind == 'heart':
            x = sum(np.sin(2 * np.pi * f * t) for f in (55, 82.5, 110)) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.5 * t))
        elif kind in ('radio', 'voice'):
            x = lp_fast(noise(d), 2500) * (0.3 + 0.7 * (np.sin(2 * np.pi * 3.1 * t) > 0)) * 0.5
            if kind == 'voice':
                x = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 4 * t)) for f in (180, 270, 360)) * (0.3 + 0.7 * np.abs(np.sin(2 * np.pi * 2.3 * t))) * 0.3
        elif kind == 'branch':
            x = sweep(d, 600, 120) * 0.6
        elif kind == 'pulse':
            x = sum(kick(0.4) for _ in range(1))
            x = np.tile(np.concatenate([x, np.zeros(int(0.6 * SR) - len(x))]), int(d / 0.6) + 1)[: int(d * SR)]
        else:
            f0 = {'drone': 41.2, 'hum': 110, 'tension': 49, 'tide': 36.7, 'field': 220, 'memory': 65.4, 'room': 98, 'hangar': 73.4,
                  'calm': 82.4, 'combat': 41.2, 'theme': 65.4, 'tractor': 130.8}[kind]
            x = np.sin(2 * np.pi * f0 * t) + 0.5 * np.sin(2 * np.pi * f0 * 1.5 * t) + 0.25 * lp_fast(noise(d), f0 * 6) * 3
        return x * env(len(t), min(2.0, d * 0.25), d * 0.35, d * 0.3) * g * 0.3
    if kind == 'breath':
        d = 70
        t = t_axis(d)
        cyc = np.sin(2 * np.pi * t / 3.6)
        x = lp_fast(noise(d), 1200) * np.clip(cyc, 0, 1) ** 2 * 1.4
        return x * g * 0.5
    if kind in ('airlock', 'door', 'canopy', 'roll', 'pat', 'steps', 'brush', 'link', 'laugh', 'arm'):
        d = {'airlock': 2, 'door': 2.5, 'canopy': 1.5, 'roll': 2, 'pat': 0.3, 'steps': 2, 'brush': 2, 'link': 1.2, 'laugh': 0.4, 'arm': 0.8}[kind]
        if kind in ('pat', 'steps'):
            out = np.zeros(int(d * SR))
            for i in range(1 if kind == 'pat' else 6):
                x = lp_fast(noise(0.08), 900) * env(int(0.08 * SR), 0.001, 0.02) * 3
                s = int(i * 0.32 * SR)
                out[s:s + len(x)] += x
            return out * g
        if kind == 'laugh':
            return lp_fast(noise(d), 900) * env(int(d * SR), 0.01, 0.12) * g
        if kind == 'arm':
            return sweep(d, 300, 1200) * env(int(d * SR), 0.01, 0.4) * g * 0.4
        x = lp_fast(noise(d), 600 if kind != 'link' else 2500) * env(int(d * SR), 0.05, d * 0.4) * 2
        return x * g
    if kind == 'silence':
        return None
    return None


def render_scene(sc, outdir):
    d = sc['duration'] + 0.5
    n = int(d * SR)
    L, R = music(d, sc['music']['mood'])
    L = L[:n]
    R = R[:n]
    duck = np.ones(n)
    fx = np.zeros(n)
    for t, kind, g in sc['cues']:
        if kind == 'silence':
            s = int(t * SR)
            e = min(n, s + int(3.0 * SR))
            ramp = np.concatenate([np.linspace(1, 0.08, int(0.3 * SR)), np.full(max(0, e - s - int(0.6 * SR)), 0.08), np.linspace(0.08, 1, int(0.3 * SR))])
            duck[s:s + len(ramp)] = np.minimum(duck[s:s + len(ramp)], ramp[: max(0, min(len(ramp), n - s))])
            continue
        x = sfx(kind, g)
        if x is None:
            continue
        s = int(t * SR)
        e = min(n, s + len(x))
        if s < n:
            fx[s:e] += x[: e - s]
    # Les dialogues baissent légèrement la musique (place pour les voix témoins à venir)
    for t, dur, who, _ in sc['subs']:
        s = int(t * SR)
        e = min(n, int((t + dur) * SR))
        duck[s:e] = np.minimum(duck[s:e], 0.7)
    duck = lp_fast(duck, 4)[:n]
    fade = np.ones(n)
    fi = int(1.0 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fo = int(1.5 * SR)
    fade[-fo:] = np.linspace(1, 0, fo)
    left = (L * duck + fx * 0.9) * fade
    right = (R * duck + fx * 0.9) * fade
    st = np.stack([left, right], axis=1)
    rms = float(np.sqrt(np.mean(st ** 2))) or 1
    st = np.tanh(st * (0.11 / rms)) * 0.9
    pcm = (st * 32767).astype(np.int16)
    path = Path(outdir) / f"s{sc['id']}.wav"
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    return path


if __name__ == '__main__':
    data = json.load(open(sys.argv[1]))
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    only = sys.argv[3:] or None
    for sc in data:
        if only and sc['id'] not in only:
            continue
        p = render_scene(sc, out)
        print('audio', p)

// Outils déterministes : le même temps donne toujours la même image.

export function rng(seed = 1) {
  let a = seed >>> 0;
  const f = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.range = (lo, hi) => lo + (hi - lo) * f();
  f.sign = () => (f() < 0.5 ? -1 : 1);
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  return f;
}

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const easeIn = (t) => t * t * t;
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const ramp = (a, b, x) => smooth(inv(a, b, x));
export const pulse = (x, a, b, fade = 0.2) => ramp(a, a + fade, x) * (1 - ramp(b - fade, b, x));

export function lerp3(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

// Bruit 1D lissé, utilisé pour la caméra portée et les vibrations.
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export function noise1(x) {
  const i = Math.floor(x);
  const f = x - i;
  return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1;
}
export function shake(t, freq = 1, seed = 0) {
  return [
    noise1(t * freq + seed) + 0.5 * noise1(t * freq * 2.1 + seed + 17),
    noise1(t * freq + seed + 41) + 0.5 * noise1(t * freq * 2.3 + seed + 59),
    noise1(t * freq + seed + 83),
  ];
}

// Interpolation par images-clés : keys = [[t, value], ...], value scalaire ou tableau.
export function keys(list, t, ease = smooth) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 0; i < list.length - 1; i++) {
    const [t0, v0] = list[i];
    const [t1, v1] = list[i + 1];
    if (t <= t1) {
      const u = ease(inv(t0, t1, t));
      if (Array.isArray(v0)) return v0.map((v, k) => lerp(v, v1[k], u));
      return lerp(v0, v1, u);
    }
  }
  return list[list.length - 1][1];
}

// Formatage mm:ss pour les comptes à rebours affichés.
export function mmss(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

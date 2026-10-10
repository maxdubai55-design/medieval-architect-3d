import * as THREE from 'three';
import { rng } from './util.js';
import { glow } from './fx.js';

// Convention : tous les vaisseaux regardent vers +Z (Object3D.lookAt oriente le nez vers la cible).

const cache = new Map();

// Texture de coque : panneaux, rivets, salissures. Générée une fois.
export function hullTexture(kind = 'worn') {
  if (cache.has('hull-' + kind)) return cache.get('hull-' + kind);
  const r = rng(kind.length * 31 + 7);
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  const base = { worn: '#8d8e8c', clean: '#c9ccd0', dark: '#2a2c30', black: '#121316', rust: '#7b6a58', teal: '#3f5d63' }[kind] || '#888';
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 512);
  // Plaques
  for (let i = 0; i < 70; i++) {
    const w = 30 + r() * 150, h = 20 + r() * 110;
    const x = r() * 512, y = r() * 512;
    const v = (r() - 0.5) * (kind === 'clean' ? 18 : 40);
    g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`;
    g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.lineWidth = 1.2;
    g.strokeRect(x, y, w, h);
  }
  // Lignes de panneaux régulières
  g.strokeStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 512; i += 128) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke();
  }
  if (kind !== 'clean') {
    // Salissures, coulures, brûlures
    for (let i = 0; i < 40; i++) {
      const x = r() * 512, y = r() * 512, rad = 10 + r() * 60;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, `rgba(20,15,10,${0.15 + r() * 0.25})`);
      grd.addColorStop(1, 'rgba(20,15,10,0)');
      g.fillStyle = grd;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  }
  // Rivets
  g.fillStyle = 'rgba(0,0,0,0.4)';
  for (let i = 0; i < 600; i++) g.fillRect(r() * 512, r() * 512, 1.5, 1.5);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set('hull-' + kind, t);
  return t;
}

export function hullMat(kind = 'worn', opts = {}) {
  return new THREE.MeshStandardMaterial({
    map: hullTexture(kind),
    color: opts.color ?? 0xffffff,
    roughness: opts.roughness ?? 0.65,
    metalness: opts.metalness ?? 0.45,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
  });
}

export const lightMat = (color, intensity = 2) =>
  new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: intensity, roughness: 1, metalness: 0 });

export const glassMat = (tint = 0x9fd6ff, opacity = 0.35) =>
  new THREE.MeshPhysicalMaterial({ color: tint, roughness: 0.05, metalness: 0.1, transparent: true, opacity, envMapIntensity: 1, clearcoat: 1 });

function part(parent, geo, mat, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...p);
  m.rotation.set(...r);
  m.scale.set(...s);
  parent.add(m);
  return m;
}
// Les UV sont mis à l'échelle du monde : une texture couvre UNIT mètres, quelle que soit la pièce.
const UNIT = 5;
function box(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0] / UNIT, uv.getY(i) * dims[f][1] / UNIT);
  }
  return g;
}
function cyl(rt, rb, h, seg = 16) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  const uv = g.attributes.uv;
  const circ = (Math.PI * 2 * Math.max(rt, rb)) / UNIT;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, circ), uv.getY(i) * Math.max(1, h / UNIT));
  return g;
}
export { box, cyl };
export function scaleUV(geo, su, sv) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  return geo;
}

// Petits volumes répétés qui donnent l'échelle aux coques.
export function greebles(parent, { count = 40, size = [0.6, 0.4, 0.8], area = [4, 1, 8], center = [0, 0, 0], seed = 3, mat }) {
  const r = rng(seed);
  const g = new THREE.BoxGeometry(1, 1, 1);
  const im = new THREE.InstancedMesh(g, mat, count);
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    d.position.set(center[0] + (r() - 0.5) * area[0], center[1] + (r() - 0.5) * area[1], center[2] + (r() - 0.5) * area[2]);
    d.scale.set(size[0] * (0.3 + r()), size[1] * (0.3 + r()), size[2] * (0.3 + r()));
    d.rotation.set(0, (r() < 0.5 ? 0 : Math.PI / 2), 0);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
  }
  parent.add(im);
  return im;
}

// Tuyère avec halo, intensité réglable via userData.setThrust(k).
function engine(parent, p, radius, color = 0x8fc8ff) {
  const nozzle = part(parent, cyl(radius * 0.8, radius, radius * 1.6, 18), hullMat('dark'), p, [Math.PI / 2, 0, 0]);
  const core = part(parent, new THREE.CircleGeometry(radius * 0.7, 18), lightMat(new THREE.Color(color).multiplyScalar(0.7), 3), [p[0], p[1], p[2] - radius * 0.81], [0, Math.PI, 0]);
  const g = glow(color, radius * 4, 0.6);
  g.position.set(p[0], p[1], p[2] - radius * 1.2);
  parent.add(g);
  const plume = glow(color, radius * 3, 0.5);
  plume.position.set(p[0], p[1], p[2] - radius * 3);
  parent.add(plume);
  return { nozzle, core, g, plume, radius };
}

function attachEngines(grp, engines) {
  grp.userData.engines = engines;
  grp.userData.setThrust = (k, which) => {
    engines.forEach((e, i) => {
      const kk = Array.isArray(k) ? k[i] ?? k[0] : k;
      if (which !== undefined && which !== i) return;
      e.core.material.emissiveIntensity = 0.15 + 0.9 * kk;
      e.g.material.opacity = 0.08 + 0.55 * kk;
      e.g.scale.setScalar(e.radius * (2 + 3.5 * kk));
      e.plume.material.opacity = 0.6 * kk;
      e.plume.scale.setScalar(e.radius * (1 + 6 * kk));
      e.plume.position.z = e.nozzle.position.z - e.radius * (1.5 + 4 * kk);
    });
  };
  grp.userData.setThrust(0.5);
}

function navLights(grp, list) {
  const lights = list.map(([p, c, s]) => {
    const l = glow(c, s ?? 0.8, 1, 'hard');
    l.position.set(...p);
    grp.add(l);
    return l;
  });
  grp.userData.nav = lights;
  grp.userData.blink = (t) => lights.forEach((l, i) => (l.material.opacity = (Math.sin(t * 4 + i * 2) > 0.3 ? 1 : 0.15)));
  return lights;
}

function cockpitLight(grp, p, color, intensity = 3, dist = 6) {
  const l = new THREE.PointLight(color, intensity, dist, 2);
  l.position.set(...p);
  grp.add(l);
  return l;
}

// Récupérateur de Balam : court, asymétrique, nez décapé, plaque dépareillée à droite.
export function recuperateur() {
  const g = new THREE.Group();
  const hull = hullMat('worn');
  const hull2 = hullMat('rust');
  const dark = hullMat('dark');
  part(g, box(3.2, 2, 6), hull, [0, 0, 0]);
  part(g, cyl(1.1, 1.5, 2.6, 10), hull2, [0, 0.1, 4], [Math.PI / 2, 0, 0]); // nez décapé
  part(g, new THREE.SphereGeometry(1.05, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), glassMat(0xffc890, 0.45), [0, 0.95, 3.2]);
  part(g, box(2.6, 1.2, 4), dark, [0, -1.5, -0.2]); // soute ventrale
  part(g, box(0.25, 1.8, 3.4), hullMat('teal', { color: 0x99aa99 }), [1.72, 0.1, 0.6]); // plaque récupérée
  part(g, box(0.5, 0.5, 2.2), dark, [-1.9, -0.6, 1.4]); // bras d'amarrage
  part(g, box(0.3, 0.3, 1.5), dark, [-1.9, -0.6, 2.9], [0.3, 0, 0]);
  greebles(g, { count: 30, size: [0.4, 0.3, 0.5], area: [3, 0.3, 5], center: [0, 1.05, -0.5], seed: 2, mat: dark });
  greebles(g, { count: 16, size: [0.3, 0.3, 0.5], area: [0.2, 1.5, 5], center: [-1.65, 0, 0], seed: 5, mat: dark });
  const e = [engine(g, [-0.9, 0, -3.3], 0.6, 0xffb070), engine(g, [0.9, 0, -3.3], 0.6, 0xffb070)];
  attachEngines(g, e);
  navLights(g, [[[1.7, 0, 2], 0x30ff60, 0.6], [[-1.7, 0, 2], 0xff3030, 0.6], [[0, 1.2, -2.5], 0xffffff, 0.5]]);
  g.userData.cockpit = cockpitLight(g, [0, 1.2, 3.2], 0xffa060, 4, 4);
  // Phares de travail
  const head = glow(0xfff4d0, 3, 0.9);
  head.position.set(0.8, -0.4, 5.3);
  g.add(head);
  g.userData.head = head;
  return g;
}

// Appareil de Glide : proue large, deux nacelles séparées, profil bas.
export function glideShip() {
  const g = new THREE.Group();
  const hull = hullMat('teal', { color: 0x8fb5b8, metalness: 0.6, roughness: 0.4 });
  const dark = hullMat('dark');
  const prow = part(g, cyl(0.2, 3.4, 5, 6), hull, [0, 0, 1.5], [Math.PI / 2, 0, 0], [1, 1, 0.35]);
  prow.rotation.z = Math.PI / 6;
  part(g, box(5.5, 0.9, 3.5), hull, [0, 0, -1.4]);
  part(g, new THREE.SphereGeometry(0.9, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), glassMat(0x6fd0ff, 0.5), [0, 0.45, 0.4], [0, 0, 0], [1.3, 0.6, 1.6]);
  for (const sx of [-1, 1]) {
    part(g, cyl(0.75, 0.9, 5.5, 14), dark, [sx * 3.6, -0.2, -1.6], [Math.PI / 2, 0, 0]);
    part(g, box(1.6, 0.25, 1.8), hull, [sx * 2.8, -0.1, -1.2]);
  }
  greebles(g, { count: 24, size: [0.3, 0.2, 0.6], area: [4.5, 0.2, 3], center: [0, 0.5, -1.4], seed: 9, mat: dark });
  part(g, box(0.25, 0.25, 2.2), dark, [1.0, -0.55, 2.4]); // canon droit
  part(g, box(0.25, 0.25, 2.2), dark, [-1.0, -0.55, 2.4]);
  const e = [engine(g, [-3.6, -0.2, -4.4], 0.7, 0x7fe0ff), engine(g, [3.6, -0.2, -4.4], 0.7, 0x7fe0ff)];
  attachEngines(g, e);
  navLights(g, [[[3.6, 0.6, -0.5], 0x30ff90, 0.6], [[-3.6, 0.6, -0.5], 0x30ff90, 0.6]]);
  g.userData.cockpit = cockpitLight(g, [0, 0.9, 0.5], 0x4fb8ff, 5, 4);
  return g;
}

// L'Indocile : biplace ancien, épaules larges, nez étroit greffé, deux masses de propulsion disproportionnées.
export function indocile({ mark = false } = {}) {
  const g = new THREE.Group();
  const hull = hullMat('worn', { color: 0xaab0b4 });
  const band = hullMat('dark', { color: 0x777777 });
  const patch = hullMat('rust', { color: 0xb0a090 });
  const dark = hullMat('dark');
  part(g, box(3.4, 1.6, 5.2), hull, [0, 0, 0]);
  part(g, box(3.45, 0.4, 5.25), band, [0, 0.3, 0]); // bande sombre sous le gris
  part(g, cyl(0.45, 1.0, 4.2, 10), hull, [0, 0.05, 4.4], [Math.PI / 2, 0, 0]); // nez étroit
  // Verrière tandem, poste arrière surélevé
  part(g, new THREE.CapsuleGeometry(0.62, 2.6, 6, 12), glassMat(0xbfe6ff, 0.4), [0, 0.95, 1.6], [Math.PI / 2, 0, 0], [1, 1, 0.8]);
  part(g, new THREE.SphereGeometry(0.62, 14, 8), glassMat(0xbfe6ff, 0.4), [0, 1.15, 0.2], [0, 0, 0], [1, 0.9, 1.1]);
  for (const sx of [-1, 1]) {
    part(g, cyl(1.05, 1.25, 4.6, 16), dark, [sx * 2.35, -0.1, -1.6], [Math.PI / 2, 0, 0]);
    part(g, box(0.15, 0.7, 3.8), hull, [sx * 1.78, -0.45, 0.6], [0, 0, sx * 0.25]); // ailettes repliées
  }
  part(g, box(0.18, 1.2, 1.8), patch, [-1.72, 0.05, 1.5]); // panneau dépareillé flanc gauche
  part(g, cyl(0.12, 0.12, 2, 8), dark, [0.45, -0.55, 4.8], [Math.PI / 2, 0, 0]); // canons sous le nez
  part(g, cyl(0.12, 0.12, 2, 8), dark, [-0.45, -0.55, 4.8], [Math.PI / 2, 0, 0]);
  const turret = new THREE.Group();
  turret.position.set(0, -0.95, -0.4);
  part(turret, new THREE.SphereGeometry(0.55, 12, 8), dark);
  part(turret, cyl(0.1, 0.1, 1.6, 6), dark, [0.15, 0, 0.8], [Math.PI / 2, 0, 0]);
  part(turret, cyl(0.1, 0.1, 1.6, 6), dark, [-0.15, 0, 0.8], [Math.PI / 2, 0, 0]);
  g.add(turret);
  g.userData.turret = turret;
  greebles(g, { count: 40, size: [0.35, 0.25, 0.5], area: [3, 0.2, 4.5], center: [0, 0.85, -0.6], seed: 17, mat: dark });
  const e = [engine(g, [-2.35, -0.1, -4.0], 0.95, 0xa0d0ff), engine(g, [2.35, -0.1, -4.0], 0.95, 0xa0d0ff)];
  attachEngines(g, e);
  navLights(g, [[[2.4, 0.9, -1], 0x30ff60, 0.6], [[-2.4, 0.9, -1], 0xff3030, 0.6], [[0, 0.95, -2.6], 0xffffff, 0.4]]);
  g.userData.cockpit = cockpitLight(g, [0, 1.3, 1.2], 0x9fc8ff, 4, 5);
  if (mark) addTessMark(g, mark === 'burnt');
  return g;
}

// Marque de quai peinte par Tess : trois traits et un cercle.
export function addTessMark(g, burnt = false) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.strokeStyle = '#f4f4f0';
  x.lineWidth = 7;
  x.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    x.beginPath(); x.moveTo(26 + i * 18, 30); x.lineTo(26 + i * 18, 96); x.stroke();
  }
  x.beginPath(); x.arc(96, 64, 18, 0, Math.PI * 2); x.stroke();
  if (burnt) {
    const grd = x.createRadialGradient(40, 70, 0, 40, 70, 50);
    grd.addColorStop(0, 'rgba(10,8,6,0.95)');
    grd.addColorStop(1, 'rgba(10,8,6,0)');
    x.fillStyle = grd;
    x.fillRect(0, 0, 128, 128);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), m);
  p.position.set(0.62, 0.32, 4.7);
  p.rotation.set(0, Math.PI / 2 - 0.35, 0);
  g.add(p);
  g.userData.mark = p;
  return p;
}

// Chasseur moderne d'OTANE : fin, lisse, sans cicatrice.
export function otaneFighter({ color = 0xdfe4ea, stripe = 0x3a7bd5 } = {}) {
  const g = new THREE.Group();
  const hull = hullMat('clean', { color, metalness: 0.5, roughness: 0.35 });
  const s = new THREE.MeshStandardMaterial({ color: stripe, metalness: 0.3, roughness: 0.4 });
  part(g, cyl(0.15, 0.9, 6.5, 8), hull, [0, 0, 0.5], [Math.PI / 2, 0, 0], [1, 1, 0.55]);
  part(g, box(6.5, 0.12, 2.2), hull, [0, -0.1, -1.4], [0, 0, 0]);
  part(g, box(6.6, 0.13, 0.4), s, [0, -0.1, -0.5]);
  part(g, new THREE.SphereGeometry(0.45, 12, 8), glassMat(0x88c8ff, 0.6), [0, 0.35, 1.2], [0, 0, 0], [1, 0.7, 2]);
  const e = [engine(g, [0, 0, -2.9], 0.5, 0x7fb8ff)];
  attachEngines(g, e);
  navLights(g, [[[3.2, -0.1, -1.4], 0x3080ff, 0.5], [[-3.2, -0.1, -1.4], 0x3080ff, 0.5]]);
  return g;
}

// Chasseur mosode : anguleux, sombre, feux rouges. Siraal : noir, empennage droit brisé.
export function mosodeFighter({ siraal = false } = {}) {
  const g = new THREE.Group();
  const hull = siraal ? hullMat('black', { metalness: 0.2, roughness: 0.85 }) : hullMat('dark', { color: 0x8a6a6a, metalness: 0.5 });
  const dark = hullMat('black');
  const body = part(g, new THREE.OctahedronGeometry(1.4, 0), hull, [0, 0, 0.6], [0, 0, 0], [1, 0.45, 2.6]);
  part(g, box(5.2, 0.12, 1.6), hull, [0, 0, -1.2], [0, 0, 0]);
  for (const sx of [-1, 1]) part(g, box(0.15, 1.6, 1.5), hull, [sx * 2.5, 0.5, -1.4], [0, 0, sx * -0.35]);
  // Empennage dorsal (brisé à mi-hauteur chez Siraal, réparé par une pièce plus courte)
  part(g, box(0.15, siraal ? 0.8 : 1.7, 1.4), hull, [0.6, siraal ? 0.7 : 1.1, -1.6]);
  part(g, box(0.15, 1.7, 1.4), hull, [-0.6, 1.1, -1.6]);
  if (siraal) part(g, box(0.18, 0.5, 0.8), hullMat('worn', { color: 0x444444 }), [0.6, 1.25, -1.9], [0.25, 0, 0]);
  part(g, new THREE.SphereGeometry(0.35, 10, 6), lightMat(siraal ? 0xff2a2a : 0xff4030, 1.5), [0, 0.4, 1.8], [0, 0, 0], [1, 0.6, 1.8]);
  const e = [engine(g, [0.7, 0, -2.7], 0.45, 0xff6a40), engine(g, [-0.7, 0, -2.7], 0.45, 0xff6a40)];
  attachEngines(g, e);
  navLights(g, [[[2.5, 0, -1.2], 0xff2020, 0.6], [[-2.5, 0, -1.2], 0xff2020, 0.6]]);
  g.userData.body = body;
  return g;
}

export function mosodeBomber() {
  const g = new THREE.Group();
  const hull = hullMat('dark', { color: 0x7a5c58 });
  part(g, box(4, 2.2, 10), hull);
  part(g, box(10, 0.4, 4), hull, [0, -0.4, -2]);
  part(g, box(2.2, 0.8, 4), hullMat('black'), [0, -1.4, 0]);
  const e = [engine(g, [1.4, 0, -5.4], 0.8, 0xff6a40), engine(g, [-1.4, 0, -5.4], 0.8, 0xff6a40)];
  attachEngines(g, e);
  navLights(g, [[[5, -0.4, -2], 0xff2020, 1], [[-5, -0.4, -2], 0xff2020, 1]]);
  return g;
}

// Croiseur mosode : une coque qui remplit la verrière.
export function cruiser({ length = 600 } = {}) {
  const g = new THREE.Group();
  const s = length / 600;
  const hull = hullMat('worn', { color: 0x8a7a76, metalness: 0.5, roughness: 0.55 });
  part(g, box(90 * s, 60 * s, 600 * s), hull);
  part(g, cyl(10 * s, 60 * s, 160 * s, 6), hull, [0, 0, 380 * s], [Math.PI / 2, 0, 0], [1, 0.6, 1]);
  part(g, box(160 * s, 20 * s, 200 * s), hull, [0, -10 * s, -150 * s]);
  part(g, box(40 * s, 50 * s, 140 * s), hull, [0, 50 * s, -120 * s]);
  const dark = hullMat('black');
  greebles(g, { count: 260, size: [12 * s, 8 * s, 20 * s], area: [90 * s, 2, 560 * s], center: [0, 31 * s, 0], seed: 21, mat: dark });
  greebles(g, { count: 200, size: [3 * s, 12 * s, 20 * s], area: [2, 50 * s, 560 * s], center: [45 * s, 0, 0], seed: 23, mat: dark });
  greebles(g, { count: 200, size: [3 * s, 12 * s, 20 * s], area: [2, 50 * s, 560 * s], center: [-45 * s, 0, 0], seed: 29, mat: dark });
  // Batteries
  const turrets = [];
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Group();
    t.position.set((i % 2 ? 1 : -1) * 30 * s, 34 * s, (-200 + i * 70) * s);
    part(t, cyl(9 * s, 11 * s, 6 * s, 10), dark);
    part(t, box(3 * s, 3 * s, 40 * s), dark, [-4 * s, 3 * s, 20 * s]);
    part(t, box(3 * s, 3 * s, 40 * s), dark, [4 * s, 3 * s, 20 * s]);
    g.add(t);
    turrets.push(t);
  }
  g.userData.turrets = turrets;
  // Hublots et feux
  const r = rng(77);
  const lm = lightMat(0xffa070, 2);
  const im = new THREE.InstancedMesh(box(1, 1, 1), lm, 400);
  const d = new THREE.Object3D();
  for (let i = 0; i < 400; i++) {
    const side = r() < 0.5 ? -1 : 1;
    d.position.set(side * 45.2 * s, (r() - 0.5) * 50 * s, (r() - 0.5) * 580 * s);
    d.scale.set(0.3 * s, 1.2 * s, 2.5 * s);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
  }
  g.add(im);
  const e = [engine(g, [30 * s, 0, -305 * s], 18 * s, 0xff7040), engine(g, [-30 * s, 0, -305 * s], 18 * s, 0xff7040), engine(g, [0, 25 * s, -305 * s], 14 * s, 0xff7040)];
  attachEngines(g, e);
  return g;
}

export function frigate({ color = 0xc8ccd2 } = {}) {
  const g = new THREE.Group();
  const hull = hullMat('clean', { color });
  part(g, box(14, 10, 70), hull);
  part(g, box(30, 3, 20), hull, [0, 0, -18]);
  part(g, box(8, 8, 18), hull, [0, 8, -10]);
  greebles(g, { count: 60, size: [2, 1.5, 3], area: [13, 0.5, 66], center: [0, 5.2, 0], seed: 41, mat: hullMat('dark') });
  const e = [engine(g, [4, 0, -36], 3, 0x7fb8ff), engine(g, [-4, 0, -36], 3, 0x7fb8ff)];
  attachEngines(g, e);
  navLights(g, [[[15, 0, -18], 0x30ff60, 2], [[-15, 0, -18], 0xff3030, 2]]);
  return g;
}

// Remorqueur lourd d'OTANE (convoi du Cœur).
export function tug({ color = 0xd8b04a } = {}) {
  const g = new THREE.Group();
  const hull = hullMat('worn', { color });
  part(g, box(8, 6, 14), hull);
  part(g, box(10, 2, 4), hullMat('dark'), [0, 0, 7.5]);
  part(g, new THREE.SphereGeometry(1.6, 12, 8), glassMat(0xffe0a0, 0.5), [0, 3, 5], [0, 0, 0], [1.2, 0.6, 1]);
  const e = [engine(g, [2.5, 1.5, -7.5], 1.6, 0x9fd0ff), engine(g, [-2.5, 1.5, -7.5], 1.6, 0x9fd0ff), engine(g, [2.5, -1.5, -7.5], 1.6, 0x9fd0ff), engine(g, [-2.5, -1.5, -7.5], 1.6, 0x9fd0ff)];
  attachEngines(g, e);
  navLights(g, [[[4.2, 3, 0], 0xffb020, 1.2], [[-4.2, 3, 0], 0xffb020, 1.2]]);
  return g;
}

export function shuttle({ color = 0xe8e8e8, medical = false } = {}) {
  const g = new THREE.Group();
  const hull = hullMat('clean', { color });
  part(g, new THREE.CapsuleGeometry(1.8, 6, 6, 12), hull, [0, 0, 0], [Math.PI / 2, 0, 0]);
  if (medical) part(g, box(0.1, 1.2, 1.2), lightMat(0xff3030, 1.5), [1.82, 0.3, 0]);
  const r = rng(13);
  const wm = lightMat(0xffe2b0, 1.5);
  for (let i = 0; i < 6; i++) part(g, box(0.1, 0.4, 0.5), wm, [1.8, 0.4, -2.5 + i], [0, 0, 0]);
  for (let i = 0; i < 6; i++) part(g, box(0.1, 0.4, 0.5), wm, [-1.8, 0.4, -2.5 + i], [0, 0, 0]);
  void r;
  const e = [engine(g, [0, 0, -5.1], 1, 0x9fd0ff)];
  attachEngines(g, e);
  navLights(g, [[[0, 1.9, 0], 0xffffff, 0.8]]);
  return g;
}

// Remorqueur mort « Kestrel » du cimetière de Sol, lettres effacées.
export function wreckTug() {
  const g = new THREE.Group();
  const hull = hullMat('rust');
  const dark = hullMat('dark');
  part(g, box(14, 10, 34), hull);
  part(g, box(10, 7, 10), hull, [0, 1, 21]);
  part(g, cyl(3, 4, 8, 10), dark, [4, 0, -20], [Math.PI / 2, 0, 0]);
  part(g, cyl(3, 4, 8, 10), dark, [-4, 0, -20], [Math.PI / 2, 0, 0]);
  part(g, box(2, 2, 22), dark, [7.5, 4, 0]);
  greebles(g, { count: 80, size: [1.2, 0.8, 2], area: [13, 0.5, 32], center: [0, 5.2, 0], seed: 61, mat: dark });
  // Lettres d'une compagnie disparue
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,0)';
  x.fillRect(0, 0, 512, 128);
  x.font = 'bold 88px Inter, sans-serif';
  x.fillStyle = 'rgba(210,200,180,0.32)';
  x.fillText('KESTREL  TOW', 18, 96);
  x.globalCompositeOperation = 'destination-out';
  const r = rng(5);
  for (let i = 0; i < 200; i++) x.fillRect(r() * 512, r() * 128, 4 + r() * 30, 2 + r() * 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const lm = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2 });
  const lt = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), lm);
  lt.position.set(7.02, 0, 0);
  lt.rotation.y = Math.PI / 2;
  g.add(lt);
  // Cloison arrachée : la cavité du régulateur
  const cavity = new THREE.Group();
  cavity.position.set(7.1, -1.5, 8);
  part(cavity, box(0.3, 4, 5), dark, [-0.4, 0, 0]);
  const reg = new THREE.Group();
  part(reg, cyl(0.35, 0.35, 1.8, 14), new THREE.MeshStandardMaterial({ color: 0x2b2f35, metalness: 0.8, roughness: 0.3 }), [0, 0, 0], [0, 0, Math.PI / 2]);
  part(reg, box(0.9, 0.9, 0.2), hullMat('clean', { color: 0xc9c2b0 }), [0, 0, 0.35]);
  reg.position.set(0.2, 0, 0);
  cavity.add(reg);
  g.add(cavity);
  g.userData.cavity = cavity;
  g.userData.regulator = reg;
  // Plaque de blindage qui pivote
  const plate = new THREE.Group();
  plate.position.set(7.3, 2, 6);
  part(plate, box(0.4, 5, 7), hull, [0, -2.5, 3.5]);
  g.add(plate);
  g.userData.plate = plate;
  return g;
}

// Module d'habitation éventré : lit fixé au mur, boîtes colorées dans un filet.
export function habitatModule({ length = 40, radius = 7, seed = 2 } = {}) {
  const g = new THREE.Group();
  const r = rng(seed);
  const hull = hullMat('worn', { color: 0xbbbbbb });
  const shell = part(g, new THREE.CylinderGeometry(radius, radius, length, 20, 1, true), hull, [0, 0, 0], [Math.PI / 2, 0, 0]);
  shell.material.side = THREE.DoubleSide;
  part(g, cyl(radius * 0.9, radius, 3, 20), hull, [0, 0, length / 2 + 1], [Math.PI / 2, 0, 0]);
  const wm = lightMat(0x9fb8d0, 0.4);
  for (let i = 0; i < 10; i++) part(g, box(0.2, 1.6, 2.2), wm, [radius - 0.05, 1, -length / 2 + 4 + i * 3.5]);
  // Intérieur visible
  part(g, box(1, 0.4, 3), new THREE.MeshStandardMaterial({ color: 0x7a6a5a }), [radius - 1.5, -2, 4]);
  const colors = [0xd94a3a, 0x3a8ad9, 0xe0c03a, 0x4ad08a];
  for (let i = 0; i < 12; i++) part(g, box(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: colors[i % 4] }), [radius - 2 + r(), 1 + r() * 2, -3 + r() * 3], [r(), r(), r()]);
  return g;
}

// Transporteur orbital : 300 m de coque morte cassée au tiers, ventre ouvert.
export function transporter() {
  const g = new THREE.Group();
  const hull = hullMat('worn', { color: 0x9a9690 });
  const dark = hullMat('dark');
  const a = new THREE.Group();
  const b = new THREE.Group();
  // Section avant (affaissée) et arrière, coques creuses pour pouvoir y entrer
  for (const [grp, len, z] of [[a, 100, 110], [b, 190, -40]]) {
    for (const [p, s] of [[[0, 22, 0], [50, 3, len]], [[0, -22, 0], [50, 3, len]], [[25, 0, 0], [3, 44, len]], [[-25, 0, 0], [3, 44, len]]]) {
      part(grp, box(...s), hull, p);
    }
    grp.position.z = z;
    greebles(grp, { count: 120, size: [3, 1, 6], area: [48, 1, len], center: [0, 23.6, 0], seed: len, mat: dark });
    g.add(grp);
  }
  a.rotation.set(0.08, 0.05, 0.03);
  // Épine de charpente entre les sections
  part(g, box(4, 4, 30), dark, [10, 20, 52]);
  part(g, box(2, 2, 30), dark, [-14, -18, 52], [0.1, 0, 0]);
  // Conteneurs, rails, grue
  const r = rng(91);
  for (let i = 0; i < 26; i++) part(g, box(6, 6, 12), hullMat('rust', { color: [0xb06a3a, 0x3a6ab0, 0x8a8a8a][i % 3] }), [(r() - 0.5) * 40, (r() - 0.5) * 30, -120 + r() * 160], [r() * 0.5, r() * 0.5, r() * 0.5]);
  const crane = new THREE.Group();
  part(crane, box(30, 1.5, 1.5), dark);
  part(crane, box(1.5, 10, 1.5), dark, [14, -5, 0]);
  crane.position.set(0, 5, -60);
  g.add(crane);
  g.userData.crane = crane;
  g.userData.front = a;
  return g;
}

// Balise de navigation morte dans sa cage. setOn(k) l'allume en vert.
export function deadBeacon() {
  const g = new THREE.Group();
  const dark = hullMat('dark');
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x15171a, metalness: 0.6, roughness: 0.5, emissive: 0x2dff8a, emissiveIntensity: 0 });
  part(g, box(1.6, 2.4, 1.6), bodyMat);
  const lineMat = lightMat(0x2dff8a, 0);
  const lines = [];
  for (let i = 0; i < 4; i++) lines.push(part(g, box(1.65, 0.06, 1.65), lineMat.clone(), [0, -0.9 + i * 0.6, 0]));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(g, cyl(0.06, 0.06, 3.2, 6), dark, [x * 1.1, 0, z * 1.1]);
  for (const y of [-1.6, 1.6]) part(g, box(2.3, 0.08, 2.3), dark, [0, y, 0]);
  const cables = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x2dff8a, emissiveIntensity: 0 });
    const c = part(g, cyl(0.08, 0.08, 12, 6), m, [-1 + i * 0.4, -7.5, -0.5 + (i % 2)], [0.1 * (i - 3), 0, 0]);
    cables.push(c);
  }
  const halo = glow(0x2dff8a, 10, 0);
  g.add(halo);
  g.userData.setOn = (k, t = 0) => {
    bodyMat.emissiveIntensity = 0.3 * k;
    lines.forEach((l, i) => (l.material.emissiveIntensity = 3 * Math.max(0, Math.min(1, k * 4 - i * 0.5 + Math.sin(t * 6 + i) * 0.1))));
    cables.forEach((c, i) => (c.material.emissiveIntensity = 2.5 * Math.max(0, Math.min(1, k * 3 - i * 0.35))));
    halo.material.opacity = 0.9 * k;
    halo.scale.setScalar(6 + 10 * k);
  };
  g.userData.setOn(0);
  return g;
}

// La Couronne : trois anneaux immenses sur des inclinaisons différentes, autour d'un noyau.
export function couronne({ scale = 1 } = {}) {
  const g = new THREE.Group();
  const s = scale;
  const hull = hullMat('clean', { color: 0xc6cad2, metalness: 0.55, roughness: 0.45 });
  const dark = hullMat('dark');
  const core = part(g, new THREE.SphereGeometry(120 * s, 48, 32), hull);
  part(g, cyl(30 * s, 30 * s, 520 * s, 24), hull, [0, 0, 0]);
  const coreLights = glow(0xbfe0ff, 400 * s, 0.25);
  g.add(coreLights);
  const rings = [];
  const r = rng(404);
  const ringDefs = [
    { R: 700, w: 150, tilt: [0.25, 0, 0.1], speed: 0.01, full: true, lit: 0xffd6a0 },
    { R: 1000, w: 190, tilt: [-0.45, 0.3, 0], speed: -0.006, full: true, lit: 0xa0f0c0 },
    { R: 1350, w: 120, tilt: [0.9, -0.2, 0.3], speed: 0.004, full: false, lit: 0xd0e0ff },
  ];
  for (const d of ringDefs) {
    const holder = new THREE.Group();
    holder.rotation.set(...d.tilt);
    const ring = new THREE.Group();
    holder.add(ring);
    const arc = d.full ? Math.PI * 2 : Math.PI * 1.6;
    const segs = d.full ? 1 : 5;
    for (let k = 0; k < segs; k++) {
      const a0 = d.full ? 0 : k * (Math.PI * 2 / 5);
      const a1 = d.full ? arc : Math.PI * 2 / 5 * 0.72;
      const geo = new THREE.CylinderGeometry(d.R * s, d.R * s, d.w * s, 160, 1, true, a0, a1);
      scaleUV(geo, (d.R * a1) / 25, d.w / 25);
      const m = part(ring, geo, hull);
      m.material = hull.clone();
      m.material.side = THREE.DoubleSide;
      // face intérieure habitée
      const inner = part(ring, new THREE.CylinderGeometry(d.R * s * 0.97, d.R * s * 0.97, d.w * s * 0.9, 160, 1, true, a0, a1), new THREE.MeshStandardMaterial({ color: 0x1b2026, roughness: 0.8, side: THREE.DoubleSide }));
      void inner;
    }
    // Lumières des quais, fenêtres, places
    const n = 2600;
    const im = new THREE.InstancedMesh(box(1, 1, 1), lightMat(d.lit, 2.6), n);
    const dd = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      let a = r() * Math.PI * 2;
      if (!d.full) {
        const seg = Math.floor(r() * 5);
        a = seg * (Math.PI * 2 / 5) + r() * (Math.PI * 2 / 5) * 0.72;
      }
      const rad = d.R * s * (r() < 0.5 ? 1.003 : 0.965);
      dd.position.set(Math.sin(a) * rad, (r() - 0.5) * d.w * s * 0.85, Math.cos(a) * rad);
      dd.rotation.set(0, a, 0);
      dd.scale.set(3 * s + r() * 9 * s, 1.2 * s + r() * 2.5 * s, 0.6 * s);
      dd.updateMatrix();
      im.setMatrixAt(i, dd.matrix);
    }
    ring.add(im);
    // Rayons vers le noyau
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.2;
      const sp = part(ring, box(8 * s, 8 * s, d.R * s - 130 * s), dark, [Math.sin(a) * (d.R * s + 120 * s) / 2, 0, Math.cos(a) * (d.R * s + 120 * s) / 2], [0, a, 0]);
      void sp;
    }
    // Quais en grappes
    for (let k = 0; k < 20; k++) {
      const a = r() * Math.PI * 2;
      part(ring, box(30 * s, 20 * s, 20 * s), hull, [Math.sin(a) * (d.R + 25) * s, (r() - 0.5) * d.w * s, Math.cos(a) * (d.R + 25) * s], [0, a, 0]);
    }
    g.add(holder);
    rings.push({ ring, speed: d.speed });
  }
  g.userData.rings = rings;
  g.userData.core = core;
  g.userData.update = (t) => rings.forEach((rr) => (rr.ring.rotation.y = t * rr.speed));
  return g;
}

// Trafic : de petites navettes qui circulent sur des orbites autour de la ville.
export function traffic({ count = 200, radius = 900, seed = 8, scale = 1 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const im = new THREE.InstancedMesh(box(1, 1, 3), hullMat('clean'), count);
  const lights = new THREE.InstancedMesh(box(1, 1, 1), lightMat(0xffe8c0, 3), count);
  const paths = [];
  for (let i = 0; i < count; i++) paths.push({ R: radius * (0.6 + r() * 0.9), y: (r() - 0.5) * 400, ph: r() * 6.28, sp: (0.02 + r() * 0.05) * r.sign(), tilt: (r() - 0.5) * 0.8, sc: (1 + r() * 4) * scale });
  g.add(im, lights);
  const d = new THREE.Object3D();
  g.userData.update = (t) => {
    paths.forEach((p, i) => {
      const a = p.ph + t * p.sp;
      d.position.set(Math.sin(a) * p.R, p.y + Math.sin(a) * p.R * p.tilt, Math.cos(a) * p.R);
      d.rotation.set(0, a + (p.sp > 0 ? Math.PI / 2 : -Math.PI / 2), 0);
      d.scale.setScalar(p.sc);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
      d.scale.setScalar(p.sc * 0.6);
      d.updateMatrix();
      lights.setMatrixAt(i, d.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
    lights.instanceMatrix.needsUpdate = true;
  };
  g.userData.update(0);
  return g;
}

// Ardent-Six : plateforme de relais et quatre pylônes en croix inégale.
export function ardentPlatform({ broken = false } = {}) {
  const g = new THREE.Group();
  const hull = hullMat('clean', { color: 0xb4bac2 });
  const dark = hullMat('dark');
  part(g, cyl(18, 22, 10, 12), hull);
  part(g, cyl(8, 8, 26, 12), dark, [0, 0, 0]);
  const pylons = [];
  const lens = [70, 52, 64, 46];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08);
    const p = new THREE.Group();
    p.rotation.y = a;
    part(p, box(4, 4, lens[i]), dark, [0, 0, lens[i] / 2 + 18]);
    // grille verticale de panneaux (pylône trois partiellement déployé)
    const panels = i === 2 ? 7 : 4;
    for (let k = 0; k < panels; k++) part(p, box(0.4, 14, 5), hull, [0, 0, 26 + k * 7]);
    const tip = glow(0xff4040, 4, 1, 'hard');
    tip.position.set(0, 3, lens[i] + 18);
    p.add(tip);
    g.add(p);
    pylons.push(p);
  }
  // antennes
  for (let i = 0; i < 6; i++) part(g, cyl(0.3, 0.3, 20, 6), dark, [Math.sin(i) * 12, 14, Math.cos(i) * 12], [0.2 * Math.sin(i), 0, 0.2 * Math.cos(i)]);
  if (broken) pylons[1].rotation.z = 0.4;
  g.userData.pylons = pylons;
  navLights(g, [[[0, 6, 0], 0x40a0ff, 6]]);
  return g;
}

// Le Cœur : sphère sombre d'écailles minérales, lueurs vertes qui avancent en nappes.
export function heart({ radius = 5 } = {}) {
  const g = new THREE.Group();
  const m = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, intensity: { value: 1 }, speed: { value: 1 }, white: { value: 0 } },
    vertexShader: `varying vec3 vP; varying vec3 vN; varying vec3 vV;
      void main(){ vP = position; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float time; uniform float intensity; uniform float speed; uniform float white;
      varying vec3 vP; varying vec3 vN; varying vec3 vV;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){
        vec3 n = normalize(vP);
        float lat = asin(n.y); float lon = atan(n.z, n.x);
        vec2 uv = vec2(lon*6.0, lat*9.0);
        vec2 cell = floor(uv); vec2 f = fract(uv);
        float scale = smoothstep(0.0,0.12,f.x)*smoothstep(0.0,0.12,f.y);
        float shade = 0.05 + 0.05*h(cell);
        float sheet = sin(lon*2.0 + lat*3.0 - time*0.4*speed) * sin(lat*5.0 + time*0.27*speed + lon) ;
        sheet = smoothstep(0.55, 1.0, sheet);
        float sheet2 = smoothstep(0.7,1.0, sin(lon*3.0 - lat*2.0 + time*0.33*speed + 2.0));
        float glowv = (sheet + 0.6*sheet2) * (0.35 + 0.65*(1.0-scale));
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
        vec3 base = vec3(shade*0.8, shade, shade*0.9) * (0.5+0.5*scale);
        vec3 green = mix(vec3(0.15,1.0,0.5), vec3(1.0), white);
        vec3 col = base + green*glowv*intensity*1.6 + green*fres*0.25*intensity;
        gl_FragColor = vec4(col,1.0);
      }`,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 64), m);
  g.add(sphere);
  const halo = glow(0x3dff9a, radius * 5, 0.25);
  g.add(halo);
  const ringMat = hullMat('dark', { color: 0x9aa2aa, metalness: 0.8, roughness: 0.3 });
  const rings = [];
  const defs = [[radius * 1.6, 0.18, [0.3, 0, 0]], [radius * 1.9, 0.18, [1.2, 0.4, 0]], [radius * 2.2, 0.22, [0.7, -0.9, 0.4]]];
  for (const [R, th, rot] of defs) {
    const holder = new THREE.Group();
    holder.rotation.set(...rot);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, th * radius * 0.4, 8, 128), ringMat);
    for (let k = 0; k < 8; k++) {
      const l = glow(0x9effc8, radius * 0.25, 0.8, 'hard');
      l.position.set(Math.cos((k / 8) * Math.PI * 2) * R, Math.sin((k / 8) * Math.PI * 2) * R, 0);
      ring.add(l);
    }
    holder.add(ring);
    g.add(holder);
    rings.push(ring);
  }
  const light = new THREE.PointLight(0x3dff9a, 40, radius * 16, 1.2);
  g.add(light);
  g.userData = { sphere, mat: m, rings, halo, light };
  g.userData.update = (t, k = 1) => {
    m.uniforms.time.value = t;
    m.uniforms.intensity.value = k;
    rings[0].rotation.z = t * 0.21;
    rings[1].rotation.z = -t * 0.13;
    rings[2].rotation.z = t * 0.08;
    halo.material.opacity = 0.18 * k;
    light.intensity = (g.userData.lightGain ?? 30) * k;
  };
  return g;
}

// Personnages stylisés, lisibles en silhouette.
export function astronaut({ suit = 0xc9c4b8, visor = 0xd8a040 } = {}) {
  const g = new THREE.Group();
  const s = new THREE.MeshStandardMaterial({ color: suit, roughness: 0.92, metalness: 0.0 });
  const joint = new THREE.MeshStandardMaterial({ color: 0x5a5852, roughness: 0.7 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.6, metalness: 0.3 });
  const vm = new THREE.MeshStandardMaterial({ color: visor, metalness: 1, roughness: 0.12, emissive: 0x2a1a05, emissiveIntensity: 0.6 });
  part(g, new THREE.CapsuleGeometry(0.27, 0.45, 4, 12), s, [0, 1.18, 0], [0, 0, 0], [1.12, 1, 0.85]);
  part(g, box(0.34, 0.22, 0.08), dark, [0, 1.3, 0.24]); // module de poitrine
  for (let i = 0; i < 4; i++) part(g, box(0.04, 0.03, 0.02), lightMat([0x40ff80, 0xffa030, 0x40ff80, 0xff4030][i], 1.5), [-0.09 + i * 0.06, 1.33, 0.29]);
  part(g, cyl(0.27, 0.27, 0.06, 16), joint, [0, 0.9, 0]); // ceinture
  part(g, box(0.56, 0.7, 0.3), hullMat('worn', { color: 0xd0ccc0 }), [0, 1.25, -0.32]); // sac dorsal
  part(g, cyl(0.07, 0.07, 0.6, 8), dark, [0.2, 1.25, -0.5]);
  part(g, cyl(0.07, 0.07, 0.6, 8), dark, [-0.2, 1.25, -0.5]);
  part(g, cyl(0.17, 0.2, 0.08, 16), joint, [0, 1.56, 0]); // anneau de col
  const head = part(g, new THREE.SphereGeometry(0.25, 24, 16), s, [0, 1.8, 0]);
  const vis = part(g, new THREE.SphereGeometry(0.255, 24, 16, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.22, Math.PI * 0.42), vm, [0, 1.8, 0.005]);
  part(g, box(0.06, 0.05, 0.08), dark, [0.24, 1.9, 0.02]); // lampe de casque
  const limb = (parent, len, rad) => {
    part(parent, new THREE.CapsuleGeometry(rad, len * 0.42, 4, 10), s, [0, -len * 0.25, 0]);
    part(parent, cyl(rad * 1.05, rad * 1.05, 0.05, 12), joint, [0, -len * 0.5, 0]);
    part(parent, new THREE.CapsuleGeometry(rad * 0.92, len * 0.38, 4, 10), s, [0, -len * 0.75, 0]);
  };
  const armL = new THREE.Group(); armL.position.set(0.36, 1.42, 0); limb(armL, 0.62, 0.085); part(armL, new THREE.SphereGeometry(0.075, 10, 8), joint, [0, -0.66, 0]); g.add(armL);
  const armR = new THREE.Group(); armR.position.set(-0.36, 1.42, 0); limb(armR, 0.62, 0.085); part(armR, new THREE.SphereGeometry(0.075, 10, 8), joint, [0, -0.66, 0]); g.add(armR);
  const legL = new THREE.Group(); legL.position.set(0.13, 0.86, 0); limb(legL, 0.8, 0.1); part(legL, box(0.17, 0.12, 0.3), dark, [0, -0.84, 0.05]); g.add(legL);
  const legR = new THREE.Group(); legR.position.set(-0.13, 0.86, 0); limb(legR, 0.8, 0.1); part(legR, box(0.17, 0.12, 0.3), dark, [0, -0.84, 0.05]); g.add(legR);
  part(armL, box(0.11, 0.05, 0.12), dark, [0, -0.5, 0.06]); // écran de poignet
  const wrist = glow(0xff9030, 0.18, 1, 'hard');
  wrist.position.set(0, -0.5, 0.13);
  armL.add(wrist);
  const helm = new THREE.SpotLight(0xfff0d0, 25, 12, 0.5, 0.6, 2);
  helm.position.set(0.24, 1.9, 0.1);
  helm.target.position.set(0.24, 1.9, 3);
  g.add(helm, helm.target);
  const helmGlow = glow(0xfff4e0, 0.35, 0.9, 'hard');
  helmGlow.position.set(0.24, 1.9, 0.07);
  g.add(helmGlow);
  g.userData = { head, vis, armL, armR, legL, legR, wrist, helm };
  return g;
}

export function human({ body = 0x2e3440, skin = 0x8a6a56, hair = 0x1c1410, female = false } = {}) {
  const g = new THREE.Group();
  const b = new THREE.MeshStandardMaterial({ color: body, roughness: 0.75 });
  const sk = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.6 });
  const hr = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.9 });
  part(g, new THREE.CapsuleGeometry(0.24, 0.55, 4, 10), b, [0, 1.2, 0], [0, 0, 0], [1.1, 1, 0.75]);
  part(g, cyl(0.07, 0.08, 0.12, 8), sk, [0, 1.6, 0]);
  const head = part(g, new THREE.SphereGeometry(0.13, 16, 12), sk, [0, 1.74, 0], [0, 0, 0], [0.9, 1.1, 1]);
  part(g, new THREE.SphereGeometry(0.135, 16, 12, 0, Math.PI * 2, 0, Math.PI / (female ? 1.6 : 2.2)), hr, [0, 1.76, -0.01]);
  const armL = new THREE.Group(); armL.position.set(0.3, 1.45, 0); part(armL, new THREE.CapsuleGeometry(0.065, 0.5, 4, 8), b, [0, -0.3, 0]); g.add(armL);
  const armR = new THREE.Group(); armR.position.set(-0.3, 1.45, 0); part(armR, new THREE.CapsuleGeometry(0.065, 0.5, 4, 8), b, [0, -0.3, 0]); g.add(armR);
  for (const x of [0.11, -0.11]) part(g, new THREE.CapsuleGeometry(0.085, 0.65, 4, 8), b, [x, 0.42, 0]);
  g.userData = { head, armL, armR };
  return g;
}

// Glide (Alyde) : tête large, peau lisse, mâchoire puissante, courtes vibrisses, yeux sombres, mains palmées.
export function alyde({ skin = 0x4c6064, suit = 0x1e2a2e } = {}) {
  const g = new THREE.Group();
  const sk = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.22, metalness: 0.08 });
  const su = new THREE.MeshStandardMaterial({ color: suit, roughness: 0.6, metalness: 0.2 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x020304, roughness: 0.02, metalness: 0.6 });
  part(g, new THREE.CapsuleGeometry(0.3, 0.6, 4, 12), su, [0, 1.25, 0], [0, 0, 0], [1.25, 1, 0.85]);
  part(g, box(0.5, 0.08, 0.3), hullMat('dark'), [0, 1.62, 0]); // col de combinaison
  part(g, cyl(0.15, 0.19, 0.2, 14), sk, [0, 1.7, 0.02]);
  const head = new THREE.Group();
  head.position.set(0, 1.9, 0.02);
  part(head, new THREE.SphereGeometry(0.22, 28, 20), sk, [0, 0.02, -0.02], [0, 0, 0], [1.32, 0.8, 1.25]); // crâne large et bas
  part(head, new THREE.SphereGeometry(0.18, 24, 16), sk, [0, -0.09, 0.07], [0.2, 0, 0], [1.38, 0.72, 1.18]); // mâchoire puissante
  part(head, box(0.34, 0.04, 0.08), sk, [0, 0.07, 0.2], [0.3, 0, 0]); // arcade
  for (const x of [0.12, -0.12]) part(head, new THREE.SphereGeometry(0.06, 16, 12), eye, [x, 0.02, 0.215], [0, x * 2, 0], [1.25, 0.95, 0.55]);
  const vib = [];
  const vm = new THREE.MeshStandardMaterial({ color: 0x8a9a9c, roughness: 0.3 });
  for (const sx of [1, -1]) for (let i = 0; i < 4; i++) {
    const v = new THREE.Group();
    v.position.set(sx * 0.2, -0.1 + i * 0.022, 0.17);
    const m = new THREE.Mesh(cyl(0.002, 0.004, 0.11, 4), vm);
    m.position.x = sx * 0.055;
    m.rotation.z = sx * (Math.PI / 2 - 0.12 + i * 0.09);
    v.add(m);
    head.add(v);
    vib.push(v);
  }
  g.add(head);
  const hand = (parent) => {
    part(parent, new THREE.SphereGeometry(0.075, 10, 8), sk, [0, -0.66, 0], [0, 0, 0], [1.25, 0.5, 1.5]);
    part(parent, box(0.15, 0.01, 0.12), new THREE.MeshStandardMaterial({ color: skin, transparent: true, opacity: 0.6, roughness: 0.3 }), [0, -0.7, 0.05]); // palmure
  };
  const armL = new THREE.Group(); armL.position.set(0.38, 1.5, 0); part(armL, new THREE.CapsuleGeometry(0.085, 0.5, 4, 8), su, [0, -0.3, 0]); hand(armL); g.add(armL);
  const armR = new THREE.Group(); armR.position.set(-0.38, 1.5, 0); part(armR, new THREE.CapsuleGeometry(0.085, 0.5, 4, 8), su, [0, -0.3, 0]); hand(armR); g.add(armR);
  for (const x of [0.14, -0.14]) part(g, new THREE.CapsuleGeometry(0.11, 0.65, 4, 8), su, [x, 0.45, 0]);
  g.userData = { head, armL, armR, vib };
  return g;
}

// Tête casquée pour les plans de cockpit (Balam humain / Glide alyde).
export function pilotBust(kind = 'balam') {
  const g = kind === 'glide' ? alyde() : human({ body: 0x3a3226 });
  if (kind === 'balam') {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), new THREE.MeshStandardMaterial({ color: 0x55524c, roughness: 0.5, metalness: 0.3 }));
    helmet.position.set(0, 1.76, -0.02);
    helmet.rotation.x = -0.35;
    g.add(helmet);
  }
  return g;
}

// Intérieur de cockpit simplifié : montants, tableau de bord avec un écran à texture.
export function cockpitInterior({ screen, color = 0x2a2c30, tandem = false, seed = 4, canopy = true } = {}) {
  const g = new THREE.Group();
  const r = rng(seed);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.35 });
  const m2 = new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.6, metalness: 0.4 });
  // planche de bord
  part(g, box(1.5, 0.45, 0.55), m, [0, 0.92, 0.78], [-0.45, 0, 0]);
  part(g, box(0.5, 0.5, 0.9), m, [0.62, 0.72, 0.3]);
  part(g, box(0.5, 0.5, 0.9), m, [-0.62, 0.72, 0.3]);
  if (screen) {
    const sm = new THREE.MeshBasicMaterial({ map: screen, toneMapped: false });
    part(g, new THREE.PlaneGeometry(0.56, 0.34), sm, [0, 1.13, 0.61], [-0.45 + Math.PI, Math.PI, 0]);
  }
  // boutons, voyants, deux générations d'interfaces
  const cols = [0xffa040, 0x40ff90, 0xff4030, 0x80c0ff];
  for (let i = 0; i < 46; i++) {
    const side = i < 23 ? 1 : -1;
    const k = i % 23;
    part(g, box(0.035, 0.012, 0.025), lightMat(cols[Math.floor(r() * 4)], 0.6 + r() * 1.5), [side * (0.48 + (k % 5) * 0.055), 0.98, 0.0 + Math.floor(k / 5) * 0.12]);
  }
  for (let i = 0; i < 10; i++) part(g, cyl(0.025, 0.025, 0.02, 10), m2, [-0.5 + i * 0.11, 1.08, 0.93], [0.6, 0, 0]);
  // verrière : arceaux
  if (canopy) {
    for (const z of [0.95, 0.2, -0.6]) {
      const arcg = new THREE.TorusGeometry(0.85, 0.025, 6, 24, Math.PI);
      part(g, arcg, m2, [0, 1.05, z], [0, 0, 0], [1, 1.05, 1]);
    }
    part(g, box(0.03, 0.03, 1.6), m2, [0, 1.95, 0.2]);
  }
  part(g, box(1.6, 0.06, 2.4), m2, [0, 0.16, 0]); // plancher
  part(g, box(0.75, 0.12, 0.6), m2, [0, 0.55, -0.1]); // siège
  part(g, box(0.75, 0.95, 0.12), m2, [0, 1.02, -0.42]);
  const stick = part(g, cyl(0.022, 0.03, 0.4, 8), m2, [0.2, 0.75, 0.25]);
  part(g, new THREE.SphereGeometry(0.04, 8, 6), m2, [0.2, 0.96, 0.25]);
  const lever = part(g, box(0.04, 0.22, 0.04), lightMat(0xff8030, 0.8), [-0.3, 0.85, 0.42]);
  const glowPanel = glow(0x9fd0ff, 0.9, 0.25);
  glowPanel.position.set(0, 1.15, 0.6);
  g.add(glowPanel);
  g.userData = { stick, lever, glowPanel };
  if (tandem) {
    part(g, box(0.75, 0.12, 0.6), m2, [0, 0.8, -1.3]);
    part(g, box(0.75, 0.95, 0.12), m2, [0, 1.25, -1.62]);
    part(g, box(1.3, 0.35, 0.4), m, [0, 1.15, -0.85], [-0.4, 0, 0]);
  }
  return g;
}

// Champ de débris instancié : carcasses, panneaux solaires, réservoirs. update(t) les fait tourner.
export function debrisField({ count = 400, center = [0, 0, 0], size = [800, 300, 800], scale = [2, 30], seed = 12, avoid = null, palette = ['worn', 'rust', 'dark'] } = {}) {
  const r = rng(seed);
  const grp = new THREE.Group();
  const geos = [new THREE.BoxGeometry(1, 1, 1), new THREE.CylinderGeometry(0.5, 0.5, 1, 10), new THREE.BoxGeometry(1, 0.05, 1.6), new THREE.IcosahedronGeometry(0.6, 0)];
  const kinds = geos.length;
  const per = Math.ceil(count / kinds);
  const items = [];
  geos.forEach((geo, k) => {
    const mat = k === 2 ? new THREE.MeshStandardMaterial({ color: 0x1d2c4a, metalness: 0.7, roughness: 0.3, emissive: 0x050a14 }) : hullMat(palette[k % palette.length]);
    const im = new THREE.InstancedMesh(geo, mat, per);
    grp.add(im);
    for (let i = 0; i < per; i++) {
      let p;
      for (let tries = 0; tries < 10; tries++) {
        p = [center[0] + (r() - 0.5) * size[0], center[1] + (r() - 0.5) * size[1], center[2] + (r() - 0.5) * size[2]];
        if (!avoid || Math.hypot(p[0] - avoid[0], p[1] - avoid[1], p[2] - avoid[2]) > avoid[3]) break;
      }
      const sc = scale[0] + Math.pow(r(), 3) * (scale[1] - scale[0]);
      items.push({ im, i, p, s: k === 2 ? [sc * 0.7, sc * 0.5, sc * 0.7] : [sc * (0.5 + r()), sc * (0.5 + r()), sc * (0.5 + r() * 2)], rot: [r() * 6, r() * 6, r() * 6], spin: [(r() - 0.5) * 0.2, (r() - 0.5) * 0.2, (r() - 0.5) * 0.1], drift: [(r() - 0.5) * 0.6, (r() - 0.5) * 0.3, (r() - 0.5) * 0.6] });
    }
  });
  const d = new THREE.Object3D();
  grp.userData.items = items;
  grp.userData.update = (t) => {
    for (const it of items) {
      d.position.set(it.p[0] + it.drift[0] * t, it.p[1] + it.drift[1] * t, it.p[2] + it.drift[2] * t);
      d.rotation.set(it.rot[0] + it.spin[0] * t, it.rot[1] + it.spin[1] * t, it.rot[2] + it.spin[2] * t);
      d.scale.set(...it.s);
      d.updateMatrix();
      it.im.setMatrixAt(it.i, d.matrix);
    }
    grp.children.forEach((im) => (im.instanceMatrix.needsUpdate = true));
  };
  grp.userData.update(0);
  return grp;
}

// Relais de récupération de Sol : trois anneaux fatigués autour d'un axe.
export function solRelay() {
  const g = new THREE.Group();
  const hull = hullMat('worn');
  part(g, cyl(6, 6, 120, 12), hull, [0, 0, 0], [Math.PI / 2, 0, 0]);
  for (const [z, R] of [[-35, 40], [0, 50], [35, 38]]) {
    const ring = part(g, new THREE.TorusGeometry(R, 4, 8, 48), hull, [0, 0, z]);
    for (let k = 0; k < 16; k++) {
      const l = glow(k % 3 ? 0xffd090 : 0x80c0ff, 3, 0.9, 'hard');
      l.position.set(Math.cos(k / 16 * Math.PI * 2) * R, Math.sin(k / 16 * Math.PI * 2) * R, z);
      g.add(l);
    }
    void ring;
  }
  greebles(g, { count: 60, size: [4, 3, 6], area: [10, 10, 110], center: [0, 0, 0], seed: 4, mat: hullMat('dark') });
  return g;
}

// Ligne simple mise à jour à chaque image (câble de sécurité, lien magnétique).
export function cable(color = 0xd8d0b8) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 16), 3));
  const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color }));
  l.frustumCulled = false;
  l.userData.set = (a, b, sag = 0.3) => {
    const p = geo.attributes.position.array;
    for (let i = 0; i < 16; i++) {
      const u = i / 15;
      p[i * 3] = a[0] + (b[0] - a[0]) * u;
      p[i * 3 + 1] = a[1] + (b[1] - a[1]) * u - Math.sin(u * Math.PI) * sag;
      p[i * 3 + 2] = a[2] + (b[2] - a[2]) * u;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return l;
}

// Pik : mécanicien minuscule, bras courts et larges, lunettes techniques qui grossissent les yeux.
export function pik() {
  const g = human({ body: 0x4a4038, skin: 0x8f7058, hair: 0x2a2018 });
  g.scale.set(0.62, 0.62, 0.62);
  const lens = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, metalness: 0.9, roughness: 0.05, emissive: 0x204050, emissiveIntensity: 0.6 });
  for (const x of [0.055, -0.055]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16), lens);
    l.rotation.x = Math.PI / 2;
    l.position.set(x, 1.76, 0.12);
    g.add(l);
  }
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.012, 6, 24), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  strap.rotation.x = Math.PI / 2;
  strap.position.y = 1.76;
  g.add(strap);
  g.userData.armL.scale.set(1.6, 0.85, 1.6);
  g.userData.armR.scale.set(1.6, 0.85, 1.6);
  const wrench = new THREE.Mesh(box(0.04, 0.35, 0.02), new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.9, roughness: 0.3 }));
  wrench.position.set(0, -0.7, 0.05);
  g.userData.armR.add(wrench);
  return g;
}

// Hangar : sol, parois, rampes de lumière, berceaux. Ouverture sur l'espace à -Z.
export function hangar({ w = 120, h = 34, d = 170, red = false } = {}) {
  const g = new THREE.Group();
  const floorMat = hullMat('dark', { color: 0x6a6e74, metalness: 0.3, roughness: 0.55 });
  const wall = hullMat('clean', { color: 0x8a9098, metalness: 0.4, roughness: 0.6 });
  part(g, box(w, 1, d), floorMat, [0, -0.5, 0]);
  part(g, box(w, 1, d), wall, [0, h + 0.5, 0]);
  part(g, box(1, h, d), wall, [-w / 2, h / 2, 0]);
  part(g, box(1, h, d), wall, [w / 2, h / 2, 0]);
  part(g, box(w, h, 1), wall, [0, h / 2, d / 2]);
  // linteau de la porte
  part(g, box(w, 8, 2), wall, [0, h - 4, -d / 2]);
  const doors = [];
  for (const sx of [-1, 1]) {
    const dd = part(g, box(w / 2, h - 8, 1.5), hullMat('dark', { color: 0x50555c }), [sx * w / 4, (h - 8) / 2, -d / 2]);
    doors.push(dd);
  }
  g.userData.doors = doors;
  g.userData.setDoors = (k) => doors.forEach((dd, i) => (dd.position.x = (i ? 1 : -1) * (w / 4 + (w / 2) * k)));
  // rampes lumineuses au plafond
  const lm = lightMat(0xeaf2ff, 2.2);
  g.userData.strips = [];
  for (let i = 0; i < 6; i++) {
    const st = part(g, box(w * 0.8, 0.3, 1.2), lm.clone(), [0, h - 0.4, -d / 2 + 20 + i * 26]);
    g.userData.strips.push(st);
  }
  // marquages au sol
  const mk = lightMat(0xffc040, 0.6);
  for (let i = 0; i < 10; i++) part(g, box(0.4, 0.05, 6), mk, [-14, 0.03, -d / 2 + 10 + i * 15]);
  for (let i = 0; i < 10; i++) part(g, box(0.4, 0.05, 6), mk, [14, 0.03, -d / 2 + 10 + i * 15]);
  // rails magnétiques
  part(g, box(1.2, 0.3, d * 0.9), hullMat('dark'), [-3, 0.15, 0]);
  part(g, box(1.2, 0.3, d * 0.9), hullMat('dark'), [3, 0.15, 0]);
  const key = new THREE.HemisphereLight(0xdfe8ff, 0x505458, red ? 0.3 : 2.2);
  g.add(key);
  g.userData.key = key;
  return g;
}

export function cradle() {
  const g = new THREE.Group();
  const m = hullMat('dark', { color: 0x40444a });
  for (const [x, z] of [[-1.5, 1.5], [1.5, 1.5], [-1.5, -1.5], [1.5, -1.5]]) part(g, cyl(0.2, 0.3, 2.2, 8), m, [x, 1.1, z]);
  part(g, box(4, 0.3, 4.4), m, [0, 0.15, 0]);
  return g;
}

// Convoi du Cœur : la chambre entière détachée, fixée sur un châssis de 200 m, six remorqueurs autour.
export function convoy() {
  const g = new THREE.Group();
  const frameM = hullMat('dark', { color: 0x70767c, metalness: 0.7 });
  for (const [x, y] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) part(g, box(2, 2, 200), frameM, [x, y, 0]);
  for (let i = 0; i < 11; i++) {
    const z = -100 + i * 20;
    part(g, box(30, 1.2, 1.2), frameM, [0, -14, z]);
    part(g, box(30, 1.2, 1.2), frameM, [0, 14, z]);
    part(g, box(1.2, 30, 1.2), frameM, [-14, 0, z]);
    part(g, box(1.2, 30, 1.2), frameM, [14, 0, z]);
  }
  const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(12, 1), new THREE.MeshStandardMaterial({ color: 0x8a9298, wireframe: true, metalness: 0.8 }));
  g.add(cage);
  const h = heart({ radius: 5 });
  g.add(h);
  g.userData.heart = h;
  const tugs = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const tg = tug();
    tg.scale.setScalar(1.6);
    tg.position.set(Math.cos(a) * 26, Math.sin(a) * 26, -60 + (i % 2) * 40);
    tg.rotation.y = Math.PI;
    g.add(tg);
    tugs.push(tg);
    const cableL = part(g, box(0.3, 0.3, 30), frameM, [Math.cos(a) * 19, Math.sin(a) * 19, -60 + (i % 2) * 40 + 10]);
    cableL.lookAt(0, 0, 0);
  }
  g.userData.tugs = tugs;
  return g;
}

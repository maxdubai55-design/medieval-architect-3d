import * as THREE from 'three';
import { starfield, nebulaSky, glow, bolt, shootBolt, explosion, setExplosion, beam, filaments } from '../lib/fx.js';
import { indocile, otaneFighter, mosodeFighter, convoy, cruiser, frigate } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp, fly, rng } from '../lib/util.js';
import { text } from '../lib/hud.js';

// Projecteur de signalisation sous coque (seul langage commun une fois la Cadence coupée).
function signal(ship, color = 0xffffff) {
  const s = glow(color, 6, 0, 'star');
  s.position.set(0, -1.2, 2);
  ship.add(s);
  const b = beam({ length: 40, radius: 6, color, opacity: 0 });
  b.position.set(0, -1.2, 2);
  ship.add(b);
  ship.userData.signal = (k) => {
    s.material.opacity = k;
    s.scale.setScalar(6 + 34 * k);
    b.material.uniforms.opacity.value = 0.18 * k;
  };
  ship.userData.signal(0);
}

// Motif : une longue, deux courtes.
function longShortShort(x) {
  if (x < 0) return 0;
  return pulse(x, 0, 0.9, 0.05) + pulse(x, 1.2, 1.45, 0.03) + pulse(x, 1.7, 1.95, 0.03);
}

const IND = [[0, [24, 18, 60]], [8, [24, 18, 10]], [16, [20, 22, -20]], [26, [10, 26, -40]], [36, [30, 10, -60]], [40, [34, 6, -70]], [46, [20, 14, -80]], [56, [18, 16, -90]], [68, [10, 18, -100]], [86, [0, 20, -140]]];

export default {
  id: '09',
  title: 'Le Miroir se brise',
  chapter: 'Chapitre 22',
  duration: 88,
  shots: [
    {
      t: [0, 8], plan: 'Plan embarqué', optique: '24 mm', mouvement: 'Solidaire de L’Indocile, sursaut',
      lumiere: "Les étoiles vibrent ; plus aucun marqueur sur l'écran",
      intention: "Le premier danger de la marée aveugle ne fut pas un tir mosode. Ce fut Nim.",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x + 2, p.y + 3, p.z + 9], look: [p.x - 2, p.y + 1, p.z - 30], fov: 56, shake: lt > 3 && lt < 5 ? 0.3 : 0.06, shakeFreq: 3 };
      },
    },
    {
      t: [8, 16], plan: 'Plan large', optique: '35 mm', mouvement: 'Fixe',
      lumiere: 'Trois éclats des feux d’aile de Fara ; un cercle tracé au projecteur',
      intention: "REGROUPEMENT VISUEL. Une escadrille se reconstruit sans réseau. Pas proprement. Assez.",
      cam: () => ({ pos: [70, 30, -10], look: [10, 18, -30], fov: 44 }),
    },
    {
      t: [16, 26], plan: 'Plan large, contre-plongée', optique: '28 mm', mouvement: 'Fixe',
      lumiere: 'Barre verticale du projecteur de Fara : MONTE',
      intention: "Un chasseur pris dans le sillage du remorqueur cinq pivote vers l'anneau. Nim passe devant sa verrière et monte.",
      cam: () => ({ pos: [-50, -40, 40], look: [-20, 0, 0], fov: 46 }),
    },
    {
      t: [26, 36], plan: 'Plan large', optique: '50 mm', mouvement: 'Panoramique',
      lumiere: 'Feux rouges mosodes qui se croisent',
      intention: "Deux chasseurs mosodes convergent vers le même espace et rompent l'un devant l'autre.",
      cam: () => ({ pos: [-95, 26, -95], look: [-60, 20, -140], fov: 42 }),
    },
    {
      t: [36, 46], plan: 'Plan embarqué, tourelle', optique: '35 mm', mouvement: 'Roulis sur le flanc',
      lumiere: 'Zone de lumière déformée dont surgit le Mosode',
      intention: "Trois points fixes, deux vitesses. « Trois secondes. Deux. » La tourelle l'attendait. « Korren ? » « Oui. »",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x - 6, p.y + 2, p.z + 8], look: [p.x + 10, p.y - 6, p.z - 30], fov: 48, shake: 0.08 };
      },
    },
    {
      t: [46, 56], plan: 'Plan large', optique: '35 mm', mouvement: 'Fixe',
      lumiere: 'L’Indocile immobile au centre d’une figure ennemie qui se défait',
      intention: "Balam ne fait rien. Quatre Mosodes terminent leur manœuvre autour d'un adversaire qui ne joue pas.",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x + 50, p.y + 30, p.z + 40], look: [p.x, p.y, p.z], fov: 42 };
      },
    },
    {
      t: [56, 68], plan: 'Plan large, croiseur de commandement', optique: '35 mm', mouvement: 'Travelling latéral',
      lumiere: "Les antennes tactiques ennemies cessent d'émettre leurs impulsions",
      intention: "Fara, Sava et Nim sur les relais. Un relais latéral s'éteint. Le Miroir n'a plus de bataille stable à lire.",
      cam: (lt) => ({ pos: [keys([[0, 120], [12, 60]], lt), 80, -260], look: [0, 40, -420], fov: 46 }),
    },
    {
      t: [68, 80], plan: "Plan d'ensemble, très large", optique: '18 mm', mouvement: 'Grue lente',
      lumiere: 'Le signal court de projecteur en projecteur à travers toute la flotte',
      intention: "UN LONG. DEUX COURTS. MIROIR INOPÉRANT. La nouvelle traverse une flotte qui ne peut plus la transmettre autrement.",
      cam: (lt) => ({ pos: [keys([[0, 150], [12, 110]], lt), keys([[0, 50], [12, 90]], lt), keys([[0, 150], [12, 130]], lt)], look: [0, 10, -40], fov: 56 }),
    },
    {
      t: [80, 88], plan: 'Plan moyen', optique: '50 mm', mouvement: 'Fixe, l’appareil passe au-dessus',
      lumiere: 'Feux dorés d’un chasseur de commandement',
      intention: "Plus grand. Plus lourd. « Dril. » « Le commandeur pilote lui-même ? »",
      cam: () => ({ pos: [20, 6, -110], look: [0, 30, -170], fov: 44 }),
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 90, hues: [[20, 40, 50], [40, 30, 50]], density: 0.4 }));
    S.stars = starfield({ count: 6000, seed: 90 });
    scene.add(S.stars);
    scene.add(new THREE.HemisphereLight(0x304050, 0x101010, 0.8));
    const key = new THREE.DirectionalLight(0xfff0e0, 2);
    key.position.set(200, 300, 200);
    scene.add(key);
    S.tide = filaments({ count: 120, length: 900, radius: 400, color: 0x6a8aa0, twist: 0.3, seed: 31 });
    S.tide.position.z = 400;
    scene.add(S.tide);
    S.cv = convoy();
    scene.add(S.cv);
    S.frig = frigate();
    S.frig.position.set(0, 10, -170);
    S.frig.rotation.y = Math.PI;
    scene.add(S.frig);
    S.ind = indocile();
    signal(S.ind);
    scene.add(S.ind);
    const r = rng(9);
    // Flotte d'OTANE (paires visuelles)
    S.fleet = [];
    for (let i = 0; i < 18; i++) {
      const f = otaneFighter({ stripe: i === 0 ? 0xc8a8f0 : i === 1 ? 0xd0b060 : 0x3a7bd5 });
      const a = (i / 18) * Math.PI * 2;
      f.userData.base = [Math.cos(a) * (60 + r() * 50), -20 + r() * 60, -120 + r() * 220];
      f.position.set(...f.userData.base);
      f.rotation.y = Math.PI;
      signal(f);
      scene.add(f);
      S.fleet.push(f);
    }
    S.fara = S.fleet[0];
    S.sava = S.fleet[1];
    S.nim = otaneFighter({ color: 0xd8d8d8, stripe: 0x30d0d0 });
    S.nim.scale.setScalar(0.7);
    signal(S.nim);
    scene.add(S.nim);
    S.lost = otaneFighter();
    signal(S.lost);
    scene.add(S.lost);
    // Mosodes
    S.mos = Array.from({ length: 8 }, (_, i) => {
      const m = mosodeFighter();
      m.userData.ph = i * 0.8;
      scene.add(m);
      return m;
    });
    S.cmd = cruiser({ length: 400 });
    S.cmd.position.set(0, 40, -480);
    scene.add(S.cmd);
    S.ant = Array.from({ length: 5 }, (_, i) => {
      const a = glow(0xff4030, 8, 1, 'star');
      a.position.set(-60 + i * 30, 72, -480 + (i % 2) * 40);
      scene.add(a);
      return a;
    });
    S.dril = mosodeFighter();
    S.dril.scale.setScalar(1.7);
    const gold = glow(0xffc040, 3, 1, 'hard');
    gold.position.set(0, 0.6, 1);
    S.dril.add(gold);
    scene.add(S.dril);
    S.escort = [0, 1, 2, 3].map(() => {
      const e = mosodeFighter();
      scene.add(e);
      return e;
    });
    S.bolts = Array.from({ length: 6 }, (_, i) => {
      const b = bolt(i < 3 ? 0xff7040 : 0x9fd0ff, 8, 0.35);
      scene.add(b);
      return b;
    });
    S.booms = [0, 1, 2].map((i) => {
      const e = explosion(0xffa040, 10, 30 + i);
      scene.add(e);
      return e;
    });
    S.warp = glow(0xc0d0ff, 30, 0);
    scene.add(S.warp);
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.stars.material.uniforms.jitter.value = 0.8;
    S.tide.material.uniforms.time.value = t * 0.4;
    S.tide.material.uniforms.intensity.value = 0.25;
    S.cv.userData.heart.userData.update(t * 2, 1);
    S.cv.userData.tugs.forEach((tg) => tg.userData.setThrust(0.8));
    const ip = fly(S.ind, IND, t, { bank: 0.004 });
    if (t > 37 && t < 41) S.ind.rotateZ(Math.sin((t - 37) * Math.PI / 4) * 1.4);
    S.ind.userData.setThrust(t > 46 && t < 56 ? 0.2 : 0.8);
    S.ind.userData.blink(t);
    S.ind.userData.turret.rotation.y = keys([[36, 0], [40, -2.4], [44, -2.6], [46, 0]], t);
    // Nim traverse devant L'Indocile
    S.nim.position.set(keys([[0, 70], [3.6, 24], [5, -30], [16, -40], [19, -20], [21, -10], [24, 10], [56, 10], [62, -20], [68, -10], [88, 0]], t), keys([[0, 18], [4, 22], [16, -6], [20, 2], [21, 12], [24, 20], [56, 30], [62, 55], [88, 40]], t), keys([[0, 4], [4, 8], [16, -10], [20, -6], [22, -2], [24, -20], [56, -300], [62, -380], [88, -300]], t));
    S.nim.lookAt(S.nim.position.x - 10, S.nim.position.y, S.nim.position.z - 10);
    // Flotte
    S.fleet.forEach((f, i) => {
      const b = f.userData.base;
      f.position.set(b[0] + Math.sin(t * 0.3 + i) * 6, b[1] + Math.cos(t * 0.25 + i) * 4, b[2] - t * 0.6);
      if (i === 0) f.position.set(keys([[0, -20], [8, 0], [16, -10], [56, -30], [62, -40], [68, -20], [88, -10]], t), keys([[0, 20], [8, 24], [56, 40], [62, 70], [68, 30]], t), keys([[0, -10], [8, -20], [56, -260], [62, -360], [68, -60], [88, -40]], t));
      if (i === 1) f.position.set(keys([[0, 40], [56, 30], [62, 10], [68, 40]], t), keys([[0, 30], [56, 50], [62, 60], [68, 30]], t), keys([[0, 20], [56, -280], [62, -380], [68, -80]], t));
      f.userData.blink(t);
      f.userData.setThrust(0.6);
    });
    // Le chasseur pris dans le sillage du remorqueur cinq
    S.lost.position.set(keys([[16, -40], [20, -26], [22, -24], [26, -30]], t), keys([[16, -10], [20, -16], [21.5, -18], [24, -4], [26, 0]], t), keys([[16, 40], [20, 10], [26, -10]], t));
    S.lost.rotation.set(0, Math.PI, keys([[16, 0], [20, 1.4], [21.5, 1.7], [23, 0.2]], t));
    S.lost.visible = t > 15 && t < 27;

    // Signaux lumineux
    S.ind.userData.signal(0);
    S.fleet.forEach((f) => f.userData.signal(0));
    S.nim.userData.signal(0);
    S.fara.userData.signal(pulse(t, 9, 9.3, 0.03) + pulse(t, 9.6, 9.9, 0.03) + pulse(t, 10.2, 10.5, 0.03) + pulse(t, 18.5, 20.5, 0.1));
    S.ind.userData.signal(pulse(t, 11.2, 11.5, 0.03) + pulse(t, 11.8, 12.1, 0.03) + pulse(t, 12.8, 14, 0.1));
    // Relais du signal MIROIR INOPÉRANT : de proche en proche
    const fp = S.fara.position;
    const ships = [S.fara, S.sava, S.nim, S.ind, ...S.fleet.slice(2)];
    if (t >= 68) {
      ships.forEach((sh) => {
        const d = sh.position.distanceTo(fp);
        sh.userData.signal(Math.min(1, longShortShort(t - 69 - d * 0.035)));
      });
    }
    // Mosodes
    S.mos.forEach((m, i) => {
      const ph = m.userData.ph;
      let p = [Math.cos(t * 0.3 + ph) * 140, 10 + Math.sin(t * 0.4 + ph) * 40, -160 + Math.sin(t * 0.2 + ph) * 80];
      if (i === 0) p = [keys([[26, -140], [31, -64], [32, -60], [36, -20]], t), keys([[26, 40], [31, 22], [36, 60]], t), keys([[26, -200], [31, -142], [36, -100]], t)];
      if (i === 1) p = [keys([[26, 20], [31, -56], [32, -58], [36, -120]], t), keys([[26, 0], [31, 18], [36, -10]], t), keys([[26, -80], [31, -138], [36, -200]], t)];
      if (i === 2) p = [ip[0] + keys([[36, 40], [41, 12], [44, 20]], t), ip[1] + keys([[36, -20], [41, -8], [44, -30]], t), ip[2] + keys([[36, -60], [41, -26], [44, -40]], t)];
      if (i >= 3 && i <= 6 && t > 46 && t < 56) {
        const a = (i - 3) * (Math.PI / 2) + (t - 46) * 0.5;
        p = [ip[0] + Math.cos(a) * 30, ip[1] + Math.sin(a * 0.7) * 12, ip[2] + Math.sin(a) * 30];
        if (i === 5) p = [ip[0] + keys([[46, 30], [52, 6], [54, 10]], t), ip[1] + 4, ip[2] + keys([[46, -10], [52, -18], [54, -60]], t)];
      }
      m.position.set(...p);
      m.lookAt(p[0] + Math.cos(t + ph) * 10, p[1], p[2] - 10);
      m.userData.blink(t);
      m.userData.setThrust(0.8);
      m.visible = !(i === 2 && t > 41.5) && !(i === 5 && t > 52.6);
    });
    // tirs dans le vide, tourelle, Nim/Fara sur les relais
    shootBolt(S.bolts[0], S.mos[0].position.toArray(), [S.mos[0].position.x + 30, S.mos[0].position.y, S.mos[0].position.z + 30], inv(33, 33.5, t));
    shootBolt(S.bolts[1], S.mos[1].position.toArray(), [10, 30, -40], inv(30, 30.6, t));
    shootBolt(S.bolts[3], ip, S.mos[2].position.toArray(), inv(41, 41.4, t));
    shootBolt(S.bolts[4], ip, S.mos[5].position.toArray(), inv(52.2, 52.6, t));
    shootBolt(S.bolts[5], S.fara.position.toArray(), [-30, 72, -480], inv(60, 60.6, t));
    setExplosion(S.booms[0], inv(41.4, 43, t)); S.booms[0].position.copy(S.mos[2].position);
    setExplosion(S.booms[1], inv(52.6, 54, t)); S.booms[1].position.copy(S.mos[5].position);
    setExplosion(S.booms[2], inv(60.6, 62.5, t)); S.booms[2].position.set(-30, 72, -480);
    S.warp.position.set(ip[0] + 12, ip[1] - 8, ip[2] - 26);
    S.warp.material.opacity = pulse(t, 39, 41.2, 0.5) * 0.5;
    S.warp.scale.setScalar(30 + Math.sin(t * 20) * 6);
    S.ant.forEach((a, i) => (a.material.opacity = t < 61 + i * 0.6 ? (Math.sin(t * 6 + i) > 0 ? 1 : 0.3) : 0));
    // Dril
    S.dril.position.set(keys([[80, 60], [88, -20]], t), keys([[80, 60], [88, 34]], t), keys([[80, -260], [88, -150]], t));
    S.dril.lookAt(0, 0, 0);
    S.dril.visible = t > 79;
    S.dril.userData.setThrust(1);
    S.escort.forEach((e, i) => {
      e.position.copy(S.dril.position).add(new THREE.Vector3(Math.cos(i * 1.6) * 18, Math.sin(i * 1.6) * 10, -10));
      e.lookAt(0, 0, 0);
      e.visible = t > 79;
    });
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    if (t < 8) {
      text(g, 'TRANSPONDEURS : PORTÉE 3 km', 60, h - 40, { size: 12, color: '#9fc8ff' });
      text(g, 'CADENCE : —', w - 60, h - 40, { size: 12, align: 'right', color: '#9fc8ff' });
    }
    if (t >= 9 && t < 14) text(g, '· · ·  REGROUPEMENT VISUEL', 60, 50, { size: 14, color: '#ffffff', weight: 700, alpha: ramp(10.4, 10.8, t) });
    if (t >= 18 && t < 21) text(g, '│  MONTE', 60, 50, { size: 14, color: '#ffffff', weight: 700, alpha: ramp(18.6, 19, t) });
    if (t >= 36 && t < 41) {
      const pts = [['LE CŒUR', 1], ['FRÉGATE AVANT', 2], ['FARA', 3]];
      pts.forEach(([l, i]) => text(g, `${i} · ${l}`, 60, 40 + i * 20, { size: 12, color: '#bfe8ff' }));
      const c = Math.max(0, Math.ceil(41 - t));
      if (t > 38.5) text(g, String(c), w / 2, h / 2, { size: 60, align: 'center', color: 'rgba(255,255,255,0.7)', weight: 200, mono: false });
    }
    if (t >= 70 && t < 80) {
      text(g, '—    ·    ·', w / 2, 50, { size: 26, align: 'center', color: '#ffffff', weight: 700, alpha: ramp(69.2, 69.6, t) });
      text(g, 'MIROIR INOPÉRANT', w / 2, 80, { size: 14, align: 'center', color: '#ffffff', spacing: 4, alpha: ramp(70.5, 71, t) });
    }
  },

  subs: [
    [1, 3, '*', 'Le premier danger de la marée aveugle ne fut pas un tir mosode. Ce fut Nim.'],
    [5, 1.4, 'Balam', 'Ça commence bien.'],
    [6.6, 1.6, 'Glide', 'Trois kilomètres. Parfois quatre.'],
    [13, 3, '*', 'Une escadrille se reconstruisit sans réseau. Pas proprement. Assez.'],
    [22.5, 1.8, 'Balam', 'On va finir par se tuer nous-mêmes.'],
    [24.4, 1.6, 'Glide', 'C’est le prix de l’absence de réseau.'],
    [28, 1.6, 'Glide', 'Ils n’ont pas préparé ça.'],
    [29.8, 1, 'Balam', 'Nous non plus.'],
    [32.5, 2.4, 'Balam', 'Je crois que le Miroir vient de perdre son reflet.'],
    [35, 1, 'Glide', 'C’était mauvais.'],
    [36.6, 1.8, 'Glide', 'Deux appareils bas droite.'],
    [38.6, 1.2, 'Glide', 'Trois secondes.'],
    [40, 0.8, 'Glide', 'Deux.'],
    [42.4, 1.4, 'Balam', 'Tu les suivais comment ?'],
    [43.9, 1.8, 'Glide', 'Je savais où ils ne pouvaient pas être.'],
    [45, 0.8, 'Balam', 'Korren ?'],
    [45.9, 0.8, 'Glide', 'Oui.'],
    [47, 1.4, 'Glide', 'Qu’est-ce que tu fais ?'],
    [48.6, 0.8, 'Balam', 'Rien.'],
    [53, 3, 'Balam', 'J’ai passé ma vie à fuir. Il fallait une guerre pour découvrir que ne pas bouger pouvait être imprévisible.'],
    [56.3, 1.8, 'Glide', 'N’en tire aucune conclusion générale.'],
    [58.3, 0.9, 'Balam', 'Trop tard.'],
    [62, 3.4, '*', 'Le Miroir n’était peut-être pas détruit. Il n’avait plus de bataille stable à lire.'],
    [74, 4, '*', 'De proche en proche, la nouvelle traversa une flotte qui ne pouvait plus la transmettre autrement.'],
    [82, 0.9, 'Glide', 'Dril.'],
    [83.2, 1.8, 'Balam', 'Le commandeur pilote lui-même ?'],
  ],
  cues: [
    [0, 'tide', 0.8], [3.6, 'flyby', 1], [9, 'click', 0.5], [11.2, 'click', 0.4], [18.5, 'click', 0.5], [20, 'flyby', 0.7],
    [26, 'tension', 0.6], [30, 'laser', 0.5], [33, 'laser', 0.5], [38.6, 'tick', 0.6], [39.6, 'tick', 0.6], [41, 'laser', 0.8],
    [41.4, 'boom', 0.8], [46, 'silence', 0.6], [52.2, 'laser', 0.8], [52.6, 'boom', 0.8], [56, 'combat', 0.8], [60, 'laser', 0.7],
    [60.6, 'boom', 1], [68, 'swell', 1], [80, 'cruiser', 0.8],
  ],
  music: { mood: 'combat' },
};

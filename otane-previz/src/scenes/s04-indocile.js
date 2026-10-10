import * as THREE from 'three';
import { starfield, nebulaSky, planet, glow, sparkCloud, bolt, shootBolt } from '../lib/fx.js';
import { indocile, otaneFighter, hangar, cradle, pik, human, alyde, couronne, cockpitInterior, pilotBust, hullMat, box } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp } from '../lib/util.js';
import { panel, text, alert, gauge } from '../lib/hud.js';

const lin = (x) => x;
const FLIGHT = [
  [48, [0, 2, 60]], [50, [-2, 3, -60]], [53, [-30, 6, -320]], [56, [-60, 10, -600]], [59, [-20, 20, -820]], [62, [40, 15, -960]],
  [64, [70, 10, -1040]], [66, [40, 0, -900]], [69, [10, -4, -620]], [72, [2, 1, -300]], [74.5, [0, 1.8, -60]], [76, [0, 1.8, 20]], [86, [0, 1.8, 22]],
];

export default {
  id: '04',
  title: "L'Indocile",
  chapter: 'Chapitres 5 et 6',
  duration: 88,
  shots: [
    {
      t: [0, 8], plan: "Plan d'ensemble hangar", optique: '21 mm', mouvement: 'Travelling latéral le long des berceaux',
      lumiere: 'Lumière zénithale blanche, uniforme : rien ne traîne, aucune cicatrice',
      intention: "Sur Sol, une machine intacte était soit neuve, soit suspecte. Ici, aucune rayure.",
      cam: (lt) => ({ pos: [keys([[0, -50], [8, -30]], lt), 6, keys([[0, -40], [8, -20]], lt)], look: [-20, 2, 10], fov: 50 }),
    },
    {
      t: [8, 16], plan: 'Plan large, révélation', optique: '35 mm', mouvement: 'Travelling avant lent',
      lumiere: "Un seul plafonnier sur la réserve ; poussière en suspension dans le cône",
      intention: "Derrière la cloison coupe-feu, l'ordre impeccable cesse. Puis le quatrième appareil.",
      cam: (lt) => ({ pos: [keys([[0, 22], [8, 12]], lt), 4.5, keys([[0, 22], [8, 13]], lt)], look: [0, 1.8, 0], fov: 40 }),
    },
    {
      t: [16, 24], plan: 'Plan moyen, contre-plongée', optique: '28 mm', mouvement: 'Fixe au ras du sol',
      lumiere: 'Baladeuse sous le ventre du chasseur',
      intention: 'Pik sort de sous l’appareil sur sa planche. « Trop tard. »',
      cam: () => ({ pos: [4.2, 0.5, 7.4], look: [1.2, 0.4, 3.0], fov: 46 }),
    },
    {
      t: [24, 32], plan: 'Champ / contrechamp', optique: '50 mm', mouvement: 'Fixe',
      lumiere: 'Plafonnier en douche, visages à moitié dans l’ombre',
      intention: "« Ne dépassez jamais quatre-vingt-dix-sept pour cent. » « J'ai entendu un nombre. »",
      cam: (lt) => (lt < 4 ? { pos: [6.8, 1.6, 8.2], look: [1.6, 1.0, 3.6], fov: 40 } : { pos: [-0.8, 1.3, 7.4], look: [2.4, 1.3, 5.4], fov: 40 }),
    },
    {
      t: [32, 40], plan: 'Gros plan', optique: '85 mm', mouvement: 'Fixe',
      lumiere: 'Lumière rasante du matin sur la coque repeinte',
      intention: "« Elle est indocile, mais pas morte. » La main de Balam sur la coque. Le nom reste.",
      cam: () => ({ pos: [3.8, 1.75, 3.6], look: [1.8, 1.45, 1.6], fov: 34 }),
    },
    {
      t: [40, 48], plan: 'Plan rapproché cockpit', optique: '35 mm', mouvement: 'Lent travelling avant',
      lumiere: 'Le tableau de bord se réveille par couches ; vraies aiguilles',
      intention: "Aucun écran ne cherche à décider à sa place. Il sourit malgré lui. « Je t'ai vu. »",
      cam: (lt) => ({ pos: [2000.0, 1.72, keys([[0, -1.3], [8, -0.9]], lt)], look: [2000, 1.15, 0.8], fov: 46 }),
    },
    {
      t: [48, 56], plan: 'Plan large, sortie du hangar', optique: '24 mm', mouvement: 'Fixe puis panoramique',
      lumiere: 'Contre-jour : la porte ouverte sur La Couronne',
      intention: "L'Indocile quitte le hangar comme si quelqu'un venait de lui donner un coup de pied.",
      cam: (lt, S) => {
        const p = S.ship.position;
        return lt < 3 ? { pos: [8, 3, 50], look: [0, 2, -40], fov: 46 } : { pos: [p.x + 30, p.y + 8, p.z + 50], look: [p.x, p.y, p.z], fov: 30 };
      },
    },
    {
      t: [56, 66], plan: 'Plan de poursuite', optique: '50 mm', mouvement: 'Derrière et au-dessus, suit la cible',
      lumiere: 'Balises bleues du secteur d’essai, éclat du disque',
      intention: "« Ce n'est pas une valeur. » Puis une valeur. Le disque éclate en trois fragments.",
      cam: (lt, S) => {
        const p = S.ship.position;
        const q = S.next;
        return { pos: [p.x - (q[0] - p.x) * 0.4 + 6, p.y + 6, p.z - (q[2] - p.z) * 0.4 + 14], look: [q[0], q[1], q[2]], fov: 48, shake: 0.1 };
      },
    },
    {
      t: [66, 76], plan: 'Plan embarqué', optique: '18 mm', mouvement: 'Roulis à 90°, retour brutal',
      lumiere: 'Voyant rouge hydraulique, la porte du hangar qui grandit',
      intention: "La balise passe sous la verrière à moins de dix mètres. Entrée à 148. Les rails accrochent.",
      cam: (lt, S) => {
        const p = S.ship.position;
        const q = S.next;
        return { pos: [p.x, p.y + 2.4, p.z + 1.5], look: [q[0], q[1] + 1.5, q[2]], fov: 64, roll: S.roll, shake: 0.2, shakeFreq: 3 };
      },
    },
    {
      t: [76, 82], plan: 'Plan moyen', optique: '35 mm', mouvement: 'Fixe',
      lumiere: 'Retour à la lumière blanche du hangar',
      intention: "« Dix-sept minutes et quarante-deux secondes. » « On a dépassé. » « J'avais remarqué. »",
      cam: () => ({ pos: [7, 3.5, 30], look: [0, 2.5, 22], fov: 38 }),
    },
    {
      t: [82, 88], plan: "Plan d'ensemble", optique: '21 mm', mouvement: 'Fixe',
      lumiere: 'Toute la longueur du hangar vire au rouge',
      intention: 'ALERTE FRONTIÈRE. Les dix-sept minutes d’essai viennent de devenir leur seul entraînement.',
      cam: () => ({ pos: [-14, 10, 60], look: [0, 2, 0], fov: 52 }),
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 5, hues: [[10, 40, 60], [30, 50, 80]], density: 0.3 }));
    S.stars = starfield({ count: 4000, seed: 41 });
    scene.add(S.stars);
    S.hall = hangar({});
    scene.add(S.hall);
    S.top = new THREE.DirectionalLight(0xe8f0ff, 1.6);
    S.top.position.set(-20, 40, 30);
    scene.add(S.top);
    // Berceaux modernes
    for (let i = 0; i < 5; i++) {
      const c = cradle();
      c.position.set(-40, 0, -50 + i * 22);
      scene.add(c);
      const f = otaneFighter();
      f.position.set(-40, 2.6, -50 + i * 22);
      f.rotation.y = Math.PI / 2;
      f.scale.setScalar(1.2);
      scene.add(f);
    }
    // Cloison coupe-feu et réserve
    const fw = new THREE.Mesh(box(1, 20, 60), hullMat('dark', { color: 0x585c60 }));
    fw.position.set(-16, 10, 20);
    scene.add(fw);
    for (let i = 0; i < 14; i++) {
      const cr = new THREE.Mesh(box(2 + (i % 3), 1.5 + (i % 2), 2), hullMat('rust', { color: [0x8a6a4a, 0x5a6a7a, 0x7a7a6a][i % 3] }));
      cr.position.set(8 + (i % 4) * 2.5, 0.75 + Math.floor(i / 8) * 1.6, -8 + Math.floor(i / 4) * 3);
      cr.rotation.y = i * 0.3;
      scene.add(cr);
    }
    for (let i = 0; i < 3; i++) {
      const old = indocile();
      old.position.set(-8 + i * 8, 1.6, -14);
      old.rotation.y = 0.4 * (i - 1);
      old.userData.setThrust(0);
      scene.add(old);
    }
    S.ship = indocile();
    S.ship.position.set(0, 1.8, 0);
    scene.add(S.ship);
    S.cr = cradle();
    scene.add(S.cr);
    S.lamp = new THREE.SpotLight(0xfff0d8, 900, 40, 0.5, 0.6, 1.5);
    S.lamp.position.set(0, 22, 2);
    S.lamp.target.position.set(0, 0, 0);
    scene.add(S.lamp, S.lamp.target);
    S.dust = sparkCloud({ count: 300, seed: 2, color: 0xfff0d0, size: 0.04, spread: [12, 20, 12] });
    S.dust.position.set(0, 10, 0);
    scene.add(S.dust);
    S.work = new THREE.PointLight(0xffc080, 8, 6, 2);
    S.work.position.set(1, 0.4, 1.5);
    scene.add(S.work);
    S.red = new THREE.PointLight(0xff2010, 0, 120, 1.2);
    S.red.position.set(0, 25, 0);
    scene.add(S.red);

    S.pik = pik();
    scene.add(S.pik);
    S.board = new THREE.Mesh(box(0.5, 0.06, 1.1), hullMat('dark'));
    scene.add(S.board);
    S.balam = human({ body: 0x3a3226 });
    S.balam.position.set(2.6, 0, 6);
    S.balam.rotation.y = -2.4;
    scene.add(S.balam);
    S.glide = alyde();
    S.glide.position.set(-2.5, 0, 6.5);
    S.glide.rotation.y = 2.6;
    scene.add(S.glide);
    S.fara = human({ body: 0x22262e, female: true, skin: 0x9a7a66 });
    S.fara.position.set(3.6, 0, 1.0);
    S.fara.rotation.y = -1.6;
    scene.add(S.fara);

    // Extérieur : La Couronne et le secteur d'essai
    S.city = couronne();
    S.city.position.set(1800, -300, -1400);
    scene.add(S.city);
    S.star = new THREE.DirectionalLight(0xffe2c0, 2.2);
    S.star.position.set(2000, 800, -1000);
    scene.add(S.star);
    S.nerea = planet({ radius: 5200, seed: 12, kind: 'nerea', atmo: 0x9fd0ff });
    S.nerea.position.set(-6000, -4500, -15000);
    scene.add(S.nerea);
    S.beacons = [];
    for (let i = 0; i < 16; i++) {
      const b = glow(0x3a8aff, 8, 1, 'hard');
      b.position.set(i % 2 ? 90 : -90, 0, -200 - i * 60);
      scene.add(b);
      S.beacons.push(b);
    }
    S.frames = [];
    for (let i = 0; i < 2; i++) {
      const f = new THREE.Mesh(new THREE.TorusGeometry(14, 0.6, 6, 4), new THREE.MeshStandardMaterial({ color: 0x8090a0, emissive: 0x2050a0, emissiveIntensity: 0.6 }));
      f.position.set(-40 + i * 30, 12, -700 - i * 140);
      f.rotation.z = Math.PI / 4;
      scene.add(f);
      S.frames.push(f);
    }
    S.disc = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.5, 20), new THREE.MeshStandardMaterial({ color: 0xffa040, emissive: 0xff6010, emissiveIntensity: 1 }));
    S.disc.rotation.x = Math.PI / 2;
    scene.add(S.disc);
    S.frags = [0, 1, 2].map(() => {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.5, 3), S.disc.material);
      scene.add(f);
      return f;
    });
    S.shot = bolt(0x9fd0ff, 10, 0.4);
    scene.add(S.shot);
    S.fara2 = otaneFighter();
    scene.add(S.fara2);
    S.telemetry = new THREE.Mesh(box(3, 3, 3), hullMat('clean'));
    S.telemetry.position.set(4, -8, -470);
    scene.add(S.telemetry);
    S.telemetryLight = glow(0xff4040, 6, 1, 'hard');
    S.telemetry.add(S.telemetryLight);

    // Cockpit (plateau)
    S.cock = cockpitInterior({ color: 0x3a3c40, seed: 17, tandem: true });
    S.cock.position.set(2000, 0, 0);
    scene.add(S.cock);
    S.pilot = pilotBust('balam');
    S.pilot.position.set(2000, -0.42, -0.12);
    scene.add(S.pilot);
    S.gunner = alyde();
    S.gunner.position.set(2000, -0.2, -1.3);
    S.gunner.scale.setScalar(0.95);
    scene.add(S.gunner);
    S.dash = [];
    for (let i = 0; i < 5; i++) {
      const l = new THREE.PointLight([0xffa040, 0x40ff90, 0x9fd0ff, 0xffa040, 0xff4030][i], 0, 2.5, 2);
      l.position.set(2000 - 0.5 + i * 0.25, 1.1, 0.7);
      scene.add(l);
      S.dash.push(l);
    }
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.city.userData.update(t);
    S.hall.userData.setDoors(keys([[44, 0], [48, 1], [80, 1], [82, 0]], t));
    const morning = t >= 32 && t < 48;
    S.lamp.intensity = t < 8 ? 0 : morning ? 600 : 900;
    S.dust.material.uniforms.time.value = t;
    S.dust.material.uniforms.amount.value = t > 8 && t < 48 ? 0.8 : 0;
    // Alerte rouge
    const red = ramp(82.5, 83.2, t);
    S.red.intensity = red * 30000 * (0.6 + 0.4 * Math.sin(t * 6));
    S.hall.userData.key.intensity = 2.2 * (1 - 0.8 * red);
    S.top.intensity = (t >= 8 && t < 48 ? 0.5 : 1.6) * (1 - red);
    S.hall.userData.strips.forEach((s) => s.material.emissive.setRGB(1, 1 - red * 0.85, 1 - red * 0.9));

    // Pik sur sa planche
    const out = smooth(inv(16.5, 18.5, t));
    S.pik.position.set(lerp(0.6, 1.4, out), out > 0.95 && t > 19.2 ? 0 : 0.08, lerp(1.2, 3.6, out));
    S.pik.rotation.set(t < 19.2 ? -Math.PI / 2 : 0, t < 19.2 ? 0 : -2.6, 0);
    if (t < 19.2) S.pik.position.y = 0.15;
    S.board.position.set(lerp(0.6, 1.4, out), 0.05, lerp(0.6, 3.0, out));
    S.pik.visible = t >= 16 && t < 48;
    S.board.visible = t >= 16 && t < 32;
    S.pik.userData.armR.rotation.x = t > 35.5 && t < 36.5 ? -1.8 : -0.2;
    if (t >= 32 && t < 40) {
      S.pik.position.set(1.4, 0, 4.4);
      S.pik.rotation.set(0, -2.4, 0);
    }
    if (t >= 76) {
      S.pik.visible = true;
      S.pik.position.set(2, 0, 24);
      S.pik.rotation.set(0, -0.6, 0);
    }
    S.balam.visible = (t >= 8 && t < 40) || t >= 82;
    S.glide.visible = S.balam.visible;
    S.fara.visible = t >= 24 && t < 40;
    S.balam.userData.armR.rotation.set(t > 34 && t < 40 ? -1.2 : -0.1, 0, 0.1);
    if (t >= 32 && t < 40) {
      S.balam.position.set(2.25, 0, 1.6);
      S.balam.rotation.y = -Math.PI / 2;
    } else {
      S.balam.position.set(2.6, 0, 6);
      S.balam.rotation.y = -2.4;
    }

    // Vol
    const p = keys(FLIGHT, t, lin);
    const q = keys(FLIGHT, t + 0.6, lin);
    S.next = q;
    if (t < 48) {
      S.ship.position.set(0, 1.8, 0);
      S.ship.rotation.set(0, 0, 0);
    } else {
      S.ship.position.set(...p);
      if (t < 75.5) S.ship.lookAt(...q);
      else S.ship.rotation.set(0, 0, 0);
      // le moteur gauche pousse 4 % de plus : le nez part à bâbord
      const yaw = keys([[48, 0], [49, 0.18], [50, -0.1], [51, 0]], t);
      S.roll = keys([[66, 0], [69.5, 0], [70, Math.PI / 2], [71.5, Math.PI / 2], [72, 0.1], [76, 0]], t);
      S.ship.rotateY(yaw);
      S.ship.rotateZ(S.roll);
    }
    S.cr.position.set(0, 0, t < 48 ? 0 : 1000);
    S.ship.userData.setThrust(t < 44 ? 0 : t < 48 ? 0.3 : t > 74 ? 0.1 : [0.9, 0.86]);
    S.ship.userData.blink(t);
    // poursuite de Fara à 50 m
    S.fara2.position.set(p[0] - 50, p[1] + 4, p[2] + 10);
    S.fara2.lookAt(q[0] - 50, q[1] + 4, q[2] + 10);
    S.fara2.visible = t > 50 && t < 74;
    // cible et tir
    S.disc.position.set(keys([[56, 80], [62.5, 30]], t), keys([[56, 20], [62.5, 13]], t), keys([[56, -980], [62.5, -1020]], t));
    S.disc.visible = t > 55 && t < 62.6;
    S.frags.forEach((f, i) => {
      const k = Math.max(0, t - 62.6);
      f.position.set(30 + (i - 1) * k * 6, 13 + Math.sin(i * 2) * k * 5, -1020 + Math.cos(i) * k * 4);
      f.rotation.set(k * 3, k * 2, i);
      f.visible = t >= 62.6 && t < 66;
    });
    shootBolt(S.shot, [p[0], p[1], p[2]], [30, 13, -1020], inv(62.1, 62.6, t));
    if (t > 62.6 && t < 62.8) S.flash = 0.25;
    S.flashColor = '#ffd8a0';
    // cockpit
    const wake = (i) => ramp(41 + i * 1.2, 41.6 + i * 1.2, t);
    S.dash.forEach((l, i) => (l.intensity = 2.5 * wake(i)));
    S.cock.userData.glowPanel.material.opacity = 0.35 * wake(3);
    S.pilot.userData.armR.rotation.set(-1.0, 0, 0.2);
    S.pilot.userData.armL.rotation.set(-1.0, 0, -0.2);
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    if (t >= 40 && t < 48) {
      const k = ramp(42, 44, t);
      ['ALIMENTATION', 'GYROSCOPES', 'POMPES', 'ARMEMENT', 'PROPULSION'].forEach((s, i) => text(g, `${s} ${ramp(41 + i * 1.2, 41.5 + i * 1.2, t) > 0.5 ? '●' : '○'}`, 60, h - 150 + i * 20, { size: 12, color: '#bfe8d0', alpha: k }));
      // aiguille analogique
      g.save();
      g.translate(w - 160, h - 110);
      g.strokeStyle = 'rgba(255,220,160,0.8)';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(0, 0, 60, Math.PI, 2 * Math.PI);
      g.stroke();
      const a = Math.PI + Math.PI * (0.1 + 0.5 * ramp(42, 46, t) + Math.sin(t * 7) * 0.01);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * 54, Math.sin(a) * 54);
      g.stroke();
      g.restore();
    }
    if (t >= 56 && t < 64) {
      const v = keys([[56, 60], [59, 82], [61, 88], [62, 88], [62.4, 40]], t);
      gauge(g, w - 300, h - 60, 240, 12, v, { label: 'POUSSÉE', limit: 97 });
    }
    if (t >= 66 && t < 76) {
      alert(g, 'DISTRIBUTION HYDRAULIQUE — ASSISTANCE DROITE PERDUE', w / 2, 60, t, { size: 15 });
      const v = keys([[66, 190], [70, 192], [73, 160], [75.5, 148]], t);
      text(g, `${Math.round(v)}`, w - 80, h - 40, { size: 40, align: 'right', color: v > 150 ? '#ff6040' : '#ffd0a0', weight: 700 });
    }
    if (t >= 82) alert(g, 'ALERTE FRONTIÈRE · PERSONNEL DE VOL AUX APPAREILS', w / 2, 60, t, { size: 17, blink: 1.5 });
  },

  subs: [
    [3, 3.4, '*', 'Sur Sol, une machine intacte était soit neuve, soit suspecte.'],
    [11.5, 1, 'Balam', 'Non.'],
    [12.8, 2.6, 'Balam', 'Je sais reconnaître une mauvaise idée à distance.'],
    [16.6, 3.2, 'Pik', 'Assez pour savoir qu’il ne faut pas répondre aux pilotes avant qu’ils aient dit bonjour.'],
    [20, 1, 'Balam', 'Bonjour.'],
    [21.2, 1.2, 'Pik', 'Trop tard.'],
    [24.3, 3.4, 'Pik', 'Ne dépassez jamais quatre-vingt-dix-sept pour cent sur le moteur gauche.'],
    [27.8, 1.2, 'Balam', 'Combien de temps ?'],
    [29.1, 2, 'Pik', 'Vous n’avez pas entendu « jamais » ?'],
    [30.9, 1.2, 'Balam', 'J’ai entendu un nombre.'],
    [33, 2.6, 'Pik', 'Elle est indocile, mais pas morte.'],
    [36, 1.2, 'Balam', 'L’Indocile.'],
    [37.3, 1.1, 'Pik', 'J’interdis.'],
    [38.5, 1.3, 'Balam', 'Trop tard.'],
    [45, 1.1, 'Glide', 'Je t’ai vu.'],
    [46.2, 0.8, 'Balam', 'Vu quoi ?'],
    [47.1, 0.8, 'Glide', 'Rien.'],
    [49, 1.4, 'Glide', 'Doucement.'],
    [50.5, 1.1, 'Balam', 'Je pilote.'],
    [51.7, 1.6, 'Glide', 'C’est ce qui m’inquiète.'],
    [56.4, 1.2, 'Balam', 'J’accélère.'],
    [57.7, 0.8, 'Glide', 'Combien ?'],
    [58.6, 1, 'Balam', 'Suffisamment.'],
    [59.7, 1.3, 'Glide', 'Ce n’est pas une valeur.'],
    [60.4, 2, 'Balam', 'Quatre-vingt-deux. Quatre-vingt-huit dans deux secondes.'],
    [63, 1.6, 'Balam', 'Tu vois quand tu veux.'],
    [64.7, 1.3, 'Glide', 'Tu as donné une valeur.'],
    [67, 1.8, 'Balam', 'Fara, j’ai perdu l’assistance droite.'],
    [70.6, 2, '*', 'Le traducteur hésita, puis choisit : « imbécile construit à l’envers ».'],
    [76.5, 2.8, 'Pik', 'Dix-sept minutes et quarante-deux secondes.'],
    [79.4, 1.1, 'Balam', 'On a dépassé.'],
    [80.6, 1.3, 'Pik', 'J’avais remarqué.'],
    [84, 3, 'Pik', 'Si vous touchez à quatre-vingt-dix-sept aujourd’hui, je vous assomme moi-même au retour.'],
  ],
  cues: [
    [0, 'hangar', 0.6], [8, 'hum', 0.4], [16.5, 'roll', 0.5], [33.5, 'pat', 0.6], [36.2, 'pat', 0.3], [40, 'canopy', 0.6],
    [41, 'boot', 0.6], [42.2, 'boot', 0.5], [43.4, 'boot', 0.5], [44.6, 'boot', 0.5], [45.8, 'boot', 0.5], [47.5, 'engine', 0.9],
    [48, 'kick', 1], [56, 'engine', 0.7], [62.1, 'laser', 0.7], [62.6, 'impact', 0.7], [66, 'alarm', 0.7], [70, 'whoosh', 0.8],
    [75.5, 'clank', 1], [82.5, 'klaxon', 1], [84, 'engine', 0.6],
  ],
  music: { mood: 'énergie' },
};

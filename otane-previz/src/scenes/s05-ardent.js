import * as THREE from 'three';
import { starfield, nebulaSky, planet, glow, bolt, shootBolt, explosion, setExplosion, sparkCloud } from '../lib/fx.js';
import { indocile, otaneFighter, mosodeFighter, mosodeBomber, ardentPlatform, shuttle, cockpitInterior, pilotBust, alyde, hullMat } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp, fly } from '../lib/util.js';
import { panel, text, alert, arc, blip } from '../lib/hud.js';

// Ardent-Six est à l'origine. Pylône « trois » = branche vers -Z. Les Mosodes arrivent par -Z.
const IND = [
  [0, [12, 34, 470]], [16, [12, 30, 190]], [22, [14, 24, 110]], [25, [8, -8, 70]], [27.5, [-12, -16, 50]],
  [29, [-16, -8, 30]], [31, [-4, 6, 10]], [34, [10, 10, -20]], [37, [6, 2, -36]], [40, [-6, -2, -52]],
  [44, [-20, 4, -40]], [50, [-30, 8, -30]], [53, [-14, -4, -60]], [56, [-4, -2, -86]], [58.5, [6, 10, -100]],
  [62, [30, 20, -110]], [70, [60, 26, -140]], [74, [70, 20, -170]], [80, [110, 30, -220]], [84, [150, 40, -250]],
  [87, [160, 50, -230]], [90, [190, 40, -260]], [100, [260, 30, -330]],
];
const SAVA = [[0, [-10, 46, 470]], [16, [-10, 42, 200]], [20, [-20, 50, 120]], [24, [-40, 40, 70]], [28, [-10, 30, 40]], [40, [20, 50, -40]], [70, [20, 60, -100]], [86, [40, 50, -60]], [100, [60, 40, -30]]];
const M1 = [[14, [-160, 70, -500]], [20, [-60, 40, -100]], [24, [-30, 34, 40]], [27, [-26, 6, 40]], [28.5, [-40, -20, 60]], [40, [-200, -20, 140]]];
const M2 = [[14, [-140, 50, -520]], [22, [-20, 10, -120]], [30, [10, 0, -60]], [34, [16, 6, -30]], [42, [40, 20, 80]]];
const M3 = [[44, [-80, 10, -200]], [52, [-40, 0, -110]], [56, [-12, -6, -96]], [58.5, [0, -4, -104]], [59, [4, -4, -108]]];
const LIO = [[44, [-60, -20, 60]], [50, [-30, -10, -10]], [54, [-20, -8, -60]], [56, [-20, -6, -80]], [62, [-40, -10, -70]]];
const BOMB = [[40, [-120, 40, -400]], [60, [-60, 30, -200]], [72, [-20, 20, -100]], [76, [-6, 16, -80]], [79, [-30, 10, -110]], [90, [-160, 30, -300]]];
const SIR = [[70, [200, 80, -500]], [75.5, [60, 30, -170]], [78, [80, 36, -190]], [80, [84, 26, -205]], [84, [118, 34, -228]], [87, [140, 40, -210]], [88.5, [220, 60, -260]], [93, [320, 60, -500]], [100, [380, 50, -560]]];

export default {
  id: '05',
  title: 'Ardent-Six',
  chapter: 'Chapitre 7',
  duration: 102,
  shots: [
    {
      t: [0, 9], plan: "Plan d'ensemble", optique: '24 mm', mouvement: 'Sortie de saut, recul',
      lumiere: 'Étoile lointaine dure, feux rouges des pylônes, transpondeurs jaunes des transports civils',
      intention: "Ardent-Six : une croix inégale de pylônes. Deux transports civils immobilisés dans son ombre.",
      cam: (lt) => ({ pos: [keys([[0, 60], [9, 90]], lt), keys([[0, 20], [9, 40]], lt), keys([[0, 260], [9, 300]], lt)], look: [0, 0, 0], fov: 46 }),
    },
    {
      t: [9, 16], plan: 'Plan large, escadrille', optique: '50 mm', mouvement: 'Travelling parallèle à la formation',
      lumiere: 'Arcs bleus de la Cadence en surimpression',
      intention: "Six chasseurs qui bougent comme un seul pilote. C'était beau. C'était insupportable.",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x + 40, p.y + 8, p.z + 10], look: [p.x - 10, p.y + 6, p.z - 30], fov: 40 };
      },
    },
    {
      t: [16, 24], plan: 'Plan large, contre-champ ennemi', optique: '85 mm', mouvement: 'Panoramique',
      lumiere: 'Feux rouges mosodes ; traînées de missiles',
      intention: "Les Mosodes changent de trajectoire AVANT eux. Pas réagir : changer avant.",
      cam: () => ({ pos: [60, 50, 160], look: [-30, 30, 20], fov: 34 }),
    },
    {
      t: [24, 34], plan: 'Plan de poursuite serré', optique: '28 mm', mouvement: 'Arrimé à L’Indocile, pivot brutal',
      lumiere: 'Ombre du pylône qui balaie la verrière',
      intention: "Il coupe la Cadence. Moteur droit à zéro : L'Indocile pivote autour du gauche. « Valeur ! »",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x + 8, p.y + 4, p.z + 14], look: [p.x, p.y, p.z], fov: 52, shake: 0.3, shakeFreq: 2 };
      },
    },
    {
      t: [34, 42], plan: 'Plan large', optique: '35 mm', mouvement: 'Fixe',
      lumiere: "Explosion de l'antenne, gerbe de fragments autour du pylône",
      intention: 'Deux missiles. Il passe entre deux antennes trop serrées. Le premier frappe la structure.',
      cam: () => ({ pos: [50, 20, -10], look: [0, 4, -40], fov: 44 }),
    },
    {
      t: [42, 50], plan: 'Plan rapproché, tourelle', optique: '50 mm', mouvement: 'Solidaire, roulis à gauche',
      lumiere: 'Voyant orange de la branche hydraulique dans le cockpit',
      intention: "La tourelle obtient son arc. Trois tirs. Le missile explose à vingt mètres. Glide arrête de tirer.",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x - 2, p.y - 5, p.z + 9], look: [p.x + 2, p.y + 2, p.z - 30], fov: 56, shake: 0.2 };
      },
    },
    {
      t: [50, 62], plan: 'Plan large puis embarqué', optique: '24 mm', mouvement: 'Suit L’Indocile derrière le pylône trois',
      lumiere: 'Grille du pylône en contre-jour ; déflecteurs qui bleuissent contre la structure',
      intention: "Lio ou les relais ? Lio. Moteur gauche coupé, puis derrière le pylône trois. Le chasseur ennemi se disloque.",
      cam: (lt, S) => {
        const p = S.ind.position;
        if (lt < 5) return { pos: [30, 6, -50], look: [p.x, p.y, p.z], fov: 46 };
        return { pos: [p.x + 5, p.y + 3, p.z + 12], look: [p.x - 2, p.y, p.z - 20], fov: 54, shake: 0.25 };
      },
    },
    {
      t: [62, 70], plan: 'Plan fixe, silence', optique: '85 mm', mouvement: 'Fixe',
      lumiere: "L'avant de l'appareil détruit s'éloigne, une balise de détresse brille moins d'une seconde",
      intention: "Ils venaient d'abattre quelqu'un. Balam cherche une capsule. Aucune.",
      cam: (lt, S) => {
        const w = S.wreckFront.position;
        return { pos: [w.x + 16, w.y + 5, w.z + 22], look: [w.x, w.y, w.z], fov: 34 };
      },
    },
    {
      t: [70, 80], plan: 'Plan large', optique: '35 mm', mouvement: 'Panoramique sur le missile',
      lumiere: "Surface noire qui avale les lumières des capteurs",
      intention: "Un appareil noir traverse le champ. Il tire sur leur missile. Explosion intermédiaire.",
      cam: (lt) => ({ pos: [30, 34, -95], look: [lerp(55, 30, lt / 10), lerp(28, 22, lt / 10), lerp(-160, -150, lt / 10)], fov: 46 }),
    },
    {
      t: [80, 92], plan: 'Duel, caméra arrière', optique: '35 mm', mouvement: 'Derrière Siraal, qui pousse L’Indocile hors du volume',
      lumiere: "Éclats d'impacts sur le bouclier",
      intention: "Il ne tire pas encore. Il les pousse vers l'extérieur, cent mètres après cent mètres.",
      cam: (lt, S) => {
        const s = S.sir.position;
        const p = S.ind.position;
        const dx = p.x - s.x, dy = p.y - s.y, dz = p.z - s.z;
        const n = Math.hypot(dx, dy, dz) || 1;
        return { pos: [s.x - (dx / n) * 14 + 3, s.y - (dy / n) * 14 + 5, s.z - (dz / n) * 14], look: [p.x, p.y, p.z], fov: 44, shake: 0.15 };
      },
    },
    {
      t: [92, 102], plan: 'Plan rapproché, téléobjectif', optique: '150 mm', mouvement: 'Fixe',
      lumiere: "Profil noir découpé sur la ligne rouge du secteur",
      intention: "Il vire une dernière fois pour présenter son profil. Empennage brisé. Pour qu'on le reconnaisse.",
      cam: (lt, S) => {
        const s = S.sir.position;
        return { pos: [s.x + 60, s.y + 8, s.z + 50], look: [s.x, s.y, s.z], fov: 12 };
      },
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 15, hues: [[60, 30, 30], [30, 40, 80]], density: 0.5 }));
    S.stars = starfield({ count: 5000, seed: 15 });
    scene.add(S.stars);
    S.star = new THREE.DirectionalLight(0xfff0dc, 2.8);
    S.star.position.set(300, 200, 400);
    scene.add(S.star);
    S.starGlow = glow(0xfff2e0, 600, 0.8, 'star');
    S.starGlow.position.set(3000, 2000, 4000);
    scene.add(S.starGlow);
    scene.add(new THREE.HemisphereLight(0x203048, 0x101010, 0.7));
    S.planet = planet({ radius: 1800, seed: 33, kind: 'barren', atmo: 0x8090a0 });
    S.planet.position.set(-1500, -2600, -3200);
    scene.add(S.planet);
    S.plat = ardentPlatform();
    scene.add(S.plat);
    S.civ = [shuttle({ color: 0xd8c890 }), shuttle({ color: 0xc8c8c0 })];
    S.civ.forEach((c, i) => {
      c.position.set(-8 + i * 16, -16, 4 - i * 8);
      c.scale.setScalar(1.4);
      const y = glow(0xffd020, 2.5, 1, 'hard');
      y.position.set(0, 2.2, 0);
      c.add(y);
      c.userData.y = y;
      scene.add(c);
    });
    S.ind = indocile();
    scene.add(S.ind);
    S.sava = otaneFighter({ stripe: 0xd0b060 });
    scene.add(S.sava);
    S.squad = [0, 1, 2, 3, 4].map(() => {
      const f = otaneFighter();
      scene.add(f);
      return f;
    });
    S.lio = otaneFighter({ color: 0xe6e0d0, stripe: 0x40c070 });
    scene.add(S.lio);
    S.m1 = mosodeFighter();
    S.m2 = mosodeFighter();
    S.m3 = mosodeFighter();
    S.bomb = mosodeBomber();
    S.bomb2 = mosodeBomber();
    S.sir = mosodeFighter({ siraal: true });
    for (const o of [S.m1, S.m2, S.m3, S.bomb, S.bomb2, S.sir]) scene.add(o);
    S.bolts = Array.from({ length: 12 }, (_, i) => {
      const b = bolt(i < 6 ? 0xff7040 : 0x9fd0ff, 9, 0.35);
      scene.add(b);
      return b;
    });
    S.missiles = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.4, 8), hullMat('dark'));
      m.rotation.x = Math.PI / 2;
      const grp = new THREE.Group();
      grp.add(m);
      const fl = glow(0xffc070, 4, 1);
      fl.position.z = -1.6;
      grp.add(fl);
      scene.add(grp);
      return grp;
    });
    S.booms = Array.from({ length: 6 }, (_, i) => {
      const e = explosion(0xffa040, 10 + i * 2, 50 + i);
      scene.add(e);
      return e;
    });
    S.wreckFront = new THREE.Group();
    const wf = mosodeFighter();
    wf.scale.set(1, 1, 0.55);
    S.wreckFront.add(wf);
    scene.add(S.wreckFront);
    S.wreckEngine = glow(0xff6040, 6, 1);
    scene.add(S.wreckEngine);
    S.distress = glow(0xff3030, 6, 0, 'star');
    scene.add(S.distress);
    S.deflect = sparkCloud({ count: 150, seed: 3, color: 0x80c0ff, size: 0.4, spread: [4, 6, 12] });
    scene.add(S.deflect);
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.plat.rotation.y = t * 0.01;
    S.plat.userData.pylons.forEach((p) => p.children.forEach((c) => c.isSprite && (c.material.opacity = Math.sin(t * 3) > 0 ? 1 : 0.2)));
    S.civ.forEach((c) => (c.userData.y.material.opacity = Math.sin(t * 4) > 0 ? 1 : 0.2));

    const ip = fly(S.ind, IND, t, { bank: 0.004 });
    // pivot moteur droit coupé (pylône), roulis à gauche pour la tourelle
    if (t > 26 && t < 30) S.ind.rotateY(Math.sin((t - 26) * Math.PI / 4) * 1.4);
    if (t > 42 && t < 46) S.ind.rotateZ(Math.sin((t - 42) * Math.PI / 4) * 1.1);
    if (t > 86 && t < 89) S.ind.rotateX(-Math.sin((t - 86) * Math.PI / 3) * 2.4);
    S.ind.userData.setThrust(t > 26 && t < 28.5 ? [0.86, 0] : t > 52 && t < 54 ? [0, 0.9] : [0.85, 0.85]);
    S.ind.userData.blink(t);
    const tur = S.ind.userData.turret;
    tur.rotation.y = keys([[40, 0], [43, 2.6], [47, 2.8], [55, 0.4], [58, 0.2], [70, 0]], t);

    const sp = fly(S.sava, SAVA, t, { bank: 0.003 });
    S.squad.forEach((f, i) => {
      const off = [[-20, 10, 15], [25, -4, 25], [-35, -8, 40], [38, 12, 50], [0, 18, 60]][i];
      const k = ramp(20, 26, t);
      const disp = [[-60, 30, -20], [70, -10, 30], [-80, -40, 10], [60, 40, -40], [0, 60, 20]][i];
      const base = keys([[0, 460], [16, 180], [30, 60], [100, -40]], t);
      f.position.set(off[0] + disp[0] * k, 32 + off[1] + disp[1] * k, base + off[2] + disp[2] * k);
      f.lookAt(f.position.x + disp[0] * 0.1, f.position.y, f.position.z - 50);
      f.rotateZ(Math.sin(t * 0.4 + i) * 0.1 + (t > 9 && t < 14 ? Math.sin((t - 9) * 1.2) * 0.4 : 0));
      f.userData.blink(t);
    });
    fly(S.lio, LIO, Math.max(44, t));
    S.lio.visible = t >= 44 && t < 70;
    const m1 = fly(S.m1, M1, Math.max(14, t), { bank: 0.003 });
    const m2 = fly(S.m2, M2, Math.max(14, t));
    const m3 = fly(S.m3, M3, Math.max(44, t));
    S.m1.visible = t > 14 && t < 40;
    S.m2.visible = t > 14 && t < 42;
    S.m3.visible = t > 44 && t < 58.6;
    // M1 touché à l'aile à 28 s : roulis
    if (t > 28) S.m1.rotateZ((t - 28) * 3);
    const bp = fly(S.bomb, BOMB, Math.max(40, t));
    S.bomb.visible = t > 40;
    fly(S.bomb2, BOMB.map(([k, v]) => [k, [v[0] + 30, v[1] - 10, v[2] - 20]]), Math.max(40, t));
    S.bomb2.visible = t > 40 && t < 88;
    if (t > 88) S.bomb.rotateZ((t - 88) * 0.5);
    const sir = fly(S.sir, SIR, Math.max(70, t), { bank: 0.006 });
    S.sir.visible = t > 70;
    if (t > 92 && t < 96) S.sir.rotateZ(-Math.sin((t - 92) * Math.PI / 4) * 1.3);
    for (const o of [S.m1, S.m2, S.m3, S.bomb, S.bomb2, S.sir, S.lio, S.sava]) { o.userData.setThrust(0.8); o.userData.blink(t); }

    // Tirs (rouges = Mosodes, bleus = OTANE / Glide)
    const B = S.bolts;
    shootBolt(B[0], m1, [sp[0] + 4, sp[1], sp[2]], inv(21, 21.7, t));
    shootBolt(B[1], m2, [sp[0] - 4, sp[1] + 2, sp[2] + 6], inv(22.2, 23, t));
    shootBolt(B[2], m2, [ip[0] + 3, ip[1], ip[2]], inv(33, 33.6, t));
    shootBolt(B[3], bp, [ip[0], ip[1] + 4, ip[2] + 10], inv(80.5, 81.2, t));
    shootBolt(B[4], sir, [ip[0] + 4, ip[1], ip[2] + 3], inv(82.5, 83.1, t));
    shootBolt(B[5], sir, [ip[0], ip[1], ip[2]], inv(87.5, 88, t));
    shootBolt(B[6], ip, [m1[0] + 2, m1[1] + 6, m1[2]], inv(27.6, 28.1, t));
    shootBolt(B[7], ip, [ip[0] + 30, ip[1] + 6, ip[2] + 40], inv(44.2, 44.6, t));
    shootBolt(B[8], ip, [ip[0] + 26, ip[1] + 4, ip[2] + 36], inv(44.8, 45.2, t));
    shootBolt(B[9], ip, [ip[0] + 22, ip[1] + 4, ip[2] + 30], inv(45.4, 45.8, t));
    shootBolt(B[10], ip, m3, inv(58.2, 58.6, t));
    shootBolt(B[11], sir, [lerp(ip[0], bp[0], 0.6), lerp(ip[1], bp[1], 0.6), lerp(ip[2], bp[2], 0.6)], inv(76.8, 77.3, t));
    // Missiles
    const mis = S.missiles;
    const place = (m, a, b, u) => {
      m.visible = u > 0 && u < 1;
      if (!m.visible) return;
      m.position.set(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u));
      m.lookAt(b[0], b[1], b[2]);
    };
    place(mis[0], [-30, 20, -10], [-2, 18, -40], inv(34, 37.2, t));
    place(mis[1], [-30, 20, -10], [ip[0] + 24, ip[1] + 4, ip[2] + 32], inv(35, 45.6, t));
    place(mis[2], ip, bp, inv(76, 79, t) * 0.6 / 0.6);
    if (t > 77.3) mis[2].visible = false;
    // Explosions
    setExplosion(S.booms[0], inv(37.2, 39.5, t)); S.booms[0].position.set(-2, 18, -40);
    setExplosion(S.booms[1], inv(45.6, 47, t)); S.booms[1].position.set(ip[0] + 22, ip[1] + 4, ip[2] + 30);
    setExplosion(S.booms[2], inv(58.6, 60.5, t)); S.booms[2].position.set(...m3);
    setExplosion(S.booms[3], inv(77.3, 79.3, t)); S.booms[3].position.set(lerp(ip[0], bp[0], 0.6), lerp(ip[1], bp[1], 0.6), lerp(ip[2], bp[2], 0.6));
    setExplosion(S.booms[4], inv(88.5, 90.5, t)); S.booms[4].position.set(bp[0] + 2, bp[1], bp[2] - 4);
    setExplosion(S.booms[5], inv(28, 29, t) * 0.5); S.booms[5].position.set(m1[0] + 2, m1[1] + 6, m1[2]);
    if ((t > 37.2 && t < 37.4) || (t > 45.6 && t < 45.8)) S.flash = 0.25;
    S.flashColor = '#ffd8a0';
    // L'épave : la partie avant continue sur son inertie
    const wk = Math.max(0, t - 58.6);
    S.wreckFront.visible = t > 58.6 && t < 70;
    S.wreckFront.position.set(m3[0] - wk * 4, m3[1] - wk * 1, m3[2] - wk * 7);
    S.wreckFront.rotation.set(wk * 0.3, wk * 0.2, wk * 0.5);
    S.wreckEngine.visible = t > 58.6 && t < 66;
    S.wreckEngine.position.set(m3[0] + wk * 9, m3[1] + wk * 2, m3[2] - wk * 10);
    S.distress.position.copy(S.wreckFront.position);
    S.distress.material.opacity = pulse(t, 64, 64.9, 0.1);
    // déflecteurs contre la structure
    S.deflect.position.set(ip[0] - 3, ip[1], ip[2]);
    S.deflect.material.uniforms.amount.value = pulse(t, 56.2, 57.6, 0.2);
    S.deflect.material.uniforms.time.value = t;
    S.deflect.material.uniforms.spd.value = 5;
    if (t > 62 && t < 70) S.fade = 0.15;
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    // Arcs de la Cadence (recommandations) — jaunes : prévisions du Miroir
    if (t >= 9 && t < 24) {
      const a = ramp(9, 10, t) * (t < 24 ? 1 : 0);
      for (let i = 0; i < 5; i++) {
        const y0 = h * 0.35 + i * 30;
        const pts = Array.from({ length: 20 }, (_, k) => [w * 0.15 + k * 45, y0 + Math.sin(k * 0.3 + i + t * 0.5) * 20 - k * 4]);
        arc(g, pts, { alpha: a * 0.8 });
        if (t > 17) arc(g, pts.map(([x, y]) => [x + 36, y - 6]), { color: 'rgba(255,210,80,0.8)', dash: [6, 6], alpha: ramp(17, 18, t) });
      }
      text(g, 'INTERCEPTION OPTIMALE : 00:43', 60, h - 40, { size: 13, color: '#9fc8ff', alpha: a });
      if (t > 17) text(g, 'PROJECTIONS ADVERSES (MIROIR)', w - 60, h - 40, { size: 12, align: 'right', color: '#ffd060', alpha: ramp(17, 18, t) });
    }
    if (t >= 24 && t < 34) {
      alert(g, 'LIAISON TACTIQUE DÉCONNECTÉE', w / 2, 50, t, { size: 16 });
      text(g, 'GAUCHE 86 %   DROIT 0 %', w - 60, h - 40, { size: 15, align: 'right', color: '#ffd0a0', weight: 700, alpha: pulse(t, 26, 29, 0.2) });
    }
    if (t >= 34 && t < 40) alert(g, 'VERROUILLAGE MISSILE ×2', w / 2, 50, t, { size: 16, blink: 4 });
    if (t >= 38 && t < 42) {
      panel(g, 60, 70, 340, 70, { color: 'rgba(120,200,255,0.9)', fill: 'rgba(0,10,30,0.6)' });
      text(g, 'ARDENT-SIX — RELAIS 3 INTACT', 76, 98, { size: 12, color: '#bfe0ff' });
      text(g, 'COUVERTURE : 87 %', 76, 122, { size: 15, color: '#ffffff', weight: 700 });
    }
    if (t >= 46 && t < 50) alert(g, 'TOURELLE EN REFROIDISSEMENT — 10 s', w / 2, 50, t, { size: 15, color: '#ffa040', blink: 2 });
    if (t >= 80 && t < 92) {
      const k = keys([[80, 0], [92, 600]], t);
      text(g, `HORS VOLUME : +${Math.round(k)} m`, w - 60, h - 40, { size: 15, align: 'right', color: '#ff7050', weight: 700 });
    }
  },

  subs: [
    [3, 3.6, 'Fara', 'Nous protégeons les relais. Nous ne chassons personne.'],
    [10, 1.4, 'Glide', 'Tu es hors position.'],
    [11.5, 1.2, 'Balam', 'Je suis à huit mètres.'],
    [12.8, 0.8, 'Glide', 'Douze.'],
    [13.8, 2.6, 'Balam', 'Elle suggère avec le ton d’une mère qui a déjà rangé ta chambre.'],
    [18, 1.6, 'Balam', 'Fara, ils bougent tôt.'],
    [21.8, 1.8, 'Sava', 'Ils avaient notre croisement.'],
    [24.6, 1.4, 'Glide', 'Tu vas désobéir ?'],
    [26.1, 0.9, 'Balam', 'J’envisage.'],
    [27.1, 1, 'Glide', 'Valeur !'],
    [28.1, 2.6, 'Balam', 'Quatre-vingt-six gauche, zéro droit. Je remets les deux dans deux secondes.'],
    [30.8, 0.8, 'Glide', 'Angle ?'],
    [31.7, 1.8, 'Balam', 'Trente degrés sous leur plan !'],
    [34.3, 1.2, 'Balam', 'Missile.'],
    [35.5, 1, 'Glide', 'Deux.'],
    [42.4, 1, 'Balam', 'Alors tire.'],
    [43.5, 1.4, 'Glide', 'Je suis le tireur, pas le vaisseau.'],
    [50.4, 2.2, 'Lio', 'Ils passent ! Deux vers Ardent-Six !'],
    [52.8, 1, 'Glide', 'Lequel ?'],
    [53.9, 0.9, 'Balam', 'Lio.'],
    [55, 1.6, 'Balam', 'Je remonte plein droit dans trois… deux…'],
    [56.7, 1, 'Glide', 'Continue.'],
    [63.5, 4, '*', 'Ils venaient d’abattre quelqu’un.'],
    [67.8, 1, 'Glide', 'Balam.'],
    [68.9, 1, 'Balam', 'Je suis là.'],
    [76, 1.4, 'Glide', 'Nouveau contact.'],
    [81.5, 1.2, 'Balam', 'Il est bon.'],
    [82.8, 0.8, 'Glide', 'Oui.'],
    [84.5, 1.4, 'Balam', 'Il nous chasse.'],
    [86, 2.4, 'Glide', 'Personne n’aime être de l’autre côté.'],
    [94.5, 2, 'Balam', 'Pourquoi montrer son profil ?'],
    [96.7, 2.8, 'Glide', 'Pour que nous le reconnaissions la prochaine fois.'],
  ],
  cues: [
    [0, 'jump', 0.9], [0, 'drone', 0.5], [9, 'engine', 0.5], [16, 'tension', 0.8], [21, 'laser', 0.6], [22.2, 'laser', 0.6],
    [24, 'cut', 0.8], [26, 'roar', 0.7], [27.6, 'laser', 0.8], [28, 'impact', 0.6], [33, 'laser', 0.6], [34, 'lock', 0.8],
    [37.2, 'boom', 0.9], [44.2, 'laser', 0.7], [44.8, 'laser', 0.7], [45.4, 'laser', 0.7], [45.6, 'boom', 0.8], [50.4, 'radio', 0.5],
    [56.2, 'scrape', 0.7], [58.2, 'laser', 0.8], [58.6, 'boom', 1], [60, 'silence', 0.8], [64, 'beep', 0.3], [70, 'tension', 0.7],
    [76.8, 'laser', 0.7], [77.3, 'boom', 0.8], [80, 'pulse', 0.8], [82.5, 'laser', 0.8], [83.1, 'impact', 0.8], [87.5, 'laser', 0.8],
    [88.5, 'boom', 0.8], [92, 'drone', 0.6],
  ],
  music: { mood: 'combat' },
};

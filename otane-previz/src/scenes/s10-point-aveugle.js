import * as THREE from 'three';
import { starfield, nebulaSky, glow, bolt, shootBolt, explosion, setExplosion, filaments, sparkCloud } from '../lib/fx.js';
import { indocile, otaneFighter, mosodeFighter, convoy, cruiser, frigate, cockpitInterior, pilotBust, alyde, cable, hullMat } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp, fly } from '../lib/util.js';
import { panel, text, alert, gauge, branchList } from '../lib/hud.js';

const DRIL = [
  [0, [0, 20, -480]], [8, [0, 20, -460]], [11, [20, 30, -420]], [13, [10, 6, -370]], [15, [-20, 20, -440]], [17, [0, 24, -470]],
  [19, [10, 10, -390]], [20.5, [40, 30, -450]], [24, [30, 16, -410]], [26, [18, 14, -395]], [27.2, [-14, 12, -390]], [28, [-40, 18, -420]],
  [32, [-80, 30, -480]], [40, [-60, 20, -460]], [44, [-30, 16, -430]], [48, [-10, 14, -420]], [52, [10, 20, -430]], [58, [0, 16, -420]],
  [62, [-10, 14, -425]], [64, [-12, 14, -426]], [72, [-180, 40, -640]], [108, [-500, 60, -900]],
];
const IND = [
  [0, [24, 18, -340]], [20, [26, 18, -380]], [24, [24, 18, -398]], [26, [22, 16, -404]], [27.2, [20, 15, -406]], [30, [16, 16, -410]],
  [40, [10, 14, -400]], [52, [6, 10, -410]], [58, [0, 8, -415]], [64, [10, 12, -400]], [72, [20, 14, -320]], [84, [24, 0, 30]],
  [86, [17, 0, 40]], [108, [17, 0, 40]],
];
const SIR = [[50, [120, 60, -620]], [56, [20, 30, -440]], [60, [6, 24, -430]], [64, [-11, 15, -424]], [72, [-180, 42, -418]], [108, [-500, 62, -898]]];

export default {
  id: '10',
  title: 'Le point aveugle',
  chapter: 'Chapitre 23',
  duration: 110,
  shots: [
    {
      t: [0, 8], plan: "Plan d'ensemble", optique: '28 mm', mouvement: 'Lent travelling avant',
      lumiere: "Deux bandes sombres de courant encadrent la sortie de la marée ; le chasseur de Dril en contre-jour",
      intention: "« On ouvre la route. Rien d'autre. » Dril occupe le corridor de sortie.",
      cam: (lt) => ({ pos: [30, 30, keys([[0, -280], [8, -310]], lt)], look: [0, 20, -470], fov: 40 }),
    },
    {
      t: [8, 20], plan: 'Plan large', optique: '35 mm', mouvement: 'Panoramique suivant Dril',
      lumiere: 'Barre verticale du projecteur de L’Indocile vers la frégate : RESTE AXE',
      intention: "Premier passage : la frégate relève le nez. Second passage : elle ne bouge pas. Dril doit rompre plus tôt.",
      cam: (lt, S) => {
        const d = S.dril.position;
        return { pos: [60, 30, -340], look: [d.x, d.y, d.z], fov: 42 };
      },
    },
    {
      t: [20, 32], plan: 'Duel, caméra latérale', optique: '35 mm', mouvement: 'Suit L’Indocile, puis fixe quand elle coupe tout',
      lumiere: "Éclat de la plaque arrachée ; propulseur droit de Dril qui clignote",
      intention: "« Alors on lui donne la mauvaise première décision. » Il coupe tout. Dril passe devant. « Maintenant. »",
      cam: (lt, S) => {
        const p = S.ind.position;
        return lt < 7 ? { pos: [p.x + 20, p.y + 8, p.z + 18], look: [p.x - 10, p.y, p.z - 10], fov: 46, shake: 0.12 } : { pos: [40, 22, -380], look: [-10, 14, -405], fov: 46 };
      },
    },
    {
      t: [32, 40], plan: "Plan d'ensemble", optique: '24 mm', mouvement: 'Fixe',
      lumiere: 'Le vert du Cœur traverse le corridor',
      intention: "La frégate pousse. Les remorqueurs suivent. Le Cœur passe. Balam ne poursuit pas Dril.",
      cam: () => ({ pos: [70, 10, -440], look: [0, 0, -300], fov: 44 }),
    },
    {
      t: [40, 52], plan: 'Plan large', optique: '35 mm', mouvement: 'Panoramique sur le missile trois',
      lumiere: "Explosion du projectile intercepté ; traînée du missile capricieux",
      intention: "Missile quatre sur le projectile de Dril. Puis le trois, de travers, absurde. « Il fonctionne. » « Techniquement. »",
      cam: () => ({ pos: [50, 30, -360], look: [-20, 16, -430], fov: 48 }),
    },
    {
      t: [52, 64], plan: 'Mêlée, caméra portée', optique: '28 mm', mouvement: 'Au milieu de quatre trajectoires',
      lumiere: "Alarme rouge ; un éclat de panneau ouvre la joue de Glide",
      intention: "Fara, Nim, L'Indocile autour d'un chasseur endommagé. Dril arrache les fixations de la tourelle auxiliaire.",
      cam: (lt, S) => {
        const d = S.dril.position;
        return lt < 7 ? { pos: [d.x + 22, d.y + 10, d.z + 26], look: [d.x, d.y, d.z], fov: 50, shake: 0.2 } : { pos: [2001.3, 1.6, -0.75], look: [2000, 1.35, -1.3], fov: 46, shake: 0.06 };
      },
    },
    {
      t: [64, 72], plan: 'Plan rapproché, téléobjectif', optique: '135 mm', mouvement: 'Fixe',
      lumiere: 'Profil noir de Siraal, lien magnétique tendu',
      intention: "Siraal avait Balam dans son axe. Il ne le fit pas. Il plonge vers Dril et l'emporte. « Il l'a choisi. »",
      cam: (lt, S) => {
        const s = S.sir.position;
        return { pos: [s.x + 40, s.y + 12, s.z + 50], look: [s.x - 4, s.y - 2, s.z], fov: 18 };
      },
    },
    {
      t: [72, 82], plan: "Plan d'ensemble", optique: '24 mm', mouvement: 'Travelling latéral le long du croiseur',
      lumiere: 'Les explosions courent le long de la coque',
      intention: "Boro dans l'angle mort : relais de tir et propulseurs de correction. Le grand vaisseau cesse de tenir son axe.",
      cam: (lt) => ({ pos: [keys([[0, 200], [10, 80]], lt), 120, -560], look: [0, 40, -720], fov: 50 }),
    },
    {
      t: [82, 98], plan: 'Plan large puis rapproché', optique: '35 mm', mouvement: 'Approche du flanc du remorqueur deux',
      lumiere: "Le patin magnétique contre la coque ; le moteur gauche au rouge",
      intention: "Le remorqueur deux ne suit plus. L'Indocile se colle à son flanc et pousse. « Pas encore. »",
      cam: (lt, S) => (lt < 8
        ? { pos: [60, 20, 70], look: [17, 0, 40], fov: 40, shake: 0.08 }
        : { pos: [2000.6, 1.72, -0.9], look: [1999.95, 1.15, 0.7], fov: 48, shake: 0.04 + (lt - 8) * 0.01, shakeFreq: 5 }),
    },
    {
      t: [98, 110], plan: "Plan d'ensemble, réancrage", optique: '35 mm', mouvement: 'Fixe puis lente dérive',
      lumiere: "Les lueurs du Cœur changent de rythme ; une vague verte traverse la zone d'ancrage",
      intention: "L'indice touche le seuil, y reste, puis remonte. Le moteur gauche s'éteint tout seul. Glide rit, une seule fois.",
      cam: (lt) => ({ pos: [70, 30, 120], look: [0, 0, 0], fov: 44 }),
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 100, hues: [[20, 40, 50], [40, 30, 50]], density: 0.4 }));
    S.stars = starfield({ count: 6000, seed: 100 });
    scene.add(S.stars);
    scene.add(new THREE.HemisphereLight(0x405870, 0x181818, 1.5));
    const key = new THREE.DirectionalLight(0xfff0e0, 3);
    key.position.set(200, 300, 200);
    scene.add(key);
    S.bandL = filaments({ count: 90, length: 600, radius: 30, color: 0x40305a, twist: -1, seed: 1 });
    S.bandL.position.set(-80, 20, 100);
    scene.add(S.bandL);
    S.bandR = filaments({ count: 90, length: 600, radius: 30, color: 0x40305a, twist: 1, seed: 2 });
    S.bandR.position.set(80, 20, 100);
    scene.add(S.bandR);
    S.cv = convoy();
    scene.add(S.cv);
    S.tug2 = S.cv.userData.tugs[1];
    S.frig = frigate();
    S.frig.rotation.y = Math.PI;
    scene.add(S.frig);
    S.ind = indocile({ mark: true });
    scene.add(S.ind);
    S.dril = mosodeFighter();
    S.dril.scale.setScalar(1.7);
    const gold = glow(0xffc040, 3, 1, 'hard');
    gold.position.set(0, 0.6, 1);
    S.dril.add(gold);
    S.drilEng = glow(0xff6040, 4, 1);
    S.drilEng.position.set(-0.7, 0, -3);
    S.dril.add(S.drilEng);
    scene.add(S.dril);
    S.esc = [mosodeFighter(), mosodeFighter()];
    S.esc.forEach((e) => scene.add(e));
    S.sir = mosodeFighter({ siraal: true });
    scene.add(S.sir);
    S.link = cable(0x9fd0ff);
    scene.add(S.link);
    S.fara = otaneFighter({ stripe: 0xc8a8f0 });
    S.nim = otaneFighter({ color: 0xd8d8d8, stripe: 0x30d0d0 });
    S.nim.scale.setScalar(0.7);
    S.boro = otaneFighter({ color: 0xb0b0a0, stripe: 0x806040 });
    S.boro.scale.setScalar(2);
    for (const o of [S.fara, S.nim, S.boro]) scene.add(o);
    S.cmd = cruiser({ length: 400 });
    S.cmd.position.set(0, 40, -720);
    scene.add(S.cmd);
    S.proj = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffa060 }));
    scene.add(S.proj);
    S.mis = [0, 1].map(() => {
      const g = new THREE.Group();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.4, 8), hullMat('dark'));
      m.rotation.x = Math.PI / 2;
      g.add(m);
      const fl = glow(0xffc070, 4, 1);
      fl.position.z = -1.6;
      g.add(fl);
      scene.add(g);
      return g;
    });
    S.bolts = Array.from({ length: 8 }, (_, i) => {
      const b = bolt(i < 3 ? 0xff7040 : 0x9fd0ff, 8, 0.35);
      scene.add(b);
      return b;
    });
    S.booms = Array.from({ length: 8 }, (_, i) => {
      const e = explosion(0xffa040, 10 + (i % 3) * 5, 60 + i);
      scene.add(e);
      return e;
    });
    S.pad = sparkCloud({ count: 120, seed: 5, color: 0x9fd0ff, size: 0.25, spread: [2, 2, 6] });
    scene.add(S.pad);
    // Zone d'ancrage : couronne de balises vertes
    S.anchor = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const b = glow(0x3dff9a, 6, 0.6, 'hard');
      b.position.set(Math.cos(a) * 70, Math.sin(a) * 70, 0);
      scene.add(b);
      S.anchor.push(b);
    }
    S.wave = glow(0x3dff9a, 50, 0);
    scene.add(S.wave);
    // Cockpit tandem
    S.cock = cockpitInterior({ color: 0x3a3c40, seed: 17, tandem: true });
    S.cock.position.set(2000, 0, 0);
    scene.add(S.cock);
    S.pilot = pilotBust('balam');
    S.pilot.position.set(2000, -0.42, -0.12);
    scene.add(S.pilot);
    S.gunner = alyde();
    S.gunner.position.set(2000, -0.2, -1.35);
    S.gunner.scale.setScalar(0.95);
    scene.add(S.gunner);
    S.cut = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.05, 0.004), new THREE.MeshBasicMaterial({ color: 0x8a1010 }));
    S.gunner.userData.head.add(S.cut);
    S.cut.position.set(0.24, -0.05, 0.12);
    S.cockRed = new THREE.PointLight(0xff3020, 0, 4, 2);
    S.cockRed.position.set(2000, 2, -0.6);
    scene.add(S.cockRed);
    S.cockKey = new THREE.PointLight(0x9fc8ff, 2, 4, 2);
    S.cockKey.position.set(2000.6, 1.8, 0.8);
    scene.add(S.cockKey);
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.stars.material.uniforms.jitter.value = 0.6 * (1 - ramp(98, 104, t));
    for (const b of [S.bandL, S.bandR]) { b.material.uniforms.time.value = t; b.material.uniforms.intensity.value = 0.8 * (1 - ramp(80, 90, t)); }
    // Le convoi avance puis revient vers sa zone d'ancrage (origine)
    const cz = keys([[0, -120], [32, -160], [40, -330], [72, -300], [84, 30], [98, 4], [104, 0]], t);
    S.cv.position.set(0, 0, cz);
    const hk = t < 98 ? 1.6 : lerp(1.6, 0.7, ramp(98, 104, t));
    S.cv.userData.heart.userData.update(t * hk, 1 + pulse(t, 101, 104, 1) * 1.2);
    S.cv.userData.tugs.forEach((tg, i) => { tg.userData.setThrust(i === 1 && t > 80 ? (Math.sin(t * 7) > 0 ? 0.9 : 0.1) : 0.8); tg.userData.blink(t); });
    S.frig.position.set(0, 10, cz - 70);
    S.frig.rotation.x = t > 10 && t < 13 ? -0.3 * Math.sin((t - 10) * Math.PI / 3) : 0;
    S.frig.userData.setThrust(0.8);

    const dp = fly(S.dril, DRIL, t, { bank: 0.005 });
    S.dril.visible = t < 72;
    if (t > 26 && t < 28) S.dril.rotateZ((t - 26) * 4);
    S.drilEng.material.opacity = t > 27.2 ? (Math.sin(t * 9) > 0 ? 1 : 0.1) : 1;
    S.dril.userData.setThrust(1);
    S.esc.forEach((e, i) => {
      e.position.set(dp[0] + (i ? 20 : -20), dp[1] + 4, dp[2] - 10);
      e.lookAt(0, 10, cz);
      e.visible = t < 52;
      e.userData.setThrust(0.8);
    });
    const ip = fly(S.ind, IND, t, { bank: 0.004 });
    if (t > 24 && t < 26) S.ind.rotateZ(-Math.sin((t - 24) * Math.PI / 2) * 1.2);
    S.ind.userData.setThrust(t > 26 && t < 27.4 ? 0 : t > 86 && t < 103.5 ? [0, 1] : t >= 103.5 ? 0 : 0.85);
    S.ind.userData.blink(t);
    if (t >= 84) {
      // collée au flanc du remorqueur deux
      const tp = new THREE.Vector3();
      S.tug2.getWorldPosition(tp);
      S.ind.position.set(tp.x - 13, tp.y, tp.z);
      S.ind.rotation.set(0, Math.PI, Math.PI / 2);
      if (t > 104) S.ind.position.x -= (t - 104) * 1.5;
    }
    S.pad.position.set(S.ind.position.x + 2, S.ind.position.y, S.ind.position.z);
    S.pad.material.uniforms.amount.value = pulse(t, 85.6, 87, 0.2) + pulse(t, 95, 96, 0.2);
    S.pad.material.uniforms.time.value = t;
    S.pad.material.uniforms.spd.value = 3;

    const sp = fly(S.sir, SIR, Math.max(50, t), { bank: 0.005 });
    S.sir.visible = t > 50;
    S.sir.userData.setThrust(1);
    S.link.visible = t > 64 && t < 108;
    S.link.userData.set(sp, [dp[0], dp[1], dp[2]], 0.5);

    S.fara.position.set(keys([[52, -40], [56, -20], [60, -14], [64, -8], [66, 0], [70, 10], [110, 20]], t), keys([[52, 30], [60, 18], [66, 16], [72, 6], [110, 6]], t), keys([[52, -390], [60, -415], [64, -420], [66, -410], [72, -340], [110, -60]], t));
    S.fara.lookAt(t < 65 ? dp[0] : 0, t < 65 ? dp[1] : 0, t < 65 ? dp[2] : cz);
    S.fara.visible = t > 50;
    S.nim.position.set(dp[0] + 10, dp[1] + 16 - (t - 52) * 0.5, dp[2] + 14);
    S.nim.lookAt(...dp);
    S.nim.visible = t > 52 && t < 64;
    S.boro.position.set(keys([[72, 120], [78, 30], [82, -40]], t), keys([[72, 0], [78, 20], [82, 30]], t), keys([[72, -600], [78, -670], [82, -700]], t));
    S.boro.lookAt(0, 40, -720);
    S.boro.visible = t > 71 && t < 82;
    S.cmd.rotation.z = ramp(76, 82, t) * 0.15;
    S.cmd.rotation.y = ramp(76, 82, t) * 0.25;

    // Projectile de Dril intercepté, missile trois capricieux
    const proj = [lerp(dp[0], 0, inv(41, 44, t)), lerp(dp[1], 10, inv(41, 44, t)), lerp(dp[2], cz - 70, inv(41, 44, t))];
    S.proj.position.set(...proj);
    S.proj.visible = t > 41 && t < 43.2;
    const m4 = S.mis[0];
    m4.visible = t > 42 && t < 43.2;
    m4.position.set(lerp(ip[0], proj[0], inv(42, 43.2, t)), lerp(ip[1], proj[1], inv(42, 43.2, t)), lerp(ip[2], proj[2], inv(42, 43.2, t)));
    m4.lookAt(...proj);
    const m3 = S.mis[1];
    m3.visible = t > 47 && t < 51.5;
    const u = inv(47, 51.5, t);
    m3.position.set(ip[0] + lerp(0, -60, u) + Math.sin(u * 6) * 20 * (1 - u), ip[1] + Math.sin(u * 4) * 10, ip[2] + lerp(0, -60, u));
    m3.rotation.set(Math.sin(t * 6) * 0.8, t * 2, 0);

    // Tirs
    shootBolt(S.bolts[0], dp, [ip[0], ip[1], ip[2] + 4], inv(25, 25.5, t));
    shootBolt(S.bolts[1], dp, ip, inv(59, 59.5, t));
    shootBolt(S.bolts[2], sp, [ip[0] + 10, ip[1], ip[2]], inv(57, 57.4, t));
    shootBolt(S.bolts[3], ip, dp, inv(27.4, 27.8, t));
    shootBolt(S.bolts[4], ip, dp, inv(56, 56.4, t));
    shootBolt(S.bolts[5], S.fara.position.toArray(), dp, inv(62, 62.4, t));
    shootBolt(S.bolts[6], S.fara.position.toArray(), sp, inv(67, 67.4, t));
    const B = S.booms;
    setExplosion(B[0], inv(27.8, 29.2, t)); B[0].position.set(dp[0], dp[1], dp[2]);
    setExplosion(B[1], inv(43.2, 45, t)); B[1].position.set(...proj);
    setExplosion(B[2], inv(59.5, 60.6, t)); B[2].position.set(ip[0], ip[1] - 1, ip[2]);
    setExplosion(B[3], inv(62.4, 63.8, t)); B[3].position.set(dp[0], dp[1], dp[2]);
    for (let k = 0; k < 4; k++) {
      setExplosion(B[4 + k], inv(77.5 + k * 0.7, 79.5 + k * 0.7, t));
      B[4 + k].position.set(-80 + k * 50, 70, -720 + (k % 2) * 30);
    }
    if ((t > 59.5 && t < 59.7) || (t > 27.8 && t < 28)) S.flash = 0.3;
    S.flashColor = '#ffd8a0';

    // Réancrage
    const re = ramp(98, 101, t);
    S.anchor.forEach((b, i) => (b.material.opacity = 0.3 + 0.7 * re * (0.5 + 0.5 * Math.sin(t * 3 - i * 0.4))));
    S.wave.position.set(0, 0, cz);
    S.wave.material.opacity = pulse(t, 101, 104, 1) * 0.8;
    S.wave.scale.setScalar(50 + inv(101, 104, t) * 500);

    // Cockpit
    S.cockRed.intensity = (t > 58.5 && t < 64) || (t > 90 && t < 98) ? 3 * (0.5 + 0.5 * Math.sin(t * 10)) : 0;
    S.cut.visible = t > 59.5;
    S.pilot.userData.armR.rotation.set(-1.0, 0, 0.2);
    S.pilot.userData.armL.rotation.set(-1.0, 0, -0.2);
    S.gunner.userData.armR.rotation.set(t > 93 && t < 98 ? -1.4 : -1.0, 0, 0.2);
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    const idx = keys([[0, 84.2], [40, 83.4], [72, 82.4], [82, 81.6], [92, 80.4], [98, 80.0], [100, 80.0], [102, 80.6], [110, 90.4]], t);
    if (t < 8 || t >= 82) {
      text(g, `INDICE D'ANCRAGE ${idx.toFixed(1).replace('.', ',')}`, w - 60, 46, { size: 14, align: 'right', color: idx < 82 ? '#ff6040' : idx < 88 ? '#ffb040' : '#9fffd0', weight: 700 });
      if (t >= 82) text(g, 'SEUIL DE RETOUR : 80,0', w - 60, 66, { size: 11, align: 'right', color: '#ffb0a0' });
    }
    if (t >= 14 && t < 20) text(g, '│  RESTE AXE', 60, 50, { size: 14, color: '#ffffff', weight: 700, alpha: ramp(14.2, 14.6, t) });
    if (t >= 58 && t < 64 && lt > 7) alert(g, 'TOURELLE AUXILIAIRE — FIXATIONS ARRACHÉES', w / 2, 46, t, { size: 15 });
    if (t >= 82 && t < 98) {
      branchList(g, 60, 60, [['Hespar', t > 84 ? 'dead' : 'warn'], ['Iléa externe', 'warn'], ['Néréa trois', t > 87 ? 'dead' : 'ok'], ['Varda', 'TRANSIT ×4']], { alpha: ramp(82, 82.5, t) });
      if (t > 90) gauge(g, w / 2 - 200, h - 60, 400, 14, keys([[90, 97], [98, 99.6]], t), { label: 'MOTEUR GAUCHE', limit: 96.8, decimals: 1 });
      if (t > 92) text(g, `DISTANCE ZONE : ${Math.round(keys([[92, 28000], [98, 0]], t)).toLocaleString('fr-FR')} km`, w - 60, h - 40, { size: 13, align: 'right', color: '#bfe8d0' });
    }
    if (t >= 100 && t < 110) {
      branchList(g, 60, 60, [['Hespar', t > 103 ? 'ok' : 'dead'], ['Iléa externe', t > 104 ? 'ok' : 'warn'], ['Néréa trois', t > 105.5 ? 'warn' : 'dead'], ['Varda', 'ok']], { alpha: ramp(100, 100.5, t) });
    }
  },

  subs: [
    [1, 2, 'Balam', 'On ouvre la route. Rien d’autre.'],
    [3.4, 0.8, 'Glide', 'Oui.'],
    [5, 2.4, 'Balam', 'Il sait lire la zone.'],
    [10, 2, 'Glide', 'Il teste les réactions.'],
    [12.3, 2, 'Balam', 'Je pensais qu’il avait perdu son Miroir.'],
    [14.4, 1.2, 'Glide', 'Lui non.'],
    [20.5, 2.6, 'Glide', 'Le premier passage te force à corriger. Le second utilise ta correction.'],
    [23.4, 2.4, 'Balam', 'Alors on lui donne la mauvaise première décision.'],
    [26, 1.2, 'Glide', 'Tu en as beaucoup.'],
    [27.3, 0.9, 'Balam', 'Maintenant.'],
    [29, 1, 'Balam', 'Touché.'],
    [34, 3.4, '*', 'Le Cœur passa. Balam ne poursuivit pas Dril. Même quand il le vit à portée.'],
    [41, 1.8, 'Glide', 'Missile quatre. Pas sur Dril.'],
    [43, 1.6, 'Balam', 'On fait exploser sa couverture.'],
    [47.6, 1.2, 'Balam', 'Il fonctionne.'],
    [48.9, 1, 'Glide', 'Techniquement.'],
    [50, 1.2, 'Balam', 'Pik sera fier.'],
    [51.3, 0.8, 'Glide', 'Non.'],
    [60, 1, 'Balam', 'Ça va ?'],
    [61.1, 0.8, 'Glide', 'Oui.'],
    [65, 3, '*', 'Siraal avait Balam dans son axe. Il ne poursuivit pas L’Indocile. Il plongea vers Dril.'],
    [68.6, 1.4, 'Balam', 'Il l’a choisi.'],
    [70.2, 1, 'Glide', 'Oui.'],
    [78, 4, 'Dril', 'Toutes unités. Retrait ordonné. Priorité aux appareils endommagés. Nous quittons la zone.'],
    [83, 1.6, 'Balam', 'On peut pousser le deux.'],
    [84.8, 2, 'Glide', 'Par le flanc. Pas derrière.'],
    [91, 1.4, 'Glide', 'Pas encore.'],
    [92.6, 2.4, 'Balam', 'Voilà une phrase que je pensais ne jamais t’entendre dire.'],
    [95.2, 2, 'Glide', 'Il reste huit mille kilomètres.'],
    [102, 3, '*', 'Le seuil resta affiché. Puis l’indice remonta à peine.'],
    [105, 1.2, 'Balam', 'Bonne nouvelle.'],
    [106.3, 0.9, 'Glide', 'Laquelle ?'],
    [107.3, 1.4, 'Balam', 'On n’a plus de moteur gauche.'],
  ],
  cues: [
    [0, 'tide', 0.6], [8, 'flyby', 0.8], [14, 'click', 0.5], [18, 'flyby', 0.8], [24, 'tension', 0.8], [25, 'laser', 0.6],
    [26.2, 'cut', 0.9], [27.4, 'laser', 0.9], [27.8, 'boom', 0.9], [32, 'swell', 0.6], [42, 'launch', 0.7], [43.2, 'boom', 0.8],
    [47, 'launch', 0.7], [52, 'combat', 0.8], [59, 'laser', 0.8], [59.5, 'metal', 1], [62.4, 'boom', 0.7], [64, 'link', 0.8],
    [72, 'tension', 0.6], [77.5, 'boom', 1], [78.2, 'boom', 0.8], [79, 'radio', 0.6], [84, 'branch', 0.7], [85.6, 'clank', 1],
    [86, 'engine97', 0.9], [94, 'crack', 0.8], [98, 'heart', 1], [101, 'swell', 1], [103.5, 'die', 0.9], [108.6, 'laugh', 0.4],
  ],
  music: { mood: 'combat' },
};

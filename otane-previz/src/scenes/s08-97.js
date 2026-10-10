import * as THREE from 'three';
import { starfield, nebulaSky, planet, glow, bolt, shootBolt, explosion, setExplosion, sparkCloud } from '../lib/fx.js';
import { indocile, otaneFighter, mosodeFighter, cruiser, frigate, convoy, ardentPlatform, debrisField, cockpitInterior, pilotBust, alyde } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp, fly } from '../lib/util.js';
import { panel, text, alert, gauge, branchList } from '../lib/hud.js';

// Le convoi est à l'origine et file vers -Z ; le décor défile.
const IND = [
  [18, [30, 20, 520]], [22, [26, 14, 470]], [26, [10, 4, 420]], [30, [-6, 10, 380]], [34, [8, 2, 330]], [38, [12, 6, 290]],
  [42, [10, 8, 260]], [52, [8, 8, 210]], [56, [6, 8, 150]], [60, [4, 10, 80]], [62, [2, 12, 40]], [66, [22, 14, 10]], [100, [22, 14, -10]],
];
const SIR = [[28, [60, 40, 620]], [32, [20, 20, 420]], [34, [-2, 12, 390]], [40, [30, 20, 300]], [56, [40, 24, 120]], [61, [30, 20, 40]], [63, [36, 30, 10]], [66, [80, 50, -40]], [100, [140, 60, -200]]];

export default {
  id: '08',
  title: 'Quatre-vingt-dix-sept pour cent',
  chapter: 'Chapitres 20 et 21',
  duration: 104,
  shots: [
    {
      t: [0, 10], plan: "Plan d'ensemble, grue", optique: '21 mm', mouvement: 'Élévation lente au-dessus du convoi',
      lumiere: 'Le vert du Cœur au centre du châssis, feux orange des remorqueurs',
      intention: "Le Cœur ne peut pas être mis dans un vaisseau : on déplace sa chambre. Six remorqueurs, deux frégates, trois couches d'escorte.",
      cam: (lt) => ({ pos: [keys([[0, 90], [10, 60]], lt), keys([[0, -10], [10, 70]], lt), keys([[0, 160], [10, 120]], lt)], look: [0, 0, -20], fov: 46 }),
    },
    {
      t: [10, 18], plan: 'Plan subjectif, verrière', optique: '24 mm', mouvement: 'Fixe, le croiseur entre dans le cadre',
      lumiere: "La coque ennemie occupe presque toute la verrière ; batteries qui pivotent",
      intention: "Un croiseur sort de derrière la plateforme sud. « Trop près. » « Pour lui aussi. »",
      cam: (lt) => ({ pos: [50, 6, 70], look: [lerp(-260, -200, lt / 8), 44, -230], fov: 56 }),
    },
    {
      t: [18, 30], plan: 'Plan de poursuite', optique: '24 mm', mouvement: 'Derrière L’Indocile, dans le nuage',
      lumiere: 'Débris en contre-jour, bras de dock, panneaux qui tournent',
      intention: "« Donne-moi les gros. » Le bras de dock passe au-dessus. Une fente entre le panneau et la poutre.",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x + 4, p.y + 4, p.z + 16], look: [p.x - 1, p.y, p.z - 30], fov: 58, shake: 0.2, shakeFreq: 2 };
      },
    },
    {
      t: [30, 40], plan: 'Plan large', optique: '50 mm', mouvement: 'Panoramique',
      lumiere: 'Le chasseur noir apparaît par intermittence entre les débris',
      intention: "Siraal les suit. Balam coupe la poussée, laisse une poutre masquer leur trajectoire. Siraal tire sur l'ancienne position.",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x + 40, p.y + 14, p.z + 30], look: [p.x, p.y, p.z + 20], fov: 44 };
      },
    },
    {
      t: [40, 52], plan: 'Insert puis gros plan', optique: '85 mm', mouvement: 'Fixe',
      lumiere: "Voyant orange de température, reflet sur le gant",
      intention: "Le pouce sur la dérivation manuelle. « Alors ne fais pas semblant de découvrir le risque. »",
      cam: (lt) => (lt < 6
        ? { pos: [2000.32, 1.12, 0.12], look: [1999.7, 0.86, 0.42], fov: 36 }
        : { pos: [2000.7, 1.6, -0.2], look: [2000, 1.4, -1.2], fov: 34 }),
    },
    {
      t: [52, 62], plan: 'Plan large, accélération', optique: '18 mm', mouvement: 'Recul brutal, la caméra perd du terrain',
      lumiere: "Panache du moteur gauche qui vire au blanc ; étoiles qui s'étirent",
      intention: "La jauge franchit quatre-vingt-dix-sept. L'Indocile accélère comme si elle avait attendu qu'on cesse enfin de la ménager.",
      cam: (lt, S) => {
        const p = S.ind.position;
        return { pos: [p.x + 6, p.y + 3, p.z + keys([[0, 10], [10, 34]], lt)], look: [p.x, p.y, p.z - 20], fov: keys([[0, 50], [10, 70]], lt), shake: 0.15 + lt * 0.03, shakeFreq: 3 };
      },
    },
    {
      t: [62, 70], plan: 'Plan moyen', optique: '35 mm', mouvement: 'Fixe, L’Indocile freine dans le cadre',
      lumiere: 'Vert du Cœur au fond ; tir bleu de la tourelle',
      intention: "Glide tire avant même qu'ils soient stabilisés. « Vous êtes en retard. » « J'ai apporté une excuse mécanique. »",
      cam: () => ({ pos: [50, 20, 30], look: [20, 14, -10], fov: 40 }),
    },
    {
      t: [70, 80], plan: 'Plan rapproché cockpit tandem', optique: '28 mm', mouvement: 'Caméra portée',
      lumiere: 'Rouge des alarmes, gravité qui varie',
      intention: "Glide détache sa sangle, enfonce le bras dans le compartiment. « Dix secondes. » « Neuf seraient bien. » « Tais-toi. »",
      cam: () => ({ pos: [2001.45, 1.65, -0.7], look: [2000, 1.25, -1.25], fov: 50, shake: 0.03, shakeFreq: 3 }),
    },
    {
      t: [80, 90], plan: 'Plan large, convoi', optique: '35 mm', mouvement: 'Lent travelling latéral',
      lumiere: 'Le Cœur pulse plus vite',
      intention: "Hespar s'éteint. « Le choix n'a pas changé depuis le briefing. Seulement son prix devient visible. »",
      cam: (lt) => ({ pos: [keys([[0, -60], [10, -30]], lt), 30, 70], look: [0, 0, -30], fov: 42 }),
    },
    {
      t: [90, 104], plan: 'Plan rapproché cockpit', optique: '35 mm', mouvement: 'Fixe, les symboles se dédoublent',
      lumiere: "Les étoiles vibrent derrière la verrière, chaleur inexistante",
      intention: "« À trois ? » « Pourquoi ? » « Pour faire dramatique. » Glide coupe immédiatement.",
      cam: (lt) => ({ pos: [2000.55, 1.75, -0.95], look: [1999.95, 1.15, 0.7], fov: 50 }),
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 80, hues: [[60, 30, 30], [20, 50, 60]], density: 0.5 }));
    S.stars = starfield({ count: 6000, seed: 80 });
    scene.add(S.stars);
    S.star = new THREE.DirectionalLight(0xfff0dc, 2.6);
    S.star.position.set(300, 200, 300);
    scene.add(S.star);
    scene.add(new THREE.HemisphereLight(0x203048, 0x101010, 0.8));
    S.cv = convoy();
    scene.add(S.cv);
    S.frig = [frigate(), frigate()];
    S.frig[0].position.set(0, 10, -170);
    S.frig[1].position.set(0, -10, 150);
    S.frig.forEach((f) => { f.rotation.y = Math.PI; scene.add(f); });
    S.esc = [0, 1, 2, 3, 4, 5].map((i) => {
      const f = otaneFighter();
      f.position.set(Math.cos(i) * 60, Math.sin(i * 1.3) * 40, -40 + i * 20);
      f.rotation.y = Math.PI;
      scene.add(f);
      return f;
    });
    S.south = ardentPlatform({ broken: true });
    S.south.scale.setScalar(3);
    S.south.position.set(-260, 20, -320);
    scene.add(S.south);
    S.cruiser = cruiser({ length: 600 });
    S.cruiser.rotation.y = Math.PI / 2;
    scene.add(S.cruiser);
    const cKey = new THREE.DirectionalLight(0xffd8c0, 2.2);
    cKey.position.set(-100, 400, 400);
    cKey.target = S.cruiser;
    scene.add(cKey);
    S.debris = debrisField({ count: 360, center: [0, 10, 380], size: [160, 80, 300], scale: [2, 26], seed: 88, avoid: [10, 8, 380, 10] });
    scene.add(S.debris);
    S.dock = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 60), S.cv.children[0].material);
    scene.add(S.dock);
    S.ind = indocile();
    scene.add(S.ind);
    S.sir = mosodeFighter({ siraal: true });
    scene.add(S.sir);
    S.bolts = Array.from({ length: 5 }, () => {
      const b = bolt(0xff7040, 8, 0.35);
      scene.add(b);
      return b;
    });
    S.tbolt = bolt(0x9fd0ff, 8, 0.35);
    scene.add(S.tbolt);
    S.boom = explosion(0xffa040, 10, 4);
    scene.add(S.boom);
    S.streak = sparkCloud({ count: 600, seed: 9, color: 0xffffff, size: 0.6, spread: [120, 80, 300] });
    scene.add(S.streak);
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
    S.cockRed = new THREE.PointLight(0xff3020, 0, 4, 2);
    S.cockRed.position.set(2000, 2, -0.6);
    scene.add(S.cockRed);
    S.cockKey = new THREE.PointLight(0x9fc8ff, 2, 4, 2);
    S.cockKey.position.set(2000.6, 1.8, 0.8);
    scene.add(S.cockKey);
    S.cockOrange = new THREE.PointLight(0xffa040, 0, 2, 2);
    S.cockOrange.position.set(1999.7, 1.0, 0.5);
    scene.add(S.cockOrange);
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.stars.material.uniforms.jitter.value = ramp(90, 96, t);
    S.stars.material.uniforms.stretch.value = pulse(t, 56, 62, 1);
    const hk = 1 + ramp(80, 100, t) * 1.5;
    S.cv.userData.heart.userData.update(t * hk, 1);
    S.cv.userData.tugs.forEach((tg) => { tg.userData.setThrust(0.8 + 0.2 * Math.sin(t * 3)); tg.userData.blink(t); });
    S.frig.forEach((f) => f.userData.setThrust(0.8));
    S.esc.forEach((f, i) => { f.position.x = Math.cos(i + t * 0.1) * 60; f.userData.blink(t); });
    S.debris.userData.update(t);
    // croiseur qui sort de derrière la plateforme sud
    S.cruiser.position.set(keys([[8, -700], [18, -260], [40, -240], [104, -220]], t), 50, keys([[8, -330], [18, -240], [104, -230]], t));
    S.cruiser.userData.turrets.forEach((tt, i) => (tt.rotation.y = keys([[10, 0], [16, -0.6 - i * 0.05]], t)));
    // bras de dock dans le nuage
    S.dock.position.set(4, 22, 360);
    S.dock.rotation.set(0.4, t * 0.15, 0.3);
    // L'Indocile
    const ip = fly(S.ind, IND, Math.max(18, t), { bank: 0.005 });
    S.ind.visible = t >= 18;
    if (t > 33 && t < 35) S.ind.userData.setThrust(0.05);
    else S.ind.userData.setThrust(t > 52 && t < 62 ? [1.6, 0.9] : 0.8);
    S.ind.userData.blink(t);
    // Siraal
    const sp = fly(S.sir, SIR, Math.max(28, t), { bank: 0.005 });
    S.sir.visible = t > 28;
    S.sir.userData.setThrust(0.9);
    shootBolt(S.bolts[0], sp, [ip[0] - 12, ip[1] - 4, ip[2] + 6], inv(34.2, 34.8, t));
    shootBolt(S.bolts[1], sp, [ip[0] + 6, ip[1], ip[2] - 3], inv(37, 37.5, t));
    shootBolt(S.bolts[2], sp, [-28, 26, -60], inv(60.5, 61.2, t));
    shootBolt(S.tbolt, ip, sp, inv(63, 63.4, t));
    setExplosion(S.boom, inv(34.8, 36.5, t));
    S.boom.position.set(ip[0] - 12, ip[1] - 4, ip[2] + 6);
    // traînées d'étoiles pendant l'accélération
    S.streak.position.set(ip[0], ip[1], ip[2]);
    S.streak.material.uniforms.amount.value = pulse(t, 55, 62, 0.8);
    S.streak.material.uniforms.time.value = t;
    S.streak.material.uniforms.flow.value.set(0, 0, 400);
    // cockpit
    S.cockRed.intensity = t > 70 && t < 80 ? 3 * (0.5 + 0.5 * Math.sin(t * 10)) : t > 55 && t < 62 ? 1.5 : 0;
    S.cockOrange.intensity = t > 40 && t < 52 ? 1.5 : 0;
    S.pilot.userData.armR.rotation.set(-1.0, 0, 0.2);
    S.pilot.userData.armL.rotation.set(t > 41 && t < 52 ? -1.25 : -1.0, 0, -0.2);
    const reach = pulse(t, 72, 79, 0.6);
    S.gunner.rotation.set(reach * 0.5, reach * 0.6, 0);
    S.gunner.userData.armR.rotation.set(-1.0 - reach * 0.9, 0, reach * 0.5);
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    const anchor = keys([[0, 99.8], [50, 97.6], [80, 95.4], [90, 93.2], [104, 91.6]], t);
    if (t < 18 || (t >= 80 && t < 90)) {
      text(g, "PROTÉGER LE CONVOI JUSQU'AU POINT NŒUD-UN", 60, 46, { size: 13, color: '#bfe0ff', weight: 700, alpha: t < 18 ? ramp(2, 3, t) : 1 });
      text(g, `INDICE D'ANCRAGE ${anchor.toFixed(1).replace('.', ',')}`, w - 60, 46, { size: 14, align: 'right', color: anchor < 95 ? '#ffb040' : '#9fffd0' });
    }
    if (t >= 18 && t < 30) {
      const items = [[19, 'BRAS DE DOCK — HAUT GAUCHE'], [21.5, 'PANNEAU TOURNANT — BAS'], [24, 'TROIS MASSES DEVANT — 700 m'], [26.5, 'OUVERTURE À DROITE DANS 4 s']];
      items.forEach(([s, l], i) => text(g, l, 60, 50 + i * 22, { size: 13, color: '#9fe8ff', alpha: ramp(s, s + 0.3, t) }));
      text(g, 'DISTANCE CONVOI : 300 km', w - 60, h - 40, { size: 13, align: 'right', color: '#ffd0a0' });
    }
    if (t >= 40 && t < 62) {
      const v = keys([[40, 94], [46, 95.2], [52, 96.6], [55, 96.8], [56.5, 97.0], [58, 97.6], [62, 97.9]], t);
      gauge(g, w / 2 - 200, h - 60, 400, 14, v, { label: 'MOTEUR GAUCHE', limit: 96.8, decimals: 1 });
      text(g, 'PAS AU-DESSUS', w / 2 - 200 + (400 * 96.8) / 100 - 30, h - 80, { size: 10, color: '#ff6040', mono: false, weight: 700 });
      const ct = keys([[40, 130], [56, 130], [60, 110]], t);
      text(g, `CONTACT REMORQUEUR : ${Math.floor(ct / 60)} min ${String(Math.floor(ct % 60)).padStart(2, '0')}`, 60, 46, { size: 13, color: '#ffb090' });
      const us = keys([[40, 160], [52, 160], [55, 142], [57, 110], [60, 100]], t);
      text(g, `NOUS : ${Math.floor(us / 60)} min ${String(Math.floor(us % 60)).padStart(2, '0')}`, 60, 68, { size: 13, color: us > ct ? '#ff6040' : '#9fffd0' });
      if (t > 56.5) alert(g, 'PRESSION SECONDAIRE INSTABLE', w / 2, 46, t, { size: 15 });
    }
    if (t >= 70 && t < 80) {
      alert(g, 'PRESSION REFROIDISSEMENT — CHUTE', w / 2, 46, t, { size: 15 });
      text(g, `VANNE DE DÉRIVATION : ${t > 77.5 ? 'OUVERTE' : 'BLOQUÉE'}`, 60, h - 40, { size: 13, color: t > 77.5 ? '#9fffd0' : '#ff7050' });
    }
    if (t >= 82 && t < 90) {
      branchList(g, w - 360, 60, [['Hespar', t > 84 ? 'dead' : 'ok'], ['Iléa externe', 'warn'], ['Néréa trois', 'ok'], ['Varda', 'ok']], { alpha: ramp(82, 82.5, t) });
      text(g, '17 000 habitants sur la branche', w - 360, 200, { size: 12, color: '#ffb0a0', alpha: ramp(84.5, 85, t) });
    }
    if (t >= 92 && t < 104) {
      const cut = t > 99.8;
      if (!cut) {
        alert(g, 'SYNCHRONISATION DÉGRADÉE', w / 2, 46, t, { size: 15, color: '#ffb040' });
        if (t > 94) alert(g, 'DONNÉES TACTIQUES INCOHÉRENTES', w / 2, 70, t, { size: 15, color: '#ffb040' });
        const jit = Math.sin(t * 30) * 6;
        for (const [x, y] of [[300, 200], [820, 160], [600, 330]]) {
          text(g, '◆ OTANE', x, y, { size: 12, color: '#9fc8ff' });
          text(g, '◆ OTANE', x + 18 + jit, y + 10, { size: 12, color: '#9fc8ff', alpha: ramp(94, 95, t) });
        }
      } else {
        text(g, 'CADENCE : COUPÉE', w / 2, 46, { size: 15, align: 'center', color: '#ffffff', weight: 700, alpha: ramp(100.6, 101, t) });
      }
    }
  },

  subs: [
    [3, 3.2, '*', 'Le Cœur ne pouvait pas être mis dans un vaisseau. Il fallait déplacer sa chambre.'],
    [7, 2.4, 'Glide', 'Si je veux que le Miroir apprenne comment je vise, je lui donnerai un cours.'],
    [12.5, 1.2, 'Balam', 'Trop près.'],
    [13.9, 1.2, 'Glide', 'Pour lui aussi.'],
    [18.6, 1.6, 'Balam', 'Donne-moi les gros.'],
    [20.4, 2.4, 'Balam', 'Tout ce qui peut nous tuer immédiatement. Le reste attendra.'],
    [24.6, 1.4, 'Balam', 'Laquelle est claire ?'],
    [26.2, 2.6, 'Glide', 'Celle que tu vas percuter si tu continues à parler.'],
    [31, 1.2, 'Balam', 'Il nous suit.'],
    [32.4, 2, 'Balam', 'Il ne connaît pas ce cimetière.'],
    [34.6, 1.2, 'Glide', 'Toi non plus.'],
    [36, 2.2, 'Balam', 'J’ai grandi dans des endroits comme ça.'],
    [42, 1.8, 'Balam', 'Si je passe à quatre-vingt-seize huit ?'],
    [43.9, 1.6, 'Glide', 'Deux minutes vingt-deux.'],
    [45.6, 1.2, 'Balam', 'Encore trop.'],
    [47, 1.2, 'Glide', 'Pik a dit…'],
    [48.3, 1.6, 'Balam', 'Je sais ce que Pik a dit.'],
    [50, 2.2, 'Glide', 'Alors ne fais pas semblant de découvrir le risque.'],
    [57, 3.4, '*', 'L’Indocile accéléra comme si elle avait attendu qu’on cesse enfin de la ménager.'],
    [60.6, 1.4, 'Glide', 'Après ça, Pik va te tuer.'],
    [64.4, 1.4, 'Fara', 'Vous êtes en retard.'],
    [66, 1.8, 'Balam', 'J’ai apporté une excuse mécanique.'],
    [72.6, 1.2, 'Glide', 'Dix secondes.'],
    [74, 1.3, 'Balam', 'Neuf seraient bien.'],
    [75.5, 1, 'Glide', 'Tais-toi.'],
    [78.2, 1.6, 'Balam', 'Tu vois ? Travail d’équipe.'],
    [80.2, 1.4, 'Glide', 'Tu as tiré trop tôt.'],
    [85, 1.6, 'Balam', 'On peut encore arrêter.'],
    [86.8, 3, 'Glide', 'Le choix n’a pas changé depuis le briefing. Seulement son prix devient visible.'],
    [92, 1.6, 'Balam', 'Prêt à devenir aveugle ?'],
    [93.8, 0.9, 'Glide', 'Non.'],
    [94.9, 1.1, 'Balam', 'Bonne réponse.'],
    [97, 0.9, 'Balam', 'À trois ?'],
    [98, 0.8, 'Glide', 'Pourquoi ?'],
    [98.9, 1, 'Balam', 'Pour faire dramatique.'],
  ],
  cues: [
    [0, 'convoy', 0.7], [0, 'heart', 0.6], [10, 'cruiser', 1], [18, 'engine', 0.8], [22, 'whoosh', 0.7], [27, 'scrape', 0.6],
    [30, 'tension', 0.7], [34.2, 'laser', 0.8], [34.8, 'boom', 0.8], [40, 'pulse', 0.6], [52, 'rise', 0.8], [56.5, 'alarm', 0.8],
    [57, 'engine97', 1], [62, 'brake', 0.9], [63, 'laser', 0.7], [70, 'alarm', 0.7], [77.5, 'clank', 0.8], [80, 'heart', 0.8],
    [84, 'branch', 0.8], [90, 'drone', 0.8], [94, 'glitch', 0.8], [99.9, 'switch', 1], [100.3, 'silence', 1],
  ],
  music: { mood: 'combat' },
};

import * as THREE from 'three';
import { starfield, nebulaSky, planet, glow, filaments, bolt, shootBolt, explosion, setExplosion, beam, sparkCloud } from '../lib/fx.js';
import { recuperateur, glideShip, transporter, deadBeacon, debrisField, cockpitInterior, alyde, pilotBust, hullMat } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth } from '../lib/util.js';
import { panel, text, alert } from '../lib/hud.js';

const lin = (x) => x;
// Trajectoires (le transporteur est à l'origine, sa longueur suit l'axe Z, l'entrée arrière vers z = -135).
const BALAM = [
  [12, [-60, 30, -760]], [16, [-20, 10, -640]], [20, [30, -10, -520]], [24, [10, 5, -420]], [28, [0, -5, -300]],
  [32, [2, -4, -190]], [38, [-6, 2, -110]], [44, [6, -6, -20]], [48, [0, 0, 20]], [52, [-4, 3, 55]],
  [56, [4, -2, 85]], [62, [0, 2, 120]], [68, [0, 0, 138]], [92, [0, 0, 139]],
];
const GLIDE = [
  [12, [-90, 60, -860]], [16, [-60, 40, -740]], [20, [0, 20, -620]], [24, [-10, 15, -500]], [28, [5, 0, -390]],
  [32, [0, 2, -280]], [38, [0, 4, -160]], [44, [-4, -2, -60]], [48, [2, 2, -10]], [52, [0, 0, 30]],
  [56, [2, 0, 60]], [62, [0, 0, 100]], [68, [0, 0, 118]], [92, [0, 0, 120]],
];
const at = (path, t) => keys(path, t, lin);

export default {
  id: '02',
  title: 'La balise morte',
  chapter: 'Chapitre 2',
  duration: 94,
  shots: [
    {
      t: [0, 9], plan: 'Très gros plan, profil', optique: '85 mm', mouvement: 'Fixe, respiration à peine',
      lumiere: "Bleu froid des écrans alydes, peau humide, vibrisses en rim light",
      intention: 'Glide. Deux doigts sur le pupitre. La vibration des propulseurs jusque dans les phalanges.',
      cam: (lt) => ({ pos: [5000.85, 1.55, -0.25 - lt * 0.01], look: [4999.95, 1.42, 0.35], fov: 30 }),
    },
    {
      t: [9, 12], plan: 'Insert', optique: '50 mm', mouvement: 'Lent panoramique vers la droite',
      lumiere: 'Ombre portée sur un logement vide tapissé',
      intention: "Le logement du Livre, vide. Il n'a pas besoin de tourner la tête pour le savoir.",
      cam: (lt) => ({ pos: [5000.15, 1.35, 0.9], look: [5000.62 + lt * 0.02, 1.0, 0.2], fov: 34 }),
    },
    {
      t: [12, 22], plan: 'Plan large téléobjectif', optique: '200 mm', mouvement: 'Panoramique, écrasement des épaves',
      lumiere: 'Soleil latéral, la Terre en fond bleu',
      intention: 'La chasse. Les épaves écrasées par la longue focale ; deux trajectoires qui se croisent à cent mètres.',
      cam: (lt, S) => {
        const b = S.balam.position;
        const g = S.glide.position;
        return { pos: [b.x + 95, b.y + 22, b.z - 70], look: [(b.x * 2 + g.x) / 3, (b.y * 2 + g.y) / 3, (b.z * 2 + g.z) / 3], fov: 18 };
      },
    },
    {
      t: [22, 30], plan: 'Plan moyen, travelling parallèle', optique: '35 mm', mouvement: 'Solidaire du récupérateur, de côté',
      lumiere: "Éclair orange du tir qui pulvérise l'antenne",
      intention: "Le tir passe devant le nez. Il veut l'arrêter, pas le tuer.",
      cam: (lt, S) => {
        const b = S.balam.position;
        return { pos: [b.x - 9, b.y + 2.5, b.z - 2], look: [b.x + 3, b.y, b.z + 8], fov: 50, shake: 0.2, shakeFreq: 1.6 };
      },
    },
    {
      t: [30, 38], plan: "Plan d'ensemble", optique: '28 mm', mouvement: 'Grue descendante',
      lumiere: 'Soleil rasant sur 300 m de coque morte ; intérieur noir',
      intention: 'Le transporteur cassé au tiers. Balam y entre. « Évidemment. »',
      cam: (lt) => ({ pos: [keys([[0, 140], [8, 90]], lt), keys([[0, 120], [8, 40]], lt), keys([[0, -330], [8, -280]], lt)], look: [0, 0, keys([[0, -60], [8, -140]], lt)], fov: 40 }),
    },
    {
      t: [38, 46], plan: 'Plan embarqué', optique: '24 mm', mouvement: "Derrière Glide, ses phares balaient l'intérieur",
      lumiere: 'Seules sources : les phares de Glide ; conteneurs et grue en ombres mouvantes',
      intention: "Une grue libérée de son axe. Il passe dessous, laisse ses ailettes frôler la structure.",
      cam: (lt, S) => {
        const g = S.glide.position;
        return { pos: [g.x + 2, g.y + 4, g.z - 12], look: [g.x, g.y, g.z + 30], fov: 50, shake: 0.08 };
      },
    },
    {
      t: [46, 52], plan: 'Plan large', optique: '35 mm', mouvement: 'Fixe',
      lumiere: "Noir total. Reflets de Sol par les brèches sur une cinquantaine de sphères",
      intention: 'Balam coupe ses phares. Glide coupe les siens. Il écoute la coque.',
      cam: () => ({ pos: [18, 8, -8], look: [0, 0, 30], fov: 46 }),
    },
    {
      t: [52, 58], plan: 'Champ / contrechamp à travers les verrières', optique: '50 mm', mouvement: 'Fixe',
      lumiere: 'Orange côté Balam, bleu côté Glide : deux mondes face à face',
      intention: "Les deux cockpits presque face à face. Balam lève une main. Pas pour se rendre.",
      cam: (lt, S) => {
        const g = S.glide.position;
        return { pos: [g.x + 1.6, g.y + 1.5, g.z - 3], look: [g.x, g.y + 0.8, g.z + 20], fov: 34 };
      },
    },
    {
      t: [58, 64], plan: 'Gros plan Glide', optique: '85 mm', mouvement: 'Fixe',
      lumiere: 'Bleu, vibrisses tendues',
      intention: 'Il prononce le nom. « Pour répondre de Korren. »',
      cam: (lt) => ({ pos: [5000.7, 1.5, 0.85 - lt * 0.01], look: [5000, 1.46, 0.0], fov: 26 }),
    },
    {
      t: [64, 70], plan: 'Gros plan Balam', optique: '85 mm', mouvement: 'Fixe',
      lumiere: "Orange d'habitacle, visage dans l'ombre du casque",
      intention: "« Je n'ai pas tué Korren. » La légèreté a quitté sa voix.",
      cam: (lt) => ({ pos: [2000.7, 1.45, 0.75 - lt * 0.01], look: [2000, 1.37, 0.0], fov: 28 }),
    },
    {
      t: [70, 78], plan: 'Plan moyen', optique: '35 mm', mouvement: 'Lent travelling avant sur la cage',
      lumiere: 'Phares croisés des deux appareils sur une balise noire',
      intention: "Cul-de-sac. Une balise morte depuis des décennies. Balam y branche son circuit.",
      cam: (lt) => ({ pos: [9, 3, keys([[0, 128], [8, 136]], lt)], look: [0, 0, 152], fov: 38 }),
    },
    {
      t: [78, 86], plan: 'Gros plan', optique: '100 mm', mouvement: 'Fixe puis léger tremblement',
      lumiere: 'Une ligne verte parcourt le boîtier, les câbles s’allument un à un',
      intention: "Pas faiblement. Pas comme un vieux circuit réveillé. Glide retire sa main du déclencheur.",
      cam: (lt) => ({ pos: [4.6, 1.2, 147], look: [0, -1, 152], fov: 30, shake: lt > 4 ? 0.04 + (lt - 4) * 0.03 : 0, shakeFreq: 4 }),
    },
    {
      t: [86, 94], plan: "Plan d'ensemble", optique: '18 mm', mouvement: 'Recul brusque puis aspiration',
      lumiere: "Les étoiles s'étirent en courbes vertes ; flash blanc final",
      intention: "La paroi semble se creuser. Non : c'est l'espace derrière. L'impulsion les arrache.",
      cam: (lt) => ({ pos: [0, 6, keys([[0, 100], [5, 92], [8, 140]], lt)], look: [0, 0, 220], fov: keys([[0, 70], [6, 90], [8, 110]], lt), shake: 0.1 + lt * 0.05, shakeFreq: 5 }),
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 1, hues: [[30, 40, 70], [60, 50, 40]], density: 0.3 }));
    S.stars = starfield({ count: 5000, seed: 2 });
    scene.add(S.stars);
    S.sun = new THREE.DirectionalLight(0xfff1dc, 3);
    S.sun.position.set(600, 400, -500);
    scene.add(S.sun);
    scene.add(new THREE.HemisphereLight(0x0a1220, 0x2a4a7a, 0.5));
    S.earth = planet({ radius: 2600, seed: 4, kind: 'earth' });
    S.earth.position.set(800, -3600, -1800);
    scene.add(S.earth);
    S.trans = transporter();
    scene.add(S.trans);
    S.debris = debrisField({ count: 360, center: [0, 0, -560], size: [700, 260, 700], scale: [2, 26], seed: 41, avoid: [0, 0, -500, 60] });
    scene.add(S.debris);
    // Chambre des sphères de stockage
    const sm = hullMat('worn', { color: 0xbfbab0, metalness: 0.7, roughness: 0.3 });
    const sg = new THREE.SphereGeometry(1, 16, 12);
    S.spheres = new THREE.InstancedMesh(sg, sm, 50);
    const d = new THREE.Object3D();
    for (let i = 0; i < 50; i++) {
      d.position.set(Math.sin(i * 2.3) * 16, Math.cos(i * 1.7) * 14, 10 + (i % 10) * 4);
      d.scale.setScalar(1.5 + (i % 4) * 0.6);
      d.updateMatrix();
      S.spheres.setMatrixAt(i, d.matrix);
    }
    scene.add(S.spheres);
    S.cage = deadBeacon();
    S.cage.position.set(0, -2, 152);
    scene.add(S.cage);
    // Brèches lumineuses dans la coque
    for (const z of [-80, 10, 70]) {
      const l = new THREE.PointLight(0xfff0d0, 60, 50, 2);
      l.position.set(20, 18, z);
      scene.add(l);
    }

    S.balam = recuperateur();
    scene.add(S.balam);
    S.glide = glideShip();
    scene.add(S.glide);
    for (const [ship, col] of [[S.balam, 0xfff0d0], [S.glide, 0xd0f0ff]]) {
      const sl = new THREE.SpotLight(col, 0, 160, 0.35, 0.5, 1.4);
      sl.position.set(0, 0, 4);
      sl.target.position.set(0, -1, 40);
      ship.add(sl, sl.target);
      ship.userData.spot = sl;
      const bm = beam({ length: 70, radius: 12, color: col, opacity: 0 });
      bm.position.set(0, 0, 4);
      ship.add(bm);
      ship.userData.beam = bm;
    }
    S.shot1 = bolt(0x7fe0ff, 10, 0.35);
    S.shot2 = bolt(0x7fe0ff, 10, 0.35);
    S.shot3 = bolt(0xffb060, 8, 0.4);
    scene.add(S.shot1, S.shot2, S.shot3);
    S.boom = explosion(0xffa040, 8, 3);
    scene.add(S.boom);
    S.antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 30, 8), hullMat('dark'));
    S.antenna.position.set(30, -10, -440);
    S.antenna.rotation.z = 0.6;
    scene.add(S.antenna);

    // Cockpit de Glide (plateau)
    S.gCock = cockpitInterior({ color: 0x1f3438, seed: 9 });
    S.gCock.position.set(5000, 0, 0);
    scene.add(S.gCock);
    S.gPilot = alyde();
    S.gPilot.position.set(5000, -0.45, -0.1);
    scene.add(S.gPilot);
    const gl = new THREE.PointLight(0x3f9fff, 0.9, 3, 2);
    gl.position.set(5000.2, 1.2, 0.9);
    scene.add(gl);
    const grim = new THREE.SpotLight(0xaee8ff, 14, 5, 0.6, 0.6, 2);
    grim.position.set(4999.3, 2.1, -0.9);
    grim.target.position.set(5000, 1.45, 0.1);
    scene.add(grim, grim.target);
    S.slot = new THREE.Group();
    S.slot.position.set(5000.62, 1.0, 0.2);
    const lining = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.6), new THREE.MeshStandardMaterial({ color: 0x3a2e48, roughness: 1 }));
    S.slot.add(lining);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.66), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.5, metalness: 0.5 }));
    frame.position.x = 0.03;
    S.slot.add(frame);
    S.slot.rotation.y = -0.3;
    scene.add(S.slot);
    // Cockpit de Balam (plateau)
    S.bCock = cockpitInterior({ color: 0x3a3430, seed: 3 });
    S.bCock.position.set(2000, 0, 0);
    scene.add(S.bCock);
    S.bPilot = pilotBust('balam');
    S.bPilot.position.set(2000, -0.42, -0.12);
    scene.add(S.bPilot);
    const bl = new THREE.PointLight(0xffa060, 1.2, 3, 2);
    bl.position.set(2000.2, 1.2, 0.9);
    scene.add(bl);
    const brim = new THREE.SpotLight(0xffd0a0, 12, 5, 0.6, 0.6, 2);
    brim.position.set(1999.2, 2.1, -0.9);
    brim.target.position.set(2000, 1.4, 0.1);
    scene.add(brim, brim.target);

    S.fil = filaments({ count: 220, length: 600, radius: 70, color: 0x3dff9a, twist: 1.2 });
    S.fil.position.set(0, 0, 160);
    S.fil.rotation.y = Math.PI;
    scene.add(S.fil);
    S.surge = glow(0x3dff9a, 200, 0);
    S.surge.position.set(0, 0, 175);
    scene.add(S.surge);
    S.motes = sparkCloud({ count: 300, seed: 6, color: 0x9fffd0, size: 0.4, spread: [60, 40, 80] });
    S.motes.position.set(0, 0, 140);
    scene.add(S.motes);
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.stars.material.uniforms.stretch.value = ramp(86, 92, t);
    S.debris.userData.update(t);
    S.trans.userData.crane.rotation.y = t * 0.08;
    const bp = at(BALAM, t), bn = at(BALAM, t + 0.5);
    const gp = at(GLIDE, t), gn = at(GLIDE, t + 0.5);
    S.balam.position.set(...bp);
    S.glide.position.set(...gp);
    if (t < 68) {
      S.balam.lookAt(...bn);
      S.glide.lookAt(...gn);
    } else {
      S.balam.lookAt(0, -2, 160);
      S.glide.lookAt(0, 0, 160);
    }
    // face-à-face dans la chambre des sphères
    if (t >= 52 && t < 58) {
      S.balam.position.set(0, 1, 52);
      S.balam.lookAt(0, 1, 30);
      S.glide.position.set(0, 1, 30);
      S.glide.lookAt(0, 1, 52);
    }
    S.balam.rotateZ(Math.sin(t * 0.7) * 0.15);
    S.balam.userData.setThrust(t < 68 ? 0.8 : 0.2);
    S.glide.userData.setThrust(t < 68 ? 0.6 : 0.2);
    S.balam.userData.blink(t);
    S.glide.userData.blink(t);
    // phares : allumés dans l'épave, coupés dans la chambre des sphères
    const inside = ramp(33, 36, t);
    const dark = pulse(t, 45.5, 52, 0.4);
    const lightG = inside * (1 - dark);
    const lightB = inside * (1 - pulse(t, 44.5, 52, 0.3));
    S.glide.userData.spot.intensity = 1500 * lightG;
    S.glide.userData.beam.material.uniforms.opacity.value = 0.12 * lightG;
    S.balam.userData.spot.intensity = 1200 * lightB;
    S.balam.userData.beam.material.uniforms.opacity.value = 0.1 * lightB;

    // tirs
    shootBolt(S.shot1, [gp[0], gp[1], gp[2] + 4], [bp[0] + 22, bp[1] + 3, bp[2] + 40], inv(23.5, 24.4, t));
    shootBolt(S.shot2, [gp[0], gp[1], gp[2] + 4], [bp[0] + 6, bp[1], bp[2] + 30], inv(27, 27.8, t));
    shootBolt(S.shot3, [bp[0], bp[1] + 2, bp[2]], [gp[0], gp[1] + 6, gp[2] - 10], inv(41, 41.6, t));
    setExplosion(S.boom, inv(24.4, 26, t));
    S.boom.position.set(bp[0] + 22, bp[1] + 3, bp[2] + 40);
    S.antenna.visible = t < 24.4;
    if (t > 24.4 && t < 24.6) S.flash = 0.3;
    S.flashColor = '#ffd8a0';

    // balise
    const on = smooth(inv(80, 84, t));
    S.cage.userData.setOn(on, t);
    S.motes.material.uniforms.amount.value = ramp(83, 90, t);
    S.motes.material.uniforms.time.value = t;
    S.motes.material.uniforms.spd.value = 3;
    S.fil.material.uniforms.time.value = t * 2;
    S.fil.material.uniforms.intensity.value = ramp(85, 90, t) * 1.2;
    S.surge.material.opacity = ramp(88, 92.5, t);
    S.surge.scale.setScalar(200 + ramp(88, 93, t) * 600);
    if (t > 92) S.flash = ramp(92, 93.5, t);
    S.flashColor = t > 80 ? '#e8fff0' : S.flashColor;
    // vibrisses de Glide qui se plaquent après le nom
    const tense = ramp(60, 61, t);
    S.gPilot.userData.vib.forEach((v, i) => (v.rotation.y = tense * 0.6 * (i < 4 ? 1 : -1)));
    S.gPilot.userData.head.rotation.y = keys([[0, 0.05], [9, 0.12], [58, 0.12], [62, 0]], t);
    S.gPilot.userData.armR.rotation.set(-1.0, 0, 0.2);
    S.gPilot.userData.armL.rotation.set(-1.0 + (t > 82 ? 0.4 : 0), 0, -0.2);
    S.bPilot.userData.armR.rotation.set(-1.0, 0, 0.2);
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    if (t >= 52 && t < 58) {
      const a = ramp(54.2, 54.5, t);
      panel(g, w / 2 + 40, 60, 360, 64, { color: 'rgba(120,220,255,0.9)', fill: 'rgba(0,20,30,0.6)', alpha: a });
      text(g, 'GESTE HOSTILE', w / 2 + 56, 86, { size: 13, color: '#9fe8ff', alpha: a });
      text(g, 'SIGNIFICATION CULTURELLE PROBABLE', w / 2 + 56, 108, { size: 13, color: '#9fe8ff', alpha: a * ramp(55, 55.3, t) });
    }
    if (t >= 82 && t < 86) {
      const rows = ['Champ gravitationnel : incohérent', 'Magnétisme : hors échelle', 'Distance aux parois : variable'];
      panel(g, 60, 70, 360, 104, { color: 'rgba(255,80,60,0.9)', fill: 'rgba(30,0,0,0.5)' });
      rows.forEach((r, i) => text(g, r, 76, 100 + i * 24, { size: 13, color: '#ff9080', alpha: ramp(82.3 + i * 0.5, 82.6 + i * 0.5, t) }));
    }
    if (t >= 22 && t < 30) {
      const lock = ramp(26, 27, t);
      alert(g, lock > 0.5 ? 'VERROUILLAGE — PROPULSEUR GAUCHE' : 'VERROUILLAGE', w - 60, h - 40, t, { size: 14, align: 'right', alpha: lock });
    }
  },

  subs: [
    [1, 4, '*', 'Glide n’aimait pas les cimetières qui continuaient de bouger.'],
    [5.2, 3.4, '*', 'Les morts, au moins, avaient la politesse de rester à leur place.'],
    [13, 1.8, 'Balam', 'Tu triches encore.'],
    [14.9, 1.5, 'Glide', 'Tu répètes.'],
    [16.5, 2, 'Balam', 'C’est parce que tu recommences.'],
    [18.6, 2.6, 'Glide', 'Non. C’est parce que tu recommences.'],
    [24.8, 2, 'Balam', 'Tu veux me tuer ou m’arrêter ?'],
    [26.9, 1.2, 'Glide', 'T’arrêter.'],
    [28.2, 1.8, 'Balam', 'Tes méthodes manquent de nuance.'],
    [35.5, 1.6, 'Glide', 'Évidemment.'],
    [41.8, 1.6, 'Glide', 'Tu m’as tiré dessus.'],
    [43.5, 2.2, 'Balam', 'Je voulais vérifier que tu étais attentif.'],
    [49, 2.5, '*', 'L’obscurité avala les deux appareils.'],
    [55.6, 1.6, 'Balam', 'Ton logiciel est très lent.'],
    [57.3, 0.7, 'Glide', 'Il hésitait.'],
    [58.2, 1, 'Balam', 'Sur quoi ?'],
    [59.3, 1.4, 'Glide', 'Ta maturité.'],
    [61, 2.8, 'Glide', 'Tu viens avec moi. Pour répondre de Korren.'],
    [64.6, 2.2, 'Balam', 'Je n’ai pas tué Korren.'],
    [67, 1.4, 'Glide', 'Tu étais là.'],
    [68.5, 1.4, 'Glide', 'Tu es parti avec le Livre.'],
    [71, 1.8, 'Glide', 'Ne l’alimente pas.'],
    [73, 1.8, 'Glide', 'Parce qu’elle est morte.'],
    [75, 2.8, 'Balam', 'C’est généralement le meilleur moment pour voler quelque chose.'],
    [78.2, 1.4, 'Glide', 'Dernier avertissement.'],
    [79.7, 1.3, 'Balam', 'Tu en as donné quatre.'],
    [81.1, 1.6, 'Balam', 'Tu devrais numéroter.'],
  ],
  cues: [
    [0, 'drone', 0.4], [0, 'hum', 0.5], [12, 'engine', 0.6], [12, 'tension', 0.5], [23.6, 'laser', 0.8], [24.4, 'impact', 0.8],
    [27, 'laser', 0.7], [33, 'rumble', 0.5], [41, 'laser', 0.6], [46, 'silence', 0.5], [54, 'beep', 0.4],
    [61, 'hit', 0.7], [70, 'drone', 0.6], [80, 'beacon', 0.9], [82, 'alarm', 0.5], [86, 'rise', 1], [92, 'boom', 1],
  ],
  music: { mood: 'tension' },
};

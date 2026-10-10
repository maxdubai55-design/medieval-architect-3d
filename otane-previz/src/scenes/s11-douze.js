import * as THREE from 'three';
import { starfield, nebulaSky, planet, glow, filaments, sparkCloud } from '../lib/fx.js';
import { indocile, hangar, pik, human, alyde, couronne, traffic, heart, hullMat, glassMat, box, cockpitInterior, pilotBust } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp, rng } from '../lib/util.js';
import { text } from '../lib/hud.js';

const CH = 4000; // décor de la chambre du Cœur

export default {
  id: '11',
  title: 'Douze',
  chapter: 'Chapitre 24',
  duration: 92,
  fadeOut: 3,
  cards: [{ t: 86, d: 6, big: true, size: 72, lines: ['OTANE', 'LE CŒUR DES MONDES'], y: 250 }],
  shots: [
    {
      t: [0, 9], plan: 'Plan large hangar', optique: '28 mm', mouvement: 'Fixe',
      lumiere: 'Lumière blanche du hangar ; coque brûlée, tourelle qui pend sur un câble',
      intention: "L'Indocile rentre sous remorque. Pik, mains sur les hanches. « Descendez. » « Je peux expliquer. » « Non. »",
      cam: () => ({ pos: [9, 3.2, 18], look: [0, 1.8, 4], fov: 40 }),
    },
    {
      t: [9, 18], plan: 'Plan rapproché', optique: '50 mm', mouvement: 'Fixe',
      lumiere: 'Main de Pik sur la coque, lumière rasante',
      intention: "Sa colère change. Pas beaucoup. Assez. « Elle a tenu. » « Oui. » Tess arrive en courant.",
      cam: () => ({ pos: [4.4, 1.8, 8.6], look: [1.4, 1.5, 5.4], fov: 40 }),
    },
    {
      t: [18, 27], plan: "Plan d'ensemble", optique: '24 mm', mouvement: 'Lent travelling latéral',
      lumiere: 'Hangar silencieux, moteurs coupés',
      intention: "Kovar lit les noms. Pas de musique. « Il revenait toujours chercher les retardataires. »",
      cam: (lt) => ({ pos: [keys([[0, -18], [9, -10]], lt), 5, 30], look: [0, 1.5, 14], fov: 46 }),
    },
    {
      t: [27, 33], plan: 'Insert', optique: '85 mm', mouvement: 'Fixe',
      lumiere: 'Pinceau blanc sur la plaque froide',
      intention: "Tess repeint autour de la brûlure sans l'effacer. La cicatrice reste dans le dessin.",
      cam: () => ({ pos: [2.1, 2.2, 9.6], look: [0.62, 2.12, 8.7], fov: 30 }),
    },
    {
      t: [33, 50], plan: 'Plan rapproché, chambre du Cœur', optique: '50 mm', mouvement: 'Lent travelling avant sur la plaque',
      lumiere: "Une lumière du Cœur traverse la plaque translucide ; douze points se fixent",
      intention: "Onze positions ne répondent à rien. La douzième revient à intervalles réguliers. « Même notation que le Cœur. »",
      cam: (lt) => ({ pos: [CH + 1.6, 1.9, keys([[0, 4.2], [17, 2.8]], lt)], look: [CH, 1.6, 0], fov: 40 }),
    },
    {
      t: [50, 58], plan: 'Plan à deux', optique: '85 mm', mouvement: 'Fixe',
      lumiere: 'Contre-jour de la baie du hangar',
      intention: "« Vous êtes revenu. » « Vous aussi. » Pas longtemps. Assez pour que Balam oublie de parler.",
      cam: () => ({ pos: [-24.4, 8.4, 3.6], look: [-24.4, 8.2, 0], fov: 36 }),
    },
    {
      t: [58, 70], plan: 'Plan large, départ', optique: '24 mm', mouvement: 'Fixe, L’Indocile glisse vers la porte',
      lumiere: "La porte ouverte sur l'espace, cinq silhouettes au bord du hangar",
      intention: "Fara, Pik, Tess, Mara, Brek. MOTEUR GAUCHE : 94 % MAXIMUM. Il devient conservateur.",
      cam: () => ({ pos: [-6, 2.2, 40], look: [0, 3, -40], fov: 46 }),
    },
    {
      t: [70, 92], plan: "Plan d'ensemble, final", optique: '24 mm', mouvement: 'Recul, La Couronne derrière, le Sillage devant',
      lumiere: "La ville et ses réparations en contre-jour ; le vert du Sillage qui s'ouvre",
      intention: "« Tu sais que je te déteste toujours ? » « Oui. » « Bien. » « Ça aurait été gênant. » L'Indocile entre dans le Sillage.",
      cam: (lt, S) => {
        const p = S.ship.position;
        return { pos: [p.x + keys([[0, 14], [16, 40]], lt), p.y + keys([[0, 5], [16, 20]], lt), p.z + keys([[0, 22], [16, 80]], lt)], look: [p.x, p.y, p.z - 40], fov: 48 };
      },
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 5, hues: [[10, 40, 60], [30, 50, 80]], density: 0.3 }));
    S.stars = starfield({ count: 5000, seed: 111 });
    scene.add(S.stars);
    S.hall = hangar({});
    scene.add(S.hall);
    S.top = new THREE.DirectionalLight(0xe8f0ff, 1.4);
    S.top.position.set(-20, 40, 30);
    scene.add(S.top);
    S.ship = indocile({ mark: 'burnt' });
    scene.add(S.ship);
    // tourelle auxiliaire qui pend
    S.ship.userData.turret.rotation.z = 0.6;
    S.pik = pik();
    scene.add(S.pik);
    S.tess = human({ body: 0x6a4a5a, female: true, skin: 0x9a7a62 });
    S.tess.scale.setScalar(0.85);
    scene.add(S.tess);
    S.mara = human({ body: 0x3a2a2a, female: true, hair: 0x5a5a5a });
    S.brek = human({ body: 0x2a3038 });
    S.fara = human({ body: 0x22262e, female: true, skin: 0x9a7a66 });
    S.kovar = human({ body: 0x1c2024, hair: 0x8a8a88 });
    S.sava = human({ body: 0x3a3a30, female: true, hair: 0x9a9a98 });
    S.balam = human({ body: 0x3a3226 });
    S.glide = alyde();
    for (const c of [S.mara, S.brek, S.fara, S.kovar, S.sava, S.balam, S.glide]) scene.add(c);
    S.crowd = [];
    const r = rng(12);
    for (let i = 0; i < 26; i++) {
      const c = r() < 0.2 ? alyde() : human({ body: [0x2a3038, 0x3a3226, 0x22262e, 0x404040][i % 4], female: r() < 0.5 });
      c.position.set(-10 + (i % 9) * 2.4, 0, 18 + Math.floor(i / 9) * 2.2);
      c.rotation.y = Math.PI;
      scene.add(c);
      S.crowd.push(c);
    }
    S.brush = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    scene.add(S.brush);
    S.fouine = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), new THREE.MeshStandardMaterial({ color: 0x8a6a4a }));
    S.fouine.rotation.z = Math.PI / 2;
    scene.add(S.fouine);
    // passerelle extérieure (Fara et Balam)
    const walk = new THREE.Mesh(box(10, 0.3, 3), hullMat('dark'));
    walk.position.set(-24, 6.8, 0);
    scene.add(walk);

    // Chambre du Cœur : plaque et douze positions
    S.heart = heart({ radius: 5 });
    S.heart.position.set(CH, 8, -14);
    scene.add(S.heart);
    S.chamberFill = new THREE.HemisphereLight(0x2a6a48, 0x0a1a12, 0.8);
    S.plateCanvas = document.createElement('canvas');
    S.plateCanvas.width = S.plateCanvas.height = 512;
    S.plateTex = new THREE.CanvasTexture(S.plateCanvas);
    S.plateTex.colorSpace = THREE.SRGBColorSpace;
    S.plate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshBasicMaterial({ map: S.plateTex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
    S.plate.position.set(CH, 1.6, 0);
    scene.add(S.plate);
    S.cGlide = alyde();
    S.cGlide.position.set(CH - 1.4, 0, 0.6);
    S.cGlide.rotation.y = Math.PI / 2 + 0.3;
    scene.add(S.cGlide);
    S.cBalam = human({ body: 0x3a3226 });
    S.cBalam.position.set(CH + 1.4, 0, 0.9);
    S.cBalam.rotation.y = -Math.PI / 2 - 0.4;
    scene.add(S.cBalam);
    const floorC = new THREE.Mesh(new THREE.CircleGeometry(20, 32), hullMat('dark', { color: 0x30363a }));
    floorC.rotation.x = -Math.PI / 2;
    floorC.position.set(CH, 0, 0);
    scene.add(floorC);

    // Extérieur : La Couronne et le Sillage
    S.city = couronne();
    S.city.position.set(600, -300, 1500);
    scene.add(S.city);
    S.traffic = traffic({ count: 200, radius: 1000, seed: 3, scale: 3 });
    S.traffic.position.copy(S.city.position);
    scene.add(S.traffic);
    S.nerea = planet({ radius: 5200, seed: 12, kind: 'nerea', atmo: 0x9fd0ff });
    S.nerea.position.set(-6000, -4000, 14000);
    scene.add(S.nerea);
    S.star = new THREE.DirectionalLight(0xffe2c0, 2.4);
    S.star.position.set(3000, 1500, 2000);
    scene.add(S.star);
    S.sillage = filaments({ count: 220, length: 1600, radius: 120, color: 0x3dff9a, twist: 1.2 });
    S.sillage.position.set(0, 0, -900);
    scene.add(S.sillage);
    S.mouth = glow(0x3dff9a, 400, 0);
    S.mouth.position.set(0, 0, -900);
    scene.add(S.mouth);
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.city.userData.update(t);
    S.traffic.userData.update(t);
    S.heart.userData.update(t * 0.6, 0.8);
    S.hall.userData.setDoors(keys([[0, 1], [9, 0], [58, 0], [62, 1]], t));
    // Retour au hangar
    if (t < 58) {
      S.ship.position.set(0, keys([[0, 1.8], [9, 1.8]], t), keys([[0, -30], [6, 4], [9, 4]], t));
      S.ship.rotation.set(0, 0, 0);
      S.ship.userData.setThrust([0, 0.1]);
    } else if (t < 70) {
      S.ship.position.set(0, keys([[58, 1.8], [62, 3], [70, 4]], t), keys([[58, 4], [62, 0], [70, -90]], t));
      S.ship.rotation.set(0, Math.PI, 0);
      S.ship.userData.setThrust([0.7, 0.7]);
    } else {
      S.ship.position.set(0, 4, keys([[70, -120], [92, -1000]], t));
      S.ship.rotation.set(0, Math.PI, 0);
      S.ship.userData.setThrust([0.85, 0.85]);
    }
    S.ship.userData.blink(t);
    const place = (c, p, ry, vis = true) => { c.position.set(...p); c.rotation.set(0, ry, 0); c.visible = vis; };
    const inHangar = t < 33 || (t >= 58 && t < 70);
    place(S.pik, [2.2, 0, 7.8], -2.6, inHangar);
    S.pik.userData.armL.rotation.set(0, 0, t < 9 ? -1.2 : 0.2);
    S.pik.userData.armR.rotation.set(t > 10 && t < 16 ? -1.5 : 0, 0, t < 9 ? 1.2 : 0);
    if (t > 10 && t < 18) place(S.pik, [1.9, 0, 6.2], -Math.PI / 2, true);
    place(S.balam, [2.6, 0, 9.8], -2.4, t < 27);
    place(S.glide, [-2.6, 0, 9.2], 2.4, t < 27);
    place(S.tess, [keys([[12, 14], [15, 3.2]], t), 0, keys([[12, 18], [15, 8.6]], t)], -2.2, t > 12 && t < 33);
    if (t >= 27 && t < 33) place(S.tess, [1.5, 0, 9.4], -Math.PI / 2 - 0.4, true);
    S.tess.userData.armR.rotation.set(t >= 27 && t < 33 ? -2.1 + Math.sin(t * 6) * 0.15 : 0, 0, 0);
    S.brush.visible = t >= 27 && t < 33;
    S.brush.position.set(0.85, 2.12 + Math.sin(t * 6) * 0.04, 8.75);
    const burnt = S.ship.userData.mark;
    if (burnt) burnt.material.opacity = 1;
    place(S.kovar, [0, 0, 14], 0, t >= 18 && t < 27);
    place(S.sava, [-5, 0, 16], 0.2, t >= 18 && t < 27);
    S.crowd.forEach((c) => (c.visible = t >= 18 && t < 27));
    S.fouine.position.set(-1.0, 0.25, 4.6 + Math.sin(t * 3) * 0.2);
    S.fouine.visible = t >= 14 && t < 18;
    // Départ : les cinq au bord du hangar
    const edge = t >= 58 && t < 70;
    place(S.fara, edge ? [-4, 0, 30] : [-24.95, 6.95, 0], edge ? Math.PI : Math.PI / 2, edge || (t >= 50 && t < 58));
    place(S.mara, [-1.5, 0, 30.5], Math.PI, edge);
    place(S.brek, [1.5, 0, 30.5], Math.PI, edge);
    if (edge) { place(S.pik, [3.5, 0, 30], Math.PI, true); place(S.tess, [-6, 0, 30.2], Math.PI, true); }
    if (t >= 50 && t < 58) {
      place(S.balam, [-23.85, 6.95, 0], -Math.PI / 2, true);
      const k = pulse(t, 53, 55.5, 0.4);
      S.fara.position.x = -24.95 + k * 0.45;
      S.fara.userData.armR.rotation.set(-2.2 * k, 0, 0);
    }
    // Chambre
    const inCh = t >= 33 && t < 50;
    S.cGlide.visible = S.cBalam.visible = inCh;
    S.cGlide.userData.armL.rotation.set(-1.3, 0, 0.3);
    drawTwelve(S, t);
    // Sillage
    S.sillage.material.uniforms.time.value = t;
    S.sillage.material.uniforms.intensity.value = ramp(72, 82, t);
    S.mouth.material.opacity = ramp(80, 90, t) * 0.5;
    S.hall.visible = t < 72;
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    if (t >= 60 && t < 70) text(g, 'MOTEUR GAUCHE : 94 % MAXIMUM', 60, h - 40, { size: 15, color: '#ffd060', weight: 700, alpha: ramp(60.5, 61, t) });
    if (t >= 18 && t < 27) text(g, 'ARDENT-TREIZE · SECTEUR DOUZE · LA LIGNE', w / 2, 50, { size: 12, align: 'center', color: 'rgba(220,230,225,0.7)', spacing: 3 });
    if (t >= 76 && t < 86) {
      text(g, 'DOUZIÈME POSITION — DIRECTION', w - 60, h - 40, { size: 12, align: 'right', color: '#9fffd0', alpha: ramp(76, 77, t) });
    }
  },

  subs: [
    [3, 1.2, 'Pik', 'Descendez.'],
    [4.5, 1.4, 'Balam', 'Je peux expliquer.'],
    [6, 0.8, 'Pik', 'Non.'],
    [7, 1.6, 'Balam', 'On a sauvé…'],
    [10.5, 1.4, 'Balam', 'Elle a tenu.'],
    [12, 1, 'Pik', 'Oui.'],
    [13.5, 2.2, 'Tess', 'Vous êtes nuls pour ramener les choses en bon état.'],
    [15.9, 1, 'Balam', 'On est revenus.'],
    [17, 1.4, 'Tess', 'C’était la moitié du contrat.'],
    [19, 2.4, '*', 'Kovar lut les noms confirmés morts. Pas de musique. Pas de discours.'],
    [22, 3.6, 'Sava', 'Il revenait toujours chercher les retardataires.'],
    [28, 3.4, '*', 'Tess termina la marque sans effacer la partie brûlée.'],
    [35, 2.6, 'Scientifique', 'Depuis le réancrage, certaines notations se répètent à intervalles réguliers.'],
    [38.5, 1.4, 'Balam', 'Douze quoi ?'],
    [40, 1.2, 'Glide', 'Positions.'],
    [41.4, 2.6, 'Scientifique', 'Onze ne répondent à rien dans nos relevés.'],
    [44.3, 1.8, 'Glide', 'Même notation que le Cœur.'],
    [46.4, 1, 'Fara', 'Un autre ?'],
    [47.5, 1.8, 'Scientifique', 'Possible. Pas prouvé.'],
    [50.5, 1.4, 'Fara', 'Vous êtes revenu.'],
    [52, 1, 'Balam', 'Vous aussi.'],
    [56, 1.8, 'Fara', 'Partez avant de gâcher ça.'],
    [64, 1.4, 'Glide', 'Elle reste ?'],
    [65.6, 1.6, 'Balam', 'Essaie de la sortir.'],
    [67.4, 1.2, 'Glide', 'Elle reste.'],
    [71, 1.4, 'Glide', 'Quatre-vingt-quatorze.'],
    [72.6, 1.4, 'Balam', 'On vient de partir.'],
    [74.2, 1.6, 'Glide', 'Je préfère commencer tôt.'],
    [77, 2, 'Balam', 'Tu sais que je te déteste toujours ?'],
    [79.2, 0.8, 'Glide', 'Oui.'],
    [80.2, 0.8, 'Balam', 'Bien.'],
    [81.2, 1.8, 'Glide', 'Ça aurait été gênant.'],
  ],
  cues: [
    [0, 'hangar', 0.5], [3, 'engineoff', 0.6], [10, 'pat', 0.5], [13, 'steps', 0.5], [18, 'silence', 1], [27, 'brush', 0.4],
    [33, 'heart', 0.7], [36, 'twelve', 0.9], [44, 'swell', 0.6], [50, 'drone', 0.4], [58, 'engine', 0.7], [62, 'door', 0.6],
    [70, 'theme', 1], [84, 'enter', 1],
  ],
  music: { mood: 'final' },
};

// Lumière du Cœur à travers la plaque : douze positions fixées autour d'une carte inconnue.
function drawTwelve(S, t) {
  const g = S.plateCanvas.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  g.fillStyle = 'rgba(190,225,235,0.16)';
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(220,240,245,0.5)';
  g.strokeRect(4, 4, 504, 504);
  const k = ramp(36, 40, t);
  const r = rng(12);
  g.strokeStyle = `rgba(200,240,225,${0.25 + 0.4 * k})`;
  for (let i = 0; i < 22; i++) {
    g.beginPath();
    g.moveTo(r() * 512, r() * 512);
    g.bezierCurveTo(r() * 512, r() * 512, r() * 512, r() * 512, r() * 512, r() * 512);
    g.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3;
    const rad = 150 + (i % 3) * 30;
    const x = 256 + Math.cos(a) * rad, y = 256 + Math.sin(a) * rad;
    const last = i === 11;
    const on = ramp(38 + i * 0.25, 38.4 + i * 0.25, t);
    g.fillStyle = last ? `rgba(80,255,160,${on * (0.6 + 0.4 * Math.sin(t * 4))})` : `rgba(255,255,255,${on * 0.85})`;
    g.beginPath();
    g.arc(x, y, last ? 9 : 5, 0, Math.PI * 2);
    g.fill();
    if (last && t > 43) {
      g.strokeStyle = `rgba(80,255,160,${ramp(43, 44, t)})`;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(x, y, 18 + Math.sin(t * 4) * 3, 0, Math.PI * 2);
      g.stroke();
    }
  }
  S.plateTex.needsUpdate = true;
  S.plate.lookAt(CH + 1.6, 1.9, 4);
}

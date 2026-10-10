import * as THREE from 'three';
import { starfield, nebulaSky, planet, glow, sparkCloud, beam, explosion, setExplosion } from '../lib/fx.js';
import { wreckTug, astronaut, recuperateur, debrisField, habitatModule, solRelay, cable, glideShip, cockpitInterior, pilotBust, hullMat } from '../lib/models.js';
import { keys, ramp, pulse, lerp, mmss, smooth, inv, noise1 } from '../lib/util.js';
import { panel, text, alert, blip } from '../lib/hud.js';

const lin = (x) => x;
// Compte à rebours du poignet, compressé sur la durée de la séquence.
const countdown = (t) => keys([[22, 438], [31, 401], [40, 331], [46, 286], [52, 232], [62, 118], [69, 54], [72, 54]], t, lin);

// Trajectoire du récupérateur pendant la fuite.
const SHIP_PATH = [
  [70, [1, -9.5, 4]], [72.5, [-6, -14, -10]], [75, [-40, -30, -60]], [77, [-110, -39, -110]],
  [79.6, [-120, -40, -160]], [81.5, [-123, -42, -215]], [84, [-170, -48, -300]], [92, [-380, -58, -560]],
];

export default {
  id: '01',
  title: 'Le cimetière de Sol',
  chapter: 'Chapitre 1',
  duration: 114,
  shots: [
    {
      t: [0, 9], plan: "Plan d'ensemble", optique: '18 mm', mouvement: 'Dérive lente, légère rotation',
      lumiere: 'Soleil dur hors champ droit, la Terre en contre-champ bleu ; nuit avec grappes de villes',
      intention: "La Terre occupe la moitié du cadre. Le cimetière orbital au premier plan, tout ce qu'on n'a pas eu les moyens de désorbiter.",
      cam: (lt) => ({ pos: [keys([[0, 38], [9, 30]], lt), keys([[0, 10], [9, 6]], lt), keys([[0, 70], [9, 52]], lt)], look: [-10, -40, -220], fov: 52, roll: keys([[0, 0.05], [9, 0.02]], lt) }),
    },
    {
      t: [9, 16], plan: 'Plan moyen', optique: '35 mm', mouvement: 'Caméra portée, flottante',
      lumiere: 'Soleil rasant sur la coque, ombres franches ; lampe de casque en appoint',
      intention: 'Balam les deux mains dans le ventre du remorqueur. La cloison lâche sans un bruit.',
      cam: (lt) => ({ pos: [11.8, 0.2, 12.5], look: [8, -1.3, 8.4], fov: 38, shake: 0.08, shakeFreq: 0.6 }),
    },
    {
      t: [16, 22], plan: 'Plan large latéral', optique: '24 mm', mouvement: 'Fixe, Balam traverse le cadre',
      lumiere: 'Contre-jour : la Terre derrière Balam, silhouette découpée',
      intention: "La plaque passe à moins d'un mètre du casque. Balam pend au bout de son câble.",
      cam: (lt) => ({ pos: [keys([[0, 22], [6, 24]], lt), 3, keys([[0, -2], [6, -3]], lt)], look: [9.5, -1.5, 8], fov: 40 }),
    },
    {
      t: [22, 29], plan: 'Insert', optique: '85 mm macro', mouvement: 'Fixe',
      lumiere: "Lueur orange du voyant sur le gant",
      intention: '07:18. Le compte à rebours devient le métronome de la séquence.',
      cam: (lt) => ({ pos: [3000.25, 0.32 + lt * 0.004, 0.62 - lt * 0.01], look: [3000, 0, 0], fov: 30, shake: 0.006 }),
    },
    {
      t: [29, 42], plan: 'Plan rapproché', optique: '50 mm', mouvement: 'Lent travelling circulaire',
      lumiere: "Le soleil quitte la coque à 36 s : passage brutal à l'ombre, seule reste la lampe de casque",
      intention: 'Le coupeur meurt à 3 %. Balam attend la rotation, joue avec le froid. La céramique cède.',
      cam: (lt) => {
        const a = keys([[0, 0.5], [13, 1.1]], lt);
        return { pos: [8 + Math.cos(a) * 3.2, 0.4, 8.2 + Math.sin(a) * 3.2], look: [7.6, -1.2, 8.2], fov: 42, shake: 0.03 };
      },
    },
    {
      t: [42, 50], plan: "Plan d'ensemble", optique: '35 mm', mouvement: 'Panoramique suivant le bloc',
      lumiere: 'Silhouette noire sur le disque terrestre',
      intention: "Un bloc de coque se détache et glisse devant la Terre. L'avant-garde du nuage arrive.",
      cam: (lt) => ({ pos: [60, 18, 110], look: [keys([[0, -10], [8, -60]], lt), -50, -120], fov: 34 }),
    },
    {
      t: [50, 60], plan: 'Plan subjectif (visière)', optique: '24 mm', mouvement: 'Travelling avant, micro-propulseurs',
      lumiere: "Faisceau jaune d'un récupérateur concurrent qui balaie l'épave",
      intention: "Le cimetière s'ouvre. Il n'y a pas de vide propre ici.",
      cam: (lt) => ({ pos: [keys([[0, 9.5], [10, 16]], lt), keys([[0, -0.8], [10, 2]], lt), keys([[0, 8.6], [10, 4]], lt)], look: [keys([[0, 40], [10, 60]], lt), keys([[0, 5], [10, 25]], lt), keys([[0, -40], [10, -80]], lt)], fov: 62, shake: 0.06, shakeFreq: 0.8 }),
    },
    {
      t: [60, 70], plan: 'Plan large', optique: '28 mm', mouvement: 'Suivi latéral de Balam',
      lumiere: 'Éclats blancs des fragments qui traversent le champ ; Terre en fond',
      intention: "Puis dix. Puis cent. Le nuage n'est pas une masse : une pluie de reflets qui arrivent trop tard.",
      cam: (lt, S) => {
        const a = S.astro.position;
        return { pos: [a.x + 9, a.y + 3, a.z + 10], look: [a.x - 2, a.y - 2, a.z - 2], fov: 44, shake: 0.12 };
      },
    },
    {
      t: [70, 77], plan: 'Plan de poursuite', optique: '21 mm', mouvement: 'Caméra devant le vaisseau, en recul',
      lumiere: "Cockpit orange, lumière terrestre bleue en remplissage",
      intention: "La pince refuse. Le bras d'amarrage s'arrache. Balam coupe l'assistance.",
      cam: (lt, S) => {
        const p = S.ship.position;
        const q = S.shipLook;
        const dx = q[0] - p.x, dy = q[1] - p.y, dz = q[2] - p.z;
        const n = Math.hypot(dx, dy, dz) || 1;
        const k = 11 / n;
        return { pos: [p.x + dx * k + 3.5, p.y + dy * k + 2.5, p.z + dz * k], look: [p.x, p.y, p.z], fov: 50, shake: 0.18, shakeFreq: 2.2, roll: keys([[0, 0], [7, -0.15]], lt) };
      },
    },
    {
      t: [77, 84], plan: 'Plan fixe dans le passage', optique: '24 mm', mouvement: 'Fixe, le vaisseau frôle la caméra',
      lumiere: "Fenêtres éclairées de l'ancien habitat ; gerbe d'étincelles du raclement",
      intention: "L'ouverture est trop étroite selon l'ordinateur. L'ordinateur ne paie pas ses dettes.",
      cam: (lt) => ({ pos: [-119.5, -38.6, -196], look: [-118, -40, keys([[0, -120], [7, -150]], lt)], fov: 46, shake: 0.05 + (lt > 2.3 && lt < 3.5 ? 0.25 : 0), shakeFreq: 3 }),
    },
    {
      t: [84, 92], plan: 'Plan large', optique: '50 mm', mouvement: 'Fixe, le vaisseau s’éloigne',
      lumiere: 'Calme : la Terre bleue, le relais et ses feux',
      intention: '« Facile. » La liste des dégâts répond à sa place.',
      cam: (lt, S) => {
        const p = S.ship.position;
        return { pos: [-205, -41, keys([[0, -352], [8, -360]], lt)], look: [lerp(p.x, -560, 0.3), lerp(p.y, -70, 0.3), lerp(p.z, -820, 0.3)], fov: 34 };
      },
    },
    {
      t: [92, 104], plan: 'Plan rapproché cockpit', optique: '35 mm', mouvement: 'Lent travelling avant',
      lumiere: "Orange chaud de l'habitacle qui vire au rouge d'alarme",
      intention: "Les balises s'éteignent une fraction de seconde. Une large, deux courtes, une pause. Balam reconnaît la signature.",
      cam: (lt) => ({ pos: [2000.55, keys([[0, 1.72], [12, 1.62]], lt), keys([[0, -0.95], [12, -0.7]], lt)], look: [1999.9, 1.15, 0.7], fov: keys([[0, 48], [12, 40]], lt), shake: 0.006 }),
    },
    {
      t: [104, 108], plan: 'Insert', optique: '50 mm', mouvement: 'Fixe, plongée',
      lumiere: 'Rai rouge sous le siège',
      intention: "Le coffret scellé heurte son logement. Il sait ce qu'il contient.",
      cam: (lt) => ({ pos: [2000.42, 0.42 + lt * 0.01, 0.55], look: [2000, 0.3, -0.15], fov: 38 }),
    },
    {
      t: [108, 114], plan: 'Plan large téléobjectif', optique: '200 mm', mouvement: 'Fixe, écrasement des plans',
      lumiere: 'Contre-jour solaire sur la proue large et les deux nacelles',
      intention: "Un contact coupe droit entre les épaves, comme s'il connaissait la place de chacune.",
      cam: (lt) => ({ pos: [1200, 140, 1600], look: [keys([[0, 820], [6, 700]], lt), 100, keys([[0, 1050], [6, 920]], lt)], fov: 8 }),
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 1, hues: [[30, 40, 70], [60, 50, 40]], density: 0.3 }));
    S.stars = starfield({ count: 5000, seed: 1 });
    scene.add(S.stars);
    S.sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
    S.sun.position.set(800, 280, 220);
    scene.add(S.sun);
    S.sunGlow = glow(0xfff4e0, 900, 0.9, 'star');
    S.sunGlow.position.set(4000, 1400, 1100);
    scene.add(S.sunGlow);
    scene.add(new THREE.HemisphereLight(0x0a1220, 0x2a4a7a, 0.9));
    S.earth = planet({ radius: 2600, seed: 4, kind: 'earth' });
    S.earth.position.set(-400, -3100, -2600);
    S.earth.rotation.set(0.3, 2.2, 0.1);
    scene.add(S.earth);
    S.moon = planet({ radius: 110, seed: 9, kind: 'moon', atmo: null });
    S.moon.position.set(2600, 900, -5200);
    scene.add(S.moon);

    S.wreck = wreckTug();
    scene.add(S.wreck);
    S.wreck.userData.regulator.visible = false;
    S.reg = new THREE.Group();
    const rm = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 14), new THREE.MeshStandardMaterial({ color: 0x2b2f35, metalness: 0.8, roughness: 0.3 }));
    rm.rotation.z = Math.PI / 2;
    S.reg.add(rm);
    scene.add(S.reg);

    S.debris = debrisField({ count: 520, center: [-60, -20, -150], size: [900, 260, 900], scale: [1.5, 28], seed: 31, avoid: [-60, -20, -100, 70] });
    scene.add(S.debris);
    S.debris2 = debrisField({ count: 160, center: [-250, -40, -500], size: [1200, 300, 600], scale: [10, 70], seed: 33, avoid: [-260, -50, -420, 140] });
    scene.add(S.debris2);
    S.modA = habitatModule({ seed: 3 });
    S.modA.position.set(-131, -40, -160);
    scene.add(S.modA);
    S.modB = habitatModule({ seed: 5 });
    S.modB.position.set(-109, -40, -160);
    S.modB.rotation.z = Math.PI;
    scene.add(S.modB);
    const weld = new THREE.Mesh(new THREE.BoxGeometry(18, 3, 6), hullMat('rust'));
    weld.position.set(-120, -32, -175);
    scene.add(weld);

    S.block = new THREE.Mesh(new THREE.BoxGeometry(18, 6, 26), hullMat('rust'));
    scene.add(S.block);

    S.astro = astronaut();
    scene.add(S.astro);
    S.tether = cable();
    scene.add(S.tether);
    S.wristPos = new THREE.Vector3();
    S.cutSpark = glow(0xffffff, 1.2, 0, 'star');
    scene.add(S.cutSpark);
    S.crack = sparkCloud({ count: 60, seed: 3, color: 0xffe0b0, size: 0.06, spread: [1.5, 1.5, 1.5] });
    scene.add(S.crack);

    S.ship = recuperateur();
    scene.add(S.ship);
    S.shipLook = [0, 0, 0];
    S.arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 2.2), hullMat('dark'));
    scene.add(S.arm);
    S.rival = recuperateur();
    S.rival.position.set(-70, 22, -40);
    scene.add(S.rival);
    S.rivalBeam = beam({ length: 120, radius: 18, color: 0xffd860, opacity: 0.22 });
    S.rival.add(S.rivalBeam);
    S.rivalBeam.position.set(0.8, -0.4, 5.3);
    S.rivalSpot = new THREE.SpotLight(0xffd860, 400, 160, 0.25, 0.5, 1.5);
    S.rival.add(S.rivalSpot);
    S.rival.add(S.rivalSpot.target);

    S.cloud = sparkCloud({ count: 1400, seed: 8, color: 0xffffff, size: 0.35, spread: [140, 80, 140] });
    scene.add(S.cloud);
    S.hits = [0, 1, 2, 3, 4].map((i) => {
      const e = explosion(0xfff0d0, 3 + i, 40 + i);
      scene.add(e);
      return e;
    });
    S.scrape = sparkCloud({ count: 120, seed: 4, color: 0xffc070, size: 0.25, spread: [3, 3, 10] });
    scene.add(S.scrape);

    S.relay = solRelay();
    S.relay.position.set(-560, -70, -820);
    S.relay.rotation.y = 0.6;
    scene.add(S.relay);

    // Cockpit (plateau séparé) et coffret scellé
    S.screenCanvas = document.createElement('canvas');
    S.screenCanvas.width = 256;
    S.screenCanvas.height = 160;
    S.screenTex = new THREE.CanvasTexture(S.screenCanvas);
    S.screenTex.colorSpace = THREE.SRGBColorSpace;
    S.cock = cockpitInterior({ screen: S.screenTex, color: 0x3a3430 });
    S.cock.position.set(2000, 0, 0);
    scene.add(S.cock);
    S.pilot = pilotBust('balam');
    S.pilot.position.set(2000, -0.42, -0.12);
    S.pilot.rotation.y = 0;
    scene.add(S.pilot);
    S.cockLight = new THREE.PointLight(0xffa060, 6, 6, 2);
    S.cockLight.position.set(2000, 1.3, 0.7);
    scene.add(S.cockLight);
    S.cockKey = new THREE.PointLight(0xfff0e0, 3, 6, 2);
    S.cockKey.position.set(2001.2, 2, -0.5);
    scene.add(S.cockKey);
    S.box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.32), new THREE.MeshStandardMaterial({ color: 0x2b2420, metalness: 0.5, roughness: 0.4 }));
    S.box.position.set(2000, 0.3, -0.15);
    scene.add(S.box);
    const seal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.19, 0.33), new THREE.MeshStandardMaterial({ color: 0x000, emissive: 0xb02010, emissiveIntensity: 1.5 }));
    seal.position.set(2000.12, 0.3, -0.15);
    scene.add(seal);
    S.cockStars = glow(0xffffff, 0.6, 0.6, 'star');
    S.cockStars.position.set(2001.5, 2.5, 6);
    scene.add(S.cockStars);

    // Plateau d'insert : avant-bras et écran de poignet
    S.armSet = new THREE.Group();
    S.armSet.position.set(3000, 0, 0);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.9, 20), new THREE.MeshStandardMaterial({ color: 0xc9c4b8, roughness: 0.92 }));
    sleeve.rotation.z = Math.PI / 2;
    sleeve.position.x = -0.25;
    S.armSet.add(sleeve);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshStandardMaterial({ color: 0x5a5852, roughness: 0.7 }));
    glove.scale.set(1.4, 0.8, 1);
    glove.position.x = 0.27;
    S.armSet.add(glove);
    S.wristCanvas = document.createElement('canvas');
    S.wristCanvas.width = 256;
    S.wristCanvas.height = 128;
    S.wristTex = new THREE.CanvasTexture(S.wristCanvas);
    S.wristTex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.12), [0, 0, new THREE.MeshBasicMaterial({ map: S.wristTex, toneMapped: false }), 0, 0, 0].map((m) => m || new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.5 })));
    scr.position.set(0, 0.095, 0);
    S.armSet.add(scr);
    const wl = new THREE.PointLight(0xff9030, 1.2, 0.8, 2);
    wl.position.set(0, 0.2, 0.05);
    S.armSet.add(wl);
    const earthBounce = new THREE.PointLight(0x4f8fff, 2, 3, 2);
    earthBounce.position.set(0.3, -0.6, 0.5);
    S.armSet.add(earthBounce);
    scene.add(S.armSet);

    S.glide = glideShip();
    scene.add(S.glide);
    S.glideScan = glow(0x7fe0ff, 20, 0);
    S.glide.add(S.glideScan);
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.debris.userData.update(t);
    S.debris2.userData.update(t * 0.6);
    S.wreck.rotation.z = t * 0.004;
    S.earth.rotation.y = 2.2 + t * 0.0008;
    // Lumière : le soleil quitte la coque à 36 s (ombre), revient à 46 s.
    const shadow = pulse(t, 35.5, 46, 0.6);
    S.sun.intensity = 3.2 * (1 - 0.94 * shadow);

    // La plaque de blindage pivote à 10,5 s
    S.wreck.userData.plate.rotation.y = -1.6 * smooth(inv(10.3, 13, t));

    // Balam (astronaute)
    const a = S.astro;
    a.rotation.set(0, 0, -Math.PI / 2);
    let pos = [7.2, -1.0, 9.0];
    if (t > 13 && t < 50) {
      // poussée, suspendu au câble, retour contre l'épave
      const out = smooth(inv(13, 17, t)) * (1 - smooth(inv(20, 23.5, t)));
      pos = [7.2 + out * 4.5, -1.0 + out * 0.6, 9.0 + out * 0.8];
      a.rotation.x = out * (t - 13) * 0.9;
    }
    if (t >= 50 && t < 60) pos = [keys([[50, 7.2], [60, 15]], t), keys([[50, -1], [60, 1.5]], t), keys([[50, 9], [60, 5]], t)];
    if (t >= 60) pos = [keys([[60, 15], [64, 9], [68.5, 3]], t), keys([[60, 1.5], [64, -4], [68.5, -8.2]], t), keys([[60, 5], [64, 6], [68.5, 5.5]], t)];
    a.position.set(...pos);
    if (t >= 50) a.rotation.set(0.4, 0.8, -Math.PI / 2 + 0.7);
    a.visible = t < 69.2 || t >= 92;
    if (t >= 92) a.visible = false;
    // bras dans l'épave
    const work = t < 13 || (t > 24 && t < 42);
    a.userData.armL.rotation.set(work ? -1.2 : -0.3, 0, work ? 0.2 : 0.6);
    a.userData.armR.rotation.set(work ? -1.3 : -0.2, 0, work ? -0.2 : -0.6);
    a.userData.wrist.material.opacity = 0.6 + 0.4 * Math.sin(t * 8);
    a.updateMatrixWorld(true);
    a.userData.wrist.getWorldPosition(S.wristPos);
    S.wristCam = a.localToWorld(new THREE.Vector3(0.75, 1.75, 0.9));
    // câble de sécurité
    S.tether.visible = t < 60;
    const anchor = [7.1, 1.2, 9.5];
    const waist = a.localToWorld(new THREE.Vector3(0, 1.0, -0.2));
    S.tether.userData.set(anchor, [waist.x, waist.y, waist.z], 0.15);

    // coupeur : étincelle à 30 s puis panne
    S.cutSpark.position.set(7.15, -1.5, 8.6);
    S.cutSpark.material.opacity = pulse(t, 30, 30.9, 0.1) * (0.6 + 0.4 * Math.sin(t * 60));
    // céramique qui craque à 38,5 s puis cède à 40 s
    S.crack.position.set(7.2, -1.5, 8.2);
    S.crack.material.uniforms.amount.value = pulse(t, 38.5, 39.4, 0.1) + pulse(t, 40, 41, 0.1);
    S.crack.material.uniforms.time.value = t;
    S.crack.material.uniforms.spd.value = 2;
    // régulateur
    const regFree = smooth(inv(40, 40.6, t));
    const chest = a.localToWorld(new THREE.Vector3(0, 1.2, 0.35));
    S.reg.position.set(lerp(7.3, chest.x, regFree), lerp(-1.5, chest.y, regFree), lerp(8, chest.z, regFree));
    S.reg.rotation.set(t > 40 ? t * 0.3 : 0, 0, 0);
    S.reg.visible = t < 69;

    // bloc de coque qui glisse devant la Terre
    S.block.position.set(keys([[42, -6], [50, -70]], t), keys([[42, -4], [50, -22]], t), keys([[42, -30], [50, -60]], t));
    S.block.rotation.set(t * 0.12, t * 0.07, 0);
    S.block.visible = t >= 41;

    // concurrent et son faisceau
    S.rival.position.set(keys([[0, -90], [60, -55], [62, -75], [66, -140]], t), keys([[0, 26], [60, 20], [66, 34]], t), keys([[0, -40], [60, -20], [66, -60]], t));
    const sweep = Math.sin(t * 0.35) * 0.5;
    S.rival.lookAt(10 + sweep * 60, -2, 10 + Math.cos(t * 0.35) * 20);
    const beamOn = t < 61.2 ? 1 : 0;
    S.rivalBeam.material.uniforms.opacity.value = 0.22 * beamOn;
    S.rivalSpot.intensity = 400 * beamOn;
    S.rivalSpot.target.position.set(0, 0, 50);
    S.rival.userData.setThrust(t > 61 ? 1 : 0.3);

    // nuage de débris
    S.cloud.position.set(0, 0, 0);
    const amount = keys([[44, 0], [50, 0.03], [60, 0.04], [62, 0.15], [64, 0.6], [68, 1], [84, 1]], t, lin);
    S.cloud.material.uniforms.amount.value = amount;
    S.cloud.material.uniforms.time.value = t;
    S.cloud.material.uniforms.flow.value.set(-25, -3, -25);
    if (t > 70) S.cloud.position.set(-110, -40, -150);
    // impacts
    setExplosion(S.hits[0], inv(64.5, 66, t));
    S.hits[0].position.set(4, -6, 2);
    setExplosion(S.hits[1], inv(82, 83.5, t));
    S.hits[1].position.set(-131, -34, -150);
    setExplosion(S.hits[2], inv(82.4, 84, t));
    S.hits[2].position.set(-109, -45, -170);
    setExplosion(S.hits[3], inv(82.9, 84.5, t));
    S.hits[3].position.set(-125, -38, -140);
    setExplosion(S.hits[4], inv(45, 47, t));
    S.hits[4].position.set(-6, -3, -32);
    if (t > 64.5 && t < 65) S.flash = 0.25;

    // récupérateur
    const sp = keys(SHIP_PATH, t, lin);
    const sp2 = keys(SHIP_PATH, t + 0.6, lin);
    if (t < 70) {
      S.ship.position.set(1, -9.5, 4);
      S.ship.rotation.set(0, 0.3, Math.PI);
    } else {
      S.ship.position.set(...sp);
      S.ship.lookAt(sp2[0], sp2[1], sp2[2]);
      S.ship.rotateZ(keys([[76, 0], [78.5, -1.4], [81.5, -1.4], [84, 0]], t));
    }
    S.shipLook = sp2;
    S.ship.userData.setThrust(t > 70 ? 0.9 + 0.1 * Math.sin(t * 20) : 0.15);
    S.ship.userData.blink(t);
    // bras d'amarrage arraché à 71,5 s
    const armOff = smooth(inv(71.5, 74, t));
    S.arm.visible = t > 71.3 && t < 76;
    S.arm.position.set(lerp(-0.9, 6, armOff), lerp(-9, -6, armOff), lerp(5.4, 9, armOff));
    S.arm.rotation.set(t * 2, t, 0);
    // le second module dérive vers le passage
    S.modB.position.x = keys([[70, -107], [80, -112.5]], t);
    // raclement du flanc gauche
    S.scrape.position.set(-117.5, -40, -165);
    S.scrape.material.uniforms.amount.value = pulse(t, 79.3, 80.4, 0.1);
    S.scrape.material.uniforms.time.value = t;
    S.scrape.material.uniforms.spd.value = 6;
    if (t > 79.3 && t < 79.5) S.flash = 0.15;

    // cockpit : virage au rouge à 96 s
    const red = smooth(inv(96, 97, t));
    S.cockLight.color.setRGB(1, lerp(0.63, 0.12, red), lerp(0.38, 0.08, red));
    S.cockLight.intensity = 6 + red * 4 * (0.5 + 0.5 * Math.sin(t * 9));
    S.box.position.y = 0.3 + (t > 104.5 && t < 105.2 ? Math.sin((t - 104.5) * 30) * 0.03 : 0);
    S.box.rotation.z = t > 104.5 && t < 105.2 ? Math.sin((t - 104.5) * 20) * 0.04 : 0;
    drawScreen(S, t);
    if (t >= 21 && t < 30) {
      const wg = S.wristCanvas.getContext('2d');
      wg.fillStyle = '#120600';
      wg.fillRect(0, 0, 256, 128);
      wg.fillStyle = Math.sin(t * 6) > -0.6 ? '#ffa040' : '#c06010';
      wg.font = 'bold 74px monospace';
      wg.textAlign = 'center';
      wg.fillText(mmss(countdown(t)), 128, 86);
      wg.font = '14px monospace';
      wg.fillText('NUAGE · SECT. 32', 128, 116);
      S.wristTex.needsUpdate = true;
    }

    // Glide
    S.glide.position.set(keys([[92, 1150], [114, 640]], t, lin), keys([[92, 150], [114, 85]], t, lin), keys([[92, 1450], [114, 850]], t, lin));
    S.glide.lookAt(0, 0, 0);
    S.glide.userData.setThrust(0.8);
    const scan = scanPulse(t - 95);
    S.glideScan.material.opacity = scan * 0.9;
    S.glideScan.scale.setScalar(20 + scan * 60);
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    // Insert poignet : 07:18

    // Visière : compte à rebours permanent pendant la sortie EVA
    if ((t >= 29 && t < 42) || (t >= 50 && t < 70)) {
      const v = countdown(t);
      const pov = t >= 50 && t < 60;
      const x = pov ? 70 : w - 140;
      const y = pov ? h - 70 : 40;
      text(g, mmss(v), x, y, { size: pov ? 30 : 22, color: v < 120 ? '#ff5030' : '#ffa040', weight: 700 });
      if (t >= 31 && t < 36) text(g, 'COUPEUR : CHARGE 3 %', x, y + 22, { size: 11, color: '#ff5030' });
    }
    if (t >= 50 && t < 60) {
      // cadre de visière
      g.save();
      const grd = g.createRadialGradient(w / 2, h / 2, h * 0.55, w / 2, h / 2, w * 0.6);
      grd.addColorStop(0, 'rgba(0,0,0,0)');
      grd.addColorStop(1, 'rgba(0,0,0,0.85)');
      g.fillStyle = grd;
      g.fillRect(0, 0, w, h);
      g.restore();
      text(g, 'O2 71 %   CÂBLE 2   PROPULSEUR OK', w - 70, h - 70, { size: 11, align: 'right', color: 'rgba(255,200,140,0.8)' });
      text(g, 'BALISE EPAVE : PAS DE RÉPONSE', w - 70, h - 52, { size: 11, align: 'right', color: '#ff6040', alpha: t > 55 ? 1 : 0 });
    }
    // Liste des dégâts
    if (t >= 86 && t < 92) {
      const a = ramp(86, 86.5, t);
      panel(g, 70, 90, 330, 132, { color: 'rgba(255,170,90,0.9)', fill: 'rgba(25,10,0,0.6)', alpha: a });
      const rows = ["Bras d'amarrage perdu.", 'Bouclier avant : 61 %.', 'Capteur latéral gauche : hors service.', 'Fuite mineure circuit de refroidissement B.'];
      rows.forEach((r, i) => text(g, r, 86, 122 + i * 24, { size: 13, color: i === 3 ? '#ff7040' : '#ffd0a0', alpha: a * ramp(86.4 + i * 0.6, 86.8 + i * 0.6, t) }));
    }
    // Écran de cockpit en grand : balayage actif
    if (t >= 96 && t < 104) {
      alert(g, 'BALAYAGE ACTIF EXTERNE', w / 2, 70, t, { size: 22 });
      // signature : une large, deux courtes, une pause
      const x0 = w / 2 - 220;
      g.save();
      g.strokeStyle = 'rgba(255,90,60,0.9)';
      g.lineWidth = 2;
      g.beginPath();
      const base = h - 90;
      g.moveTo(x0, base);
      const seq = [[0, 0], [20, 0], [20, -50], [90, -50], [90, 0], [120, 0], [120, -30], [140, -30], [140, 0], [165, 0], [165, -30], [185, -30], [185, 0], [440, 0]];
      const prog = (t - 97) / 4;
      for (const [dx, dy] of seq) {
        if (dx / 440 > prog) break;
        g.lineTo(x0 + dx, base + dy);
      }
      g.stroke();
      g.restore();
      text(g, 'IMPULSION LARGE · DEUX COURTES · PAUSE', w / 2, h - 60, { size: 11, align: 'center', color: '#ff9070', alpha: ramp(99, 100, t) });
    }
    if (t >= 108 && t < 114) {
      panel(g, w - 330, 60, 270, 92, { color: 'rgba(255,90,60,0.9)', fill: 'rgba(30,5,0,0.5)' });
      text(g, 'CONTACT — PROFIL PARTIEL', w - 316, 84, { size: 12, color: '#ff8060' });
      text(g, 'Proue large · deux nacelles', w - 316, 108, { size: 13, color: '#ffd0c0', mono: false });
      text(g, 'Aucune route commerciale', w - 316, 130, { size: 13, color: '#ffd0c0', mono: false });
    }
  },

  subs: [
    [10.4, 2, 'Balam', 'Évidemment.'],
    [23, 2.6, 'Balam', 'Tu aurais pu me prévenir avant.'],
    [26, 2.6, 'Balam', 'Oui, je sais. Tu l’as fait.'],
    [32.5, 1.6, 'Balam', 'Non.'],
    [41, 2, 'Balam', 'Je t’ai.'],
    [53, 3.2, 'Relais', 'Secteur trente-deux, quelqu’un travaille sur le vieux Kestrel ?'],
    [61.3, 3, 'Balam', 'Secteur trente-deux, ça arrive plus vite que prévu. Décroche.'],
    [64.4, 1.6, 'Relais', 'Qui parle ?'],
    [66, 3, 'Balam', 'Quelqu’un qui ne veut pas remplir un rapport de décès.'],
    [74.5, 1.6, 'Balam', 'Tu vas lâcher.'],
    [85, 1.6, 'Balam', 'Facile.'],
    [89.5, 2.4, 'Balam', '« Facile » était peut-être excessif.'],
    [97.5, 1.4, 'Balam', 'Relais ?'],
    [100.5, 2.2, '*', 'Pas ici. Pas à Sol.'],
    [109.5, 3.5, '*', 'Glide l’avait retrouvé.'],
  ],
  cues: [
    [0, 'drone', 0.5], [0, 'breath', 0.5], [10.4, 'thud', 0.5], [13, 'whoosh', 0.4], [17, 'tension', 0.4],
    [23.5, 'beep', 0.6], [25.6, 'beep', 0.6], [25.9, 'beep', 0.6], [30, 'spark', 0.7], [30.9, 'fizzle', 0.5],
    [38.5, 'crack', 0.6], [40, 'crack', 0.9], [40.4, 'thud', 0.6], [42, 'pulse', 0.5], [45, 'impact', 0.6],
    [53, 'radio', 0.3], [61, 'radio', 0.3], [62, 'ticks', 0.6], [64.5, 'impact', 0.9], [68.8, 'airlock', 0.7],
    [70, 'engine', 0.9], [71.5, 'metal', 0.8], [76, 'alarm', 0.5], [79.3, 'scrape', 0.9], [82, 'impact', 0.7],
    [83, 'impact', 0.5], [84, 'calm', 0.5], [86, 'beep', 0.3], [96, 'alarm', 0.6], [97, 'scan', 0.9],
    [99, 'scan', 0.9], [104.5, 'thud', 0.6], [107, 'hit', 0.9],
  ],
  music: { mood: 'tension' },
};

// Signature de balayage de Glide : une impulsion large, deux courtes, une pause.
function scanPulse(x) {
  if (x < 0) return 0;
  const k = x % 6;
  return pulse(k, 0, 1.2, 0.15) + pulse(k, 1.6, 1.9, 0.05) + pulse(k, 2.2, 2.5, 0.05);
}

function drawScreen(S, t) {
  const c = S.screenCanvas;
  const g = c.getContext('2d');
  g.fillStyle = '#05100a';
  g.fillRect(0, 0, 256, 160);
  const blank = (t > 97 && t < 97.4) || (t > 99.2 && t < 99.4);
  if (!blank) {
    g.strokeStyle = 'rgba(80,255,150,0.5)';
    for (let r = 20; r < 90; r += 22) {
      g.beginPath();
      g.arc(128, 80, r, 0, Math.PI * 2);
      g.stroke();
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = 'rgba(120,255,170,0.9)';
      g.fillRect(128 + Math.sin(i * 2.1) * (20 + i * 4), 80 + Math.cos(i * 1.7) * (15 + i * 3), 3, 3);
    }
    if (t > 101) {
      g.fillStyle = '#ff4030';
      const k = ramp(101, 106, t);
      g.beginPath();
      g.arc(128 + 70 - k * 25, 80 - 50 + k * 18, 4, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (t > 96) {
    g.fillStyle = Math.sin(t * 12) > 0 ? '#ff3020' : '#601008';
    g.font = 'bold 13px monospace';
    g.fillText('BALAYAGE ACTIF', 70, 152);
  }
  S.screenTex.needsUpdate = true;
  void noise1;
  void blip;
}

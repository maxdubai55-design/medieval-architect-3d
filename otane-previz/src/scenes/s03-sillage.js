import * as THREE from 'three';
import { starfield, nebulaSky, planet, glow, filaments, sparkCloud } from '../lib/fx.js';
import { recuperateur, glideShip, couronne, traffic, otaneFighter, cockpitInterior, pilotBust, hullMat, greebles, tug, shuttle } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp } from '../lib/util.js';
import { panel, text, alert } from '../lib/hud.js';

const lin = (x) => x;

export default {
  id: '03',
  title: 'Le Sillage',
  chapter: 'Chapitre 3',
  duration: 98,
  shots: [
    {
      t: [0, 8], plan: 'Plan large', optique: '18 mm', mouvement: 'Caméra emportée, roulis lent',
      lumiere: 'Vert du courant, aucune source fixe : la lumière vient des filaments qui défilent',
      intention: "La notion de « devant » cesse de fonctionner. Les deux appareils tournent sur eux-mêmes.",
      cam: (lt) => ({ pos: [10, 4, 22], look: [-4, 0, -10], fov: 62, roll: lt * 0.12, shake: 0.25, shakeFreq: 1.4 }),
    },
    {
      t: [8, 15], plan: 'Plan rapproché cockpit', optique: '35 mm', mouvement: 'Fixe, vibrations',
      lumiere: "Vert qui inonde l'habitacle par la verrière ; voyants rouges",
      intention: "Trois positions contradictoires. Il choisit la troisième : elle a l'honnêteté d'avouer son ignorance.",
      cam: () => ({ pos: [2000.55, 1.7, -0.75], look: [1999.9, 1.15, 0.7], fov: 50, shake: 0.03, shakeFreq: 5 }),
    },
    {
      t: [15, 22], plan: 'Plan moyen arrière', optique: '28 mm', mouvement: 'Solidaire du vaisseau',
      lumiere: 'Contre-jour vert',
      intention: "Ici, lutter les tue. Il pose les mains à plat sur ses cuisses. La plaque passe au-dessus de la verrière.",
      cam: () => ({ pos: [2.5, 3.5, 13], look: [0, 0.5, -10], fov: 50, shake: 0.06 }),
    },
    {
      t: [22, 32], plan: "Plan d'ensemble", optique: '24 mm', mouvement: 'Lent travelling latéral',
      lumiere: 'Une bande sombre entre les deux appareils, bordée de filaments qui tournent à contresens',
      intention: "Le courant les sépare. Deux secondes de poussée. Puis l'impulsion éteint tout.",
      cam: (lt) => ({ pos: [keys([[0, -30], [10, -18]], lt), 16, 42], look: [-25, 0, -10], fov: 48 }),
    },
    {
      t: [32, 42], plan: 'Plan large, deux appareils stables', optique: '35 mm', mouvement: 'Dérive accompagnée',
      lumiere: 'Nappes lumineuses qui passent entre eux',
      intention: "« Chez moi, on parle de marées qui n'appartiennent à aucun océan. »",
      cam: (lt) => ({ pos: [keys([[0, -12], [10, -6]], lt), 6, 26], look: [-14, 0, -6], fov: 42 }),
    },
    {
      t: [42, 52], plan: 'Plan large, bifurcation', optique: '21 mm', mouvement: 'Panoramique de la branche sombre à la claire',
      lumiere: 'Branche claire vert pâle / branche sombre violette',
      intention: "Un panneau happé vers la branche sombre se plie, s'allonge, se déchire. Ce n'est pas la masse : la prise.",
      cam: (lt) => ({ pos: [0, 10, 30], look: [keys([[0, 40], [5, 40], [10, -30]], lt), 0, -120], fov: 58, shake: 0.08 }),
    },
    {
      t: [52, 62], plan: 'Plan large, contre-plongée', optique: '24 mm', mouvement: 'Fixe sous les appareils',
      lumiere: "L'ombre de la section de coque passe sur les deux vaisseaux",
      intention: "Une section du transporteur les rattrape. Ils freinent et volent dans son ombre.",
      cam: () => ({ pos: [-6, -14, 18], look: [-6, 6, -20], fov: 56 }),
    },
    {
      t: [62, 68], plan: 'Plan subjectif', optique: '18 mm', mouvement: 'Accélération, aspiration',
      lumiere: 'Point blanc qui grossit, surexposition',
      intention: '« Si c’est Sol, je choisis une autre journée. »',
      cam: (lt, S) => { const b = S.balam.position; return { pos: [b.x, b.y + 1.1, b.z - 6.5], look: [b.x, b.y, -300], fov: keys([[0, 70], [6, 100]], lt), shake: 0.1 + lt * 0.05, shakeFreq: 6 }; },
    },
    {
      t: [68, 80], plan: "Plan d'ensemble, révélation", optique: '24 mm', mouvement: 'Grue lente, élévation',
      lumiere: "Étoile locale chaude en contre-jour, la ville couverte de feux ; Néréa bleue derrière",
      intention: "Trois anneaux immenses. Pas une station : une cité. Devant lui, quelqu'un construisait encore.",
      cam: (lt) => ({ pos: [keys([[0, 200], [12, 700]], lt), keys([[0, -260], [12, 260]], lt), keys([[0, 1700], [12, 1300]], lt)], look: [0, keys([[0, -260], [12, -200]], lt), -1200], fov: keys([[0, 52], [12, 58]], lt) }),
    },
    {
      t: [80, 88], plan: 'Plan moyen', optique: '35 mm', mouvement: 'Les chasseurs entrent dans le cadre',
      lumiere: 'Feux de navigation bleus, la ville en fond',
      intention: "Route imposée. Coupez propulsion. Une force invisible saisit le récupérateur.",
      cam: (lt) => ({ pos: [keys([[0, 26], [8, 18]], lt), 6, keys([[0, 1980], [8, 1900]], lt)], look: [0, 0, keys([[0, 1900], [8, 1800]], lt)], fov: 44 }),
    },
    {
      t: [88, 98], plan: 'Champ / contrechamp', optique: '50 mm', mouvement: 'Fixe',
      lumiere: "Lueur bleutée dans la verrière de Glide",
      intention: "Deux yeux sombres fixés sur lui. Pas sur la cité. Balam lève les mains, paumes ouvertes.",
      cam: (lt, S) => {
        const g = S.glide.position;
        if (lt < 5.5) return { pos: [g.x - 9, g.y + 1.5, g.z + 3], look: [g.x, g.y + 0.5, g.z + 0.4], fov: 30 };
        return { pos: [2000.75, 1.5, 1.5], look: [2000, 1.45, 0], fov: 36 };
      },
    },
  ],

  setup({ scene }) {
    const S = {};
    S.sky = nebulaSky({ seed: 5, hues: [[10, 60, 40], [30, 80, 60]], density: 0.4 });
    scene.add(S.sky);
    S.stars = starfield({ count: 6000, seed: 99 });
    scene.add(S.stars);
    scene.add(new THREE.HemisphereLight(0x1a3a2a, 0x081810, 0.6));
    S.green = new THREE.PointLight(0x3dff9a, 400, 120, 1.5);
    S.green.position.set(0, 20, -20);
    scene.add(S.green);

    // Le Sillage : plusieurs couches de filaments
    S.tube = filaments({ count: 260, length: 1400, radius: 90, color: 0x3dff9a, twist: 1.4 });
    S.tube.position.z = 600;
    scene.add(S.tube);
    S.core = filaments({ count: 80, length: 1400, radius: 25, color: 0xc8ffe0, twist: 2.4, seed: 4 });
    S.core.position.z = 600;
    scene.add(S.core);
    S.dark = filaments({ count: 90, length: 900, radius: 14, color: 0x6a3aff, twist: -2, seed: 8 });
    S.dark.position.set(-24, 0, 400);
    scene.add(S.dark);
    S.darkBand = new THREE.Mesh(new THREE.PlaneGeometry(26, 900), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }));
    S.darkBand.rotation.x = -Math.PI / 2;
    S.darkBand.position.set(-24, -2, -50);
    scene.add(S.darkBand);
    // Bifurcation : deux branches
    S.brA = filaments({ count: 140, length: 900, radius: 50, color: 0xa8ffd0, twist: 1, seed: 21 });
    S.brA.position.set(0, 0, -150);
    S.brA.rotation.y = -0.35;
    scene.add(S.brA);
    S.brB = filaments({ count: 140, length: 900, radius: 50, color: 0x5a2aa0, twist: -1.5, seed: 22 });
    S.brB.position.set(0, 0, -150);
    S.brB.rotation.y = 0.45;
    scene.add(S.brB);
    S.motes = sparkCloud({ count: 900, seed: 3, color: 0xb0ffd8, size: 0.5, spread: [200, 120, 300] });
    scene.add(S.motes);
    S.exit = glow(0xffffff, 40, 0);
    S.exit.position.set(0, 0, -400);
    scene.add(S.exit);

    S.balam = recuperateur();
    scene.add(S.balam);
    S.glide = glideShip();
    scene.add(S.glide);
    // silhouette de Glide dans sa verrière
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshStandardMaterial({ color: 0x223034, roughness: 0.3 }));
    head.scale.set(1.3, 0.8, 1.2);
    head.position.set(0, 0.75, 0.35);
    S.glide.add(head);
    for (const x of [0.17, -0.17]) {
      const e = glow(0x9fe8ff, 0.18, 0.9, 'hard');
      e.position.set(x, 0.8, 0.85);
      S.glide.add(e);
    }
    // fragments du transporteur qui voyagent avec eux
    S.beam = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 26), hullMat('dark'));
    scene.add(S.beam);
    S.plate = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 9), hullMat('worn'));
    scene.add(S.plate);
    S.panel = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 7), hullMat('rust'));
    scene.add(S.panel);
    S.tear = sparkCloud({ count: 200, seed: 9, color: 0xd0c0ff, size: 0.4, spread: [10, 6, 40] });
    scene.add(S.tear);
    S.section = new THREE.Group();
    const sec = new THREE.Mesh(new THREE.BoxGeometry(44, 30, 70), hullMat('worn', { color: 0x9a9690 }));
    S.section.add(sec);
    greebles(S.section, { count: 90, size: [2.5, 1, 5], area: [42, 1, 66], center: [0, 15.5, 0], seed: 5, mat: hullMat('dark') });
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 14), hullMat('dark'));
      b.position.set(-18 + i * 5, -14 + (i % 3) * 8, -40);
      S.section.add(b);
    }
    scene.add(S.section);

    // Système d'OTANE
    S.otane = new THREE.Group();
    S.otane.position.set(0, 0, 0);
    scene.add(S.otane);
    S.city = couronne();
    S.city.position.set(0, -200, -1200);
    S.otane.add(S.city);
    S.traffic = traffic({ count: 260, radius: 1000, seed: 3, scale: 3 });
    S.traffic.position.copy(S.city.position);
    S.otane.add(S.traffic);
    S.nerea = planet({ radius: 5200, seed: 12, kind: 'nerea', atmo: 0x9fd0ff });
    S.nerea.position.set(-6500, -3800, -19000);
    S.otane.add(S.nerea);
    S.star = new THREE.DirectionalLight(0xffe2c0, 2.6);
    S.star.position.set(3000, 1500, -4000);
    S.otane.add(S.star);
    S.starGlow = glow(0xffe8c8, 2500, 0.9, 'star');
    S.starGlow.position.set(9000, 4500, -14000);
    S.otane.add(S.starGlow);
    S.otane.add(new THREE.AmbientLight(0x30384a, 0.5));
    const fill = new THREE.DirectionalLight(0x8fa0c0, 1.2);
    fill.position.set(-200, 100, 3000);
    S.otane.add(fill);
    S.big = tug({ color: 0xc8ccd2 });
    S.big.scale.setScalar(30);
    S.big.position.set(500, 50, -600);
    S.otane.add(S.big);
    S.shuttle = shuttle();
    S.shuttle.scale.setScalar(2);
    S.otane.add(S.shuttle);
    S.fighters = [0, 1, 2].map(() => {
      const f = otaneFighter();
      S.otane.add(f);
      return f;
    });
    S.corridor = [];
    for (let i = 0; i < 14; i++) {
      const b = glow(0x60b0ff, 4, 0.9, 'hard');
      b.position.set(i % 2 ? 14 : -14, -4, 1880 - i * 60);
      S.otane.add(b);
      S.corridor.push(b);
    }
    S.otane.visible = false;

    // Cockpit de Balam (plateau)
    S.cock = cockpitInterior({ color: 0x3a3430, seed: 3 });
    S.cock.position.set(2000, 0, 0);
    scene.add(S.cock);
    S.pilot = pilotBust('balam');
    S.pilot.position.set(2000, -0.42, -0.12);
    scene.add(S.pilot);
    S.cockGreen = new THREE.PointLight(0x3dff9a, 4, 5, 2);
    S.cockGreen.position.set(2000, 2.2, 1.2);
    scene.add(S.cockGreen);
    S.cockRed = new THREE.PointLight(0xff3020, 1, 3, 2);
    S.cockRed.position.set(2000.3, 1.1, 0.8);
    scene.add(S.cockRed);
    return S;
  },

  update(t, S) {
    const inSillage = t < 68;
    S.otane.visible = !inSillage;
    for (const o of [S.tube, S.core, S.dark, S.darkBand, S.brA, S.brB, S.motes, S.exit, S.green, S.beam, S.plate, S.panel, S.section, S.tear]) o.visible = inSillage;
    S.stars.material.uniforms.time.value = t;
    S.stars.material.uniforms.stretch.value = inSillage ? 0.6 : 0;
    S.stars.material.uniforms.opacity.value = inSillage ? 0.4 : 1;
    S.sky.visible = !inSillage;
    S.cockGreen.color.set(inSillage ? 0x3dff9a : 0x9fc0ff);

    const speed = keys([[0, 2.5], [30, 1.2], [42, 1.5], [62, 2], [68, 4]], t);
    for (const f of [S.tube, S.core, S.brA, S.brB]) {
      f.material.uniforms.time.value = t * 1.2;
      f.material.uniforms.speed.value = speed;
    }
    S.dark.material.uniforms.time.value = -t;
    S.dark.material.uniforms.intensity.value = pulse(t, 22, 34, 1.5) * 1.3;
    S.darkBand.material.opacity = pulse(t, 22, 34, 1.5) * 0.7;
    S.tube.material.uniforms.intensity.value = 1 - 0.5 * pulse(t, 28.5, 29.6, 0.1);
    S.core.material.uniforms.intensity.value = 0.6 + ramp(60, 67, t) * 1.5;
    const branch = pulse(t, 40, 60, 3);
    S.brA.material.uniforms.intensity.value = branch;
    S.brB.material.uniforms.intensity.value = branch * 1.2;
    S.motes.material.uniforms.time.value = t;
    S.motes.material.uniforms.flow.value.set(0, 0, 40 * speed);
    S.exit.material.opacity = ramp(62, 67, t);
    S.exit.scale.setScalar(40 + ramp(62, 68, t) * 800);
    if (t > 66.5 && t < 68.6) S.flash = 1 - Math.abs(t - 67.8) / 1;
    S.flashColor = '#ffffff';

    // Balam et Glide dans le courant
    const spin = t < 18 ? t * 0.9 : 18 * 0.9 + Math.max(0, 1 - (t - 18) / 6) * (t - 18) * 0.5;
    const sep = keys([[0, 0], [22, 0], [30, 14], [34, 4], [40, 0]], t);
    S.balam.position.set(0 + Math.sin(t * 0.7) * 1.5, Math.sin(t * 0.5) * 1.2, 0);
    S.balam.lookAt(S.balam.position.x, S.balam.position.y, -100);
    S.balam.rotateZ(spin * (t < 24 ? 1 : 0.15));
    S.glide.position.set(-14 - sep, 2 + Math.sin(t * 0.6), -6);
    S.glide.lookAt(S.glide.position.x, S.glide.position.y, -100);
    S.glide.rotateZ(t < 10 ? t * 0.6 : 6 + Math.sin(t) * 0.1);
    S.balam.userData.setThrust(t < 12 ? 0.8 : pulse(t, 27, 29.2, 0.1));
    S.glide.userData.setThrust(t < 12 ? 0.6 : 0.05);
    S.balam.userData.blink(t);
    // Panne : tout s'éteint une seconde
    if (t > 29.2 && t < 30.4) S.fade = 0.97;
    // poutre et plaque qui voyagent avec eux
    S.beam.position.set(8, 9, keys([[0, -30], [20, 10], [40, 30]], t));
    S.beam.visible = inSillage && t < 40;
    S.plate.visible = inSillage && t < 23;
    S.beam.rotation.set(t * 0.1, t * 0.05, 0.2);
    S.plate.position.set(lerp(30, 0, smooth(inv(15, 19.5, t))), keys([[15, 1], [19, 1], [20, 4], [22, 9]], t), keys([[15, -80], [20, 2], [22, 30]], t));
    S.plate.rotation.set(t * 0.4, 0, t * 0.2);
    // panneau déchiré dans la branche sombre
    const tear = inv(45, 49, t);
    S.panel.position.set(lerp(10, 70, tear), 0, lerp(-40, -200, tear));
    S.panel.scale.set(1, 1, 1 + tear * 6);
    S.panel.visible = inSillage && t > 42 && t < 48.5;
    S.tear.position.set(70, 0, -200);
    S.tear.material.uniforms.amount.value = pulse(t, 48.3, 52, 0.3);
    S.tear.material.uniforms.time.value = t;
    S.tear.material.uniforms.spd.value = 4;
    // section de coque qui les rattrape
    S.section.position.set(-6, keys([[52, 22], [62, 24]], t), keys([[50, 160], [55, 40], [58, -20], [62, -120]], t));
    S.section.rotation.set(t * 0.05, t * 0.03, 0.1);
    S.section.visible = inSillage && t > 50;
    // Arrivée : les tracteurs alignent les deux appareils
    if (!inSillage) {
      const k = smooth(inv(80, 98, t));
      const z = lerp(1950, 1700, k);
      S.balam.position.set(4, 0, z);
      S.balam.lookAt(4, 0, z - 100);
      S.glide.position.set(-6, 0, z + 2);
      S.glide.lookAt(-6, 0, z - 100);
      S.balam.userData.setThrust(t < 83 ? 0.3 : 0);
      S.glide.userData.setThrust(t < 83 ? 0.3 : 0);
      S.city.userData.update(t);
      S.traffic.userData.update(t);
      S.shuttle.position.set(keys([[80, -60], [98, 80]], t), -14, 1840);
      S.shuttle.lookAt(200, -14, 1840);
      S.fighters.forEach((f, i) => {
        const a = smooth(inv(80, 84, t));
        f.position.set(lerp([60, -60, 0][i], [14, -20, -2][i], a), lerp(-40, [-6, -6, 8][i], a), lerp(1700, [1945, 1945, 1920][i], a));
        f.lookAt(f.position.x, f.position.y, 1600);
        f.userData.blink(t);
        f.userData.setThrust(0.6);
      });
      S.corridor.forEach((b, i) => (b.material.opacity = ramp(83 + i * 0.1, 83.3 + i * 0.1, t) * (0.6 + 0.4 * Math.sin(t * 3 - i))));
    }
    // cockpit : vert, voyants rouges, puis lumière de la ville
    S.cockRed.intensity = inSillage ? 1 + Math.sin(t * 10) : 0;
    S.pilot.userData.armL.rotation.set(t > 92 ? -2.6 : t > 15 && t < 22 ? 0.1 : -1, 0, t > 92 ? -0.4 : 0);
    S.pilot.userData.armR.rotation.set(t > 92 ? -2.6 : t > 15 && t < 22 ? 0.1 : -1, 0, t > 92 ? 0.4 : 0);
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    if (t >= 9 && t < 15) {
      panel(g, w - 360, 60, 300, 112, { color: 'rgba(255,120,80,0.9)', fill: 'rgba(20,4,0,0.55)' });
      text(g, 'NAVIGATION — POSITION', w - 344, 84, { size: 11, color: '#ffb090' });
      const rows = ['1  Orbite terrestre', '2  Intérieur de la Lune', '3  — — —'];
      rows.forEach((r, i) => text(g, r, w - 344, 110 + i * 22, { size: 13, color: i === 2 && t > 13 ? '#ffffff' : '#ffc0a0', weight: i === 2 && t > 13 ? 700 : 400 }));
      alert(g, 'TEMPÉRATURE CRITIQUE — CIRCUIT B', w / 2, h - 30, t, { size: 15 });
    }
    if (t >= 82 && t < 88) {
      const a = ramp(82.5, 83, t);
      panel(g, w / 2 - 170, 70, 340, 80, { color: 'rgba(120,180,255,0.95)', fill: 'rgba(0,10,30,0.6)', alpha: a });
      text(g, 'ROUTE IMPOSÉE', w / 2, 102, { size: 18, align: 'center', weight: 700, color: '#bfe0ff', alpha: a });
      text(g, 'COUPEZ PROPULSION', w / 2, 130, { size: 15, align: 'center', color: '#bfe0ff', alpha: a * ramp(83.5, 84, t) });
    }
  },

  subs: [
    [1, 3.4, 'Balam', 'Glide, si tu m’entends, c’est le moment idéal pour arrêter de vouloir me tuer.'],
    [4.6, 2, 'Glide', 'Je… ne veux… pas… te tuer.'],
    [6.7, 1.3, 'Balam', 'Formidable. On progresse.'],
    [9, 1.5, 'Glide', 'Coupe tes moteurs.'],
    [10.6, 1.7, 'Balam', 'Je perds le refroidissement.'],
    [12.4, 2.3, 'Glide', 'Tes propulseurs te font traverser le courant.'],
    [17, 2.5, '*', 'Ici, lutter les tuait.'],
    [22.5, 1.8, 'Glide', 'Ne traverse pas ça.'],
    [24.5, 1.6, 'Balam', 'J’ai besoin d’une poussée.'],
    [26.2, 1.6, 'Glide', 'Deux secondes. Pas plus.'],
    [30.6, 1.2, 'Balam', 'Glide ?'],
    [32, 1, 'Glide', 'Ici.'],
    [34, 3.4, 'Glide', 'Chez moi, on parle de marées qui n’appartiennent à aucun océan.'],
    [37.6, 4.2, 'Glide', 'Celui qui lutte contre elles choisit seulement la manière dont il se brise.'],
    [49, 2.3, 'Balam', 'Ce n’est pas la masse.'],
    [51.4, 2.5, 'Balam', 'La prise. Le courant accroche les surfaces.'],
    [58.5, 2.4, 'Balam', 'Je suppose que tu vas prétendre que c’était ton idée.'],
    [61, 0.8, 'Glide', 'Non.'],
    [62, 2.8, 'Glide', 'Elle était mauvaise. Elle a seulement fonctionné.'],
    [65, 2.6, 'Balam', 'Si c’est Sol, je choisis une autre journée.'],
    [74, 4, '*', 'Devant lui, quelqu’un construisait encore.'],
    [84.5, 2.4, 'Balam', 'Je suppose qu’ils viennent nous souhaiter la bienvenue.'],
    [87.2, 1.2, 'Balam', 'Tracteur.'],
  ],
  cues: [
    [0, 'roar', 0.8], [0, 'alarm', 0.4], [8, 'alarm', 0.5], [15, 'whoosh', 0.6], [19.5, 'whoosh', 0.7],
    [27, 'engine', 0.6], [29.2, 'emp', 1], [30.4, 'silence', 0.6], [33, 'drone', 0.5], [42, 'tension', 0.6],
    [47, 'tear', 0.8], [53, 'rumble', 0.9], [62, 'rise', 1], [67.8, 'boom', 0.8], [68.5, 'silence', 0.4],
    [70, 'swell', 1], [80, 'flyby', 0.7], [84, 'tractor', 0.7], [96, 'door', 0.8],
  ],
  music: { mood: 'merveille' },
};

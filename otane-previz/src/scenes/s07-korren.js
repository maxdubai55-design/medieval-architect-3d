import * as THREE from 'three';
import { starfield, nebulaSky, planet, glow, sparkCloud, bolt, shootBolt } from '../lib/fx.js';
import { alyde, human, hullMat, glassMat, box, cyl, lightMat, cockpitInterior, pilotBust, recuperateur, debrisField, greebles } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp } from '../lib/util.js';
import { panel, text, alert, blip } from '../lib/hud.js';

const PAL = 5000; // décor du souvenir de Pallas
const ROOM = -3000; // chambre de transit de Glide

export default {
  id: '07',
  title: 'Korren',
  chapter: 'Chapitre 14',
  duration: 114,
  shots: [
    {
      t: [0, 10], plan: "Plan d'ensemble, silhouette", optique: '35 mm', mouvement: 'Fixe',
      lumiere: 'Néréa bleue et blanche plein cadre ; Glide en ombre chinoise',
      intention: "Trois coups de phalange pour le silence, deux pour une erreur de route, un sur les doigts. Glide seul face à la lune.",
      cam: (lt) => ({ pos: [keys([[0, -6.5], [10, -5.5]], lt), 1.5, 4.3], look: [1, 1.8, -10], fov: 44 }),
    },
    {
      t: [10, 18], plan: 'Plan rapproché', optique: '85 mm', mouvement: 'Fixe',
      lumiere: "Lueur de l'écran du communicateur sur la main palmée",
      intention: "Le message de sa sœur attend depuis deux semaines. Il ne l'ouvre pas. Une voix derrière lui.",
      cam: () => ({ pos: [0.9, 1.7, 0.9], look: [0.1, 1.3, -1.0], fov: 32 }),
    },
    {
      t: [18, 30], plan: 'Plan à deux, profils', optique: '50 mm', mouvement: 'Lent travelling latéral',
      lumiere: 'Contre-jour lunaire, visages en ombre, contours bleus',
      intention: "« Tu as volé le Livre pour lui. » « Oui. » Le mot reste simple.",
      cam: (lt) => ({ pos: [keys([[0, 1.0], [12, 1.6]], lt), 1.7, 4.6], look: [1.0, 1.6, -1.6], fov: 40 }),
    },
    {
      t: [30, 42], plan: 'Gros plan Glide', optique: '85 mm', mouvement: 'Travelling avant imperceptible',
      lumiere: "Rim bleu de Néréa, l'œil noir accroche un reflet",
      intention: "« Il oubliait les anniversaires et se souvenait de la position d'une étoile observée vingt ans plus tôt. »",
      cam: (lt) => ({ pos: [keys([[0, -1.5], [12, -1.1]], lt), 1.95, keys([[0, 1.2], [12, 0.8]], lt)], look: [0.2, 1.85, -1.1], fov: 30 }),
    },
    {
      t: [42, 56], plan: 'Souvenir — plan large', optique: '24 mm', mouvement: 'Caméra portée',
      lumiere: 'Image désaturée, néons du relais minier, champ de confinement instable',
      intention: "Pallas. Korren entre avec une barre de verrouillage. Le tir vient de la passerelle supérieure. Il passe au travers du champ.",
      cam: (lt) => (lt < 8
        ? { pos: [PAL + 9, 4, 10], look: [PAL - 1, 1.5, 0], fov: 46, shake: 0.08 }
        : { pos: [PAL + 6, 3, -4], look: [PAL + lerp(0, -2, (lt - 8) / 6), lerp(1.5, -1, (lt - 8) / 6), lerp(-6, -24, (lt - 8) / 6)], fov: 42, shake: 0.05 }),
    },
    {
      t: [56, 70], plan: 'Souvenir — cockpit', optique: '35 mm', mouvement: 'Fixe, puis insert sur les mains',
      lumiere: "Balise rouge de la combinaison de Korren en haut à gauche de l'écran ; fenêtre de saut au centre",
      intention: "Deux degrés, peut-être trois. La balise revient vers le centre. Le remorqueur tire. Il corrige dans l'autre sens. Il arme. Il engage.",
      cam: (lt) => (lt < 9
        ? { pos: [2000.55, 1.72, -0.85], look: [1999.95, 1.15, 0.7], fov: 46 }
        : { pos: [2000.35, 1.25, 0.05], look: [2000.0, 0.85, 0.45], fov: 40 }),
    },
    {
      t: [70, 80], plan: 'Plan moyen', optique: '35 mm', mouvement: 'Caméra portée, choc',
      lumiere: 'Retour à la galerie ; Néréa derrière la vitre',
      intention: "« Mais tu as choisi plusieurs fois. » « Oui. » Glide frappe. Balam heurte la vitre. Il ne lève pas les mains.",
      cam: (lt) => ({ pos: [3.4, 1.7, 2.8], look: [0.8, 1.5, -1.2], fov: 44, shake: lt > 4.5 && lt < 5.5 ? 0.3 : 0.04, shakeFreq: 4 }),
    },
    {
      t: [80, 92], plan: 'Champ / contrechamp serré', optique: '85 mm', mouvement: 'Fixe',
      lumiere: 'Visages à contre-jour, un seul filet de lumière froide',
      intention: "« Choisis-en une. » « La dernière. » La colère a perdu sa forme simple.",
      cam: (lt) => (lt < 6 ? { pos: [-0.2, 1.75, 0.6], look: [1.6, 1.65, -1.6], fov: 30 } : { pos: [2.2, 1.8, 0.4], look: [0.0, 1.85, -1.3], fov: 30 }),
    },
    {
      t: [92, 102], plan: "Plan d'ensemble", optique: '28 mm', mouvement: 'Fixe, Glide sort du cadre',
      lumiere: 'Néréa, une silhouette seule contre la vitre',
      intention: "« Je ne volerai plus avec toi. » « D'accord. » Cette fois Glide accepte le mot.",
      cam: () => ({ pos: [-7, 1.6, 4.3], look: [2, 1.6, -4], fov: 46 }),
    },
    {
      t: [102, 114], plan: 'Plan rapproché, chambre', optique: '50 mm', mouvement: 'Fixe',
      lumiere: "Pénombre, humidité en suspension, l'onde du message en kalec",
      intention: "« Reviens quand tu sauras ce que tu veux rapporter avec toi. » Il désactive l'icône de L'Indocile.",
      cam: (lt) => ({ pos: [ROOM + 1.9, 1.5, 1.6], look: [ROOM - 0.3, 1.6, -2.2], fov: 44 }),
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 70, hues: [[20, 40, 80], [30, 30, 60]], density: 0.4 }));
    S.stars = starfield({ count: 4000, seed: 70 });
    scene.add(S.stars);
    // Galerie
    S.nerea = planet({ radius: 1700, seed: 12, kind: 'nerea', atmo: 0xbfe0ff });
    S.nerea.position.set(400, 150, -2600);
    scene.add(S.nerea);
    S.moonLight = new THREE.DirectionalLight(0xbcd8ff, 2.4);
    S.moonLight.position.set(200, 80, -600);
    scene.add(S.moonLight);
    S.sunNerea = new THREE.DirectionalLight(0xfff0e0, 2.5);
    S.sunNerea.position.set(2000, 600, -1000);
    scene.add(S.sunNerea);
    scene.add(new THREE.HemisphereLight(0x223040, 0x080808, 0.35));
    const floor = new THREE.Mesh(box(40, 0.2, 8), hullMat('dark', { color: 0x40464c }));
    floor.position.set(0, -0.1, 1);
    scene.add(floor);
    const ceil = new THREE.Mesh(box(40, 0.2, 8), hullMat('dark', { color: 0x30363a }));
    ceil.position.set(0, 4.2, 1);
    scene.add(ceil);
    const back = new THREE.Mesh(box(40, 4.4, 0.2), hullMat('clean', { color: 0x50565c }));
    back.position.set(0, 2.1, 5);
    scene.add(back);
    S.glass = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), glassMat(0xcfe8ff, 0.06));
    S.glass.position.set(0, 2.1, -2);
    scene.add(S.glass);
    for (let i = -10; i <= 10; i++) {
      const m = new THREE.Mesh(box(0.15, 4.4, 0.25), hullMat('dark'));
      m.position.set(i * 2, 2.1, -2);
      scene.add(m);
    }
    const rail = new THREE.Mesh(cyl(0.04, 0.04, 40, 8), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.3 }));
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, 1.05, -1.7);
    scene.add(rail);
    for (let i = 0; i < 8; i++) {
      const l = new THREE.Mesh(box(1.4, 0.05, 0.2), lightMat(0xffd8a0, 1.2));
      l.position.set(-14 + i * 4, 0.02, 4.6);
      scene.add(l);
    }
    // Structures de La Couronne qui glissent devant le disque
    S.struct = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(box(60 + i * 10, 6, 12), hullMat('clean', { color: 0x8a9098 }));
      b.position.set(-200 + i * 70, -30 + (i % 3) * 25, -260 - i * 20);
      S.struct.add(b);
      greebles(S.struct, { count: 20, size: [4, 3, 3], area: [60, 1, 10], center: [b.position.x, b.position.y + 3.2, b.position.z], seed: i + 3, mat: hullMat('dark') });
    }
    scene.add(S.struct);

    S.glide = alyde();
    S.balam = human({ body: 0x2e2a24 });
    scene.add(S.glide, S.balam);
    S.comm = glow(0x60c0ff, 0.25, 0.9, 'hard');
    scene.add(S.comm);

    // Souvenir : relais minier de Pallas
    S.pal = new THREE.Group();
    S.pal.position.set(PAL, 0, 0);
    scene.add(S.pal);
    const deck = new THREE.Mesh(box(16, 0.4, 16), hullMat('worn', { color: 0x8a8070 }));
    deck.position.set(0, -0.2, 0);
    S.pal.add(deck);
    const upper = new THREE.Mesh(box(16, 0.3, 2), hullMat('dark'));
    upper.position.set(0, 5, 5);
    S.pal.add(upper);
    for (const x of [-8, 8]) {
      const w = new THREE.Mesh(box(0.4, 6, 16), hullMat('worn', { color: 0x6a6258 }));
      w.position.set(x, 3, 0);
      S.pal.add(w);
    }
    for (let i = 0; i < 4; i++) {
      const n = new THREE.Mesh(box(0.2, 0.08, 3), lightMat(0xcfe0ff, 2));
      n.position.set(-6 + i * 4, 5.8, 0);
      S.pal.add(n);
      const pl = new THREE.PointLight(0xcfe0ff, 12, 10, 2);
      pl.position.set(-6 + i * 4, 5.4, 0);
      S.pal.add(pl);
    }
    S.field = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform float time; varying vec2 vUv;
        void main(){ float s = sin(vUv.y*80.0 + time*8.0)*0.5+0.5; float n = fract(sin(dot(floor(vUv*vec2(40.0,20.0))+floor(time*12.0), vec2(12.9,78.2)))*43758.5);
          float a = 0.08 + 0.12*s + (n>0.93?0.3:0.0); gl_FragColor = vec4(0.4,0.7,1.0,a); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    }));
    S.field.position.set(0, 3, -8);
    S.pal.add(S.field);
    S.ore = debrisField({ count: 120, center: [PAL, 0, -60], size: [140, 60, 90], scale: [1.5, 8], seed: 81, palette: ['rust', 'dark', 'worn'] });
    scene.add(S.ore);
    S.korren = alyde({ skin: 0x5a6668, suit: 0x3a3428 });
    scene.add(S.korren);
    S.bar = new THREE.Mesh(cyl(0.04, 0.04, 1.4, 6), new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.9 }));
    S.korren.userData.armR.add(S.bar);
    S.bar.position.set(0, -0.7, 0.4);
    S.bar.rotation.x = Math.PI / 2;
    S.guards = [human({ body: 0x1a1a1a }), human({ body: 0x1a1a1a }), human({ body: 0x222018 })];
    S.guards.forEach((g) => scene.add(g));
    S.thief = human({ body: 0x3a3226 });
    scene.add(S.thief);
    S.coffret = new THREE.Mesh(box(0.7, 0.2, 0.45), new THREE.MeshStandardMaterial({ color: 0x2b2420, metalness: 0.5 }));
    scene.add(S.coffret);
    S.shotK = bolt(0xffe0a0, 2, 0.06);
    scene.add(S.shotK);
    S.korrenBeacon = glow(0xff3020, 1.5, 0, 'star');
    scene.add(S.korrenBeacon);

    // Souvenir : cockpit du récupérateur
    S.cock = cockpitInterior({ color: 0x3a3430, seed: 3 });
    S.cock.position.set(2000, 0, 0);
    scene.add(S.cock);
    S.pilot = pilotBust('balam');
    S.pilot.position.set(2000, -0.42, -0.12);
    scene.add(S.pilot);
    S.cockL = new THREE.PointLight(0xffa070, 2.5, 4, 2);
    S.cockL.position.set(2000.2, 1.3, 0.9);
    scene.add(S.cockL);
    S.cockR = new THREE.PointLight(0xff2010, 0, 4, 2);
    S.cockR.position.set(1999.6, 1.6, 0.6);
    scene.add(S.cockR);

    // Chambre de transit
    S.room = new THREE.Group();
    S.room.position.set(ROOM, 0, 0);
    scene.add(S.room);
    const rbox = new THREE.Mesh(box(6, 3, 6), new THREE.MeshStandardMaterial({ color: 0x5a6268, side: THREE.BackSide, roughness: 0.9 }));
    rbox.position.y = 1.5;
    S.room.add(rbox);
    const bed = new THREE.Mesh(box(1.2, 0.4, 2.2), new THREE.MeshStandardMaterial({ color: 0x3a4248 }));
    bed.position.set(-1.6, 0.2, 0);
    S.room.add(bed);
    S.mapCanvas = document.createElement('canvas');
    S.mapCanvas.width = 512;
    S.mapCanvas.height = 256;
    S.mapTex = new THREE.CanvasTexture(S.mapCanvas);
    S.mapTex.colorSpace = THREE.SRGBColorSpace;
    const map = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: S.mapTex, toneMapped: false }));
    map.position.set(0, 1.7, -2.95);
    S.room.add(map);
    S.roomLight = new THREE.PointLight(0x7fb8ff, 3, 6, 2);
    S.roomLight.position.set(0, 1.8, -2);
    S.room.add(S.roomLight);
    S.mist = sparkCloud({ count: 300, seed: 4, color: 0xa0c8ff, size: 0.03, spread: [5, 3, 5] });
    S.mist.position.set(ROOM, 1.5, 0);
    scene.add(S.mist);
    S.glide2 = alyde();
    S.glide2.position.set(ROOM - 0.2, 0, -1.2);
    S.glide2.rotation.y = 0;
    scene.add(S.glide2);
    return S;
  },

  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.struct.position.x = t * 1.2;
    const memory = t >= 42 && t < 70;
    S.nerea.visible = !memory;
    S.struct.visible = !memory;
    S.nerea.rotation.y = t * 0.002;
    // Galerie : positions
    const g = S.glide, b = S.balam;
    g.position.set(0, 0, -1.2);
    g.rotation.set(0, Math.PI, 0);
    const hit = smooth(inv(74.6, 75.2, t));
    const bx = keys([[10, 8], [18, 2.2], [30, 1.6], [74.6, 1.4], [75.2, 1.2], [92, 1.2]], t);
    b.position.set(bx, 0, keys([[0, 0.4], [74.6, -0.8], [75.2, -1.6], [92, -1.6]], t));
    b.rotation.set(0, t < 18 ? -Math.PI / 2 : t < 74.6 ? Math.PI + 0.9 : Math.PI + 0.4, t > 75.2 && t < 92 ? 0.08 : 0);
    b.visible = t >= 12 && t < 42 || (t >= 70 && t < 102);
    if (t >= 30 && t < 42) g.rotation.y = Math.PI + 0.5;
    if (t >= 70 && t < 92) g.rotation.y = Math.PI - 1.0;
    // le coup
    g.userData.armR.rotation.set(t > 74 && t < 75.4 ? -1.6 : t > 78 && t < 86 ? -1.4 : -0.1, 0, t > 74 && t < 75.4 ? -0.8 + hit * 1.2 : 0);
    if (t >= 92) g.position.x = keys([[92, 0], [96, -4], [102, -14]], t);
    if (t >= 92 && t < 96) g.rotation.y = Math.PI / 2;
    if (t >= 96) g.visible = t < 101;
    // communicateur
    S.comm.position.set(0.05, 1.25, -0.85);
    S.comm.material.opacity = t > 10 && t < 17 ? 0.9 : 0;

    // Souvenir de Pallas
    S.field.material.uniforms.time.value = t;
    S.ore.userData.update(t * 0.3);
    const K = S.korren;
    const fall = inv(50.5, 56, t);
    K.position.set(PAL + keys([[42, 6], [45, 2], [48, 0], [50.5, -0.5]], t), 0, keys([[42, 4], [45, 1], [50.5, -6], [56, -26]], t));
    if (t > 50.5) K.position.y = -fall * 3;
    K.rotation.set(t > 50.5 ? fall * 2 : 0, t > 50.5 ? fall * 1.2 : Math.PI + 0.3, 0);
    K.userData.armR.rotation.set(t > 44 && t < 46 ? -2 : t > 46.5 && t < 47.5 ? -1.2 : -0.6, 0, 0);
    const gd = S.guards;
    gd[0].position.set(PAL + 2.5, 0, -2); gd[0].rotation.set(t > 45 ? -1.4 : 0, 0.8, 0);
    if (t > 45) gd[0].position.y = 0.2;
    gd[1].position.set(PAL - 1.5, 0, -3); gd[1].rotation.set(0, 0.2, t > 47.5 ? 0.6 : 0);
    gd[2].position.set(PAL - 3, 5.15, 5); gd[2].rotation.set(0, Math.PI - 0.4, 0);
    gd[2].userData.armR.rotation.set(-1.5, 0, 0);
    S.thief.position.set(PAL - 6, 0, -4);
    S.thief.rotation.set(0, 0.9, 0);
    S.thief.userData.armR.rotation.set(-1.2, 0, 0);
    S.coffret.position.set(PAL - 5.6, 0.9, -3.6);
    const kp = K.position;
    shootBolt(S.shotK, [PAL - 3, 6.4, 5], [kp.x + 0.3, kp.y + 1.6, kp.z], inv(49.6, 50.3, t));
    if (t > 50.2 && t < 50.4) S.flash = 0.2;
    S.flashColor = '#ffffff';
    S.korrenBeacon.position.set(kp.x, kp.y + 1.5, kp.z);
    S.korrenBeacon.material.opacity = t > 51 ? (Math.sin(t * 5) > 0.6 ? 1 : 0.15) : 0;
    for (const o of [K, ...gd, S.thief, S.coffret]) o.visible = t >= 42 && t < 56;

    // Souvenir : cockpit (balise de Korren, fenêtre de saut)
    S.cockR.intensity = t > 63 && t < 66 ? 3 * (0.5 + 0.5 * Math.sin(t * 14)) : 0;
    S.pilot.userData.armR.rotation.set(-1.0, 0, 0.2);
    S.pilot.userData.armL.rotation.set(t > 64 ? -1.25 : -1.0, 0, -0.2);

    // Chambre
    S.mist.material.uniforms.time.value = t;
    S.mist.material.uniforms.spd.value = 0.1;
    S.glide2.userData.head.rotation.x = 0.25;
    drawRoomMap(S, t);
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    // Gradation du souvenir : désaturé, froid
    if (t >= 42 && t < 70) {
      g.save();
      g.globalCompositeOperation = 'saturation';
      g.fillStyle = 'rgba(128,128,128,0.75)';
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = 'rgba(190,205,225,1)';
      g.fillRect(0, 0, w, h);
      g.restore();
      text(g, 'PALLAS — QUELQUES ANNÉES PLUS TÔT', w - 40, 40, { size: 11, align: 'right', color: 'rgba(220,230,240,0.8)', spacing: 2, alpha: ramp(42.5, 43.5, t) * (1 - ramp(55, 56, t)) });
    }
    if (t >= 10 && t < 17) {
      panel(g, w / 2 + 60, h / 2 - 40, 260, 70, { color: 'rgba(120,200,255,0.9)', fill: 'rgba(0,10,25,0.6)', alpha: ramp(10.5, 11, t) * (1 - ramp(16, 16.5, t)) });
      text(g, 'MESSAGE NON LU — KALEC', w / 2 + 76, h / 2 - 12, { size: 12, color: '#bfe0ff', alpha: ramp(10.5, 11, t) * (1 - ramp(16, 16.5, t)) });
      text(g, 'reçu il y a 13 jours', w / 2 + 76, h / 2 + 12, { size: 12, color: '#8fb0d0', alpha: ramp(10.5, 11, t) * (1 - ramp(16, 16.5, t)) });
    }
    if (t >= 56 && t < 70) {
      // Écran du récupérateur : balise de Korren en haut à gauche, fenêtre de saut au centre
      const turn = keys([[60, 0], [62, 1], [63.4, 1], [64.6, -0.2], [70, -0.3]], t);
      const bx = 90 + turn * 120, by = 80 + turn * 50;
      const beat = ((t - 56) % 2.2) < 0.25 ? 1 : 0.25; // une impulsion toutes les « huit secondes », accélérée
      blip(g, bx, by, { color: '#ff4030', size: 7 * (0.7 + 0.5 * beat), label: 'KORREN · BALISE COMBINAISON', alpha: 0.9 });
      g.save();
      g.strokeStyle = 'rgba(120,255,180,0.9)';
      g.lineWidth = 2;
      g.strokeRect(w / 2 - 70 + turn * 60, h / 2 - 45, 140, 90);
      g.restore();
      text(g, 'FENÊTRE DE SAUT', w / 2 + turn * 60, h / 2 + 66, { size: 12, align: 'center', color: '#9fffd0' });
      if (t > 63 && t < 66) alert(g, 'VERROUILLAGE — REMORQUEUR ARMÉ', w / 2, h - 40, t, { size: 15, blink: 4 });
      if (t > 65.5) text(g, t > 67.5 ? 'SAUT ENGAGÉ' : 'SAUT ARMÉ', w - 60, 60, { size: 18, align: 'right', color: t > 67.5 ? '#ffffff' : '#ffd060', weight: 700 });
      if (t > 66) text(g, 'DISTANCE BALISE : 4,6 km', 60, h - 40, { size: 13, color: '#ffb0a0' });
    }
    if (t >= 104 && t < 112) {
      // onde du message
      g.save();
      g.strokeStyle = 'rgba(140,200,255,0.8)';
      g.lineWidth = 2;
      g.beginPath();
      for (let x = 0; x < 360; x += 3) {
        const a = Math.sin(x * 0.15 + t * 9) * Math.sin(x * 0.02 + t) * 18 * (0.4 + 0.6 * Math.abs(Math.sin(t * 2.3 + x * 0.01)));
        x ? g.lineTo(60 + x, h - 70 + a) : g.moveTo(60, h - 70 + a);
      }
      g.stroke();
      g.restore();
      text(g, 'KALEC — SANS TRADUCTION AUTOMATIQUE', 60, h - 30, { size: 11, color: '#8fb0d0' });
    }
  },

  subs: [
    [1, 4, '*', 'Trois coups de phalange pour demander le silence. Deux pour une erreur de route.'],
    [5.2, 3.6, '*', 'Un seul sur les doigts, quand un élève prétendait avoir compris avant d’avoir vérifié.'],
    [13.5, 2, 'Balam', 'Tu choisis des endroits difficiles à fuir.'],
    [15.8, 1.4, 'Glide', 'Je ne fuis pas.'],
    [18.5, 2.6, 'Balam', 'Je savais que le type qui l’avait commandé avait des gens capables d’ouvrir des archives.'],
    [21.4, 1.8, 'Glide', 'Tu as volé le Livre pour lui.'],
    [23.4, 1, 'Balam', 'Oui.'],
    [25, 2, 'Glide', 'Tu savais que c’était à mon peuple.'],
    [27.2, 1.4, 'Glide', 'Korren était avec moi.'],
    [28.8, 1, 'Balam', 'Je sais.'],
    [30.2, 1.3, 'Glide', 'Non.'],
    [31.8, 3.4, 'Glide', 'Il avait passé trente-deux ans à recopier des routes que d’autres laissaient disparaître.'],
    [35.4, 3.2, 'Glide', 'Il oubliait les anniversaires et se souvenait de la position d’une étoile observée vingt ans plus tôt.'],
    [38.8, 2.9, 'Glide', 'Il m’a appris à lire le Livre avant de m’apprendre à tirer.'],
    [43, 3, 'Balam', 'Il est entré dans le relais avec une barre de verrouillage.'],
    [46.2, 2.6, 'Balam', 'Il a frappé le premier garde au genou. Le deuxième a tiré dans le plafond.'],
    [49, 1.6, 'Glide', 'Qui a tiré ?'],
    [52, 2.2, 'Glide', 'Il n’est pas mort du tir.'],
    [54.4, 1.4, 'Balam', 'Non.'],
    [56.5, 2.6, 'Balam', 'Sa balise de combinaison fonctionnait. Je la voyais sur mon écran.'],
    [59.4, 1.8, 'Glide', 'Toutes les combien ?'],
    [61.3, 2.6, 'Balam', 'Toutes les huit secondes au début. Après, plus lentement.'],
    [64, 2.8, 'Balam', 'Droite sur le manche. Gauche sur l’armement du saut.'],
    [67, 2.8, 'Balam', 'J’ai commencé à virer. Deux degrés, peut-être trois.'],
    [70.4, 1.8, 'Glide', 'Donc ce n’était pas un réflexe.'],
    [72.3, 0.9, 'Balam', 'Non.'],
    [73.3, 1.3, 'Glide', 'Mais tu as choisi plusieurs fois.'],
    [74.7, 0.8, 'Balam', 'Oui.'],
    [80.4, 1.2, 'Glide', 'Pourquoi ?'],
    [81.8, 4.4, 'Balam', 'Parce que le courtier me devait assez pour remettre mon vaisseau en état. Parce que je pensais que quelqu’un le trouverait.'],
    [86.3, 1.4, 'Balam', 'Parce que j’avais peur.'],
    [87.8, 1.4, 'Glide', 'Choisis-en une.'],
    [89.3, 1.2, 'Balam', 'La dernière.'],
    [90.6, 1.4, 'Glide', 'Je ne te pardonne pas.'],
    [92.5, 2.2, 'Glide', 'Je ne volerai plus avec toi.'],
    [95, 1.4, 'Balam', 'D’accord.'],
    [97, 3.6, '*', 'Cette fois Glide accepta le mot.'],
    [104.5, 3, '*', 'Elle parla des pluies de la saison haute. Elle ne prononça pas le nom de Korren.'],
    [108.2, 4, '*', '« Reviens quand tu sauras ce que tu veux rapporter avec toi. »'],
  ],
  cues: [
    [0, 'knock3', 0.6], [2, 'drone', 0.4], [4.5, 'knock2', 0.5], [6.5, 'knock1', 0.6], [10.5, 'beep', 0.2], [18, 'tension', 0.4],
    [42, 'memory', 0.8], [44.2, 'hit', 0.6], [46.5, 'laser', 0.4], [49.6, 'laser', 0.8], [50.5, 'field', 0.8], [52, 'breath', 0.5],
    [56, 'beacon8', 0.6], [63, 'lock', 0.8], [65.5, 'arm', 0.7], [67.5, 'jump', 0.9], [70, 'silence', 0.6], [74.8, 'punch', 1],
    [75.1, 'glass', 0.7], [92, 'drone', 0.5], [102, 'room', 0.4], [104, 'voice', 0.7],
  ],
  music: { mood: 'deuil' },
};

function drawRoomMap(S, t) {
  const g = S.mapCanvas.getContext('2d');
  g.fillStyle = '#06101a';
  g.fillRect(0, 0, 512, 256);
  g.strokeStyle = 'rgba(120,180,255,0.6)';
  for (let i = 0; i < 6; i++) g.strokeRect(20 + i * 80, 40, 70, 60);
  g.fillStyle = 'rgba(120,180,255,0.8)';
  g.font = '14px monospace';
  g.fillText('LA COURONNE — HANGAR 4', 20, 28);
  const on = t < 111.5 ? 1 : 0;
  if (on) {
    g.fillStyle = '#ffd060';
    g.fillRect(260, 60, 14, 14);
    g.fillText("L'INDOCILE", 280, 72);
  }
  S.mapTex.needsUpdate = true;
}

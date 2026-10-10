import * as THREE from 'three';
import { glow, sparkCloud } from '../lib/fx.js';
import { heart, human, alyde, hullMat, glassMat, box, cyl, greebles, lightMat, balam, fara } from '../lib/models.js';
import { keys, ramp, pulse, inv, smooth, lerp, rng } from '../lib/util.js';
import { panel, text } from '../lib/hud.js';

const HEART_Y = 22;

export default {
  id: '06',
  title: 'La chambre du Cœur',
  chapter: 'Chapitre 11',
  duration: 98,
  shots: [
    {
      t: [0, 8], plan: 'Plan moyen, travelling arrière', optique: '35 mm', mouvement: 'Recul devant le chariot',
      lumiere: 'Néons froids du couloir, reflets dans le caisson transparent',
      intention: "Le Livre entre avant Glide. Il ne voit que l'usure sur le bord de la troisième plaque.",
      cam: (lt) => ({ pos: [1.6, 1.6, keys([[0, 76], [8, 70]], lt)], look: [0, 1.1, keys([[0, 82], [8, 76]], lt)], fov: 38 }),
    },
    {
      t: [8, 14], plan: 'Plan de groupe', optique: '28 mm', mouvement: 'Fixe',
      lumiere: 'Avertissement ambre au-dessus du sas : CHAMP VARIABLE',
      intention: 'Kovar, Fara, la scientifique. « Vous avez prévu un bracelet pour empêcher les phrases ? »',
      cam: () => ({ pos: [5.5, 2.2, 63], look: [0, 1.5, 70], fov: 44 }),
    },
    {
      t: [14, 28], plan: "Plan d'ensemble, révélation", optique: '18 mm', mouvement: 'Travelling avant lent depuis le sas, élévation',
      lumiere: 'Une seule source : le Cœur. Nappes vertes, anneaux qui accrochent la lumière',
      intention: "Pas de porte, pas de cockpit, pas de trappe de maintenance. Une sphère de dix mètres. « D'accord. » Ce fut tout.",
      cam: (lt) => ({ pos: [0, keys([[0, 4], [14, 12]], lt), keys([[0, 56], [14, 40]], lt)], look: [0, keys([[0, 10], [14, HEART_Y]], lt), 0], fov: keys([[0, 60], [14, 54]], lt) }),
    },
    {
      t: [28, 36], plan: 'Plan rapproché, contre-jour', optique: '50 mm', mouvement: 'Fixe',
      lumiere: 'Silhouette de Glide découpée en vert, main à plat sur le verre',
      intention: "Le champ est perceptible sur ses vibrisses. « Vous le sentez ? » « Oui. »",
      cam: () => ({ pos: [4.6, 11.9, 28.4], look: [-1, 11.6, 26], fov: 40 }),
    },
    {
      t: [36, 44], plan: 'Plan moyen', optique: '35 mm', mouvement: 'Lent panoramique',
      lumiere: 'Vert du Cœur en rim, écrans blancs sur les visages',
      intention: "« Vous savez ce que c'est ? » « Non. » Nous avons préféré éviter la méthode « cassons pour voir ».",
      cam: (lt) => ({ pos: [keys([[0, -5], [8, -3]], lt), 12, 33], look: [1, 11.2, 28], fov: 42 }),
    },
    {
      t: [44, 56], plan: 'Insert macro', optique: '100 mm', mouvement: 'Fixe, la plaque s’incline',
      lumiere: "Lecture basse fréquence : les tracés s'éclairent en blanc pâle",
      intention: "Plaque sept. Trois arcs, un point décentré, deux lignes parallèles. Douze points s'allument une fraction de seconde.",
      cam: (lt) => ({ pos: [0.05, 12.05, 29.25], look: [0, 11.65, 28.4], fov: 34 }),
    },
    {
      t: [56, 68], plan: 'Plan large, hologramme', optique: '35 mm', mouvement: 'Fixe',
      lumiere: 'Lignes du Nœud projetées ; une colonie passe au rouge',
      intention: "Déplacer le Cœur ne claque pas des portes : une route peut rester ouverte dans un sens et pas dans l'autre.",
      cam: () => ({ pos: [6, 12.5, 36], look: [-1, 12.5, 28], fov: 48 }),
    },
    {
      t: [68, 76], plan: 'Champ / contrechamp', optique: '50 mm', mouvement: 'Fixe',
      lumiere: 'Vert latéral dur, Kovar à moitié dans le noir',
      intention: "« Le premier nombre n'efface pas le second. »",
      cam: (lt) => (lt < 4 ? { pos: [-1.2, 11.9, 31.8], look: [1.6, 11.7, 29.2], fov: 34 } : { pos: [2.4, 11.8, 32], look: [-0.8, 11.7, 29.4], fov: 34 }),
    },
    {
      t: [76, 92], plan: 'Plan large sur la paroi', optique: '28 mm', mouvement: 'Lent travelling avant',
      lumiere: "Ciel orange des mondes mosodes projeté sur le mur ; le Cœur passe derrière, en reflet",
      intention: "Dril, calme. Des champs gris, des canaux vides. « Vous avez choisi quelle population supporterait le risque. »",
      cam: (lt) => ({ pos: [0, 12.6, keys([[0, 18], [16, 22]], lt)], look: [0, 15.5, 41], fov: 46 }),
    },
    {
      t: [92, 98], plan: 'Insert', optique: '85 mm', mouvement: 'Fixe',
      lumiere: 'La plaque sept s’éteint en quittant le champ',
      intention: "« Il croit ce qu'il dit. » « Oui. » « C'est pire. »",
      cam: () => ({ pos: [0.6, 12.2, 29.6], look: [0, 11.65, 28.4], fov: 40 }),
    },
  ],

  setup({ scene }) {
    const S = {};
    scene.background = new THREE.Color(0x020403);
    scene.fog = new THREE.FogExp2(0x041a10, 0.0022);
    // Chambre : un vide réservé à une seule chose
    const wall = hullMat('dark', { color: 0x4a5250, metalness: 0.6, roughness: 0.5 });
    const room = new THREE.Mesh(new THREE.CylinderGeometry(44, 44, 60, 48, 1, true), wall);
    room.material.side = THREE.BackSide;
    room.position.y = 26;
    scene.add(room);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(44, 48), hullMat('dark', { color: 0x30363a }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    const r = rng(6);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      if (Math.abs(Math.sin(a) - 1) < 0.05) continue;
      const col = new THREE.Mesh(box(1.2, 56, 1.2), wall);
      col.position.set(Math.cos(a) * 42.5, 28, Math.sin(a) * 42.5);
      scene.add(col);
      const l = glow(0x9effc8, 1.5, 0.7, 'hard');
      l.position.set(Math.cos(a) * 42, 4 + (i % 4) * 12, Math.sin(a) * 42);
      scene.add(l);
    }
    for (let i = 0; i < 18; i++) {
      const c = new THREE.Mesh(cyl(0.6, 0.6, 40, 10), hullMat('worn', { color: 0x606a6a }));
      c.rotation.z = Math.PI / 2;
      c.rotation.y = r() * Math.PI;
      c.position.set(0, 0.6, (r() - 0.5) * 20);
      scene.add(c);
    }
    S.heart = heart({ radius: 5 });
    S.heart.position.y = HEART_Y;
    S.heart.userData.lightGain = 2600;
    const fillG = new THREE.HemisphereLight(0x2a6a48, 0x0a1a12, 0.9);
    scene.add(fillG);
    scene.add(S.heart);
    // Passerelles vers le poste d'observation
    for (const x of [-6, 6]) {
      const wk = new THREE.Mesh(box(2, 0.3, 30), hullMat('dark', { color: 0x606868 }));
      wk.position.set(x, 10, 12);
      scene.add(wk);
    }
    const obs = new THREE.Mesh(box(14, 0.5, 10), hullMat('dark', { color: 0x585e60 }));
    obs.position.set(0, 10, 30);
    scene.add(obs);
    S.glass = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), glassMat(0xbfffe0, 0.12));
    S.glass.position.set(0, 14, 26);
    scene.add(S.glass);
    const frame = new THREE.Mesh(box(14.4, 0.3, 0.3), hullMat('dark'));
    frame.position.set(0, 10.2, 26);
    scene.add(frame);
    const console1 = new THREE.Mesh(box(3, 1.1, 1), hullMat('dark', { color: 0x40484a }));
    console1.position.set(0, 10.8, 28.2);
    scene.add(console1);
    // Couloir et sas
    const corridor = new THREE.Mesh(box(8, 5, 30), new THREE.MeshStandardMaterial({ color: 0x7a8288, side: THREE.BackSide, roughness: 0.6 }));
    corridor.position.set(0, 2.5, 78);
    scene.add(corridor);
    S.corrLights = [];
    for (let i = 0; i < 5; i++) {
      const l = new THREE.PointLight(0xdfefff, 18, 10, 2);
      l.position.set(0, 4.6, 66 + i * 6);
      scene.add(l);
      S.corrLights.push(l);
      const st = new THREE.Mesh(box(3, 0.1, 0.4), lightMat(0xeaf4ff, 2));
      st.position.set(0, 4.95, 66 + i * 6);
      scene.add(st);
    }
    S.amber = glow(0xffa020, 1.4, 0.9, 'hard');
    S.amber.position.set(0, 4.4, 63.2);
    scene.add(S.amber);
    S.door = new THREE.Mesh(box(8, 5, 0.5), hullMat('dark', { color: 0x50585c }));
    S.door.position.set(0, 2.5, 63);
    scene.add(S.door);

    // Le Livre : caisson transparent sur chariot magnétique
    S.cart = new THREE.Group();
    const base = new THREE.Mesh(box(1.4, 0.15, 0.9), hullMat('dark', { color: 0x3a4044 }));
    base.position.y = 0.85;
    S.cart.add(base);
    const caseM = new THREE.Mesh(box(1.2, 0.3, 0.8), glassMat(0xdff4ff, 0.2));
    caseM.position.y = 1.08;
    S.cart.add(caseM);
    for (let i = 0; i < 8; i++) {
      const pl = new THREE.Mesh(box(1.0, 0.012, 0.6), new THREE.MeshStandardMaterial({ color: i < 4 ? 0x7a6a58 : 0xcfe8f0, transparent: i >= 4, opacity: 0.55, roughness: 0.3, metalness: 0.2 }));
      pl.position.y = 0.96 + i * 0.022;
      S.cart.add(pl);
    }
    const hover = glow(0x80c0ff, 1.6, 0.4);
    hover.position.y = 0.6;
    S.cart.add(hover);
    scene.add(S.cart);

    // Personnages
    S.balam = balam();
    S.glide = alyde();
    S.fara = fara();
    S.kovar = human({ body: 0x1c2024, hair: 0x8a8a88, skin: 0x8a6e5c });
    S.sci = human({ body: 0x405048, female: true, skin: 0x6e7e82, hair: 0x101010 });
    S.agents = [human({ body: 0xd8dce0 }), human({ body: 0xd8dce0 })];
    for (const c of [S.balam, S.glide, S.fara, S.kovar, S.sci, ...S.agents]) scene.add(c);

    // Plaque sept (gros plan) : texture redessinée à chaque image
    S.plateCanvas = document.createElement('canvas');
    S.plateCanvas.width = S.plateCanvas.height = 512;
    S.plateTex = new THREE.CanvasTexture(S.plateCanvas);
    S.plateTex.colorSpace = THREE.SRGBColorSpace;
    S.plate = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55), new THREE.MeshBasicMaterial({ map: S.plateTex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
    S.plate.position.set(0, 11.65, 28.4);
    S.plate.rotation.x = -Math.PI / 2 + 0.5;
    scene.add(S.plate);
    S.plateGlow = new THREE.PointLight(0xe8fff4, 0, 3, 2);
    S.plateGlow.position.set(0, 11.5, 28.6);
    scene.add(S.plateGlow);

    // Paroi : message de Dril
    S.dCanvas = document.createElement('canvas');
    S.dCanvas.width = 1024;
    S.dCanvas.height = 512;
    S.dTex = new THREE.CanvasTexture(S.dCanvas);
    S.dTex.colorSpace = THREE.SRGBColorSpace;
    S.screen = new THREE.Mesh(new THREE.PlaneGeometry(28, 14), new THREE.MeshBasicMaterial({ map: S.dTex, transparent: true, toneMapped: false }));
    S.screen.position.set(0, 16, 41);
    S.screen.rotation.y = Math.PI;
    scene.add(S.screen);
    S.screenLight = new THREE.PointLight(0xffa060, 0, 40, 1.5);
    S.screenLight.position.set(0, 16, 37);
    scene.add(S.screenLight);
    S.motes = sparkCloud({ count: 400, seed: 7, color: 0x9effc8, size: 0.15, spread: [60, 40, 60] });
    S.motes.position.y = 20;
    scene.add(S.motes);
    scene.add(new THREE.AmbientLight(0x0c1a14, 0.5));
    return S;
  },

  update(t, S) {
    S.heart.userData.update(t, 1);
    S.motes.material.uniforms.time.value = t;
    S.motes.material.uniforms.spd.value = 0.4;
    const inside = t >= 14;
    S.door.position.y = 2.5 + smooth(inv(14, 16, t)) * 5;
    S.corrLights.forEach((l) => (l.intensity = inside ? 4 : 18));
    S.amber.material.opacity = Math.sin(t * 3) > 0 ? 0.9 : 0.3;

    // Le chariot avance dans le couloir, puis est posé dans le poste d'observation
    if (t < 14) S.cart.position.set(0, 0, keys([[0, 82], [8, 74], [14, 68]], t));
    else S.cart.position.set(0, 10.2, 28.4);
    S.cart.visible = t < 44 || t >= 66;

    // Placement des personnages
    const place = (c, p, ry) => { c.position.set(...p); c.rotation.set(0, ry, 0); };
    if (t < 14) {
      place(S.glide, [-0.6, 0, keys([[0, 86], [8, 78.5], [14, 73]], t)], Math.PI);
      place(S.balam, [1.4, 0, keys([[0, 87], [8, 79.5], [14, 74]], t)], Math.PI);
      place(S.fara, [-1.8, 0, 66], 0);
      place(S.kovar, [-0.3, 0, 65.6], 0);
      place(S.sci, [1.6, 0, 66.2], -0.3);
      S.agents.forEach((a, i) => place(a, [i ? 0.9 : -0.9, 0, keys([[0, 84], [8, 76], [14, 70]], t)], Math.PI));
    } else {
      place(S.glide, [-0.6, 10.25, 27], Math.PI);
      place(S.balam, [2.4, 10.25, 28.6], Math.PI + 0.4);
      place(S.fara, [-3.2, 10.25, 29.2], Math.PI - 0.5);
      place(S.kovar, [1.4, 10.25, 30.6], Math.PI + 0.2);
      place(S.sci, [0.4, 10.25, 29.4], Math.PI);
      S.agents.forEach((a, i) => place(a, [i ? 5 : -5, 10.25, 33], Math.PI));
    }
    // Glide pose la main sur la vitre
    S.glide.userData.armR.rotation.set(t > 29 && t < 36 ? -2.2 : -0.1, 0, t > 29 && t < 36 ? -0.3 : 0);
    S.glide.userData.armL.rotation.set(t >= 44 && t < 56 ? -1.3 : -0.1, 0, 0.3);
    S.glide.userData.vib.forEach((v, i) => (v.rotation.y = (t > 30 && t < 36 ? 0.3 + Math.sin(t * 9 + i) * 0.08 : 0) * (i < 4 ? 1 : -1)));

    // Plaque sept
    const reading = ramp(46, 48, t) * (1 - ramp(92, 95, t));
    drawPlate(S, t, reading);
    S.plate.visible = (t >= 44 && t < 56) || t >= 92;
    S.plate.lookAt(0.05, 12.05 + Math.sin(t * 0.6) * 0.05, 29.25);
    S.plateGlow.intensity = 0.6 * reading;

    // Dril
    const on = ramp(77, 78, t) * (1 - ramp(91, 91.6, t));
    drawDril(S, t, on);
    S.screen.visible = on > 0;
    S.screenLight.intensity = 400 * on;
    if (t > 76 && t < 92) S.screen.lookAt(0, 13, 32);
  },

  overlay(g, t, S, shot, lt, { w, h }) {
    if (t >= 9 && t < 14) {
      panel(g, w / 2 - 170, 60, 340, 44, { color: 'rgba(255,170,60,0.9)', fill: 'rgba(30,15,0,0.55)' });
      text(g, 'CHAMP VARIABLE — PERTURBATIONS POSSIBLES', w / 2, 88, { size: 12, align: 'center', color: '#ffc070' });
    }
    if (t >= 56 && t < 68) drawNode(g, t, w, h);
    if (t >= 78 && t < 91) {
      text(g, 'COMMANDEUR DRIL', 60, h - 50, { size: 14, color: '#ffb090', weight: 700, spacing: 3, alpha: ramp(78.5, 79.5, t) });
      if (t > 86) text(g, 'DÉLAI : 24 H', w - 60, h - 50, { size: 18, align: 'right', color: '#ff6040', weight: 700, alpha: ramp(86, 86.5, t) });
    }
  },

  subs: [
    [2, 3.6, '*', 'Il vit seulement l’usure sur le bord de la troisième plaque.'],
    [6, 2, 'Agent', 'Sous scellés jusqu’à la fin de l’examen.'],
    [8.5, 2.6, 'Fara', 'Ce que vous allez voir est classé au niveau stratégique le plus élevé.'],
    [11.2, 1.9, 'Balam', 'Vous avez prévu un bracelet pour empêcher les phrases ?'],
    [13.2, 0.8, 'Fara', 'Pas encore.'],
    [21, 1.6, 'Balam', 'D’accord.'],
    [23.5, 3.4, '*', 'Il chercha instinctivement une trappe de maintenance. Il n’en trouva pas.'],
    [30, 1.5, 'Scientifique', 'Vous le sentez ?'],
    [31.7, 1, 'Glide', 'Oui.'],
    [37, 1.6, 'Balam', 'Vous savez ce que c’est ?'],
    [38.8, 1, 'Scientifique', 'Non.'],
    [40, 3.6, 'Scientifique', 'Nous avons préféré éviter la méthode « cassons pour voir ».'],
    [44.5, 1.2, 'Glide', 'Plaque sept.'],
    [50, 2.4, 'Scientifique', 'Ce ne sont pas des symboles religieux.'],
    [52.6, 3, 'Glide', 'Le Livre n’est pas sacré parce qu’il serait incompréhensible. Il l’est parce qu’il a servi.'],
    [57, 3.6, 'Scientifique', 'Une route peut rester praticable dans un sens et pas dans l’autre.'],
    [61, 3.4, 'Scientifique', 'Quatre mille huit cents habitants permanents. Trois mois d’autonomie alimentaire.'],
    [65, 2.6, 'Glide', 'Ce risque explique pourquoi vous refusez le transfert. Il n’explique pas mon bracelet.'],
    [68.3, 2.4, 'Kovar', 'Et si dix pilotes retenus sauvent cinquante mille personnes ?'],
    [71, 2.5, 'Glide', 'Vous aurez peut-être sauvé cinquante mille personnes.'],
    [73.6, 2.4, 'Glide', 'Le premier nombre n’efface pas le second.'],
    [79, 3.4, 'Dril', 'Vous dites qu’un déplacement condamnerait vos routes. Nous disons que votre immobilité condamne nos mondes.'],
    [82.6, 3.2, 'Dril', 'Vous avez choisi quelle population supporterait le risque. Ne prétendez plus que vous n’avez pas choisi.'],
    [86, 3.6, 'Dril', 'Préparez le Cœur au transfert. Vous avez vingt-quatre heures pour répondre.'],
    [92.4, 1.6, 'Balam', 'Il croit ce qu’il dit.'],
    [94.2, 0.9, 'Kovar', 'Oui.'],
    [95.2, 1.4, 'Balam', 'C’est pire.'],
  ],
  cues: [
    [0, 'hum', 0.5], [8, 'beep', 0.3], [14, 'door', 0.8], [15, 'heart', 1], [28, 'heart', 0.7], [46, 'chime', 0.7],
    [48.5, 'twelve', 0.6], [56, 'tension', 0.6], [60, 'beep', 0.4], [76, 'signal', 0.7], [78, 'drone', 0.8], [91, 'cut', 0.6],
  ],
  music: { mood: 'mystère' },
};

// Plaque sept : lignes presque invisibles ; à la lecture, trois arcs, un point décentré, deux parallèles.
function drawPlate(S, t, k) {
  const g = S.plateCanvas.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  g.fillStyle = 'rgba(190,225,235,0.18)';
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(220,240,245,0.5)';
  g.lineWidth = 2;
  g.strokeRect(4, 4, 504, 504);
  const r = rng(77);
  g.strokeStyle = 'rgba(200,230,240,0.18)';
  for (let i = 0; i < 30; i++) {
    g.beginPath();
    g.moveTo(r() * 512, r() * 512);
    g.bezierCurveTo(r() * 512, r() * 512, r() * 512, r() * 512, r() * 512, r() * 512);
    g.stroke();
  }
  if (k > 0) {
    g.save();
    g.globalAlpha = k;
    g.strokeStyle = '#f4fffa';
    g.shadowColor = '#e8fff4';
    g.shadowBlur = 14;
    g.lineWidth = 5;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(230, 270, 70 + i * 34, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    }
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(292, 238, 9, 0, Math.PI * 2);
    g.fill();
    g.beginPath(); g.moveTo(150, 360); g.lineTo(380, 330); g.stroke();
    g.beginPath(); g.moveTo(150, 384); g.lineTo(380, 354); g.stroke();
    g.restore();
    // Douze points, une fraction de seconde
    const flick = pulse(t, 48.5, 49.2, 0.05);
    if (flick > 0) {
      g.fillStyle = `rgba(255,255,255,${flick})`;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.3;
        g.beginPath();
        g.arc(256 + Math.cos(a) * 228, 256 + Math.sin(a) * 228, 4, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  S.plateTex.needsUpdate = true;
}

// Message de Dril : champs gris sous un ciel orange, canaux vides ; puis l'officier.
function drawDril(S, t, on) {
  if (on <= 0) return;
  const g = S.dCanvas.getContext('2d');
  const W = 1024, H = 512;
  const dril = t > 84 || t < 80.5;
  g.globalAlpha = 1;
  if (!dril) {
    const sky = g.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#c0602a');
    sky.addColorStop(1, '#e8a060');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#6a6460';
    g.fillRect(0, H * 0.55, W, H * 0.45);
    g.strokeStyle = '#4a4440';
    g.lineWidth = 3;
    for (let i = 0; i < 18; i++) {
      g.beginPath();
      g.moveTo(W / 2, H * 0.55);
      g.lineTo(-400 + i * 110, H);
      g.stroke();
    }
    g.fillStyle = '#3a342e';
    g.fillRect(W * 0.62, H * 0.6, 40, H * 0.4);
    g.strokeStyle = '#2a2420';
    g.lineWidth = 6;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(200 + i * 160, H * 0.56, 60, Math.PI, Math.PI * 1.7);
      g.stroke();
    }
  } else {
    g.fillStyle = '#0c0f14';
    g.fillRect(0, 0, W, H);
    g.fillStyle = '#1a2230';
    g.fillRect(W * 0.55, 60, W * 0.4, H * 0.55);
    g.strokeStyle = '#3a4a60';
    g.strokeRect(W * 0.55, 60, W * 0.4, H * 0.55);
    g.fillStyle = '#5a6a80';
    g.fillRect(W * 0.6, H * 0.4, W * 0.3, 18);
    // Officier
    g.fillStyle = '#20242a';
    g.beginPath();
    g.ellipse(W * 0.4, H * 1.05, 230, 200, 0, Math.PI, 0);
    g.fill();
    g.fillStyle = '#8a7a72';
    g.beginPath();
    g.ellipse(W * 0.4, H * 0.42, 70, 98, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#2a2420';
    g.fillRect(W * 0.4 - 40, H * 0.38, 26, 6);
    g.fillRect(W * 0.4 + 14, H * 0.38, 26, 6);
    g.strokeStyle = '#d0b0a8';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(W * 0.4 + 55, H * 0.3);
    g.lineTo(W * 0.4 + 40, H * 0.4);
    g.stroke();
    g.fillStyle = '#c0a060';
    g.fillRect(W * 0.4 - 120, H * 0.8, 40, 10);
  }
  // lignes de balayage
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = (t * 40) % 6; y < H; y += 6) g.fillRect(0, y, W, 2);
  S.screen.material.opacity = on * (0.9 + 0.1 * Math.sin(t * 40));
  S.dTex.needsUpdate = true;
}

// Hologramme du Nœud : branches qui dérivent, se ferment, une colonie passe au rouge.
function drawNode(g, t, w, h) {
  const a = ramp(56, 57, t);
  const cx = w * 0.5, cy = h * 0.42;
  const k = ramp(58, 66, t);
  g.save();
  g.globalAlpha = a;
  g.translate(cx + k * 30, cy);
  const branches = 9;
  for (let i = 0; i < branches; i++) {
    const ang = (i / branches) * Math.PI * 2 + 0.2;
    const len = 150 + (i % 3) * 40;
    const dead = i === 2 && t > 62;
    const warn = (i === 5 && t > 60) || (i === 7 && t > 64);
    g.strokeStyle = dead ? 'rgba(255,60,40,0.4)' : warn ? 'rgba(255,170,60,0.9)' : 'rgba(120,255,180,0.8)';
    g.setLineDash(warn ? [6, 5] : []);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(-k * 30, 0);
    const wob = warn ? Math.sin(t * 6 + i) * 10 : 0;
    g.quadraticCurveTo(Math.cos(ang + 0.3) * len * 0.5, Math.sin(ang + 0.3) * len * 0.5 + wob, Math.cos(ang) * len, Math.sin(ang) * len);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = dead ? '#ff4030' : warn ? '#ffb040' : '#9fffd0';
    g.beginPath();
    g.arc(Math.cos(ang) * len, Math.sin(ang) * len, 5, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#3dff9a';
  g.beginPath();
  g.arc(-k * 30, 0, 10, 0, Math.PI * 2);
  g.fill();
  g.restore();
  text(g, `INDICE D'ANCRAGE ${(100 - k * 14).toFixed(1).replace('.', ',')}`, w - 60, 60, { size: 14, align: 'right', color: k > 0.6 ? '#ffb040' : '#9fffd0', alpha: a });
}

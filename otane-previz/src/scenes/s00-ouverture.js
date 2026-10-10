import * as THREE from 'three';
import { starfield, nebulaSky, filaments, glow } from '../lib/fx.js';
import { heart } from '../lib/models.js';
import { keys, ramp } from '../lib/util.js';

export default {
  id: '00',
  title: 'Ouverture',
  chapter: 'Générique',
  duration: 18,
  card: false,
  fadeIn: 2,
  fadeOut: 2,
  cards: [
    { t: 3, d: 8, big: true, size: 84, lines: ['OTANE', 'LE CŒUR DES MONDES'], y: 250 },
    { t: 11.5, d: 6, lines: ['Prévisualisation des scènes clés', 'Dossier producteurs — maquette 3D temps réel, non contractuelle'], y: 270, small: 20 },
  ],
  shots: [
    {
      t: [0, 18], plan: "Plan d'ensemble", optique: '50 mm', mouvement: 'Travelling avant très lent',
      lumiere: 'Noir spatial, seule source : la lueur verte du Cœur au loin',
      intention: "Poser la couleur du film : le vert du Cœur dans le noir. Rien d'autre.",
      cam: (lt) => ({ pos: [0, keys([[0, 6], [18, 2]], lt), keys([[0, 260], [18, 120]], lt)], look: [0, 0, 0], fov: 32 }),
    },
  ],
  setup({ scene }) {
    const S = {};
    scene.add(nebulaSky({ seed: 21, hues: [[20, 60, 50], [40, 30, 80]], density: 0.6 }));
    S.stars = starfield({ count: 6000, seed: 3 });
    scene.add(S.stars);
    S.heart = heart({ radius: 6 });
    scene.add(S.heart);
    S.fil = filaments({ count: 120, length: 900, radius: 60, color: 0x3dff9a, twist: 0.6 });
    S.fil.position.z = 450;
    scene.add(S.fil);
    S.halo = glow(0x3dff9a, 120, 0.15);
    scene.add(S.halo);
    scene.add(new THREE.AmbientLight(0x203028, 0.4));
    return S;
  },
  update(t, S) {
    S.stars.material.uniforms.time.value = t;
    S.heart.userData.update(t * 0.6, 0.6 + 0.4 * ramp(2, 10, t));
    S.fil.material.uniforms.time.value = t;
    S.fil.material.uniforms.intensity.value = 0.25 + 0.4 * ramp(0, 8, t);
  },
  subs: [],
  cues: [[0, 'drone', 0.6], [3, 'swell', 0.8], [11.5, 'chime', 0.4]],
  music: { mood: 'ouverture' },
};

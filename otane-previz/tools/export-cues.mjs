// Exporte durée, ambiance musicale, repères sonores et dialogues de chaque séquence (pour la bande-son et le découpage).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCENES } from '../src/scenes/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = [];
for (const s of SCENES) {
  const m = (await s.load()).default;
  out.push({
    id: m.id, title: m.title, chapter: m.chapter, duration: m.duration, music: m.music, cues: m.cues, subs: m.subs,
    shots: m.shots.map(({ t, plan, optique, mouvement, lumiere, intention }) => ({ t, plan, optique, mouvement, lumiere, intention })),
  });
}
fs.mkdirSync(path.join(root, 'out'), { recursive: true });
fs.writeFileSync(path.join(root, 'out', 'scenes.json'), JSON.stringify(out, null, 1));
console.log(out.map((s) => `${s.id} ${s.duration}s ${s.shots.length} plans ${s.cues.length} repères`).join('\n'));

// Génère DECOUPAGE.md à partir des données des séquences (même source que la vidéo).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'out', 'scenes.json'), 'utf8'));
const tc = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const total = data.reduce((a, s) => a + s.duration, 0);
const shots = data.reduce((a, s) => a + s.shots.length, 0);

let md = `# OTANE — Le Cœur des mondes
## Découpage technique de la prévisualisation

Bobine de démonstration : ${data.length} séquences, ${shots} plans, ${tc(total)} au total.
Format : 1280×720, image utile en 2,39:1, 24 images/seconde.

### Ce qu'est cette bobine, et ce qu'elle n'est pas

C'est une **prévisualisation** (previz) : une maquette 3D animée qui fixe le découpage, les axes de caméra, les focales, les mouvements et l'intention lumière de chaque plan. Les décors, vaisseaux et personnages sont des volumes simplifiés. Les visages ne sont pas modélisés : les personnages sont filmés en silhouette ou en contre-jour, ce qui sert aussi le ton du roman. Les dialogues sont en sous-titres, sans voix. La bande-son est une maquette synthétisée (nappes, impacts, alarmes), pas une musique originale.

Elle sert à montrer **comment le film se regarde** : où est la caméra, ce qu'on voit, dans quel ordre, avec quelle lumière. Elle ne montre pas le rendu final des images.

Le bandeau du haut de chaque image indique le plan en cours (valeur de plan, focale, mouvement, lumière). Il se masque dans le lecteur interactif.

### Partis pris de mise en scène

**Une couleur par monde.**
- Sol et la récupération : orange sale, lumière de chantier, soleil dur sans atmosphère.
- Le Cœur, le Sillage et la marée : vert. C'est la seule couleur que le film réserve à ce qui échappe aux personnages.
- OTANE et la Cadence : blanc et bleu, propres, sans cicatrice.
- Les Mosodes : rouge, et le noir mat de Siraal, fait pour avaler la lumière des capteurs.
- Le souvenir de Pallas : image désaturée et froide.

**Deux caméras pour deux regards.**
- Balam : caméra portée, focales courtes, cadres qui bougent avec lui. Il improvise, la caméra aussi.
- Glide : plans fixes, longues focales, écrasement des distances. Le pisteur regarde avant d'agir ; la caméra attend avec lui.
- À mesure qu'ils apprennent à voler ensemble, les deux grammaires se mêlent : le plan du Miroir (séquence 09) reste fixe pendant que Balam ne fait rien.

**L'interface comme dramaturgie.** Comptes à rebours, jauges et listes de branches civiles sont dans l'image : ${'«'} 07:18 ${'»'} au poignet, le seuil de Pik à 96,8 %, l'indice d'ancrage, Hespar qui s'éteint. Le spectateur lit les mêmes chiffres que les personnages, au même moment.

**Les visages dans l'ombre.** Les scènes de confrontation (Korren, la chambre du Cœur) sont éclairées en contre-jour : silhouettes découpées sur Néréa ou sur le vert du Cœur. Le texte du roman porte la scène ; la lumière ne la commente pas.

`;

for (const s of data) {
  md += `\n---\n\n## ${s.id} · ${s.title}\n*${s.chapter} — durée ${tc(s.duration)} — ${s.shots.length} plans — ambiance sonore : ${s.music.mood}*\n\n`;
  md += `| # | TC | Plan | Focale | Mouvement | Lumière | Intention |\n|---|---|---|---|---|---|---|\n`;
  s.shots.forEach((p, i) => {
    md += `| ${i + 1} | ${tc(p.t[0])}–${tc(p.t[1])} | ${p.plan} | ${p.optique} | ${p.mouvement} | ${p.lumiere} | ${p.intention.replace(/\|/g, '/')} |\n`;
  });
  if (s.subs.length) {
    md += `\n<details><summary>Dialogues et narration (${s.subs.length} répliques)</summary>\n\n`;
    for (const [t, , who, text] of s.subs) md += `- \`${tc(t)}\` ${who === '*' ? `*${text}*` : `**${who}** — ${text}`}\n`;
    md += `\n</details>\n`;
  }
}

md += `
---

## Limites de cette maquette et suite du travail

- **Visages et jeu d'acteur** : absents. La previz fixe les axes ; le jeu viendra du tournage (prises de vue réelles sur fond, ou capture de performance pour Glide).
- **Glide** : le design est une silhouette de travail (crâne large et bas, mâchoire puissante, vibrisses, mains palmées). Il demande une recherche de concept art avant toute fabrication.
- **Voix** : à enregistrer en voix témoins pour la version suivante de la bobine ; les durées des sous-titres donnent déjà un rythme de lecture.
- **Musique et son** : maquette synthétisée. Les repères (impacts, alarmes, silences) sont placés au bon endroit et peuvent servir de feuille de route au monteur son.
- **Effets visuels** : chaque plan d'espace de cette bobine correspond à un plan d'effets numériques dans le film. Le tableau ci-dessus peut servir de base au chiffrage (${shots} plans, dont la très grande majorité en images de synthèse).
`;

fs.writeFileSync(path.join(root, 'DECOUPAGE.md'), md);
console.log('DECOUPAGE.md', md.length, 'caractères');

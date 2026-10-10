# OTANE — prévisualisation des scènes clés

Maquette 3D animée (previz) des scènes clés du roman *OTANE — Le Cœur des mondes*, réalisée pour une présentation à des producteurs. Le découpage complet, plan par plan, est dans [DECOUPAGE.md](DECOUPAGE.md).

## Contenu

| Séquence | Chapitre | Durée |
|---|---|---|
| 00 · Ouverture | — | 0:18 |
| 01 · Le cimetière de Sol | 1 | 1:54 |
| 02 · La balise morte | 2 | 1:34 |
| 03 · Le Sillage | 3 | 1:38 |
| 04 · L'Indocile | 5–6 | 1:28 |
| 05 · Ardent-Six | 7 | 1:42 |
| 06 · La chambre du Cœur | 11 | 1:38 |
| 07 · Korren | 14 | 1:54 |
| 08 · Quatre-vingt-dix-sept pour cent | 20–21 | 1:44 |
| 09 · Le Miroir se brise | 22 | 1:28 |
| 10 · Le point aveugle | 23 | 1:50 |
| 11 · Douze | 24 | 1:32 |

## Regarder en temps réel

Le lecteur fonctionne dans un navigateur récent, sans installation :

```bash
cd otane-previz
npx http-server -p 8080   # ou tout autre serveur statique
# puis ouvrir http://localhost:8080/index.html
```

Le lecteur permet de choisir une séquence, de se déplacer dans le temps et de masquer le bandeau technique (« Slate »).

## Refaire le rendu vidéo

Prérequis : Node 18+, ffmpeg, Python 3 avec numpy, Playwright (Chromium).

```bash
npm install
node tools/export-cues.mjs                       # données des séquences → out/scenes.json
./tools/render-all.sh                            # images → out/video/sNN.mp4 (sans son)
python3 tools/score.py out/scenes.json out/audio # bande-son maquette → out/audio/sNN.wav
./tools/mux.sh                                   # vidéo + son, bobine complète → out/final/
node tools/decoupage.mjs                         # régénère DECOUPAGE.md
```

Un plan isolé se vérifie en images fixes : `node tools/still.mjs 05 /tmp/controle 12 40 58`.

## Organisation du code

- `src/engine.js` : rendu, cadre 2,39:1, bandeau technique, sous-titres, grain, fondus.
- `src/lib/` : modèles procéduraux (vaisseaux, stations, personnages), effets (Sillage, étoiles, halos), interfaces embarquées.
- `src/scenes/sNN-*.js` : une séquence par fichier. Chaque plan déclare sa caméra et sa fiche technique (valeur de plan, focale, mouvement, lumière, intention) ; la même donnée alimente la vidéo et le découpage.

## Animatique des planches de storyboard

`animatic/` anime les planches de storyboard (dossier `animatic/src/`), case par case : mouvement de caméra sur l'image (travelling, zoom, roulis), effets lumineux posés sur les réacteurs, tirs, écrans, hologrammes, faisceaux et vortex du Sillage, particules, titre de case et légende. Les personnages ne bougent pas : c'est un *motion board*.

Une configuration par film, dans `animatic/` :

| Configuration | Contenu |
|---|---|
| `cfg_sc1` | Scène clé 1 : planches 1/2 et 2/2 (12 cases) |
| `cfg_sc2` | Scène clé 2 : planches 1/3 à 3/3 (18 cases) |
| `cfg_sc3` | Scène clé 3 : planches 1/3 à 3/3 (18 cases) |
| `cfg_planches34` | Première série, planches 3 et 4 |

```
python3 animatic/animatic.py cfg_sc1 out/animatic/sc1.mp4          # image
python3 animatic/animatic.py cfg_sc1 out/animatic/test/x.mp4 24 12.5,30   # images de contrôle
python3 animatic/audio.py cfg_sc1 out/animatic/sc1.wav               # son
bash animatic/render.sh sc1 1                                        # image + son + assemblage
```

Les cases sont repérées automatiquement dans la planche (`layout.py`). Dans une configuration, positions et cadrages s'écrivent en fractions de case (`cfgutil.case`). Dépendance : `opencv-python-headless`.

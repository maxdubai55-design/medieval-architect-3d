# OTANE — prompts de génération vidéo
## Séquences 01 (Le cimetière de Sol) et 07 (Korren)

Ce document transforme le découpage de la previz en instructions pour un générateur d'images et de vidéo par IA. Il couvre 24 plans. Les autres séquences suivront le même modèle.

### Méthode recommandée, en trois temps

1. **Une image clé par plan.** Avec un générateur d'images, produire l'image du plan à partir du prompt ci-dessous. Fournir l'image de référence de la previz (`references/scXX_planYY.jpg`) comme **référence de composition** : elle fixe le cadre, l'axe et la place des éléments. Ne pas la donner comme image de style, sinon le rendu « maquette 3D » revient.
2. **Animer l'image clé** avec un générateur vidéo (mode image vers vidéo). Ajouter au prompt la ligne « Mouvement » du plan.
3. **Monter.** La plupart des générateurs produisent des plans de 5 à 10 secondes : les plans plus longs sont découpés en deux prises, indiquées ci-dessous.

Les prompts sont en anglais, parce que ces outils sont entraînés surtout sur des descriptions anglaises. Les notes de réalisation restent en français.

### Règles qui valent pour tous les plans

À ajouter à la fin de chaque prompt :

> `anamorphic 2.39:1 cinematic frame, shot on 35mm film, natural film grain, physically accurate space lighting, no atmosphere in vacuum, deep blacks, no lens flare unless stated, no text, no subtitles, no watermark`

À éviter (champ « negative prompt » quand l'outil en a un) :

> `cartoon, anime, video game render, plastic skin, oversaturated, sci-fi cliché glowing blue holograms everywhere, stars visible in bright sunlit shots, sound effects text, extra fingers, distorted faces`

**Continuité.** Utiliser toujours la même fiche personnage (ci-dessous) pour un personnage donné, mot pour mot. Si l'outil permet d'enregistrer un personnage ou une image de référence de visage, en créer une par personnage avant de générer les plans, et la réutiliser partout.

---

## Fiches de référence (à coller telles quelles)

Ce qui vient du roman : l'âge de Balam, ses cheveux collés au front, la trace noire sur la joue ; pour Glide, la tête large, la peau lisse, la mâchoire puissante, les courtes vibrisses, les yeux sombres, les fentes auditives et les mains palmées. Le reste (couleur de peau, de cheveux, nombre de doigts, tenues) est une proposition à valider avant de générer quoi que ce soit.

**BALAM**
> `BALAM: human man, 35 years old, lean and wiry, olive-tan skin, short dark messy hair stuck to his forehead with sweat, three-day stubble, tired but amused dark eyes, a black grease smear on his left cheek. Wears a scuffed off-white EVA suit with mismatched repaired patches, a gold-tinted visor, a small orange wrist display on the left forearm.`

Sans casque, en vol : `BALAM wearing a worn brown flight jacket over a grey pressure undersuit, helmet with the visor raised.`

**GLIDE** (Alyde : espèce semi-aquatique, ni humaine ni animale)
> `GLIDE: non-human alien of the Alyde species, humanoid body, broad low skull wider than a human head, smooth hairless slate-grey skin with a faint wet sheen, heavy powerful jaw, large fully black glossy eyes without visible whites, short pale whisker-like vibrissae on both sides of the muzzle, thin auditory slits instead of ears, webbed hands with four long fingers. Calm, still, economical movements. Wears a dark teal close-fitting pilot suit.`

Note : Glide est le personnage le plus difficile à obtenir. Générer d'abord une dizaine de portraits de face et de profil, en choisir un, puis l'imposer comme référence de visage dans tous les plans. Éviter les mots « seal », « otter » ou « fish » : ils tirent vers l'animal.

**KORREN** (souvenir uniquement)
> `KORREN: older Alyde, same species as GLIDE, thinner, skin paler and mottled with age, vibrissae longer and white, wears a faded salt-stained navigator's coat over a worn pressure suit.`

**Le récupérateur de Balam**
> `a small ugly salvage ship, short and asymmetric, single-seat bubble cockpit glowing warm orange, stripped bare-metal nose, ventral cargo hold, one mismatched armor plate bolted on the right flank, a docking arm on the left, two small engines, decades of welds and patches`

**Le vaisseau de Glide**
> `a low wide predator-like ship, broad flat prow, two separate engine nacelles on outriggers, dark teal hull, cold blue cockpit light, clean and maintained`

**Le cimetière de Sol** (orbite terrestre)
> `a crowded orbital graveyard in low Earth orbit: dead station rings, gutted transports, broken solar panels, welded clusters of satellites, all tumbling slowly; a dust storm covering North Africa on Earth below; on the night side, city lights only in isolated clusters along the coasts, large dark regions between them`

**La galerie de La Couronne**
> `an empty public observation gallery inside a giant ring station, floor-to-ceiling windows, a thin metal handrail, dim warm floor strips; outside, the moon NÉRÉA fills half the window: an ocean world, blue and white, with station structures sliding slowly across its disc`

---

## Séquence 01 · Le cimetière de Sol
*Chapitre 1 — 1 min 54 — 14 plans. Couleur dominante : orange sale et soleil dur, contre le bleu de la Terre.*

### Plan 01 — 0:00 à 0:09 · Plan d'ensemble, 18 mm
Référence : `references/sc01_plan01.jpg`
> `Extreme wide shot from inside the orbital graveyard. In the foreground, a dead rust-brown space tug (faded letters "KESTREL" on its flank) drifts among tumbling debris. Behind and below, Earth fills the lower half of the frame: dust storm over North Africa, night side with scattered city clusters. Harsh unfiltered sunlight from frame right, no atmosphere, pitch-black space. A tiny figure in a white EVA suit works on the tug's belly.` + règles communes
Mouvement : `very slow drift forward with a slight roll, debris rotating lazily`
Note : l'échelle compte. La silhouette de Balam doit être minuscule.

### Plan 02 — 0:09 à 0:16 · Plan moyen, 35 mm, caméra portée
> `Medium shot, handheld feel: BALAM in his EVA suit, magnetic boots on the hull of the dead tug, both arms buried to the elbow inside an open panel. Raking sunlight, hard black shadows, his helmet lamp lit. Suddenly the armor plate beside him tears loose without a sound and swings toward him; he pushes off with both legs.` + BALAM + règles communes
Mouvement : `handheld floating camera, sudden jolt as the plate breaks free`
Deux prises : l'arrêt sur le travail (3 s), puis la plaque qui part (4 s).

### Plan 03 — 0:16 à 0:22 · Plan large latéral, 24 mm
> `Wide side view, static camera: BALAM floats away from the hull at the end of a taut safety tether, spinning slowly. The massive armor plate passes less than a meter under his helmet, trailing wires and frozen dust. Earth is behind him, so he is a silhouette against blue.` + BALAM + règles communes
Mouvement : `static camera, the figure drifts through frame and rotates`

### Plan 04 — 0:22 à 0:29 · Insert, 85 mm macro
> `Extreme close-up of an EVA suit glove and forearm, a small rectangular wrist display glowing orange shows a countdown "07:18". Reflection of Earth's blue light on the scuffed fabric, tiny frozen dust particles drifting.` + règles communes, **sauf** retirer `no text`
Mouvement : `static, the last digit changes once`
Note : les générateurs écrivent mal les chiffres. Prévoir d'incruster le compte à rebours au montage sur un écran vierge.

### Plan 05 — 0:29 à 0:42 · Plan rapproché, 50 mm, lent travelling circulaire
> `Close shot circling slowly around BALAM working inside the tug's open cavity: a dark cylindrical regulator locked in a cracked ceramic mount. A cutting tool sparks once, white, then dies. The sun slides off the edge of the hull: the scene drops into deep shadow, lit only by his helmet lamp. He braces against a beam and pulls a cable; the ceramic cracks and the regulator slams into his chest.` + BALAM + règles communes
Deux prises : l'étincelle et la panne (5 s), le passage à l'ombre puis la céramique qui cède (7 s).
Note : le basculement du soleil à l'ombre est le moment lumière de la séquence. À soigner.

### Plan 06 — 0:42 à 0:50 · Plan d'ensemble, 35 mm, panoramique
> `Wide shot: a huge chunk of hull tears off the back of the dead tug and glides slowly across the face of Earth, a black silhouette against the blue planet. First tiny fragments of a debris cloud sparkle as they catch the sun.` + CIMETIÈRE + règles communes
Mouvement : `slow pan following the drifting chunk`

### Plan 07 — 0:50 à 1:00 · Plan subjectif (visière), 24 mm
> `First-person point of view through a curved helmet visor, gold-tinted edges darkening the frame borders. Gliding out of the wreck with suit thrusters, the orbital graveyard opens up: station rings, gutted transports, satellite clusters. A rival salvage ship sweeps a yellow searchlight beam across the wreckage in the middle distance.` + CIMETIÈRE + règles communes
Mouvement : `forward glide with small thruster corrections`
Note : ajouter le compte à rebours et les données de visière au montage.

### Plan 08 — 1:00 à 1:10 · Plan large, 28 mm, suivi latéral
> `Wide tracking shot: BALAM jets across open space toward his salvage ship docked under the tug's belly. Around him the debris cloud arrives: not a mass, a rain of tiny glints appearing too late, ten, then a hundred. One fragment punches straight through the tug two meters from him like a bullet through paper, spraying debris.` + BALAM + RÉCUPÉRATEUR + règles communes
Mouvement : `lateral tracking, camera shakes on the impact`

### Plan 09 — 1:10 à 1:17 · Plan de poursuite, 21 mm
> `Chase shot, camera ahead of the salvage ship looking back at it: the ship tears free from the dead tug, its docking arm ripping off and spinning away. Engines glowing, it dives into the graveyard, debris streaking past.` + RÉCUPÉRATEUR + règles communes
Mouvement : `camera pulled backward at speed, slight roll`

### Plan 10 — 1:17 à 1:24 · Plan fixe dans le passage, 24 mm
> `Static camera inside the narrow gap between two old habitat modules welded together by a collision; through their broken windows, a bed still bolted to a wall and colorful boxes floating in a net. The salvage ship flies straight at the camera on its side, its left flank scraping the module edge in a shower of sparks, and passes inches from the lens.` + RÉCUPÉRATEUR + règles communes
Note : plan spectaculaire, à générer en plusieurs essais.

### Plan 11 — 1:24 à 1:32 · Plan large, 50 mm, fixe
> `Calm wide shot: the small salvage ship drifts away toward a tired recovery relay station made of three rings around a central spine, lit with work lights, twenty salvage ships queuing around it. Earth below, peaceful from this distance.` + RÉCUPÉRATEUR + règles communes
Note : la liste des dégâts s'incruste au montage.

### Plan 12 — 1:32 à 1:44 · Plan rapproché cockpit, 35 mm
> `Over-the-shoulder shot inside a cramped, patched cockpit glowing warm orange: BALAM, helmet off, sweat and a grease smear on his face. His screens blank out for a fraction of a second, then the whole cockpit turns red with alarm lights. He freezes, recognizing something.` + BALAM (sans casque) + règles communes
Deux prises : le calme orange, puis la bascule au rouge.

### Plan 13 — 1:44 à 1:48 · Insert, 50 mm, plongée
> `Close-up looking down under a pilot seat: behind a loose floor plate, a small sealed box with a red seal knocks against its housing as the ship turns. Red alarm light.` + règles communes

### Plan 14 — 1:48 à 1:54 · Plan large téléobjectif, 200 mm
> `Long-lens shot compressing the graveyard: far away, a low wide ship with two separate engine nacelles cuts straight through the debris without hesitation, backlit by the sun, a faint blue scanning pulse around it.` + VAISSEAU DE GLIDE + CIMETIÈRE + règles communes
Mouvement : `static, heat-haze-free, the ship grows slightly larger`

---

## Séquence 07 · Korren
*Chapitre 14 — 1 min 54 — 10 plans. Contre-jour permanent : les visages restent dans l'ombre, Néréa éclaire les contours. Le souvenir de Pallas est désaturé.*

Note de réalisation : c'est la scène où le jeu d'acteur compte le plus. Les générateurs savent faire des silhouettes et des regards ; ils ont plus de mal avec les dialogues filmés. Garder les visages dans l'ombre, comme dans la previz, est à la fois un choix de mise en scène et une protection contre les défauts de l'outil.

### Plan 01 — 0:00 à 0:10 · Plan d'ensemble, silhouette, 35 mm
Référence : `references/sc07_plan01.jpg`
> `Wide shot of an empty observation gallery. GLIDE stands alone at the handrail, a black silhouette against the giant blue-and-white moon NÉRÉA filling the window. Station structures slide slowly across the moon's disc.` + GLIDE + GALERIE + règles communes
Mouvement : `static, imperceptible drift`

### Plan 02 — 0:10 à 0:18 · Plan rapproché, 85 mm
> `Close shot of GLIDE's webbed hand holding a small communicator; its screen glows soft blue on the wet grey skin, showing an unread message. He does not open it. Behind him, out of focus, a human figure enters the gallery.` + GLIDE + règles communes

### Plan 03 — 0:18 à 0:30 · Plan à deux, profils, 50 mm
> `Two-shot in profile against the window: GLIDE at the rail, BALAM standing a meter away, both faces in shadow, rim-lit in cold blue by NÉRÉA. Neither moves much. Tension, stillness.` + GLIDE + BALAM (veste) + GALERIE + règles communes
Mouvement : `very slow lateral dolly`

### Plan 04 — 0:30 à 0:42 · Gros plan Glide, 85 mm
> `Close-up of GLIDE's face in three-quarter profile, mostly in shadow, cold blue rim light along the broad skull and jaw, a single reflection in his large black eye, vibrissae trembling slightly. He is speaking quietly about someone he loved.` + GLIDE + règles communes
Mouvement : `imperceptible push in`

### Plan 05 — 0:42 à 0:56 · Souvenir, plan large, 24 mm, caméra portée
> `Desaturated, cold memory look. Inside a run-down mining relay dock with flickering neon tubes: KORREN, an old Alyde, bursts in swinging a heavy locking bar, knocks down a guard. A shot comes from an upper walkway. KORREN is hit in the shoulder, loses his footing and falls backward through a flickering, unstable containment field into open space, among floating ore blocks.` + KORREN + règles communes, ajouter `desaturated bleach-bypass grade, cold blue tint`
Trois prises : l'entrée de Korren, le tir, la chute à travers le champ.

### Plan 06 — 0:56 à 1:10 · Souvenir, cockpit, 35 mm puis insert
> `Desaturated memory. Inside the salvage ship cockpit, over BALAM's shoulder: on the screen, a small red suit beacon blinks in the top-left corner, far from the green jump window in the center. Then close-up on his hands: right hand on the control stick, left hand on the jump arming lever. The stick turns two or three degrees toward the beacon, then corrects back. The left hand arms the jump, then engages it.` + BALAM (jeune, sans trace de graisse) + règles communes, ajouter `desaturated bleach-bypass grade`
Deux prises : l'écran, puis les mains.
Note : c'est le plan le plus important du film. Les mains doivent raconter les quatre choix successifs.

### Plan 07 — 1:10 à 1:20 · Plan moyen, 35 mm, caméra portée
> `Medium shot in the gallery: GLIDE strikes BALAM once, not with full force; BALAM slams shoulder-first against the window glass and does not raise his hands. NÉRÉA behind them. Then GLIDE grabs him by the collar.` + GLIDE + BALAM (veste) + GALERIE + règles communes
Mouvement : `handheld, one hard jolt on the impact`

### Plan 08 — 1:20 à 1:32 · Champ / contrechamp serré, 85 mm
> Prise A : `Tight close-up over GLIDE's shoulder on BALAM pinned against the glass, blood at the corner of his lip, face half lit by a cold sliver of light, eyes steady.`
> Prise B : `Reverse tight close-up on GLIDE, face in shadow, fingers trembling on BALAM's collar, then letting go.`
+ fiches + règles communes

### Plan 09 — 1:32 à 1:42 · Plan d'ensemble, 28 mm
> `Wide shot of the gallery: GLIDE walks out of frame; BALAM remains alone, a small silhouette against the enormous moon.` + GALERIE + règles communes
Mouvement : `static`

### Plan 10 — 1:42 à 1:54 · Plan rapproché, chambre, 50 mm
> `Dim small cabin, humid air with fine mist hanging in the light. GLIDE stands facing a wall screen showing a station map; a soft blue light; a voice message plays (implied by a faint waveform on a side screen). He reaches out and switches off a small yellow icon on the map.` + GLIDE + règles communes

---

## Ce qu'il faudra faire à la main au montage

- Tous les textes à l'écran : comptes à rebours, listes de dégâts, interfaces, sous-titres.
- La bande-son : reprendre celle de la previz en attendant une vraie composition.
- Les raccords de couleur entre plans générés séparément, avec un étalonnage commun (une teinte orange pour Sol, bleu froid pour la galerie, désaturé pour Pallas).

## Coût indicatif en essais

Compter trois à six générations par plan avant d'en garder une, davantage pour Glide, pour le plan 10 de la séquence 01 et pour le plan 06 de la séquence 07. Pour 24 plans, prévoir une centaine de générations vidéo et autant d'images clés.

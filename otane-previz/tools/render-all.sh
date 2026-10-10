#!/bin/bash
# Rend toutes les séquences, trois à la fois.
cd "$(dirname "$0")/.."
mkdir -p out/video
SCENES=${@:-"00 01 02 03 04 05 06 07 08 09 10 11"}
printf '%s\n' $SCENES | xargs -P 3 -I{} sh -c 'node tools/render.mjs {} out/video/s{}.mp4 24 > out/video/s{}.log 2>&1'

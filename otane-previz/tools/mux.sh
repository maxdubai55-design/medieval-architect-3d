#!/bin/bash
# Assemble chaque séquence avec sa bande-son, puis la bobine complète.
# Produit aussi des versions « web » légères (moins de 15 Mo par séquence) pour le partage.
set -e
cd "$(dirname "$0")/.."
mkdir -p out/final out/web
LIST=out/final/liste.txt
: > "$LIST"
for v in out/video/s*.mp4; do
  id=$(basename "$v" .mp4)
  a="out/audio/$id.wav"
  ffmpeg -y -loglevel error -i "$v" -i "$a" -c:v copy -c:a aac -b:a 192k -shortest "out/final/$id.mp4"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$v")
  # débit vidéo calculé pour tenir sous 14 Mo avec le son
  vb=$(python3 -c "print(max(300, int((14*8*1024)/float($dur) - 96)))")
  ffmpeg -y -loglevel error -i "$v" -i "$a" -c:v libx264 -preset slow -b:v ${vb}k -maxrate ${vb}k -bufsize $((vb*2))k \
    -pix_fmt yuv420p -c:a aac -b:a 96k -shortest -movflags +faststart "out/web/$id.mp4"
  echo "file '$(pwd)/out/final/$id.mp4'" >> "$LIST"
  echo "$id ok ($(du -h out/web/$id.mp4 | cut -f1) web)"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$LIST" -c copy out/final/OTANE_previz_bobine_complete.mp4
ffmpeg -y -loglevel error -i out/final/OTANE_previz_bobine_complete.mp4 -c:v libx264 -preset slow -crf 27 -c:a aac -b:a 128k \
  -movflags +faststart out/final/OTANE_previz_bobine_legere.mp4
ls -la out/final out/web

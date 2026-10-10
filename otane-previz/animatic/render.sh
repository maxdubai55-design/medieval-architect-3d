#!/bin/bash
# Rend une scène clé : image, son, assemblage sous 28 Mo. Usage : bash animatic/render.sh sc1 1
set -e
c=$1; n=$2
python3 animatic/animatic.py cfg_$c out/animatic/$c.mp4 24 > out/animatic/$c.log 2>&1
python3 animatic/audio.py cfg_$c out/animatic/$c.wav >> out/animatic/$c.log 2>&1
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/animatic/$c.mp4)
vb=$(python3 -c "print(int((27.0*8*1024)/float($dur) - 128))")
ffmpeg -y -loglevel error -i out/animatic/$c.mp4 -i out/animatic/$c.wav -c:v libx264 -preset slow -b:v ${vb}k -maxrate $((vb*3/2))k -bufsize $((vb*2))k -pix_fmt yuv420p -c:a aac -b:a 128k -shortest -movflags +faststart "out/animatic/final/OTANE_storyboard_anime_scene_cle_$n.mp4"
echo "terminé $c" >> out/animatic/$c.log

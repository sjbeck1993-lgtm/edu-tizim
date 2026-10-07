#!/bin/bash
# ishlatish: ./render.sh W chiqish.mp4 audio.wav   (4 qismga boʻlib parallel render)
W=$1; OUT=$2; AUD=$3; D=$(dirname "$OUT")/.parts_$$; mkdir -p "$D"
for i in 0 1 2 3; do
  python3 video.py $W "$D/p$i.mp4" none $(python3 -c "print($i*22.5,($i+1)*22.5)") &
done; wait
for i in 0 1 2 3; do echo "file 'p$i.mp4'" >> "$D/list.txt"; done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$D/list.txt" -i "$AUD" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
rm -rf "$D"; echo done

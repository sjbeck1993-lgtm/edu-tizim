#!/bin/bash
# ishlatish: VOICE_JSON=... ./render_edit.sh W chiqish.mp4 audio.wav   — 4 qismga boʻlib parallel render, soʻng ovoz bilan birlashtirish
W=$1; OUT=$2; AUD=$3; D=$(dirname "$OUT")/.p_$$; mkdir -p "$D"
N=$(python3 -c "
import sys,os; sys.path.insert(0,'$(dirname "$0")'); import cues; c=cues.layout(cues.durs(os.environ.get('VOICE_JSON'))); print(int(c['end']*30)+1)")
Q=$(( (N+3)/4 ))
for i in 0 1 2 3; do
  A=$((i*Q)); B=$(( (i+1)*Q )); [ $B -gt $N ] && B=$N
  python3 "$(dirname "$0")/edit.py" $W video "$D/p$i.mp4" $A $B > "$D/log$i.txt" 2>&1 &
done; wait
for i in 0 1 2 3; do echo "file 'p$i.mp4'" >> "$D/list.txt"; done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$D/list.txt" -i "$AUD" -c:v copy -c:a aac -b:a 224k -shortest -movflags +faststart "$OUT"
rm -rf "$D"; echo rendered

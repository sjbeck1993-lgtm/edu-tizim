"""python3 voice_split.py voice.m4a [chiqish_papka]  — 7 gapni avtomatik ajratadi (jim joylardan)."""
import sys, os, re, json, subprocess
src=sys.argv[1]; out=sys.argv[2] if len(sys.argv)>2 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'voice')
os.makedirs(out,exist_ok=True); wav=os.path.join(out,'full.wav')
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',src,'-ac','1','-ar','48000','-af','highpass=f=70','-c:a','pcm_s16le',wav],check=True)
dur=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',wav],capture_output=True,text=True).stdout)
def segs(noise,minsil):
    r=subprocess.run(['ffmpeg','-hide_banner','-i',wav,'-af',f'silencedetect=noise={noise}dB:d={minsil}','-f','null','-'],capture_output=True,text=True).stderr
    st=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',r)]; en=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',r)]
    sp=[]; cur=0.0
    for i,s in enumerate(st):
        if s-cur>0.25: sp.append((cur,s))
        cur=en[i] if i<len(en) else dur
    if dur-cur>0.25: sp.append((cur,dur))
    return sp
best=None
for noise in (-40,-36,-32,-45):
    for minsil in (0.9,0.7,0.55,1.2):
        sp=segs(noise,minsil)
        if len(sp)==7: best=sp; break
    if best: break
if not best: print('7 ta gap topilmadi, topilgan:',segs(-38,0.7)); sys.exit(1)
durs=[]
for i,(a,b) in enumerate(best):
    a=max(a-0.15,0); b=min(b+0.2,dur)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(a),'-to',str(b),'-i',wav,'-af','afade=t=in:d=0.04,afade=t=out:d=0.12','-c:a','pcm_s16le',os.path.join(out,f'line{i+1}.wav')],check=True)
    durs.append(round(b-a,3))
json.dump({'durs':durs},open(os.path.join(out,'voice.json'),'w')); print('OK',durs)

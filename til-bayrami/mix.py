"""Ovoz: python3 mix.py chiqish.wav [musiqa_fayli]   (VOICE_JSON va voice/*.wav lardan foydalanadi)"""
import sys, os, subprocess, numpy as np, wave
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
import cues
VJ=os.environ.get('VOICE_JSON'); VD=os.path.dirname(VJ) if VJ else os.path.join(HERE,'voice')
C=cues.layout(cues.durs(VJ)); sr=48000; N=int(C['end']*sr)+sr; t=np.arange(N)/sr
def dec(args):
    r=subprocess.run(['ffmpeg','-loglevel','error']+args+['-f','f32le','-ac','2','-ar',str(sr),'-'],capture_output=True)
    return np.frombuffer(r.stdout,np.float32).reshape(-1,2).astype(np.float64)
def put(buf,x,t0,g=1.0):
    i=int(t0*sr); n=min(len(x),len(buf)-i)
    if n>0 and i>=0: buf[i:i+n]+=x[:n]*g
sm=lambda x: (lambda y: y*y*(3-2*y))(np.clip(x,0,1))
# --- ovoz (har gap cues dagi vaqtga qoʻyiladi)
voice=np.zeros((N,2)); starts=[C['s1'],C['s2'],C['s3'],C['s4'],C['s5'],C['s6'],C['s7']]
for i,s0 in enumerate(starts):
    x=dec(['-i',os.path.join(VD,f'line{i+1}.wav'),'-af','highpass=f=80,afftdn=nf=-30,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,equalizer=f=3000:t=q:w=1:g=2'])
    x=np.nan_to_num(x); r=np.sqrt(np.mean(x**2))+1e-9; x=x*(0.11/r)
    put(voice,x,s0)
env=np.convolve(np.abs(voice).mean(1),np.ones(int(sr*0.25))/int(sr*0.25),'same'); duck=1-0.62*np.clip(env/0.04,0,1)
duck=np.convolve(duck,np.ones(int(sr*0.4))/int(sr*0.4),'same')
# --- kadrlarning oʻz ovozi (atmosfera), sahnalar boʻylab
amb=np.zeros((N,2))
import importlib.util
os.environ.setdefault('VOICE_JSON',VJ or '')
src=open(os.path.join(HERE,'edit.py')).read()
# sahnalar roʻyxatini edit.py dagi build() dan olamiz (video qismini ishga tushirmasdan)
ns={}; exec(src[src.index("def build():"):src.index("SCN=build()")].replace("def build():","def build(C):").replace("s=C;","s=C;"),{'np':np},ns)
SCN=ns['build'](C)
for i,sc in enumerate(SCN):
    L=sc['L']; x=dec(['-ss',str(sc['ss']),'-t',f"{L*sc['speed']+0.3:.3f}",'-i',os.path.join(HERE,'clips',sc['clip']+'.mp4')])
    if len(x)==0: continue
    if sc['speed']<0.999:   # sekinlashtirilgan boʻlsa, ovozni cho'zmaymiz: kesib olamiz
        x=x[:int(L*sr)]
    n=len(x); tt=np.arange(n)/sr; a_in=sm(tt/max(sc['xf'],0.05)) if sc['xf']>0 else np.ones(n)
    nxt=(SCN[i+1]['xf'] if i+1<len(SCN) else 1.5); a_out=1-sm((tt-(L-nxt))/max(nxt,0.05))
    put(amb,x*(a_in*a_out)[:,None],sc['a'],0.55)
amb=amb*(0.55+0.45*(1-0.0))
# --- sintez effektlar: yurak urishi, flesh zarbasi, qoʻngʻiroqlar
fx=np.zeros(N)
for b in (C['s1']-0.6,C['s1']+0.1,C['s1']+1.0,C['s1']+1.7):
    x=np.clip(t-b,0,None); fx+=0.30*(t>=b)*np.sin(2*np.pi*(55+28*np.exp(-x*14))*x)*np.exp(-x*9)
HAS=len(sys.argv)>2 and os.path.exists(sys.argv[2])
if HAS: fx*=0.55
fl=C['flash']; x=np.clip(t-fl,0,None); fx+=(0.28 if HAS else 0.55)*(t>=fl)*np.sin(2*np.pi*(50+45*np.exp(-x*8))*x)*np.exp(-x*3.8)
rs=np.random.default_rng(1).standard_normal(N); ri=((t>=fl-3.2)&(t<fl))&(not HAS); rise=np.zeros(N); 
sw=np.zeros(N); yv=0.0
for i in range(int((fl-3.2)*sr),int(fl*sr)):
    k=0.01+0.35*((i/sr-(fl-3.2))/3.2)**2; yv+=k*(rs[i]-yv); sw[i]=yv
fx+=0.9*sw/(np.max(np.abs(sw))+1e-9)*(np.clip((t-(fl-3.2))/3.2,0,1)**2)*ri*0.28
def bell(t0,f,g=0.12,d=1.3):
    x=np.clip(t-t0,0,None); e=(t>=t0)*(1-np.exp(-x/0.004))*np.exp(-x/d)
    return g*e*(np.sin(2*np.pi*f*x)+0.35*np.sin(2*np.pi*f*2.76*x)*np.exp(-x*4)+0.2*np.sin(2*np.pi*f*5.4*x)*np.exp(-x*9))
if not HAS:
    for t0,f in ((fl+0.1,1046.5),(fl+0.9,1318.5),(fl+1.15,1568.0),(fl+1.4,2093.0),(fl+2.8,2637.0)): fx+=bell(t0,f,0.14,1.5)
fxs=np.stack([fx,np.roll(fx,60)],1)
# --- musiqa (ixtiyoriy)
mus=np.zeros((N,2))
if len(sys.argv)>2 and os.path.exists(sys.argv[2]):
    m=dec(['-i',sys.argv[2],'-af','loudnorm=I=-22:TP=-3:LRA=7']); 
    reps=int(np.ceil(N/len(m)))+1; m=np.tile(m,(reps,1))[:N]
    m*= (sm(t/0.5)*(1-sm((t-(C['end']-4.0))/4.0)))[:,None]; mus=m*(0.35+0.65*duck)[:,None]*1.0
else:
    # musiqa yoʻq: yumshoq pad (faqat vaqtinchalik)
    for k in range(int(C['end']//7.5)+1):
        t0=k*7.5
        for f in ((220,261.6,329.6),(174.6,220,261.6),(196,246.9,293.7),(164.8,196,246.9))[k%4]:
            e=np.clip((t-t0)/2.5,0,1)*np.clip((t0+8.5-t)/3,0,1)*(t>=t0); mus[:,0]+=0.014*e*np.sin(2*np.pi*f*t); 
    mus[:,1]=mus[:,0]; mus*=duck[:,None]*(1-sm((t-(C['end']-3.5))/3.5))[:,None]
print('nan:',[int(np.isnan(a).sum()) for a in (voice,amb,fxs,mus)]); voice,amb,fxs,mus=[np.nan_to_num(a) for a in (voice,amb,fxs,mus)]
out=voice+amb+fxs+mus
out*= (1-sm((t-(C['end']-1.2))/1.2))[:,None]
out=out[:int(C['end']*sr)]
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
tmp=sys.argv[1]+'.raw.wav'; 
w.writeframes((np.clip(out/ (np.max(np.abs(out))+1e-9)*0.9,-1,1)*32767).astype(np.int16).tobytes()); w.close()
r=subprocess.run(['ffmpeg','-hide_banner','-i',sys.argv[1],'-af','ebur128','-f','null','-'],capture_output=True,text=True).stderr
import re; I=float(re.findall(r'I:\s+(-?[\d.]+) LUFS',r)[-1]); g=-15.0-I
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',sys.argv[1],'-af',f'volume={g:.2f}dB,alimiter=limit=0.89:attack=5:release=60',tmp],check=True); os.replace(tmp,sys.argv[1]); print('mix ok',round(C['end'],1),'s, gain',round(g,1),'dB')

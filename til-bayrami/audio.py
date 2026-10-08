"""Musiqa/effektlar: python3 audio.py out.wav [voice.wav]  (voice boʻlsa ustiga qoʻyiladi, musiqa pasayadi)"""
import sys, os, json, wave, numpy as np
HERE=os.path.dirname(os.path.abspath(__file__)); TL=json.load(open(os.path.join(HERE,'timeline.json')))
sr=44100; D=TL['dur']; n=int(sr*D); t=np.arange(n)/sr; rng=np.random.default_rng(5)
def ex(t0,tau,att=0.004):
    x=np.clip(t-t0,0,None); return (t>=t0)*(1-np.exp(-x/att))*np.exp(-x/tau)
def lp_noise(f0,f1,t0,t1):
    # filtered noise with sweeping cutoff
    nz=rng.standard_normal(n); out=np.zeros(n); i0,i1=int(t0*sr),int(t1*sr); y=0.0
    for i in range(i0,i1):
        k=f0+(f1-f0)*((i-i0)/(i1-i0))**2; a=1-np.exp(-2*np.pi*k/sr); y+=a*(nz[i]-y); out[i]=y
    return out
y=np.zeros(n)
# pad: har 7.5 s da akkord
chords=[(220.0,261.63,329.63),(174.61,220.0,261.63),(196.0,246.94,293.66),(164.81,196.0,246.94)]
for k in range(int(D//7.5)+1):
    t0=k*7.5; ch=chords[k%4]
    for f in ch:
        for det in (-0.7,0.7):
            e=np.clip((t-t0)/2.5,0,1)*np.clip((t0+8.5-t)/3.0,0,1)*(t>=t0)
            y+=0.020*e*np.sin(2*np.pi*(f+det)*t)
        e=np.clip((t-t0)/2.5,0,1)*np.clip((t0+8.5-t)/3.0,0,1)*(t>=t0)
        y+=0.012*e*np.sin(2*np.pi*f*2*t)
# pad sahna boshlarida past (S1), 77 dan keyin ochiq
y*=0.55+0.45*np.clip((t-6)/10,0,1)
# yurak urishi
for b in TL['heartbeat']:
    x=np.clip(t-b,0,None); y+=0.5*(t>=b)*np.sin(2*np.pi*(58+30*np.exp(-x*14))*x)*np.exp(-x*9)
# raqam aylanishi: tezlashuvchi tiklar
r0,r1=TL['roll']; tt=r0
while tt<r1:
    y+=0.07*ex(tt,0.03,0.001)*np.sin(2*np.pi*1900*t); tt+=0.22-0.17*((tt-r0)/(r1-r0))
x=np.clip(t-TL['lock'],0,None); y+=0.55*(t>=TL['lock'])*np.sin(2*np.pi*(48+50*np.exp(-x*7))*x)*np.exp(-x*3.5)
def bell(t0,f,g=0.12,d=1.2):
    x=np.clip(t-t0,0,None); e=(t>=t0)*(1-np.exp(-x/0.004))*np.exp(-x/d)
    return g*e*(np.sin(2*np.pi*f*x)+0.35*np.sin(2*np.pi*f*2.76*x)*np.exp(-x*4)+0.2*np.sin(2*np.pi*f*5.4*x)*np.exp(-x*9))
y+=bell(TL['lock']+0.05,1046.5,0.1)
# zinapoya: koʻtariluvchi pentatonika
pent=[523.25,587.33,659.25,783.99,880.0,1046.5]
s0,s1=TL['steps']
for i,f in enumerate(pent): y+=bell(s0+0.2+(s1-s0-0.8)*i/5*1.0,f,0.09,0.9)
y+=bell(s1+0.3,1568.0,0.1,1.6)
# soʻz morf: yumshoq shamol
for tb in TL['morph'][1:]:
    i0=int((tb-0.3)*sr); seg=int(1.3*sr); w=lp_noise(300,2500,tb-0.3,tb+1.0)
    env=np.zeros(n); env[i0:i0+seg]=np.sin(np.linspace(0,np.pi,seg))**2; y+=0.18*w*env/ (np.max(np.abs(w))+1e-9)*4
y+=bell(TL['morph'][0]+0.1,659.25,0.08,1.5)
# yuridik karta: past droun-gul
y+=0.0
y+=bell(TL['legal'][0]+0.8,523.25,0.07,2.5)+bell(TL['legal'][0]+2.0,784.0,0.07,2.5)
# kitob: riser
b0,b1=TL['book']; fl=TL['flash']
w=lp_noise(200,6000,b0,fl); env=np.clip((t-b0)/(fl-b0),0,1)**2*(t<fl); y+=0.5*w/(np.max(np.abs(w))+1e-9)*env*0.7
y+=0.08*np.sin(2*np.pi*(200+700*np.clip((t-b0)/(fl-b0),0,1)**2)*t)*env
# flesh: zarba + qoʻngʻiroqlar
x=np.clip(t-fl,0,None); y+=0.7*(t>=fl)*np.sin(2*np.pi*(52+45*np.exp(-x*8))*x)*np.exp(-x*4)
for t0,f in [(fl+0.1,1046.5),(fl+0.9,1318.5),(fl+1.15,1568.0),(fl+1.4,2093.0)]: y+=bell(t0,f,0.16,1.4)
for f in (523.25,659.25,784.0,1046.5): y+=0.035*np.sin(2*np.pi*f*t)*ex(fl,3.5,0.2)
y+=bell(TL['shine'],2637.0,0.09,0.9)+bell(TL['shine']+0.15,3136.0,0.06,0.9)
c0=TL['cta'][0]; y+=bell(c0+1.2,1318.5,0.08,1.2)
y*=np.clip((D-t)/1.2,0,1)
y=y/np.max(np.abs(y))*0.8
mus=y
if len(sys.argv)>2:
    import subprocess
    raw=subprocess.run(['ffmpeg','-loglevel','error','-i',sys.argv[2],'-f','f32le','-ac','1','-ar',str(sr),'-'],capture_output=True).stdout
    v=np.frombuffer(raw,np.float32).astype(np.float64); v=v/ (np.max(np.abs(v))+1e-9)*0.9
    vv=np.zeros(n); vv[:min(n,len(v))]=v[:n]
    env=np.convolve(np.abs(vv),np.ones(int(sr*0.15))/int(sr*0.15),'same'); duck=1-0.65*np.clip(env/0.05,0,1)
    mus=mus*duck; y=np.clip(mus*0.8+vv,-1,1)
st=np.stack([y,np.roll(y,70)],1)
w=wave.open(sys.argv[1],'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()

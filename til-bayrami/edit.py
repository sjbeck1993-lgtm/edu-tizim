"""Montaj: python3 edit.py W still outdir t1 t2 ...   |   python3 edit.py W video out.mp4 f0 f1
Muhit: VOICE_JSON=ovoz hujjati (cues.py shu jadvaldan vaqtlarni hisoblaydi)."""
import sys, os, math, subprocess
import numpy as np
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
ARGS=sys.argv[1:]; W=int(ARGS[0]); MODE=ARGS[1]
sys.argv=['video.py',str(W)]
import video as V, cues
H=V.H; SC=V.SC; FPS=30
_vj=os.environ.get('VOICE_JSON'); C=cues.layout(cues.durs(_vj),mk=cues.marks(_vj))
V.TL['flash']=C['flash']; V.TL['cta']=[C['cta'],C['end']]
CREAM=np.array([1.0,0.955,0.86],np.float32); GOLD=np.array([0.97,0.76,0.30],np.float32)
PF=os.path.join(HERE,'fonts','PlayfairDisplay[wght].ttf'); CS=os.path.join(HERE,'fonts','CormorantSC-SemiBold.ttf')
@lru_cache(None)
def fnt(size,kind):
    if kind=='pf':
        f=ImageFont.truetype(PF,max(4,int(round(size*SC)))); f.set_variation_by_name('SemiBold'); return f
    return ImageFont.truetype(CS,max(4,int(round(size*SC))))
V.font=lambda size: fnt(size,'pf')      # zastavkadagi CTA ham shu shriftda
@lru_cache(None)
def tm(text,size,sp,kind):
    f=fnt(size,kind); asc,desc=f.getmetrics(); pad=int(16*SC)+2; s=sp*SC
    wt=int((f.getlength(text) if s==0 else sum(f.getlength(c) for c in text)+s*(len(text)-1)))+2*pad
    im=Image.new('L',(wt,asc+desc+2*pad),0); d=ImageDraw.Draw(im)
    if s==0: d.text((pad,pad),text,font=f,fill=255)
    else:
        x=pad
        for c in text: d.text((x,pad),c,font=f,fill=255); x+=f.getlength(c)+s
    return np.asarray(im,np.float32)/255
@lru_cache(None)
def shd(text,size,sp,kind):
    m=tm(text,size,sp,kind); im=Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9*SC))
    return np.asarray(im,np.float32)/255
def put(fr,text,size,x,y,color,a,kind='pf',sp=0,left=False,dy=0.0):
    if a<=0.004: return
    m=tm(text,size,sp,kind); h,w=m.shape; pad=int(16*SC)+2
    x0=(x*SC-pad) if left else (x*SC-w/2); y0=(y+dy)*SC-h/2
    V.blit(fr,shd(text,size,sp,kind),x0+3*SC,y0+5*SC,(0,0,0),a*0.65)
    V.blit(fr,m,x0,y0,color,a)
def hline(fr,x0,x1,y,p,a,color=GOLD):
    xs=np.arange(int(x0*SC),int((x0+(x1-x0)*p)*SC)); yy=int(y*SC)
    if len(xs)<2: return
    for k in (-1,0,1):
        al=(1.0 if k==0 else 0.3)*a; fr[yy+k,xs]=fr[yy+k,xs]*(1-al)+np.asarray(color,np.float32)*al
sm=V.sm; eo=V.eo; seg=V.seg
def env(t,a,b,fi=0.6,fo=0.6): return seg(t,a,a+fi)*(1-seg(t,b-fo,b))
yy_=np.linspace(0,1,H,dtype=np.float32)[:,None]
SCRIM=(0.72*sm((yy_-0.38)/0.62))[...,None]*np.ones((1,W,1),np.float32)
VIG=(1-0.42*np.clip(np.hypot((V.xx-W/2)/(W*0.62),(V.yy-H/2)/(H*0.66)),0,1.2)**2.2)[...,None].astype(np.float32)
rg=np.random.default_rng(3); GRAIN=[(rg.standard_normal((H,W,1))*0.024).astype(np.float32) for _ in range(6)]
x=np.linspace(0,1,256); s_=x*x*(3-2*x); cur=x*0.62+s_*0.38
LUT=np.stack([np.clip(cur**0.97*1.035,0,1),np.clip(cur**1.0*1.0,0,1),np.clip(cur**1.05*0.955+0.012,0,1)],1)
LUT=(LUT*255+0.5).astype(np.uint8)
def grade(b):
    u=(np.clip(b,0,1)*255).astype(np.uint8); o=LUT[u,np.arange(3)].astype(np.float32)/255
    g=(o*np.array([0.3,0.59,0.11],np.float32)).sum(2,keepdims=True); o=g+(o-g)*1.10
    # bloom
    sm_=Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8)).resize((max(W//4,2),max(H//4,2)),Image.BILINEAR)
    a=np.asarray(sm_,np.float32)/255; lum=(a*np.array([0.3,0.59,0.11],np.float32)).sum(2,keepdims=True)
    hi=a*np.clip((lum-0.55)*2.4,0,1); bl=Image.fromarray((np.clip(hi,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5*SC)).resize((W,H),Image.BILINEAR)
    o=o+np.asarray(bl,np.float32)/255*np.array([1.0,0.9,0.72],np.float32)*0.55
    return np.clip(o,0,1)*VIG

# ------------------ sahnalar
def build():
    s=C; d=s['d']; m5=s['m5']; S=[]
    def add(clip,a,ss,xf,z0=1.0,z1=1.08,pan=(0.0,0.0)): S.append(dict(clip=clip,a=a,ss=ss,xf=xf,z0=z0,z1=z1,pan=pan))
    add('01',0.0,0.3,0.0,1.0,1.10)
    add('05',s['s2']-0.8,0.2,0.9,1.0,1.07)
    add('08',s['s2']+s['m2'][2]-0.5,2.0,0.9,1.0,1.06)
    add('07',s['s3']-0.4,0.8,0.8,1.02,1.08)
    add('02',s['s4']-0.7,5.2,0.9,1.0,1.06)
    add('06',s['s5']+m5[0]-0.3,1.2,0.5,1.0,1.08)
    add('05',s['s5']+m5[1]-0.2,6.0,0.35,1.0,1.10)
    add('03',s['s5']+m5[2]-0.2,3.2,0.35,1.0,1.08)
    add('04',s['s5']+m5[3]-0.2,5.5,0.4,1.0,1.08)
    add('10',s['s6']-0.6,2.2,0.8,1.0,1.06)
    add('09',s['s6']+1.9,3.0,0.7,1.0,1.07)
    add('12',s['a12'],0.0,0.9,1.16,1.08,(0.0,-1.0))
    add('11',s['a11'],0.3,1.0,1.0,1.12)
    for i,sc in enumerate(S):
        end=(S[i+1]['a']+S[i+1]['xf']) if i+1<len(S) else s['flash']+1.6
        sc['L']=end-sc['a']; sc['speed']=float(np.clip((10.0-sc['ss']-0.1)/sc['L'],0.55,1.0)); sc['i']=i
    return S
SCN=build()
CACHE={}
def frames(sc):
    if sc['i'] not in CACHE:
        for k in [k for k in CACHE if k<sc['i']-1]: del CACHE[k]
        dur=sc['L']*sc['speed']+0.4
        r=subprocess.run(['ffmpeg','-loglevel','error','-ss',str(sc['ss']),'-t',f'{dur:.3f}','-i',os.path.join(HERE,'clips',sc['clip']+'.mp4'),'-an','-vf','fps=24,scale=1280:720','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True)
        CACHE[sc['i']]=np.frombuffer(r.stdout,np.uint8).reshape(-1,720,1280,3)
    return CACHE[sc['i']]
def sframe(sc,t):
    F=frames(sc); lt=t-sc['a']; idx=max(lt,0)*sc['speed']*24; i0=int(idx); fr=idx-i0; n=len(F)
    a=F[min(i0,n-1)]; b=F[min(i0+1,n-1)]
    img=(a.astype(np.float32)*(1-fr)+b.astype(np.float32)*fr).astype(np.uint8) if fr>0.02 else a
    p=sm(lt/sc['L']); z=sc['z0']+(sc['z1']-sc['z0'])*p
    cw,ch=1280/z,720/z; cx=640+sc['pan'][0]*(1280-cw)/2; cy=360+sc['pan'][1]*(720-ch)/2
    box=(cx-cw/2,cy-ch/2,cx+cw/2,cy+ch/2)
    im=Image.fromarray(img).resize((W,H),Image.LANCZOS,box=box).filter(ImageFilter.UnsharpMask(radius=1.4*SC+0.3,percent=55,threshold=2))
    return np.asarray(im,np.float32)/255
def compose(t):
    k=max(i for i,sc in enumerate(SCN) if sc['a']<=t)
    sc=SCN[k]; al=1.0 if sc['xf']==0 else float(sm((t-sc['a'])/sc['xf']))
    cur=sframe(sc,t)
    if al>=1.0 or k==0: return cur
    return sframe(SCN[k-1],t)*(1-al)+cur*al

# ------------------ yozuvlar
def titles(fr,t):
    c=C; d=c['d']; sc=np.zeros(1)
    scrim=0.0
    # ONA
    a=env(t,c['s1']-0.3,c['s2']-0.2,0.9,0.7)
    if a>0:
        put(fr,'ONA',330,960,505,CREAM,a,sp=60,dy=(1-eo(seg(t,c['s1']-0.3,c['s1']+0.9)))*30)
        hline(fr,830,1090,690,eo(seg(t,c['s1']+0.5,c['s1']+1.6)),a)
    # SANA
    a=env(t,c['s2']+c['m2'][0],c['s3']-0.1)
    if a>0:
        fr*= (1-SCRIM*a)
        r=lambda t0,dur=0.9: (1-eo(seg(t,t0,t0+dur)))*34
        put(fr,'1989',250,150,655,CREAM,a*sm(seg(t,c['s2']+c['m2'][0],c['s2']+c['m2'][0]+0.8)),left=True,dy=r(c['s2']+c['m2'][0]))
        put(fr,'21-OKTABR',62,158,850,GOLD,a*sm(seg(t,c['s2']+c['m2'][1],c['s2']+c['m2'][1]+0.8)),kind='cs',sp=16,left=True,dy=r(c['s2']+c['m2'][1]))
        hline(fr,158,560,898,eo(seg(t,c['s2']+c['m2'][1]+0.4,c['s2']+c['m2'][1]+1.5)),a)
        put(fr,'«Davlat tili haqida»gi qonun qabul qilindi',50,158,958,CREAM,a*sm(seg(t,c['s2']+c['m2'][2],c['s2']+c['m2'][2]+1.0)),left=True,dy=r(c['s2']+c['m2'][2]))
    # QADAM
    a=env(t,c['s3']+0.1,c['s4']-0.5)
    if a>0:
        fr*= (1-SCRIM*a)
        r=lambda t0: (1-eo(seg(t,t0,t0+0.9)))*34
        put(fr,'Milliy mustaqillik sari',80,150,815,CREAM,a*sm(seg(t,c['s3']+0.1,c['s3']+1.0)),left=True,dy=r(c['s3']+0.1))
        put(fr,'muhim qadam',130,150,950,GOLD,a*sm(seg(t,c['s3']+0.9,c['s3']+1.9)),left=True,dy=r(c['s3']+0.9))
    # NON / VATAN / KITOB
    s5=c['s5']; m5=c['m5']
    for w,t0,t1 in (('NON',m5[0],m5[1]),('VATAN',m5[1],m5[2]),('KITOB',m5[2],m5[3])):
        a=env(t,s5+t0-0.15,s5+t1-0.05,0.3,0.3)
        if a>0:
            fr*= (1-SCRIM*a*0.9)
            put(fr,w,240,150,900,CREAM,a,sp=22,left=True,dy=(1-eo(seg(t,s5+t0-0.15,s5+t0+0.5)))*40)
    # MODDA (yorqin osmon ustida toʻq siyoh)
    a=env(t,c['a12']+0.9,c['a11']-0.5,0.8,0.8)
    if a>0:
        INK=np.array([0.10,0.07,0.05],np.float32); GINK=np.array([0.42,0.25,0.04],np.float32)
        r=lambda t0: (1-eo(seg(t,t0,t0+0.9)))*26
        def ink(text,size,y,col,aa,kind='pf',sp=0,dy=0):
            m=tm(text,size,sp,kind); h,w=m.shape; V.blit(fr,m,960*SC-w/2,(y+dy)*SC-h/2,col,aa)
        ink('Oʻzbekiston Respublikasining',54,82,INK,a*sm(seg(t,c['a12']+0.9,c['a12']+1.9)),dy=r(c['a12']+0.9))
        ink('davlat tili oʻzbek tilidir.',74,158,GINK,a*sm(seg(t,c['a12']+1.9,c['a12']+3.0)),dy=r(c['a12']+1.9))
        ink('«DAVLAT TILI HAQIDA»GI QONUN  ·  1-MODDA',30,222,INK*1.4,a*sm(seg(t,c['a12']+3.0,c['a12']+4.0)),kind='cs',sp=7)
    return fr

def render(n):
    t=n/FPS; c=C; fl=c['flash']
    base=grade(compose(t)) if t<fl+1.7 else None
    if base is not None: base=titles(base,t)
    if t>=fl-0.1:
        logo=V.logo_scene(t)
        R=V.lmaxd*3.2*eo(seg(t,fl,fl+1.5)); dd=np.hypot(V.xx-V.SXc,V.yy-V.SYc); m=sm((R-dd)/(V.lmaxd*0.12))[...,None]
        out=(base*(1-m)+logo*m) if base is not None else logo; out=out+(1-out)*float(math.exp(-((t-fl-0.12)/0.2)**2)*0.75)
    else: out=base
    if t<fl-0.1: out=out+GRAIN[n%6]*(0.35+0.65*(1-out.mean(2,keepdims=True)))
    f=float(sm((t-(c['end']-0.8))/0.8)); out=out*(1-f)+f
    f0=1-float(sm(t/1.0)); out=out*(1-f0)
    return (np.clip(out,0,1)*255).astype(np.uint8)

if MODE=='still':
    od=ARGS[2]; os.makedirs(od,exist_ok=True)
    for ts in ARGS[3:]: Image.fromarray(render(int(float(ts)*FPS))).save(os.path.join(od,f's_{ts}.png'))
else:
    out=ARGS[2]; f0=int(ARGS[3]); f1=int(ARGS[4])
    cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p',out]
    p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    for n in range(f0,f1):
        p.stdin.write(render(n).tobytes())
        if (n-f0)%90==0: print(n,flush=True)
    p.stdin.close(); p.wait()

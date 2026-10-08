"""RMMM Yangiqoʻrgʻon — Oʻzbek tili bayrami videosi (kinetik tipografiya).
python3 video.py W out.mp4 audio.wav|none [t0 t1]      — video
python3 video.py W still outdir t1 t2 ...              — alohida kadrlar
"""
import sys, os, json, math, subprocess, numpy as np
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERE=os.path.dirname(os.path.abspath(__file__))
TL=json.load(open(os.path.join(HERE,'timeline.json')))
LOGO=os.path.join(HERE,'logo.jpg')
FONT='/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
W=int(sys.argv[1]); H=W*9//16; SC=W/1920; FPS=30; DUR=TL['dur']
GOLD=np.array([0.97,0.73,0.18],np.float32); CREAM=np.array([1.0,0.96,0.86],np.float32)
NAVY=np.array([0.055,0.105,0.24],np.float32); GREEN=np.array([0.3,0.69,0.31],np.float32)

def clip(x,a=0.,b=1.): return np.minimum(np.maximum(x,a),b)
def seg(t,a,b): return float(clip((t-a)/(b-a)))
def sm(x): x=clip(x); return x*x*(3-2*x)
def eo(x): x=clip(x); return 1-(1-x)**3
def io(x): return sm(x)
def fade(t,a,b,c,d): return seg(t,a,b)*(1-seg(t,c,d))

@lru_cache(None)
def font(size): return ImageFont.truetype(FONT,max(4,int(round(size*SC))))
@lru_cache(None)
def tmask(text,size,spacing=0.0):
    f=font(size); asc,desc=f.getmetrics(); pad=int(12*SC)+2; sp=spacing*SC
    if sp==0: wt=int(f.getlength(text))+2*pad
    else: wt=int(sum(f.getlength(c) for c in text)+sp*(len(text)-1))+2*pad
    im=Image.new('L',(wt,asc+desc+2*pad),0); d=ImageDraw.Draw(im)
    if sp==0: d.text((pad,pad),text,font=f,fill=255)
    else:
        x=pad
        for c in text: d.text((x,pad),c,font=f,fill=255); x+=f.getlength(c)+sp
    return np.asarray(im,np.float32)/255
def tw(text,size,spacing=0.0): return tmask(text,size,spacing).shape[1]
def blit(buf,mask,x,y,color,a):
    x=int(round(x)); y=int(round(y)); h,w=mask.shape
    x0=max(x,0); y0=max(y,0); x1=min(x+w,buf.shape[1]); y1=min(y+h,buf.shape[0])
    if x1<=x0 or y1<=y0 or a<=0.003: return
    m=mask[y0-y:y1-y,x0-x:x1-x]*a
    if buf.ndim==3:
        s=buf[y0:y1,x0:x1]; s+=(np.asarray(color,np.float32)-s)*m[...,None]
    else: buf[y0:y1,x0:x1]+=m
def blur(a,r):
    x=np.clip(a,0,1); im=Image.fromarray((x*255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(max(r,0.6))),np.float32)/255

yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
CX,CY=W/2,H*0.5
dcen=np.hypot(xx-CX,yy-CY)
BG=np.zeros((H,W,3),np.float32)
rg=clip(np.hypot((xx-CX)/(W*0.62),(yy-H*0.46)/(H*0.78)))
BG[...]=(np.array([0.085,0.14,0.30])[None,None,:]*(1-rg[...,None])**1.4+np.array([0.02,0.03,0.075])[None,None,:]*(1-(1-rg[...,None])**1.4))

def draw(D,G,text,cx,cy,size,color,a=1.,glow=0.5,spacing=0.,dy=0.):
    m=tmask(text,size,spacing); h,w=m.shape
    x=cx*SC-w/2; y=(cy+dy)*SC-h/2
    blit(D,m,x,y,color,a)
    if glow>0: blit(G,m,x,y,1,a*glow)
def draw_words(D,G,words,cy,size,colors,t,t0,step,a=1.,rise=34,glow=0.35,gap=0.28):
    f=font(size); sp=f.getlength(' ')*0+size*SC*gap
    ws=[tw(w,size)-2*(int(12*SC)+2) for w in words]; total=sum(ws)+sp*(len(words)-1); x=CX-total/2
    for i,(w,c) in enumerate(zip(words,colors)):
        p=seg(t,t0+i*step,t0+i*step+0.55); m=tmask(w,size); pad=int(12*SC)+2
        yy_=cy*SC-m.shape[0]/2+(1-eo(p))*rise*SC
        blit(D,m,x-pad,yy_,c,a*sm(p)); 
        if glow: blit(G,m,x-pad,yy_,1,a*sm(p)*glow)
        x+=ws[i]+sp

def stamp(P,xs,ys,cols,al):
    rad=max(1,int(round(SC))); offs=[(0,0,1.0)]+[(dx,dy,0.45) for dx,dy in ((rad,0),(-rad,0),(0,rad),(0,-rad))]
    for ox,oy,k in offs:
        x=xs+ox; y=ys+oy; x0=np.floor(x).astype(int); y0=np.floor(y).astype(int); fx=x-x0; fy=y-y0
        for dx,dy,wt in ((0,0,(1-fx)*(1-fy)),(1,0,fx*(1-fy)),(0,1,(1-fx)*fy),(1,1,fx*fy)):
            xi=x0+dx; yi=y0+dy; ok=(xi>=0)&(xi<W)&(yi>=0)&(yi<H)
            if not ok.any(): continue
            idx=(yi*W+xi)[ok]; w=(wt*al*k)[ok]
            for c in range(3): P[c]+=np.bincount(idx,weights=w*cols[ok,c],minlength=H*W).reshape(H,W)

rng=np.random.default_rng(11)
# global dust
ND=80; dx0=rng.uniform(0,W,ND); dy0=rng.uniform(0,H,ND); dsp=rng.uniform(8,26,ND)*SC; dph=rng.uniform(0,6.3,ND)
def dust(P,t,a):
    ys=(dy0-t*dsp)%H; al=a*0.55*(0.5+0.5*np.sin(t*1.7+dph))
    stamp(P,dx0+8*SC*np.sin(t*0.3+dph),ys,np.tile(GOLD,(ND,1)),al)

# ---------- particle targets
def sample_mask(mask,ox,oy,n,seed,thr=0.5):
    ys,xs=np.where(mask>thr); r=np.random.default_rng(seed); i=r.choice(len(xs),n,replace=len(xs)<n)
    return np.stack([xs[i]+ox+r.uniform(-.5,.5,n),ys[i]+oy+r.uniform(-.5,.5,n)],1).astype(np.float32)
NP1=1700
m=tmask('ONA',560,40); ONA_T=sample_mask(m,CX-m.shape[1]/2,CY-m.shape[0]/2,NP1,1)
r=np.random.default_rng(2); ang=r.uniform(0,6.28,NP1); rad_=r.uniform(0.55,1.1,NP1)*W*0.62
ONA_S=np.stack([CX+rad_*np.cos(ang),CY+rad_*np.sin(ang)*0.8],1).astype(np.float32)
ONA_D=r.uniform(0,0.45,NP1); ONA_A=r.uniform(0.55,1,NP1); ONA_C=r.uniform(-1,1,NP1)
def hb(t):
    return sum(math.exp(-((t-b)/0.09)**2) for b in TL['heartbeat'])
def move(S,Tg,Dly,Cv,t,t0,t1,stag):
    dur=(t1-t0)-stag; p=io(clip((t-t0-Dly*stag/0.45)/dur)) if stag>0 else io(clip((t-t0)/dur))
    pos=S+(Tg-S)*p[:,None]
    d=Tg-S; perp=np.stack([-d[:,1],d[:,0]],1)/ (np.linalg.norm(d,axis=1,keepdims=True)+1e-6)
    pos=pos+perp*(np.sin(p*np.pi)*Cv*120*SC)[:,None]
    return pos,p

# ---------- logo scene (oq fon)
X0,Y0,X1,Y1=80,150,580,446
S_L=2.0*SC
im=Image.open(LOGO).convert('RGB').crop((X0,Y0,X1,Y1)); lw,lh=int(im.width*S_L),int(im.height*S_L)
im=im.resize((lw,lh),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2,percent=80,threshold=2))
L=np.asarray(im).astype(np.float32)/255; L=np.where(L.min(2,keepdims=True)>0.93,1.0,L)
LOX=(W-lw)//2; LOY=int(105*SC)
lcx,lcy=(329-X0)*S_L,(252-Y0)*S_L; rowsplit=(388-Y0)*S_L; line_split=(416-Y0)*S_L
ly_,lx_=np.mgrid[0:lh,0:lw].astype(np.float32); ldist=np.hypot(lx_-lcx,ly_-lcy); lmaxd=np.hypot(max(lcx,lw-lcx),lcy)
SXc,SYc=lcx+LOX,lcy+LOY
th=np.arctan2(yy-SYc,xx-SXc); rr=np.hypot(xx-SXc,yy-SYc)
emb=(L.min(2)<0.9)&(ly_<rowsplit)
EMB_T=sample_mask(emb.astype(np.float32),LOX,LOY,3600,5,0.5)
_ys=np.clip((EMB_T[:,1]-LOY).astype(int),0,lh-1); _xs=np.clip((EMB_T[:,0]-LOX).astype(int),0,lw-1)
EMB_C=np.clip(L[_ys,_xs]*1.05,0,1).astype(np.float32)
r=np.random.default_rng(6); N2=len(EMB_T); ang=r.uniform(0,6.28,N2); rad_=r.uniform(0.5,1.2,N2)*W*0.6
EMB_S=np.stack([CX+rad_*np.cos(ang),CY+rad_*np.sin(ang)*0.75],1).astype(np.float32)
EMB_D=r.uniform(0,0.45,N2); EMB_CV=r.uniform(-1,1,N2)
NS=46; pa=rng.uniform(np.pi*1.03,np.pi*1.97,NS); pr0=rng.uniform(0.25,0.9,NS)*lh*0.9
pspd=rng.uniform(0.25,0.7,NS)*lh; pph=rng.uniform(0,6.28,NS); pst=rng.uniform(1.0,3.4,NS); psz=rng.uniform(3,9,NS)*S_L/2.4
def logo_scene(t):
    lt=t-TL['flash']+0.5
    G=np.zeros((H,W),np.float32)
    G+=0.42*eo((lt+0.4)/1.0)*(1-0.45*sm((lt-1.6)/1.6))*np.exp(-(rr/(lh*0.55))**2)
    ray_t=sm((lt-0.35)/0.9); up=sm((-np.sin(th)-0.05)/0.5)
    pat=0.5+0.5*np.sin(th*22+lt*0.9); pat2=0.5+0.5*np.sin(th*9-lt*0.5)
    reach=lh*(0.35+0.85*eo((lt-0.35)/1.2))
    G+=0.42*ray_t*up*(pat**3*0.7+pat2**2*0.3)*np.exp(-(rr/reach)**2.2)*sm((rr-lh*0.05)/(lh*0.12))*(0.85+0.15*np.sin(lt*3))
    sp=np.zeros((H,W),np.float32)
    for k in range(NS):
        tk=lt-pst[k]*0.45
        if tk<0: continue
        rd=pr0[k]*0.3+pspd[k]*tk*0.55; px=SXc+rd*np.cos(pa[k]); py=SYc+rd*np.sin(pa[k])
        life=math.exp(-tk*0.35)*(0.5+0.5*math.sin(lt*6+pph[k]))
        if life<0.03: continue
        sz=psz[k]; a0,a1=int(max(px-4*sz,0)),int(min(px+4*sz,W)); b0,b1=int(max(py-4*sz,0)),int(min(py+4*sz,H))
        if a1<=a0 or b1<=b0: continue
        gx=xx[b0:b1,a0:a1]-px; gy=yy[b0:b1,a0:a1]-py
        sp[b0:b1,a0:a1]+=life*(np.exp(-(gx*gx+gy*gy)/(2*sz*sz))+0.5*np.exp(-(np.minimum(abs(gx),abs(gy))/(sz*0.35))**2)*np.exp(-np.hypot(gx,gy)/(sz*3)))
    G=np.clip(G+0.9*sp*sm((lt-0.4)/0.4),0,1)
    bg=1-G[...,None]*(1-GOLD)[None,None,:]
    m_e=(sm(((lmaxd*eo((lt-0.45)/1.5))-ldist)/(lmaxd*0.10))*(ly_<rowsplit+6)).astype(np.float32)
    tx0,tx1=(92-X0)*S_L-10,(567-X0)*S_L+10
    def wipe(a,b):
        p=eo((lt-a)/(b-a)); sf=lw*0.06+1; edge=(tx0-sf)+(tx1-tx0+2*sf)*p
        return sm((edge-lx_)/sf)*(p>0)
    M=np.maximum(m_e,np.maximum(wipe(1.9,2.9)*(ly_>=rowsplit+6)*(ly_<line_split),wipe(2.25,3.25)*(ly_>=line_split))).astype(np.float32)
    lay=1-M[...,None]*(1-L)
    sh=(lt-3.3)/0.8
    if 0<sh<1:
        d=((lx_/lw)+(ly_/lh)*0.35)-(-0.3+1.6*sh); s=np.exp(-(d/0.07)**2)*0.75; lay=lay+(1-lay)*s[...,None]
    cv=bg.copy(); cv[LOY:LOY+lh,LOX:LOX+lw]*=lay
    lp=eo((lt-1.5)/0.9)
    if lp>0:
        ly=int(LOY+(381-Y0)*S_L); half=int(lw*0.42*lp); xs_=np.arange(max(W//2-half,0),min(W//2+half,W))
        fd=(1-np.abs(xs_-W//2)/max(half,1))**0.8
        for d_ in (-1,0,1):
            a=(0.9 if d_==0 else 0.35)*fd; cv[ly+d_,xs_]=cv[ly+d_,xs_]*(1-a[:,None])+GOLD[None,:]*0.95*a[:,None]
    # CTA
    c0,c1=TL['cta']
    if t>c0:
        D2=cv; G2=np.zeros((H,W),np.float32)
        p1=seg(t,c0,c0+0.9)
        draw(D2,G2,'Sizning eng aziz oʻzbekcha soʻzingiz qaysi?',960,H/SC*0.0+815,70,NAVY,a=sm(p1),glow=0,dy=(1-eo(p1))*28)
        p2=seg(t,c0+1.2,c0+2.0)
        if p2>0:
            bw=tw('IZOHDA YOZING',50,6)/SC+110; bh=92
            cxp,cyp=960,935; x0=int((cxp-bw/2)*SC); x1=int((cxp+bw/2)*SC); y0=int((cyp-bh/2)*SC); y1=int((cyp+bh/2)*SC)
            pill=np.zeros((H,W),np.float32); pil=Image.new('L',(W,H),0); ImageDraw.Draw(pil).rounded_rectangle((x0,y0,x1,y1),radius=int(bh*SC/2),fill=255)
            pill=np.asarray(pil,np.float32)/255*sm(p2)
            D2[...]=D2*(1-pill[...,None])+GOLD*pill[...,None]
            draw(D2,G2,'IZOHDA YOZING',cxp,cyp-2,50,NAVY,a=sm(p2),glow=0,spacing=6)
    return cv

# ---------- dark scenes
def dark(t):
    D=BG.copy(); G=np.zeros((H,W),np.float32); P=np.zeros((3,H,W),np.float32)
    dust(P,t,1.0)
    T=TL
    # S1 ONA
    if t<T['ona_out'][1]:
        a=1-seg(t,*T['ona_out']); f0,f1=T['ona_form']
        pos,p=move(ONA_S,ONA_T,ONA_D,ONA_C,t,f0,f1,0.9)
        jit=(1-p)[:,None]*0
        shim=0.5+0.5*np.sin(t*5+ONA_C*9)
        pa_=ONA_A*(0.35+0.65*p)*a*(1-0.85*sm((t-3.2)/1.0))
        stamp(P,pos[:,0],pos[:,1],np.tile(GOLD,(NP1,1)),pa_*(0.7+0.3*shim))
        solid=sm((t-2.6)/1.0)*a; pulse=hb(t)
        draw(D,G,'ONA',960,540,560,CREAM*0.92+GOLD*0.08,a=solid,glow=0.55+0.5*pulse,spacing=40)
        if t>3.0: G+=0.0
    # S2 date
    d_a=fade(t,T['roll'][0]-0.3,T['roll'][0]+0.3,*T['date_out'])
    if d_a>0:
        p=eo(seg(t,*T['roll'])); n=int(1900+89*p); s=str(n); slot=tw('0',400)-2*(int(12*SC)+2)
        slotw=slot/SC
        for i,ch in enumerate(s):
            draw(D,G,ch,960+(i-1.5)*slotw*0.98,430,400,GOLD*0.9+CREAM*0.1,a=d_a,glow=0.7)
        dt=t-T['lock']
        if 0<dt<1.4:
            rr_=dt*1100*SC; ring=np.exp(-((dcen-rr_)/(9*SC))**2)*math.exp(-2.6*dt); G+=ring*0.9
        po=seg(t,*T['oct']); 
        if po>0:
            draw(D,G,'21-OKTABR',960,680,128,CREAM,a=d_a*sm(po),glow=0.3,spacing=14,dy=(1-eo(po))*36)
            lw_=int(900*SC*eo(po)); ly=int(752*SC)
            if lw_>2:
                xs_=np.arange(W//2-lw_//2,W//2+lw_//2); fd=(1-np.abs(xs_-W//2)/(lw_/2+1))**0.6
                for k in (-1,0,1):
                    a=(1.0 if k==0 else 0.3)*fd*d_a; D[ly+k,xs_]=D[ly+k,xs_]*(1-a[:,None])+GOLD*a[:,None]; G[ly+k,xs_]+=0.4*a
        pl=seg(t,*T['law'])
        if pl>0:
            draw_words(D,G,['«Davlat','tili','haqida»gi','qonun'],850,74,[CREAM]*4,t,T['law'][0],0.28,a=d_a,glow=0.25)
    # S3 steps
    s_a=fade(t,T['steps'][0]-0.2,T['steps'][0]+0.5,*T['steps_out'])
    if s_a>0:
        pts=[]; x,y=470,880
        pts=[(x,y)]
        for k in range(6):
            x+=170; pts.append((x,y))
            if k<5: y-=62; pts.append((x,y))
        pts=np.array(pts,np.float32)*SC; segl=np.linalg.norm(np.diff(pts,axis=0),axis=1); cum=np.concatenate([[0],np.cumsum(segl)])
        prog=io(seg(t,*T['steps']))*cum[-1]
        pil=Image.new('L',(W,H),0); dr=ImageDraw.Draw(pil); head=None
        for i in range(len(pts)-1):
            if prog<=cum[i]: break
            f=min(1,(prog-cum[i])/segl[i]); q=pts[i]+(pts[i+1]-pts[i])*f
            dr.line([tuple(pts[i]),tuple(q)],fill=255,width=max(2,int(7*SC))); head=q
        lm=np.asarray(pil,np.float32)/255
        D[...]+= (GOLD-D)*(lm*s_a)[...,None]; G+=lm*s_a*0.8
        if head is not None:
            hh=np.exp(-(((xx-head[0])**2+(yy-head[1])**2)/(2*(14*SC)**2))); G+=hh*1.4*s_a
            D[...]+= (CREAM-D)*(np.exp(-(((xx-head[0])**2+(yy-head[1])**2)/(2*(6*SC)**2)))*s_a)[...,None]
        t0=T['steps_text']
        draw_words(D,G,['Milliy','mustaqillik','sari'],250,100,[CREAM]*3,t,t0,0.45,a=s_a)
        draw_words(D,G,['qoʻyilgan','muhim','qadam'],390,100,[CREAM,GOLD,GOLD],t,t0+1.6,0.5,a=s_a,glow=0.5)
    # S4 morph words
    mw=T['morph_words']; mb=T['morph']
    if mb[0]-0.3<t<T['til_out'][1]:
        a_all=seg(t,mb[0]-0.3,mb[0]+0.4)*(1-seg(t,*T['til_out']))
        size=400; spc=26
        def lay(w):
            f=font(size); adv=[f.getlength(c)/SC for c in w]; tot=sum(adv)+spc*(len(w)-1); x=960-tot/2; out=[]
            for c,a_ in zip(w,adv): out.append((x+a_/2,520,c)); x+=a_+spc
            return out
        idx=max(i for i in range(len(mb)) if t>=mb[i]-0.0) if t>=mb[0] else 0
        # progress morph from word idx-1 to idx during 0.9s after mb[idx]
        Lw=lay(mw[idx]); mp=io(seg(t,mb[idx]+(0.0 if idx==0 else -0.0),mb[idx]+1.0)) if idx>0 else 1.0
        if idx==0:
            pa0=eo(seg(t,mb[0],mb[0]+1.2))
            for (x,y,c) in Lw: draw(D,G,c,x,y,size,CREAM,a=a_all*pa0,glow=0.6,dy=(1-pa0)*40)
        else:
            Lp=lay(mw[idx-1]); n=max(len(Lp),len(Lw))
            for i in range(n):
                if i<len(Lp) and i<len(Lw):
                    x=Lp[i][0]+(Lw[i][0]-Lp[i][0])*mp; y=Lp[i][1]+(Lw[i][1]-Lp[i][1])*mp-math.sin(mp*math.pi)*50
                    if Lp[i][2]==Lw[i][2]: draw(D,G,Lw[i][2],x,y,size,CREAM,a=a_all,glow=0.6)
                    else:
                        draw(D,G,Lp[i][2],x,y,size,CREAM,a=a_all*(1-mp),glow=0.6); draw(D,G,Lw[i][2],x,y,size,CREAM,a=a_all*mp,glow=0.6)
                elif i<len(Lw): draw(D,G,Lw[i][2],Lw[i][0],Lw[i][1],size,CREAM,a=a_all*mp,glow=0.6,dy=(1-mp)*60)
                else: draw(D,G,Lp[i][2],Lp[i][0],Lp[i][1],size,CREAM,a=a_all*(1-mp),glow=0.6,dy=-mp*60)
        # gold sweep on final TIL
        if idx==len(mw)-1 and t>T['orbit']-1.0:
            G+=0.0
        # orbit
        ow=['ona','alla','non','vatan','kitob','ruh','umid','orzu','qalb','soʻz']
        for k,w in enumerate(ow):
            ap=seg(t,T['orbit']+k*0.18,T['orbit']+k*0.18+1.0)*(1-seg(t,*T['til_out']))
            if ap<=0: continue
            thk=2*math.pi*k/len(ow)+0.28*(t-T['orbit']); x=960+760*math.cos(thk); y=520+330*math.sin(thk)
            depth=0.5+0.5*(math.sin(thk)+1)/2
            draw(D,G,w,x,y,62,GOLD*0.6+CREAM*0.4,a=ap*depth,glow=0.25)
        # subtitles handled below
    # S5 legal
    l0,l1=T['legal']
    la=fade(t,l0,l0+1.2,l1-1.2,l1)
    if la>0:
        pil=Image.new('L',(W,H),0); dr=ImageDraw.Draw(pil); bx0,by0,bx1,by1=[v*SC for v in (230,250,1690,830)]
        gp=eo(seg(t,l0,l0+1.4)); ext=70*SC*gp; wd=max(2,int(5*SC))
        for (cx_,cy_,sx,sy) in ((bx0,by0,1,1),(bx1,by0,-1,1),(bx0,by1,1,-1),(bx1,by1,-1,-1)):
            dr.line([(cx_,cy_),(cx_+sx*ext,cy_)],fill=255,width=wd); dr.line([(cx_,cy_),(cx_,cy_+sy*ext)],fill=255,width=wd)
        lm=np.asarray(pil,np.float32)/255*la; D+=(GOLD-D)*lm[...,None]; G+=lm*0.7
        draw(D,G,'Oʻzbekiston Respublikasining',960,445,96,CREAM,a=la*sm(seg(t,l0+0.6,l0+1.8)),glow=0.3,dy=(1-eo(seg(t,l0+0.6,l0+1.8)))*30)
        draw(D,G,'davlat tili oʻzbek tilidir.',960,585,106,GOLD*0.95+CREAM*0.05,a=la*sm(seg(t,l0+1.6,l0+3.0)),glow=0.55,dy=(1-eo(seg(t,l0+1.6,l0+3.0)))*30)
        draw(D,G,'«DAVLAT TILI HAQIDA»GI QONUN, 1-MODDA',960,745,40,GOLD*0.8+CREAM*0.2,a=la*sm(seg(t,l0+3.0,l0+4.2)),glow=0.15,spacing=5)
    # S6 book particles
    b0,b1=T['book']
    if b0-0.3<t<T['flash']+1.6:
        fa=1-seg(t,T['flash']+0.1,T['flash']+0.9)
        pos,p=move(EMB_S,EMB_T,EMB_D,EMB_CV,t,b0,b1,1.6)
        shim=0.82+0.18*np.sin(t*7+EMB_CV*11)
        stamp(P,pos[:,0],pos[:,1],EMB_C*1.0,(0.15+0.85*p)*shim*fa*0.95)
        g=sm((t-(b1-1.5))/(T['flash']-(b1-1.5)))
        G+=0.9*g*np.exp(-(np.hypot(xx-SXc,yy-SYc)/(lh*0.45))**2)
    # subtitles
    for s0,s1,txt in T['subs']:
        sa=fade(t,s0,s0+0.35,s1-0.35,s1)
        if sa>0:
            lines=txt.split('\n'); base=965-(len(lines)-1)*36
            for i,ln in enumerate(lines):
                draw(D,G,ln,960,base+i*72,60,CREAM,a=sa,glow=0.0)
    # compose
    Gb=blur(G,10*SC); D+=Gb[...,None]*GOLD*0.9
    Pt=np.transpose(P,(1,2,0)); D+=Pt
    Pg=blur(Pt*2.5,4*SC); D+=Pg*1.6
    return np.clip(D,0,1)

def frame(t):
    T=TL; fl=T['flash']
    D=dark(t) if t<fl+1.8 else None
    if t>=fl-0.1:
        Wc=logo_scene(t)
        R=lmaxd*2.1*eo(seg(t,fl,fl+1.5)); soft=lmaxd*0.12
        dd=np.hypot(xx-SXc,yy-SYc); m=sm((R-dd)/soft)
        out=Wc if D is None else D*(1-m[...,None])+Wc*m[...,None]
        flash=math.exp(-((t-fl-0.12)/0.2)**2)*0.75
        out=out+(1-out)*flash
    else: out=D
    f=sm((t-(DUR-0.7))/0.7)
    out=out*(1-f)+f*(1.0 if t>fl else 0.0)
    return (np.clip(out,0,1)*255).astype(np.uint8)

if __name__=='__main__':
    if sys.argv[2]=='still':
        os.makedirs(sys.argv[3],exist_ok=True)
        for ts in sys.argv[4:]:
            Image.fromarray(frame(float(ts))).save(os.path.join(sys.argv[3],f'f_{ts}.png'))
    else:
        out,aud=sys.argv[2],sys.argv[3]; t0=float(sys.argv[4]) if len(sys.argv)>4 else 0.0; t1=float(sys.argv[5]) if len(sys.argv)>5 else DUR
        cmd=['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-']
        if aud!='none': cmd+=['-ss',str(t0),'-t',str(t1-t0),'-i',aud]
        cmd+=['-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart']
        cmd+=(['-c:a','aac','-b:a','192k','-shortest'] if aud!='none' else ['-an']); cmd+=[out]
        p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
        for i in range(int((t1-t0)*FPS)):
            p.stdin.write(frame(t0+i/FPS).tobytes())
            if i%150==0: print(round(t0+i/FPS,1),flush=True)
        p.stdin.close(); p.wait()

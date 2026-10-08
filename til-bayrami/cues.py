"""Ovoz gaplari uzunligi va musiqa zarbasidan montaj vaqtlarini hisoblaydi (video va audio bir xil jadvaldan foydalanadi)."""
import json, os
HERE=os.path.dirname(os.path.abspath(__file__))
DEFAULT=[1.0,7.2,4.2,2.8,7.0,2.8,4.2]
BASE=dict(pre=1.4,g1=1.5,g2=1.0,g3=1.4,g4=1.2,g5=1.2,h12=4.3,h11=6.4,hf=4.8)
WGT=dict(pre=1.4,g1=1.0,g2=1.0,g3=1.2,g4=1.2,g5=1.4,h12=1.0,h11=1.0,hf=1.9)
def durs(path=None):
    p=path or os.path.join(HERE,'voice','voice.json')
    if os.path.exists(p): return json.load(open(p))['durs']
    return DEFAULT
def music():
    p=os.path.join(HERE,'music','music.json')
    return json.load(open(p)) if os.path.exists(p) else None
def layout(d, flash_target='auto'):
    m=music()
    if flash_target=='auto': flash_target=(m['impact']-0.10) if m else None
    b=dict(BASE)
    f0=sum(b.values())+sum(d[:5])
    if flash_target is not None:
        extra=flash_target-f0; sw=sum(WGT.values())
        for k in b: b[k]=max(b[k]+extra*WGT[k]/sw, 0.5*BASE[k])
    c={'d':d,'b':b}; c['s1']=b['pre']; c['s2']=c['s1']+d[0]+b['g1']; c['s3']=c['s2']+d[1]+b['g2']; c['s4']=c['s3']+d[2]+b['g3']
    c['s5']=c['s4']+d[3]+b['g4']; c['s6']=c['s5']+d[4]+b['g5']
    c['a12']=c['s6']+b['h12']; c['a11']=c['a12']+b['h11']; c['flash']=c['a11']+b['hf']; c['s7']=c['flash']+3.2
    c['cta']=c['s7']-0.4; c['end']=c['s7']+d[6]+3.8
    return c

"""Ovoz gaplari uzunligidan butun montaj vaqtlarini hisoblaydi (video va audio bir xil jadvaldan foydalanadi)."""
import json, os
HERE=os.path.dirname(os.path.abspath(__file__))
DEFAULT=[1.0,7.2,4.2,2.8,7.0,2.8,4.2]
def durs(path=None):
    p=path or os.path.join(HERE,'voice','voice.json')
    if os.path.exists(p): return json.load(open(p))['durs']
    return DEFAULT
def layout(d):
    c={}; c['s1']=1.4; c['s2']=c['s1']+d[0]+1.5; c['s3']=c['s2']+d[1]+1.0; c['s4']=c['s3']+d[2]+1.4
    c['s5']=c['s4']+d[3]+1.2; c['s6']=c['s5']+d[4]+1.2
    c['a12']=c['s6']+4.3; c['a11']=c['a12']+6.4; c['flash']=c['a11']+4.8; c['s7']=c['flash']+3.2
    c['cta']=c['s7']-0.4; c['end']=c['s7']+d[6]+3.8; c['d']=d
    return c

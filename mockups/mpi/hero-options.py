# Builds the Hero.dc.html board sheet: three animated hero options (copy column unchanged, new visual).
# Usage: python3 hero-options.py <live Main.dc.html> <out Hero.dc.html>
import sys
src=open(sys.argv[1]).read()
helmet=src[src.index('<helmet>'):src.index('</helmet>')]
KF=[];RULES=[];BASE=[]
def anim(p,T):
    def kf(name,segs):
        name=f'h{p}_{name}'
        segs=sorted(segs,key=lambda s:s[0])
        KF.append(f'@keyframes {name}{{'+''.join(f'{round(100*min(max(t,0),T)/T,2)}%{{{c}}}' for t,c in segs)+'}')
        return name
    def rule(sel,name): RULES.append(f'.h{p} {sel}{{animation-name:{name}}}')
    BASE.append(f'.h{p} .a{{animation-duration:{T}s;animation-timing-function:cubic-bezier(.2,.8,.2,1);animation-iteration-count:infinite;animation-fill-mode:both}}')
    n=[0]
    def show(t_in,t_out,frm='translateY(10px)',to='none',d=.45,cls=None):
        """Hidden until t_in, visible until t_out. Returns a class name to put next to 'a'."""
        n[0]+=1; c=cls or f'k{n[0]}'
        segs=[(0,f'opacity:0;transform:{frm}'),(t_in,f'opacity:0;transform:{frm}'),(t_in+d,f'opacity:1;transform:{to}'),(t_out,f'opacity:1;transform:{to}'),(t_out+.4,f'opacity:0;transform:{to}'),(T,f'opacity:0;transform:{to}')]
        rule('.'+c,kf(c,segs)); return c
    def custom(segs):
        n[0]+=1; c=f'k{n[0]}'; rule('.'+c,kf(c,segs)); return c
    def words(text,t0,t1,t_out,cls='w'):
        ws=text.split(); step=(t1-t0)/max(len(ws)-1,1)
        return ''.join(f'<span class="a {cls} {show(t0+i*step,t_out,"translateY(5px)",d=.25)}">{w}</span> ' for i,w in enumerate(ws))
    return kf,rule,show,custom,words
BRAKES='/_blob/26bfaa3e7ad07135277bc88e69d3d678'; TECH='/_blob/2cdf35438068f580d84e16a251b7f588'
MIC='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>'
CHK='<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'
def wave(on_cls): return '<div class="hwave">'+''.join(f'<i class="{on_cls}" style="--h:{h}"></i>' for h in [2,3.5,5,2.5,4.5,2,3,5,2.5,4,2,3.5,2.8,4.6])+'</div>'

# ---------------- H1: one finding travels tech -> advisor -> customer ----------------
T=10; kf,rule,show,custom,words=anim(1,T)
END=9.3
VW=[]
for i in range(34):
    import math
    h=0.35+0.65*abs(math.sin(i*1.7)*math.cos(i*.45))
    VW.append(f'.h1 .vw .b{i}{{height:{round(14+h*62)}px;animation-delay:-{round((i*0.137)%0.9,2)}s;animation-duration:{round(0.7+(i%5)*0.08,2)}s}}')
vamp=custom([(0,'opacity:.35;transform:scaleY(.14)'),(0.4,'opacity:.35;transform:scaleY(.14)'),(0.7,'opacity:1;transform:scaleY(1)'),(3.0,'opacity:1;transform:scaleY(1)'),(3.4,'opacity:.35;transform:scaleY(.14)'),(T,'opacity:.35;transform:scaleY(.14)')])
BARS=''.join(f'<i class="b{i}"></i>' for i in range(34))
def hl(t):
    return custom([(0,'background-size:0% 100%'),(t,'background-size:0% 100%'),(t+.35,'background-size:100% 100%'),(END,'background-size:100% 100%'),(END+.4,'background-size:0% 100%'),(T,'background-size:0% 100%')])
seq=[('Rear',None),('brake',None),('pads',None),('are',None),('at',None),('two',None),('millimeters.',None),('They',None),('need',None),('replacing.',None)]
tw=[0.75+i*0.24 for i in range(len(seq))]
def W(i): return f'<span class="a w {show(tw[i],END,"translateY(6px)",d=.25)}">{seq[i][0]}</span>'
DIM=custom([(0,'opacity:1'),(3.55,'opacity:1'),(3.8,'opacity:.3'),(END,'opacity:.3'),(END+.4,'opacity:1'),(T,'opacity:1')])
VSAID=f'<span class="vhl a {hl(3.1)}"><span class="a {DIM}">{W(0)} {W(1)} {W(2)}</span></span> {W(3)} {W(4)} <span class="vhl a {hl(3.25)}"><span class="a {DIM}">{W(5)} {W(6)}</span></span> {W(7)} {W(8)} {W(9)}'
CA=(-6,394); CB=(-6,428)
talk_on=custom([(0,'background:#333132;transform:scale(1)'),(0.4,'background:#333132;transform:scale(1)'),(0.6,'background:#b9314f;transform:scale(1.08)'),(3.0,'background:#b9314f;transform:scale(1.08)'),(3.2,'background:#333132;transform:scale(1)'),(T,'background:#333132;transform:scale(1)')])
wv=custom([(0,'opacity:0'),(0.5,'opacity:0'),(0.7,'opacity:1'),(3.0,'opacity:1'),(3.2,'opacity:0'),(T,'opacity:0')])
def fly(t0,t1,x0,y0,x1,y1):
    return custom([(0,f'opacity:0;transform:translate({x0}px,{y0}px) scale(.9)'),(t0-.05,f'opacity:0;transform:translate({x0}px,{y0}px) scale(.9)'),(t0+.1,f'opacity:1;transform:translate({x0}px,{y0}px) scale(1)'),(t0+(t1-t0)*.5,f'opacity:1;transform:translate({(x0+x1)/2}px,{min(y0,y1)-40}px) scale(1.06)'),(t1,f'opacity:1;transform:translate({x1}px,{y1}px) scale(1)'),(t1+.15,f'opacity:0;transform:translate({x1}px,{y1}px) scale(.9)'),(T,f'opacity:0;transform:translate({x1}px,{y1}px) scale(.9)')])
btn=custom([(0,'background:#f2f1f1;color:#333132'),(7.05,'background:#f2f1f1;color:#333132'),(7.25,'background:#78bc61;color:#000'),(END,'background:#78bc61;color:#000'),(END+.4,'background:#f2f1f1;color:#333132'),(T,'background:#f2f1f1;color:#333132')])
lbl1=show(7.1,END,'translateY(6px)'); lbl0=custom([(0,'opacity:1'),(7.05,'opacity:1'),(7.15,'opacity:0'),(END,'opacity:0'),(END+.4,'opacity:1'),(T,'opacity:1')])
fing=custom([(0,'opacity:0;transform:translate(0,30px) scale(1)'),(6.4,'opacity:0;transform:translate(0,30px) scale(1)'),(6.8,'opacity:.9;transform:translate(0,0) scale(1)'),(6.95,'opacity:.9;transform:translate(0,0) scale(1)'),(7.05,'opacity:.9;transform:translate(0,0) scale(.75)'),(7.25,'opacity:.9;transform:translate(0,0) scale(1)'),(7.6,'opacity:0;transform:translate(0,0) scale(1)'),(T,'opacity:0;transform:translate(0,0) scale(1)')])
def stepl(i,t0,t1,txt):
    c=custom([(0,'color:#5d7189'),(t0,'color:#5d7189'),(t0+.3,'color:#fff'),(t1,'color:#fff'),(t1+.3,'color:#5d7189'),(T,'color:#5d7189')])
    b=custom([(0,'background:#22364f;color:#A0B3C6'),(t0,'background:#22364f;color:#A0B3C6'),(t0+.3,'background:#2DD4BF;color:#0F2137'),(t1,'background:#2DD4BF;color:#0F2137'),(t1+.3,'background:#22364f;color:#A0B3C6'),(T,'background:#22364f;color:#A0B3C6')])
    return f'<div class="xst a {c}"><b class="a {b}">{i}</b>{txt}</div>'
h1=f'''<div class="hv h1 h1v">
 <div class="lap1"><div class="xlid"><div class="lscr">
   <div class="lhd"><b>RO 587, 2023 Rogue</b><span class="lpill a {show(4.7,END,'scale(.9)','scale(1)')}">{CHK}Line added</span></div>
   <div class="lsub">SERVICE LINES</div>
   <div class="xlrow old"><span class="xlno">A</span><span>Oil and filter change</span><span class="lp">Customer request</span></div>
   <div class="xlrow new a {show(4.45,END,'translateX(-14px)')}"><span class="xlno r">1</span><img src="{BRAKES}" alt=""><span><b>Replace rear brake pads</b><small>Brake pads, rear: 2 mm</small></span><span class="lp">$289</span></div>
   <div class="xlrow ghost"></div>
 </div></div><div class="lbase"></div></div>
 <div class="voice">
   <div class="vw a {vamp}">{BARS}</div>
   <div class="vsaid">{VSAID}</div>
 </div>
 <div class="hp cp1"><div class="scr">
   <div class="xbrand"><span class="yd"><svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="sumg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b5fa8"/><stop offset="1" stop-color="#173a6b"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#sumg)"/><path d="M5 23.5 12.6 11l3.6 5.6 2.6-3.8L27 23.5Z" fill="#fff"/><path d="M5 23.5c5.5-2.4 11.5-2.4 22 0" fill="none" stroke="#e8b04b" stroke-width="1.6" stroke-linecap="round"/></svg></span><span><b>Summit Auto</b><small>(555) 010-2030</small></span></div>
   <div class="ct">Your 2023 Rogue</div>
   <div class="xccard a {show(5.75,END,'translateY(40px)')}"><img src="{BRAKES}" alt=""><div class="cb"><div class="xcn"><b>Rear brake pads</b><span class="now">Now</span></div><p>Your rear pads are down to 2 mm. Replacing them now keeps the rotors from wearing.</p><div class="cbtn"><span>Decline</span><span class="ap a {btn}"><i class="a {lbl0}">Approve $289</i><i class="a {lbl1} xtwo">{CHK.replace('#000','#000')}Approved</i></span></div></div></div>
   <div class="xtot a {show(7.35,END,'translateY(12px)')}">Approved total <b>$289</b></div>
   <span class="xfing a {fing}"></span>
 </div></div>
 <span class="xchip a {fly(3.6,4.4,CA[0],CA[1],196,128)}">Rear brake pads</span>
 <span class="xchip a {fly(3.75,4.45,CB[0],CB[1],330,146)}"><span class="xdot r"></span>2 mm</span>
 <span class="xchip a {fly(5.05,5.75,226,166,434,330)}"><span class="xdot r"></span>Rear brake pads $289</span>
 <div class="steps">{stepl(1,0.3,3.6,'Tech says it')}{stepl(2,3.7,5.3,'&nbsp;RO updates')}{stepl(3,5.4,END,'Customer approves')}</div>
</div>'''
CSS1='''
.yd,.lg4,.lg4.sm,.bh4.dk .lg4{background:none;padding:0;overflow:hidden;color:transparent}
.yd svg,.lg4 svg{display:block}
.h1v{width:656px;height:680px}
.lap1{position:absolute;left:160px;top:0;width:440px}
.lap1 .xlid{background:#333132;border-radius:14px 14px 4px 4px;padding:12px;box-shadow:0 40px 80px -30px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.08)}
.lap1 .lscr{background:#fff;border-radius:4px;height:250px;padding:16px 18px;color:#333132;font-size:12px;overflow:hidden}
.lap1 .lbase{height:12px;margin:0 -22px;background:#2a2829;border-radius:0 0 12px 12px}
.lhd{display:flex;justify-content:space-between;align-items:center}.lhd b{font-size:15px}
.lpill{display:inline-flex;align-items:center;gap:5px;background:#78bc61;color:#000;font-weight:700;font-size:11px;padding:4px 10px;border-radius:99px}.lpill svg{width:11px;height:11px}
.lsub{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9b9799;margin:14px 0 8px}
.xlrow{display:flex;align-items:center;gap:10px;border-radius:10px;background:#f2f1f1;padding:8px 10px;margin-bottom:7px;min-height:22px}
.xlrow .lp{margin-left:auto;font-weight:700;font-size:12px}.xlrow.old .lp{font-weight:500;color:#9b9799}
.xlrow img{width:38px;height:38px;border-radius:7px;object-fit:cover}
.xlrow b{display:block;font-size:13px}.xlrow small{color:#9b9799;font-size:11px}
.xlrow.new{background:#fff;box-shadow:0 0 0 1.5px #b9314f inset,0 10px 24px -14px rgba(0,0,0,.4)}
.xlrow.ghost{background:none;border:1.5px dashed #dedcdd;height:36px}
.xlno{width:20px;height:20px;border-radius:6px;background:#dedcdd;display:grid;place-items:center;font-weight:800;font-size:11px;flex:0 0 20px}.xlno.r{background:#333132;color:#fff}
.hp{position:absolute;border-radius:34px;background:#333132;padding:9px;box-shadow:0 40px 80px -30px rgba(0,0,0,.85),0 0 0 1px rgba(255,255,255,.08)}
.hp .scr{position:relative;height:100%;border-radius:26px;overflow:hidden;background:#fff;color:#333132}
.hp .scr.dk{background:#1d1c1d;color:#fff}
.voice{position:absolute;left:0;top:300px;width:290px;z-index:3}
.xvlab{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#A0B3C6}
.vw{display:flex;align-items:center;gap:4px;width:272px;height:84px;margin:10px 0 12px;transform-origin:center}
.vw i{width:4px;border-radius:3px;background:linear-gradient(180deg,#2DD4BF,#2A9D8F);animation-name:hvw;animation-iteration-count:infinite;animation-timing-function:ease-in-out;box-shadow:0 0 12px rgba(45,212,191,.35)}
@keyframes hvw{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
.vsaid{font-size:25px;line-height:1.28;font-weight:700;color:#fff}.vsaid .w{display:inline-block}
.vhl{background-image:linear-gradient(rgba(185,49,79,.55),rgba(185,49,79,.55));background-repeat:no-repeat;background-position:0 100%;border-radius:4px;padding:0 2px;margin:0 -2px}

.cp1{left:448px;top:200px;width:208px;height:420px;z-index:3}
.xph{padding:20px 18px 0}.xph b{display:block;font-size:16px}.xph small{color:#9b9799;font-size:11px}
.said{padding:18px 18px 0;font-size:19px;line-height:1.3;font-weight:600;min-height:150px}
.said .w{display:inline-block}
.ftile{margin:6px 14px 0;background:#b9314f;color:#fff;border-radius:14px;padding:12px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}.ftile b{margin-left:auto;font-size:18px}
.ftile .xdot{background:#fff}
.xdot{width:9px;height:9px;border-radius:50%;display:inline-block;flex:0 0 9px}.xdot.r{background:#b9314f}.xdot.y{background:#ffd23f}.xdot.g{background:#78bc61}
.pdock{position:absolute;left:0;right:0;bottom:18px;display:flex;flex-direction:column;align-items:center;gap:8px}
.pmic{width:56px;height:56px;border-radius:50%;display:grid;place-items:center}.pmic svg{width:24px;height:24px}
.hwave{display:flex;align-items:flex-end;gap:3px;height:18px}
.hwave i{width:3px;height:calc(var(--h)*3.4px);background:#fff;border-radius:2px;opacity:.6}
.xbrand{display:flex;gap:8px;align-items:center;padding:18px 14px 0}.xbrand b{display:block;font-size:12px}.xbrand small{font-size:10px;color:#9b9799}
.yd{width:28px;height:28px;border-radius:8px;background:#333132;color:#fff;font-weight:800;font-size:11px;display:grid;place-items:center}
.ct{font-weight:800;font-size:17px;padding:12px 14px 8px}
.xccard{margin:0 10px;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px #dedcdd,0 14px 30px -16px rgba(0,0,0,.4)}
.xccard img{width:100%;height:96px;object-fit:cover;display:block}
.cb{padding:10px 11px 11px}.xcn{display:flex;justify-content:space-between;align-items:center}.xcn b{font-size:13px}
.now{background:#b9314f;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px}
.cb p{font-size:10.5px;line-height:1.35;color:#5b5859;margin:6px 0 9px}
.cbtn{display:flex;gap:6px}.cbtn>span{flex:1;text-align:center;font-size:11px;font-weight:700;padding:8px 0;border-radius:10px;background:#f2f1f1;position:relative}
.cbtn .ap{flex:1.4;height:14px}.ap i{position:absolute;inset:8px 0;font-style:normal;display:flex;align-items:center;justify-content:center;gap:4px}.ap svg{width:11px;height:11px}
.xtot{position:absolute;left:10px;right:10px;bottom:14px;background:#333132;color:#fff;border-radius:12px;padding:10px 12px;font-size:11px;display:flex;justify-content:space-between;align-items:center}.xtot b{font-size:15px}
.xfing{position:absolute;left:128px;top:322px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.75);box-shadow:0 0 0 2px rgba(0,0,0,.25);z-index:9}
.xchip{position:absolute;left:0;top:0;z-index:8;display:inline-flex;align-items:center;gap:7px;background:#fff;color:#333132;font-weight:700;font-size:12px;padding:7px 12px;border-radius:99px;box-shadow:0 14px 30px -10px rgba(0,0,0,.7)}
.steps{position:absolute;left:0;right:0;top:648px;display:flex;justify-content:space-between}
.xst{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600}.xst b{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px}
'''
# ---------------- H2: the checklist fills itself while the tech talks ----------------
T=9; kf,rule,show,custom,words=anim(2,T); END=8.3
ROWS=[('Exterior lights','g','OK'),('Horn','g','OK'),('Wiper blades','g','OK'),('Battery','g','Pass'),('Tires, front','y','4/32"'),('Tires, rear','g','7/32"'),('Wheel balance','y','Recommend'),('Brake pads, rear','r','2 mm')]
times=[1.0,1.35,1.7,2.3,3.6,3.9,4.6,5.6]
COL={'g':'#78bc61','y':'#ffd23f','r':'#b9314f'}
rows=''
for (n,c,v),t in zip(ROWS,times):
    d=custom([(0,'background:#dedcdd;transform:scale(1)'),(t,'background:#dedcdd;transform:scale(1)'),(t+.15,f'background:{COL[c]};transform:scale(1.5)'),(t+.4,f'background:{COL[c]};transform:scale(1)'),(END,f'background:{COL[c]};transform:scale(1)'),(END+.4,'background:#dedcdd;transform:scale(1)'),(T,'background:#dedcdd;transform:scale(1)')])
    rows+=f'<div class="mrow"><span class="xdot a {d}"></span><span>{n}</span><b class="a {show(t,END,"translateX(6px)",d=.3)}">{v}</b></div>'
cnt=''.join(f'<span class="a {custom([(0,"opacity:0"),(a,"opacity:0"),(a+.05,"opacity:1"),(b,"opacity:1"),(b+.05,"opacity:0"),(T,"opacity:0")]) if a>0 else custom([(0,"opacity:1"),(1.0,"opacity:1"),(1.05,"opacity:0"),(END+.3,"opacity:0"),(END+.35,"opacity:1"),(T,"opacity:1")])}">{n}</span>' for n,a,b in [(0,0,1.0),(9,1.0,2.3),(18,2.3,3.6),(24,3.6,4.6),(31,4.6,5.6),(38,5.6,END)])
bar=custom([(0,'transform:scaleX(0)'),(1.0,'transform:scaleX(.02)'),(2.3,'transform:scaleX(.47)'),(3.6,'transform:scaleX(.63)'),(4.6,'transform:scaleX(.82)'),(5.6,'transform:scaleX(1)'),(END,'transform:scaleX(1)'),(END+.4,'transform:scaleX(0)'),(T,'transform:scaleX(0)')])
vsh=custom([(0,'transform:translateY(105%)'),(0.3,'transform:translateY(105%)'),(0.7,'transform:none'),(5.8,'transform:none'),(6.2,'transform:translateY(105%)'),(T,'transform:translateY(105%)')])
vamp2=custom([(0,'transform:scaleY(.15)'),(0.6,'transform:scaleY(.15)'),(0.9,'transform:scaleY(1)'),(5.5,'transform:scaleY(1)'),(5.8,'transform:scaleY(.15)'),(T,'transform:scaleY(.15)')])
for i in range(34):
    import math
    h=0.35+0.65*abs(math.sin(i*1.7)*math.cos(i*.45))
    VW.append(f'.h2 .vw2 .b{i}{{height:{round(8+h*30)}px;animation-delay:-{round((i*0.137)%0.9,2)}s;animation-duration:{round(0.7+(i%5)*0.08,2)}s}}')
wv2=custom([(0,'opacity:0'),(0.4,'opacity:0'),(0.6,'opacity:1'),(5.6,'opacity:1'),(5.8,'opacity:0'),(T,'opacity:0')])
h2=f'''<div class="hv h2 h2v">
 <div class="hp mp2"><div class="scr">
   <div class="xph dkt"><b>Inspection</b><small>RO 587, 2023 Rogue</small></div>
   <div class="xcnt"><span class="cn2">{cnt}</span><small>of 38 points</small></div>
   <div class="pbar"><i class="a {bar}"></i></div>
   <div class="mlist">{rows}</div>
   <div class="pill2 a {show(6.25,END,'translateY(10px) scale(.9)','none')}">{CHK}All 38 points done</div>
   <div class="vsheet a {vsh}"><div class="bh"><span class="rdot"></span>Listening</div>
     <div class="vw vw2 a {vamp2}">{BARS}</div>
     <p>{words("Lights, horn, wipers all good. Battery passed. Fronts at four, rears at seven. Uneven wear, they're out of balance. Rear pads at two millimeters.",0.7,5.5,END)}</p></div>
 </div></div>
 <div class="pop tires a {show(4.0,END,'translateX(-40px) scale(.85)')}"><div class="ptl">Tires</div><div class="t4"><span class="y">4<small>/32"</small><em>LF</em></span><span class="y">4<small>/32"</small><em>RF</em></span><span class="g">7<small>/32"</small><em>LR</em></span><span class="g">7<small>/32"</small><em>RR</em></span></div></div>
 <div class="pop bal a {show(4.75,END,'translateX(40px) scale(.85)')}"><div class="ptl"><span class="xdot y"></span> Wheel balance</div><span class="rec">Recommend</span><p>Uneven wear on both front tires. A balance evens it out.</p></div>
 <div class="pop xbrk a {show(5.75,END,'translateX(-40px) scale(.85)')}"><img src="{BRAKES}" alt=""><div><span class="xdot r"></span> <b>Brake pads, rear</b><small>2 mm, replace now</small></div></div>
</div>'''
CSS2='''
.h2v{width:622px;height:620px}
.mp2{left:200px;top:10px;width:280px;height:580px;z-index:2}
.dkt b{color:#333132}
.xcnt{display:flex;align-items:baseline;gap:8px;padding:16px 18px 8px}.xcnt small{color:#9b9799;font-size:12px}
.cn2{position:relative;display:inline-block;width:46px;height:40px;font-size:38px;font-weight:800;line-height:40px;letter-spacing:-.03em}.cn2 span{position:absolute;left:0;top:0}
.pbar{margin:0 18px 10px;height:6px;border-radius:9px;background:#f2f1f1;overflow:hidden}.pbar i{display:block;height:100%;background:#333132;transform-origin:left}
.mrow{display:flex;align-items:center;gap:10px;padding:9.5px 18px;border-bottom:1px solid #f2f1f1;font-size:13.5px}.mrow b{margin-left:auto;font-size:13px}
.pill2{position:absolute;left:50%;margin-left:-82px;bottom:22px;width:164px;display:flex;justify-content:center;align-items:center;gap:6px;background:#78bc61;color:#000;font-weight:700;font-size:12.5px;padding:8px 0;border-radius:99px}.pill2 svg{width:13px;height:13px}
.vsheet{position:absolute;left:0;right:0;bottom:0;z-index:5;background:rgba(29,28,29,.66);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);color:#fff;border-radius:22px 22px 0 0;padding:16px 18px 22px}
.vsheet .bh{color:#A0B3C6}.vw2{height:40px;width:auto;margin:8px 0 6px;gap:3px}.vw2 i{width:3px}
.vsheet p{margin:0;font-size:15px;line-height:1.38;font-weight:600;min-height:105px;text-shadow:0 1px 3px rgba(0,0,0,.5)}.vsheet .w{display:inline-block}
.pop.bal{left:16px;top:215px;width:176px}.pop.bal .ptl{display:flex;align-items:center;gap:6px;margin-bottom:6px}
.rec{display:inline-block;background:#ffd23f;color:#000;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px}.pop.bal p{font-size:12px;line-height:1.35;color:#5b5859;margin:8px 0 0}
.bub{position:absolute;left:0;top:150px;width:192px;z-index:4;background:#333132;color:#fff;border-radius:20px;padding:16px 18px;box-shadow:0 30px 60px -20px rgba(0,0,0,.8),0 0 0 1px rgba(255,255,255,.08)}
.bh{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#A0B3C6}.bh .hwave{margin-left:auto;height:14px}.bh .hwave i{width:2px;height:calc(var(--h)*2.6px)}
.rdot{width:8px;height:8px;border-radius:50%;background:#b9314f}
.bub p{margin:10px 0 0;font-size:16px;line-height:1.35;font-weight:600}.bub .w{display:inline-block}
.pop{position:absolute;z-index:5;background:#fff;color:#333132;border-radius:18px;padding:14px;box-shadow:0 30px 60px -20px rgba(0,0,0,.8)}
.pop.tires{left:482px;top:120px;width:140px;padding:12px}.ptl{font-weight:700;font-size:13px;margin-bottom:8px}
.t4{display:grid;grid-template-columns:1fr 1fr;gap:6px}.t4 span{border-radius:10px;padding:7px;font-weight:800;font-size:18px;position:relative}.t4 small{font-size:10px;font-weight:600}.t4 em{position:absolute;right:7px;top:6px;font-style:normal;font-size:9px;font-weight:700;opacity:.55}
.t4 .y{background:#ffd23f}.t4 .g{background:#78bc61}
.pop.xbrk{left:482px;top:370px;width:140px;padding:0;overflow:hidden}.pop.xbrk img{width:100%;height:100px;object-fit:cover;display:block}.pop.xbrk div{padding:10px 14px 12px}.pop.xbrk b{font-size:14px}.pop.xbrk small{display:block;color:#b9314f;font-weight:700;font-size:12px;margin-top:2px}
'''
# ---------------- H3: the shop photo, live captions, findings pinned to the tire ----------------
T=9; kf,rule,show,custom,words=anim(3,T); END=8.3
wv3=custom([(0,'opacity:0'),(0.4,'opacity:0'),(0.6,'opacity:1'),(4.0,'opacity:1'),(4.2,'opacity:0'),(T,'opacity:0')])
def fillc(t,c): return custom([(0,'background:#f2f1f1'),(t,'background:#f2f1f1'),(t+.4,f'background:{c}'),(END,f'background:{c}'),(END+.4,'background:#f2f1f1'),(T,'background:#f2f1f1')])
tiles=''.join(f'<span class="a {fillc(4.5+i*.12,COL[c])}"><em>{p}</em><b class="a {show(4.6+i*.12,END,"translateY(8px)",d=.3)}">{v}<small>/32"</small></b></span>' for i,(p,c,v) in enumerate([('Left front','y',4),('Right front','y',4),('Left rear','g',7),('Right rear','g',7)]))
h3=f'''<div class="hv h3 h3v">
 <div class="ph3"><img src="{TECH}" alt="">
   <div class="pin p1 a {show(2.0,END,'scale(.6)','none')}"><i></i><span class="xtag y">Front tires <b>4/32"</b></span></div>
   <div class="pin p2 a {show(3.5,END,'scale(.6)','none')}"><i></i><span class="xtag y">Wheel balance <b>Recommend</b></span></div>
   <div class="cap3 a {show(0.3,END,'translateY(10px)')}"><div class="bh"><span class="rdot"></span>Live{wave('a '+wv3)}</div><p>{words("Fronts are at four thirty-seconds, rears at seven. A little cupping, looks like they're out of balance.",0.6,3.9,END)}</p></div>
 </div>
 <div class="hp mp3"><div class="scr">
   <div class="xph"><b>Tires</b><small>RO 587, 2023 Rogue</small></div>
   <div class="t43">{tiles}</div>
   <div class="mrow a {show(5.2,END,'translateY(6px)')}"><span class="xdot y"></span><span>Wheel balance</span><b>Recommend</b></div>
   <div class="pill2 a {show(5.9,END,'translateY(10px) scale(.9)')}">{CHK}Findings applied</div>
 </div></div>
</div>'''
CSS3='''
.h3v{width:620px;height:620px}
.ph3{position:absolute;left:150px;top:0;width:470px;height:600px;border-radius:28px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(0,0,0,.8)}
.ph3 img{width:100%;height:100%;object-fit:cover;display:block}
.pin{position:absolute;z-index:3;transform-origin:0 0}.pin i{position:absolute;left:-9px;top:-9px;width:18px;height:18px;border-radius:50%;background:#ffd23f;box-shadow:0 0 0 5px rgba(255,210,63,.35),0 0 0 1px rgba(0,0,0,.3)}
.pin .xtag{position:absolute;white-space:nowrap;font-size:13px;font-weight:600;padding:7px 12px;border-radius:99px;background:#fff;color:#333132;box-shadow:0 10px 24px -8px rgba(0,0,0,.6)}.pin .xtag b{margin-left:6px}
.pin.p1{left:428px;top:420px}.pin.p1 .xtag{right:16px;top:-16px}
.pin.p2{left:384px;top:380px}.pin.p2 .xtag{right:14px;top:-62px}
.cap3{position:absolute;left:14px;right:14px;bottom:14px;z-index:3;background:rgba(20,20,22,.78);backdrop-filter:blur(8px);color:#fff;border-radius:18px;padding:12px 16px 14px}
.cap3 p{margin:6px 0 0;font-size:17px;line-height:1.35;font-weight:600}.cap3 .w{display:inline-block}
.mp3{left:0;top:200px;width:220px;height:420px;z-index:4}
.t43{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:14px 12px 6px}.t43>span{border-radius:12px;min-height:66px;padding:9px;display:flex;flex-direction:column;justify-content:space-between}
.t43 em{font-style:normal;font-size:9.5px;font-weight:700;color:rgba(0,0,0,.45)}.t43 b{font-size:22px;font-weight:800}.t43 small{font-size:9px}
.mp3 .mrow{padding:10px 14px;font-size:12px;border:0}.mp3 .pill2{bottom:18px}
'''
def hero(code,vis,cap):
    return f'''<section class="hopt"><div class="hlab"><b>{code}</b> {cap}</div>
<header class="hero heroA"><div class="wrap grid"><div class="copy"><div class="kicker">Voice MPI for dealerships</div><h1>The Multi Point Inspection that builds itself</h1><p class="sub">Techs say what they see. The MPI fills itself in.</p><div class="ctas"><a class="btn" href="#top">Book a Demo</a><a class="btn ghost" href="#how">See how it works</a></div></div>{vis}</div></header></section>'''
CSS='\n'.join(BASE+KF+RULES+VW)+CSS1+CSS2+CSS3+'''
.hv{position:relative;flex:0 0 auto}.hv .bub,.hv .pop{box-sizing:border-box}.hv .a{will-change:transform,opacity}
.hsheet{width:1360px;background:#fff;padding:40px 0 60px}.hsheet>div:first-child{padding:0 40px 24px}.hsheet h1{font-size:28px;margin:0 0 6px}.hsheet .intro{color:#5b6470;max-width:80ch;margin:0}
.hopt{margin-top:36px}.hlab{padding:0 40px 12px;font-size:15px;color:#5b6470;max-width:110ch}.hlab b{display:inline-block;background:#0F2137;color:#fff;border-radius:6px;padding:1px 8px;margin-right:6px}
.hopt .hero .copy{max-width:470px}
'''
page=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Hero options</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
{helmet.replace('</style>',CSS+'</style>',1)}</helmet>
<div class="hsheet">
<div><h1>Hero options</h1><p class="intro">The hero copy stays as it is; only the visual on the right changes. All three loop. Reply with a code.</p></div>
{hero('HA',h1,'One finding, end to end. A floating voice wave and live transcript (no device); the key phrases light up and fly onto the RO as a line, then to the customer, who taps Approve. The three steps under the devices light up in turn. About 10 seconds.')}
{hero('HB',h2,'The checklist fills itself. The voice wave and live transcript sit on a translucent layer over the inspection, which ticks through underneath while the counter climbs to 38. Three cards pop out as he speaks: tire depths, a wheel balance note, the brake finding with its photo. They alternate right, left, right. About 9 seconds.')}
{hero('HC',h3,'The shop, live. The tech photo with live captions; findings pin onto the tire as he speaks, and the phone fills in the tire tiles. Uses the step 1 photo, so the hero and step 1 would need different photos if picked. About 9 seconds.')}
</div>
</x-dc>
</body>
</html>'''
open(sys.argv[2],'w').write(page); print('ok',len(page))

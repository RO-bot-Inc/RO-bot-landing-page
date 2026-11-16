import re, json
main=open('artifact-files/2b08cfe7-bed3-493f-9b2a-4b024fe1e01d/project/Main.dc.html').read()
css=main[main.index('<style>')+7:main.index('</style>')]
howa=open('board/project/HowA.dc.html').read()
def block(s,start_pat,pos=0):
    i=s.index(start_pat,pos); d=0; j=i
    while True:
        m=re.compile(r'<div\b|</div>').search(s,j)
        d+= -1 if m.group()=='</div>' else 1
        j=m.end()
        if d==0: return s[i:j], j
demos={}; pos=howa.index('<div class="steps4">')
for k in ['mpi','video','review','customer']:
    b,pos=block(howa,'<div class="demo" data-kind="%s"'%k,pos); demos[k]=b
def phone_inner(k):  # the <div class="phone">...</div> block
    b,_=block(demos[k],'<div class="phone">'); return b
MIC='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><path d="M12 18v3"></path></svg>'
CHK='<svg viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"></path></svg>'
def wave(): 
    h=[2,3.5,5,2.5,4.5,2,3,5,2.5,4,2,3.5,2.8,4.6,2.2,3.2,4.8,2.4]
    return ''.join(f'<i style="--h:{v};animation-delay:{-i*0.07:.2f}s"></i>' for i,v in enumerate(h))
def dock(hint): return f'<div class="dock"><span class="mic" aria-hidden="true"><span class="ring"></span>{MIC}</span><div class="hint">{hint}</div></div>'
def P(inner,cls=''): return f'<div class="phone {cls}"><div class="screen">{inner}</div></div>'

# ---- Step 1 options
s1A=f'<div class="demo" data-kind="mpi" data-stage="3">{phone_inner("mpi")}</div>'
cards=[('Tires','y'),('Brakes','r'),('Battery','g'),('Fluids',''),('Belts',''),('Lights','')]
track=''.join(f'<div class="ccard c{i} {c}"><div class="cfill"></div><div class="cn">{n}</div><div class="cs">{"4/32 in" if n=="Tires" else "2 mm" if n=="Brakes" else "Pass" if n=="Battery" else ""}</div></div>' for i,(n,c) in enumerate(cards))
s1B=f'<div class="demo cara" data-stage="1">'+P(f'<div class="top"><div><div class="t">Inspection</div><div class="sub">RO 587, 38 items</div></div><div class="dots"><i class="cur"></i><i></i><i></i></div></div><div class="ctrack"><div class="cinner">{track}</div></div><div class="sheet"><div class="words"><span class="on">Fronts</span> <span class="on">at</span> <span class="on">four,</span> <span class="on">rear</span> <span class="on">pads</span> <span class="on">two</span> <span class="on">millimeters,</span> <span class="on">battery</span> <span class="on">passed.</span></div><div class="wave">{wave()}</div></div>{dock("Listening")}')+'</div>'

S=[("The front tires are at four and the rears are at seven.",{"four":("y",'Tire tread, front 4/32"'),"seven.":("g",'Tire tread, rear 7/32"')}),
   ("A little irregular wear, looks like they're out of balance.",{"balance.":("y","Wheel balance, recommend")}),
   ("Rear pads are down to two millimeters.",{"millimeters.":("r","Brake pads, rear 2 mm")})]
WI=0.22; HOLD=1.3; FADE=0.35; GAP=0.45; FD=0.55
t=0.6; kfs=[]; wspans=[]; fspans=[]; n=0
for si,(sent,finds) in enumerate(S):
    words=sent.split(' '); t_in=[]
    for w in words:
        t_in.append(t); t+=WI
    t_end=t+HOLD; t_out=t_end+FADE
    sent_spans=[]
    for w,ti in zip(words,t_in):
        n+=1; kfs.append((f'w{n}',ti,t_end,t_out)); sent_spans.append(f'<span class="ttw w{n}">{w}</span>')
        if w in finds:
            c,label=finds[w]; m=len(fspans)+1
            fspans.append((f'f{m}',ti+FD,c,label))
    wspans.append('<span class="sent">'+' '.join(sent_spans)+'</span>')
    t=t_out+GAP
T=t+1.2  # tail hold before the loop restarts
def pct(x): return round(100*x/T,2)
css2=[]
for name,ti,te,to in kfs:
    css2.append(f'@keyframes {name}{{0%,{pct(ti)}%{{opacity:0;transform:translateY(5px)}}{pct(ti+0.15)}%,{pct(te)}%{{opacity:1;transform:none}}{pct(to)}%,100%{{opacity:0;transform:none}}}}.tr2 .ttext span.{name}{{animation-name:{name}}}')
for name,tf,c,label in fspans:
    css2.append(f'@keyframes {name}{{0%,{pct(tf)}%{{opacity:0;transform:translateY(8px) scale(.92)}}{pct(tf+0.3)}%,{pct(T-0.7)}%{{opacity:1;transform:none}}{pct(T-0.3)}%,100%{{opacity:0}}}}.tr2 .tags .tag.{name}{{animation-name:{name}}}')
TR2_CSS='\n'.join(css2)+f'\n.tr2 .ttext span.ttw,.tr2 .tags .tag{{animation-duration:{T:.2f}s;animation-timing-function:cubic-bezier(.2,.8,.2,1);animation-iteration-count:infinite;animation-fill-mode:both}}'
tags=''.join(f'<span class="tag {name}"><i class="dot {c}"></i>{label}</span>' for name,tf,c,label in fspans)
s1C='<div class="demo trans tr2" data-stage="1">'+P('<div class="tbig"><div class="tlabel">Listening<span>RO 587, 2023 Rogue</span></div><div class="twave">'+wave()+'</div><p class="ttext">'+''.join(wspans)+'</p><div class="tags">'+tags+'</div></div>'+dock("Release to apply"))+'</div>'
m=phone_inner('mpi'); m=re.sub(r'<div class="sheet">.*?</div></div>','',m,count=1,flags=re.S); m=re.sub(r'<div class="pill">.*?</div>','',m,count=1,flags=re.S)
s1D=f'<div class="demo" data-stage="3">{m}</div>'

# ---- Step 2 options
s2A=f'<div class="demo" data-kind="video" data-stage="3">{phone_inner("video")}</div>'
shots=['Under hood','Battery','Belts and hoses','Tires, front','Tires, rear','Brakes','Underbody','Wrap-up']
sl=''.join(f'<li style="animation-delay:{i*0.7+0.4:.1f}s"><i>{CHK}</i>{n}</li>' for i,n in enumerate(shots))
s2B=f'<div class="demo shots" data-stage="1"><div class="phone"><div class="screen vid"><div class="vf"></div><div class="rec"><i></i>REC <span>1:12</span></div><div class="slist"><div class="sh">Shot list<em>8 shots</em></div><ul>{sl}</ul></div><div class="dock"><span class="mic" aria-hidden="true"></span><div class="hint">Recording</div></div></div></div></div>'
v=phone_inner('video'); v=v.replace('<div class="tp b">','<div class="tp b" style="display:none">')
s2C=f'<div class="demo" data-stage="1">{v}</div>'
pw="Show the gauge on the tread and read the number out loud.".split(' ')
pspans=''.join(f'<span style="animation-delay:{i*0.28+0.4:.2f}s">{w}</span> ' for i,w in enumerate(pw))
s2D=f'<div class="demo prompt" data-stage="1"><div class="phone"><div class="screen vid"><div class="vf"></div><div class="brk"><i></i><i></i><i></i><i></i></div><div class="rec"><i></i>REC <span>0:42</span></div><div class="chaps"><span class="ch c1"><i></i>Tires</span></div><div class="tele"><div class="sh"><span>Shot 3 of 8</span><em>Front tread depth</em></div><p>{pspans}</p></div><div class="dock"><span class="mic" aria-hidden="true"></span><div class="hint">Recording</div></div></div></div></div>'


# ===== Step 2 redo: two motion concepts on a 14 s loop
T2=14.0
def p2(x): return round(100*x/T2,2)
KF2=[]
def kf(name,segs):
    # segs: list of (time, css) ; builds percent keyframes, holds between
    parts=[]
    for t,c in segs: parts.append(f'{p2(t)}%{{{c}}}')
    KF2.append(f'@keyframes {name}{{{"".join(parts)}}}')
def anim(name): return f'animation:{name} {T2}s cubic-bezier(.2,.8,.2,1) infinite both'
H='opacity:0;transform:translateY(6px)'; V='opacity:1;transform:none'
# --- shared: REC timer digits (one span per second)
def timer(start_s, cls):
    out=[]
    for i in range(int(T2)):
        t=start_s+i; name=f'{cls}{i}'
        kf(name,[(0,'opacity:0'),(max(i-0.01,0),'opacity:0'),(i,'opacity:1'),(i+0.99,'opacity:1'),(min(i+1,T2),'opacity:0'),(T2,'opacity:0')])
        out.append(f'<b class="tt {name}" style="{anim(name)}">{t//60}:{t%60:02d}</b>')
    return '<span class="timer">'+''.join(out)+'</span>'
# ---------- 2E guided shots
shots2=[('Shot 3 of 8','Tires','Front tread depth','Show the gauge on the tread and read the number out loud.',0.0,5.2),
        ('Shot 4 of 8','Brakes','Rear pads through the wheel','Point at the pad, give the thickness, say what you recommend.',5.2,10.0),
        ('Shot 5 of 8','Brakes','Rotor surface','Run a finger across the rotor and say what you feel.',10.0,14.0)]
cards=''
for i,(no,chap,title,say,a,b) in enumerate(shots2):
    n=f'sc{i}'
    kf(n,[(0,'opacity:0;transform:translateX(40px)'),(max(a-0.01,0),'opacity:0;transform:translateX(40px)'),(a+0.35,'opacity:1;transform:none'),(b-0.4,'opacity:1;transform:none'),(b-0.05,'opacity:0;transform:translateX(-40px)'),(T2,'opacity:0;transform:translateX(-40px)')])
    kf(n+'p',[(0,'width:0'),(a,'width:0'),(b-0.45,'width:100%'),(b-0.05,'width:100%'),(T2,'width:100%')])
    cards+=f'<div class="scard" style="{anim(n)}"><div class="sh"><span>{no}</span><em>{chap}</em></div><div class="tt2">{title}</div><div class="say"><b>Say:</b> {say}</div><div class="sprog"><i style="{anim(n+"p")}"></i></div></div>'
# chapter markers on the strip
kf('seg1',[(0,'transform:scaleX(0)'),(0.4,'transform:scaleX(0)'),(5.0,'transform:scaleX(1)'),(T2,'transform:scaleX(1)')])
kf('seg2',[(0,'transform:scaleX(0)'),(5.2,'transform:scaleX(0)'),(13.6,'transform:scaleX(1)'),(T2,'transform:scaleX(1)')])
kf('lbl2',[(0,'opacity:0'),(5.2,'opacity:0'),(5.6,'opacity:1'),(T2,'opacity:1')])
# captured chips
def chip(name,t):
    kf(name,[(0,H),(t,H),(t+0.3,V),(t+2.0,V),(t+2.4,'opacity:0;transform:translateY(-6px)'),(T2,'opacity:0')])
chip('cap1',3.3); chip('cap2',8.6); chip('cap3',12.6)
s2E=('<div class="demo gshot" data-stage="1"><div class="phone"><div class="screen vid"><div class="vf"></div><div class="brk"><i></i><i></i><i></i><i></i></div>'
 '<div class="rec"><i></i>REC '+timer(38,'ta')+'</div>'
 '<div class="strip"><div class="seg done"><i></i><span>Under hood</span></div><div class="seg"><i style="'+anim('seg1')+'"></i><span>Tires</span></div><div class="seg"><i style="'+anim('seg2')+'"></i><span style="'+anim('lbl2')+'">Brakes</span></div></div>'
 '<div class="caps"><span class="capchip" style="'+anim('cap1')+'"><i class="dot y"></i>4/32" front, captured</span><span class="capchip" style="'+anim('cap2')+'"><i class="dot r"></i>2 mm rear pads, captured</span><span class="capchip" style="'+anim('cap3')+'"><i class="dot g"></i>Rotor OK, captured</span></div>'
 '<div class="scards">'+cards+'</div>'
 '<div class="dock"><span class="mic" aria-hidden="true"></span><div class="hint">Recording</div></div></div></div></div>')
# ---------- 2F live captions + chapters
sents=[("Front tread is at four thirty-seconds, a little wear on the outside edge.",1.0,{"thirty-seconds,":('y','Tire tread, front 4/32"')}),
       ("Rear pads are down to two millimeters, I'd recommend replacing them.",7.4,{"millimeters,":('r','Brake pads, rear 2 mm')})]
WI2=0.2; caps=''; toasts=''; tn=0; wn=0
for si,(sent,t0,finds) in enumerate(sents):
    words=sent.split(' '); t=t0; spans=[]
    t_end=t0+len(words)*WI2+1.4
    for w in words:
        wn+=1; n=f'cw{wn}'
        kf(n,[(0,'opacity:0;transform:translateY(4px)'),(t,'opacity:0;transform:translateY(4px)'),(t+0.14,V),(t_end,V),(t_end+0.3,'opacity:0;transform:none'),(T2,'opacity:0')])
        spans.append(f'<span style="{anim(n)}">{w}</span>')
        if w in finds:
            c,label=finds[w]; tn+=1; m=f'toast{tn}'
            kf(m,[(0,'opacity:0;transform:translateX(16px)'),(t+0.6,'opacity:0;transform:translateX(16px)'),(t+0.9,V),(t+3.4,V),(t+3.8,'opacity:0;transform:translateX(16px)'),(T2,'opacity:0')])
            toasts+=f'<div class="toast" style="{anim(m)}"><i class="dot {c}"></i><div><small>Added to report</small>{label}</div></div>'
        t+=WI2
    caps+=f'<p class="capline">{" ".join(spans)}</p>'
kf('chp2',[(0,'opacity:0;transform:scale(.6)'),(0.8,'opacity:0;transform:scale(.6)'),(1.2,'opacity:1;transform:none'),(T2,'opacity:1;transform:none')])
kf('chp3',[(0,'opacity:0;transform:scale(.6)'),(7.0,'opacity:0;transform:scale(.6)'),(7.4,'opacity:1;transform:none'),(T2,'opacity:1;transform:none')])
kf('tl1',[(0,'transform:scaleX(0)'),(0.8,'transform:scaleX(0)'),(7.0,'transform:scaleX(1)'),(T2,'transform:scaleX(1)')])
kf('tl2',[(0,'transform:scaleX(0)'),(7.0,'transform:scaleX(0)'),(13.5,'transform:scaleX(1)'),(T2,'transform:scaleX(1)')])
s2F=('<div class="demo lcap" data-stage="1"><div class="phone"><div class="screen vid"><div class="vf"></div><div class="brk"><i></i><i></i><i></i><i></i></div>'
 '<div class="rec"><i></i>REC '+timer(41,'tb')+'</div>'
 '<div class="chaps"><span class="ch on"><i></i>Under hood</span><span class="ch" style="'+anim('chp2')+'"><i></i>Tires</span><span class="ch" style="'+anim('chp3')+'"><i></i>Brakes</span></div>'
 '<div class="toasts">'+toasts+'</div>'
 '<div class="capbox">'+caps+'</div>'
 '<div class="tline"><i class="done"></i><i class="y" style="'+anim('tl1')+'"></i><i class="r" style="'+anim('tl2')+'"></i></div>'
 '<div class="dock"><span class="mic" aria-hidden="true"></span><div class="hint">Recording</div></div></div></div></div>')
STEP2_CSS="\n".join(KF2)+r"""
.gshot .rec,.lcap .rec{opacity:1}.gshot .rec i,.lcap .rec i{animation:blink 1s ease-in-out infinite}
.gshot .brk,.lcap .brk{opacity:1;transform:scale(.92)}
.gshot .dock,.lcap .dock{background:transparent}.gshot .mic,.lcap .mic{background:#fff}.gshot .mic:after,.lcap .mic:after{content:"";width:22px;height:22px;border-radius:5px;background:var(--red);transform:scale(.8)}
.timer{position:relative;display:inline-block;width:30px;height:1em}.timer .tt{position:absolute;left:0;top:0;font-weight:600;font-variant-numeric:tabular-nums;opacity:0}
.strip{position:absolute;left:20px;right:20px;top:50px;display:flex;gap:6px}
.strip .seg{flex:1;display:flex;flex-direction:column;gap:5px}
.strip .seg i{display:block;height:4px;border-radius:2px;background:rgba(255,255,255,.22);transform-origin:left;overflow:hidden}
.strip .seg.done i{background:var(--green)}.strip .seg:nth-child(2) i{background:var(--yellow)}.strip .seg:nth-child(3) i{background:var(--red)}
.strip .seg span{font-size:10px;font-weight:700;color:#fff;opacity:.85}
.caps{position:absolute;left:20px;right:20px;bottom:238px;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.capchip{display:inline-flex;align-items:center;gap:6px;background:#fff;color:var(--char);font-weight:700;font-size:11.5px;padding:5px 10px;border-radius:999px;position:absolute;left:0;bottom:0}.capchip .dot{width:8px;height:8px}
.scards{position:absolute;left:12px;right:12px;bottom:104px;height:118px}
.scard{position:absolute;inset:0;background:rgba(255,255,255,.96);color:var(--char);border-radius:18px;padding:14px 16px 12px;z-index:3;display:flex;flex-direction:column}
.scard .sh{font-size:11px;font-weight:700;color:var(--mid);display:flex;justify-content:space-between}.scard .sh em{font-style:normal;color:var(--char)}
.scard .tt2{font-weight:700;font-size:15px;margin-top:4px}.scard .say{font-size:12.5px;line-height:1.35;margin-top:5px}.scard .say b{font-weight:600;color:var(--mid)}
.sprog{margin-top:auto;height:3px;border-radius:2px;background:var(--sheet);overflow:hidden}.sprog i{display:block;height:100%;background:var(--green)}
.lcap .chaps{top:50px}.lcap .ch{opacity:0;transform:scale(.6)}.lcap .ch.on{opacity:1;transform:none}
.toasts{position:absolute;right:12px;top:92px;display:flex;flex-direction:column;gap:8px;align-items:flex-end}
.toast{display:flex;align-items:center;gap:8px;background:#fff;color:var(--char);border-radius:12px;padding:8px 11px;font-size:12px;font-weight:700;box-shadow:0 10px 24px -10px rgba(0,0,0,.5)}
.toast small{display:block;font-size:9.5px;color:var(--mid);font-weight:700;letter-spacing:.02em}.toast .dot{width:9px;height:9px}
.capbox{position:absolute;left:16px;right:16px;bottom:118px;min-height:62px}
.capline{position:absolute;left:0;right:0;bottom:0;margin:0;text-align:center;font-size:15.5px;line-height:1.35;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8),0 0 12px rgba(0,0,0,.6);letter-spacing:-.01em}
.capline span{opacity:0;display:inline-block}
.tline{position:absolute;left:20px;right:20px;bottom:104px;height:4px;border-radius:2px;background:rgba(255,255,255,.22);display:flex;gap:3px}
.tline i{display:block;height:100%;border-radius:2px;transform-origin:left;flex:1}
.tline i.done{background:var(--green);flex:0 0 28%}.tline i.y{background:var(--yellow)}.tline i.r{background:var(--red)}
"""


# ===== 2F v2: caption -> finding card pops -> card flies up and shrinks into a chip that stays
# All animation lives in stylesheet classes (no inline animation), and every animated element starts hidden.
def p3(x): return round(100*x/T3,2)
KF3=[]; RULES3=[]
def kf3(name,segs): KF3.append(f'@keyframes {name}{{'+''.join(f'{p3(t)}%{{{c}}}' for t,c in segs)+'}')
def rule(sel,name): RULES3.append(f'{sel}{{animation-name:{name}}}')
sents3=[("Cabin air filter is pretty clogged, I'd replace it.","clogged,",'y','Cabin air filter, replace'),
        ("Serpentine belt is cracking along the ribs.","cracking",'r','Serpentine belt, cracked'),
        ("Battery tested good, terminals are clean.","good,",'g','Battery, pass')]
WI3=0.18; HOLD3=1.1; GAP3=0.25; CARDHOLD3=0.9; CARD_TOP=272; CHIP_TOP=54; CHIP_H=30; SC=0.56
starts=[]; tcur=0.4
for sent,_,_,_ in sents3:
    starts.append(tcur); tcur+=len(sent.split(' '))*WI3+HOLD3+0.3+GAP3
T3=round(tcur+1.6,2)
caps3=''; cards3=''; chips3=''
for i,(sent,trig,c,label) in enumerate(sents3):
    t0=starts[i]; words=sent.split(' '); t=t0; spans=[]
    t_words_end=t0+len(words)*WI3
    for j,w in enumerate(words):
        n=f'q{i}_{j}'
        kf3(n,[(0,'opacity:0;transform:translateY(4px)'),(t,'opacity:0;transform:translateY(4px)'),(t+0.14,'opacity:1;transform:none'),(t_words_end+HOLD3,'opacity:1;transform:none'),(t_words_end+HOLD3+0.3,'opacity:0;transform:none'),(T3,'opacity:0')])
        rule(f'.lcap2 .capline.s{i} span:nth-child({j+1})',n)
        spans.append(f'<span>{w}</span>')
        if w==trig: t_trig=t
        t+=WI3
    caps3+=f'<p class="capline s{i}">{" ".join(spans)}</p>'
    tc=t_trig+0.45; tf=tc+CARDHOLD3; te=tf+0.55
    dy=CHIP_TOP+i*CHIP_H-CARD_TOP
    kf3(f'card{i}',[(0,'opacity:0;transform:translate(0,10px) scale(.92)'),(tc,'opacity:0;transform:translate(0,10px) scale(.92)'),(tc+0.25,'opacity:1;transform:none'),(tf,'opacity:1;transform:none'),(te-0.05,f'opacity:1;transform:translate(0,{dy}px) scale({SC})'),(te,f'opacity:0;transform:translate(0,{dy}px) scale({SC})'),(T3,'opacity:0')])
    rule(f'.lcap2 .fcard.c{i}',f'card{i}')
    cards3+=f'<div class="fcard c{i}"><small>New finding</small><div><i class="dot {c}"></i>{label}</div></div>'
    kf3(f'chip{i}',[(0,'opacity:0'),(te-0.05,'opacity:0'),(te,'opacity:1'),(T3-0.6,'opacity:1'),(T3-0.2,'opacity:0'),(T3,'opacity:0')])
    rule(f'.lcap2 .rchip.r{i}',f'chip{i}')
    chips3+=f'<span class="rchip r{i}"><i class="dot {c}"></i>{label}</span>'
tdig=''
for i in range(int(T3)):
    kf3(f'tc{i}',[(0,'opacity:0'),(max(i-0.01,0),'opacity:0'),(i,'opacity:1'),(i+0.99,'opacity:1'),(min(i+1,T3),'opacity:0'),(T3,'opacity:0')])
    rule(f'.lcap2 .timer .tt:nth-child({i+1})',f'tc{i}')
    tdig+=f'<b class="tt">{(41+i)//60}:{(41+i)%60:02d}</b>'
s2F=('<div class="demo lcap2" data-stage="1"><div class="phone"><div class="screen vid"><div class="vf"></div><div class="brk"><i></i><i></i><i></i><i></i></div>'
 '<div class="rec"><i></i>REC <span class="timer">'+tdig+'</span></div>'
 '<div class="rchips">'+chips3+'</div>'
 '<div class="fcards">'+cards3+'</div>'
 '<div class="capbox">'+caps3+'</div>'
 '<div class="dock"><span class="mic" aria-hidden="true"></span><div class="hint">Recording</div></div></div></div></div>')
STEP2F_CSS="\n".join(KF3)+"\n"+"\n".join(RULES3)+r"""
.lcap2 .capline span,.lcap2 .fcard,.lcap2 .rchip,.lcap2 .timer .tt{opacity:0;animation-duration:"""+f'{T3}s'+r""";animation-timing-function:cubic-bezier(.2,.8,.2,1);animation-iteration-count:infinite;animation-fill-mode:both}
.lcap2 .rec{opacity:1}.lcap2 .rec i{animation:blink 1s ease-in-out infinite}
.lcap2 .brk{opacity:1;transform:scale(.92)}
.lcap2 .dock{background:transparent}.lcap2 .mic{background:#fff}.lcap2 .mic:after{content:"";width:22px;height:22px;border-radius:5px;background:var(--red);transform:scale(.8)}
.rchips{position:absolute;left:16px;right:16px;top:0;bottom:0;pointer-events:none}
.rchip{position:absolute;left:0;display:inline-flex;align-items:center;gap:6px;background:#fff;color:var(--char);font-weight:700;font-size:11.5px;padding:4px 10px;border-radius:999px;white-space:nowrap}
.rchip.r0{top:54px}.rchip.r1{top:84px}.rchip.r2{top:114px}
.rchip .dot{width:8px;height:8px}
.fcards{position:absolute;left:0;right:0;top:272px;height:60px}
.fcard{position:absolute;left:16px;right:16px;top:0;width:auto;max-width:calc(100% - 32px);box-sizing:border-box;background:#fff;color:var(--char);border-radius:14px;padding:8px 12px;box-shadow:0 14px 30px -10px rgba(0,0,0,.6);transform-origin:top left;overflow:hidden}
.fcard small{display:block;font-size:9.5px;font-weight:700;color:var(--mid);letter-spacing:.03em;text-transform:uppercase}
.fcard div{display:flex;align-items:center;gap:8px;font-weight:700;font-size:14px;margin-top:2px;white-space:nowrap}.fcard .dot{width:10px;height:10px}
.lcap2 .capbox{bottom:112px}
"""

# ---- Step 3 options (laptop)
def laptop(inner,cls=''): return f'<div class="laptop sheetlap {cls}"><div class="lid"><span class="cam"></span><div class="lscreen">{inner}</div></div><div class="base"></div></div>'
rows=[('k0','y','Tire tread, front','4/32"'),('k1','r','Brake pads, rear','2 mm'),('k2','y','Balance','Recommend')]
lrows=''.join(f'<div class="lrow {k}"><span class="dot {c}"></span><span class="lbl">{l}</span><span class="v">{v}</span></div>' for k,c,l,v in rows)+'<div class="lrow k3"><span class="th"></span><span class="lbl">Photo, front tread</span></div>'
chips='<span class="fchip k0"><span class="dot y"></span>4/32" front tread</span><span class="fchip k1"><span class="dot r"></span>Rear pads 2 mm</span><span class="fchip k2"><span class="dot y"></span>Wheel balance</span><span class="fchip k3"></span>'
i3A='<div class="lh">Report summary<span>RO 587, 38 items inspected</span></div><div class="lbar"><i></i></div>'+lrows+'<div class="lcta">Save &amp; Create Lines</div>'
s3A='<div class="lap lapwrap">'+laptop(i3A)+chips+'</div>'
lines=[('Rear brake pads and rotors','$489'),('Front tires, pair','$412'),('Wheel balance','$79')]
ln=''.join(f'<div class="ln" style="animation-delay:{i*0.9+1.2:.1f}s"><i>{CHK}</i>{l}<span class="price">{p}</span></div>' for i,(l,p) in enumerate(lines))
left=''.join(f'<div class="lrow st"><span class="dot {c}"></span><span class="lbl">{l}</span><span class="v">{v}</span></div>' for k,c,l,v in rows)+'<div class="lrow st"><span class="dot g"></span><span class="lbl">Battery</span><span class="v">Pass</span></div><div class="lrow st"><span class="dot g"></span><span class="lbl">Wipers</span><span class="v">Pass</span></div>'
i3B='<div class="lh">Report summary<span>RO 587</span></div><div class="two"><div class="pane">'+left+'</div><div class="pane dark"><div class="lh2">Lines added to the RO</div>'+ln+'<div class="tot"><span>Total</span><b>$980</b></div></div></div><div class="lcta flip"><span class="l1">Save &amp; Create Lines</span><span class="l2">Saved, 3 lines created</span></div>'
s3B='<div class="lap lapwrap">'+laptop(i3B,'lap2')+'</div>'
i3C='<div class="lh">Report summary<span>RO 587, 38 items inspected</span></div><div class="count"><span><i class="dot r"></i>1</span><span><i class="dot y"></i>2</span><span><i class="dot g"></i>35</span></div>'+lrows+'<div class="lcta">Save &amp; Create Lines</div>'
s3C='<div class="lap lapwrap static">'+laptop(i3C)+'</div>'
Q='&quot;'
i3D='<div class="lh">Tires<span>From the walk-around, 0:42</span></div><div class="two"><div class="pane quote">The front tires are at <mark class="y">four</mark> and the rears are at <mark class="g">seven</mark>. A little irregular wear, looks like they\'re <mark class="y">out of balance</mark>.</div><div class="pane form"><div class="f"><span>Left front</span><b>4/32"</b></div><div class="f"><span>Right front</span><b>4/32"</b></div><div class="f"><span>Left rear</span><b>7/32"</b></div><div class="f"><span>Right rear</span><b>7/32"</b></div><div class="f"><span>Wheel balance</span><b class="yy">Recommend</b></div></div></div><div class="lcta">Save &amp; Create Lines</div>'
s3D='<div class="lap lapwrap static">'+laptop(i3D,'lap3')+'</div>'

import os
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'step3-screens.py')).read())

# ---- Step 4 options
s4A=f'<div class="demo" data-kind="customer" data-stage="3">{phone_inner("customer")}</div>'
brand='<div class="top"><div class="brand"><span class="lg"></span><div><div class="t">Your Dealership</div><div class="sub">(555) 010-2030</div></div></div></div>'
s4B=f'<div class="demo rep2" data-stage="1"><div class="phone"><div class="screen cust">{brand}<div class="body"><div class="thumb sm"><span class="tn">Inspection video</span><span class="play"></span><span class="dur">2:48</span></div><div class="grp"><div class="gh"><i class="dot r"></i>Needs attention now</div><div class="item"><div><b>Brake pads, rear</b><small>2 mm, below minimum</small></div><span class="appr"><span class="a1">Approve</span><span class="a2">{CHK}Approved</span><span class="tap"></span></span></div></div><div class="grp"><div class="gh"><i class="dot y"></i>Recommend soon</div><div class="item"><div><b>Tire tread, front</b><small>4/32", pair</small></div><span class="appr st"><span class="a1">Approve</span></span></div><div class="item"><div><b>Wheel balance</b><small>Irregular wear</small></div><span class="appr st"><span class="a1">Approve</span></span></div></div></div><div class="abar"><span>Approved</span><b>$489</b></div></div></div></div>'
s4C=f'<div class="demo" data-stage="3">{phone_inner("customer")}</div>'
s4D=f'<div class="demo vfirst" data-stage="1"><div class="phone"><div class="screen vid"><div class="vf"></div><div class="brand2"><span class="lg"></span>Your Dealership</div><div class="chaps"><span class="ch c1"><i></i>Under hood</span><span class="ch c2 on"><i></i>Tires</span><span class="ch c3 on"><i></i>Brakes</span></div><span class="bigplay"></span><div class="vsheet"><div class="vh">Inspection summary<span>2023 Rogue</span></div><div class="count"><span><i class="dot r"></i>1 now</span><span><i class="dot y"></i>2 soon</span><span><i class="dot g"></i>35 OK</span></div><div class="lcta">View report</div></div></div></div></div>'
exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'step4-screens.py')).read())

extra='''
.sheetpage{width:1280px;box-sizing:border-box;padding:48px;background:#fff;font-family:var(--font);color:var(--text);display:flex;flex-direction:column;gap:56px}
.sheetpage h1{margin:0;font-size:30px;letter-spacing:-.02em;color:var(--navy)}
.sheetpage .intro{margin:8px 0 0;font-size:16px;color:var(--text-2);max-width:72ch}
.srow{display:flex;flex-direction:column;gap:16px}
.srow h2{margin:0;font-size:22px;letter-spacing:-.02em;color:var(--navy)}
.opts{display:flex;gap:24px;align-items:flex-start}
.opt{display:flex;flex-direction:column;gap:12px;width:276px}
.opt .stage{height:450px;display:flex;align-items:flex-start;justify-content:center}
.opt .stage .phone{transform:scale(.72);transform-origin:top center}
.opt.wide{width:400px}.opt.wide .stage{height:260px;position:relative}
.opt .cap{font-size:14px;line-height:1.4;color:var(--text-2)}.opt .cap b{color:var(--navy);font-size:16px}.opt .cap em{font-style:normal;font-weight:700;color:var(--teal)}
.lapwrap{position:relative;width:400px;height:250px}
.sheetlap{position:absolute;left:20px;top:0;right:auto;bottom:auto;transform:scale(1);width:360px;filter:drop-shadow(0 16px 24px rgba(0,0,0,.3))}
.lapwrap .fchip{z-index:4}
.lapwrap .fchip.k0{left:-20px;top:30px}.lapwrap .fchip.k1{left:-30px;top:90px}.lapwrap .fchip.k2{left:-20px;top:150px}.lapwrap .fchip.k3{left:-30px;top:200px}
@keyframes sfly{0%{opacity:0;transform:translate(0,0)}6%{opacity:1}22%{opacity:1;transform:translate(210px,calc(var(--ty) - 0px)) scale(.8)}26%,100%{opacity:0;transform:translate(210px,var(--ty)) scale(.3)}}
.lapwrap .fchip.k0{--ty:60px;animation:sfly 7s var(--ease) infinite}.lapwrap .fchip.k1{--ty:20px;animation:sfly 7s var(--ease) 1s infinite}.lapwrap .fchip.k2{--ty:-20px;animation:sfly 7s var(--ease) 2s infinite}.lapwrap .fchip.k3{--ty:-60px;animation:sfly 7s var(--ease) 3s infinite}
.static .lrow{opacity:1;animation:none}.static .lbar i{animation:none;width:100%}
/* 1B carousel */
.ctrack{overflow:hidden;margin:16px -20px 0;padding:0 20px}
.cinner{display:flex;gap:10px;animation:ctrack 7s var(--ease) infinite}
@keyframes ctrack{0%,12%{transform:translateX(0)}22%,40%{transform:translateX(-122px)}50%,68%{transform:translateX(-244px)}78%,90%{transform:translateX(-366px)}100%{transform:translateX(0)}}
.ccard{position:relative;flex:0 0 112px;height:140px;border-radius:14px;background:var(--sheet);padding:12px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden}
.ccard .cn{font-weight:800;font-size:15px;letter-spacing:-.01em;position:relative}.ccard .cs{font-size:12px;font-weight:700;color:var(--mid);position:relative;min-height:1.2em}
.ccard .cfill{position:absolute;inset:0;transform:scale(0);transform-origin:16px 16px;border-radius:14px}
.ccard.y .cfill{background:var(--yellow)}.ccard.r .cfill{background:var(--red)}.ccard.g .cfill{background:var(--green)}
.ccard.r .cn,.ccard.r .cs{color:#fff}
.ccard.c0 .cfill{animation:cfill 7s var(--ease) infinite}.ccard.c1 .cfill{animation:cfill 7s var(--ease) 1.95s infinite}.ccard.c2 .cfill{animation:cfill 7s var(--ease) 3.9s infinite}
@keyframes cfill{0%,4%{transform:scale(0)}10%,88%{transform:scale(1.6)}94%,100%{transform:scale(0)}}
.ccard.r .cn{color:var(--char)}.ccard.r .cs{color:var(--mid)}
.cara .sheet{bottom:104px}.cara .sheet .words span{opacity:1;transform:none}
.cara .mic{background:var(--red)}.cara .wave i{animation:wave .9s ease-in-out infinite}
/* 1C transcript */
.trans .screen{background:var(--char);color:#fff}
.tbig{padding:30px 22px 0;flex:1;display:flex;flex-direction:column;gap:18px}
.twave{display:flex;align-items:flex-end;gap:3px;height:28px}.twave i{width:4px;background:var(--teal-l);border-radius:2px;height:5px;transform-origin:bottom;animation:wave .9s ease-in-out infinite}
.ttext{font-size:17px;line-height:1.4;font-weight:600;margin:0;min-height:5.7em;letter-spacing:-.01em}
.ttext span{opacity:0;animation:tword 7s var(--ease) infinite}
.tr2 .ttext span.ttw{animation:none;opacity:0}.tr2 .ttext span.sent{animation:none;opacity:1}.tr2 .tag{animation:none}
.tr2 .ttext{position:relative}.tr2 .sent{position:absolute;left:0;top:0;right:0}
.tlabel{font-size:11px;font-weight:700;color:#bdb9ba;display:flex;justify-content:space-between;letter-spacing:.02em}.tlabel span{font-weight:600}
@keyframes tword{0%{opacity:0}4%,86%{opacity:1}92%,100%{opacity:0}}
.tags{display:flex;flex-direction:column;gap:8px}
.tag{display:inline-flex;align-items:center;gap:7px;align-self:flex-start;background:#fff;color:var(--char);font-weight:700;font-size:12.5px;padding:6px 11px;border-radius:999px;opacity:0;transform:translateY(8px) scale(.9);animation:tag 7s var(--spring) infinite}
.tag .dot{width:8px;height:8px}
@keyframes tag{0%{opacity:0;transform:translateY(8px) scale(.9)}4%,86%{opacity:1;transform:none}92%,100%{opacity:0}}
.trans .dock{background:transparent}.trans .mic{background:var(--red)}.trans .hint{color:#bdb9ba}
/* 2B shot list */
.slist{position:absolute;left:12px;right:12px;top:50px;background:rgba(255,255,255,.96);color:var(--char);border-radius:18px;padding:14px 16px;z-index:3}
.slist .sh{font-size:11px;font-weight:700;color:var(--mid);display:flex;justify-content:space-between;margin-bottom:6px}.slist .sh em{font-style:normal}
.slist ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.slist li{display:flex;align-items:center;gap:9px;font-size:13.5px;font-weight:600;padding:6px 0;border-bottom:1px solid var(--sheet)}
.slist li i{width:16px;height:16px;border-radius:5px;background:var(--light);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;animation:tick 7s var(--ease) infinite}
.slist li i svg{width:10px;height:10px;opacity:0}
@keyframes tick{0%{background:var(--light)}4%,88%{background:var(--green)}94%,100%{background:var(--light)}}
.slist li i svg{animation:ticksvg 7s var(--ease) infinite;animation-delay:inherit}
@keyframes ticksvg{0%{opacity:0}4%,88%{opacity:1}94%,100%{opacity:0}}
.shots .rec,.prompt .rec,.vfirst .rec{opacity:1}.shots .rec i,.prompt .rec i{animation:blink 1s ease-in-out infinite}
.shots .dock,.prompt .dock,.vfirst .dock{background:transparent}.shots .mic,.prompt .mic{background:#fff}.shots .mic:after,.prompt .mic:after{content:"";width:22px;height:22px;border-radius:5px;background:var(--red);transform:scale(.8)}
/* 2D teleprompter */
.prompt .brk{opacity:1;transform:scale(.92)}
.tele{position:absolute;left:12px;right:12px;bottom:104px;background:rgba(255,255,255,.96);color:var(--char);border-radius:18px;padding:14px 16px;z-index:3}
.tele .sh{font-size:11px;font-weight:700;color:var(--mid);display:flex;justify-content:space-between}.tele .sh em{font-style:normal;color:var(--char)}
.tele p{margin:8px 0 0;font-size:19px;line-height:1.3;font-weight:700;letter-spacing:-.01em}
.tele p span{color:var(--light);animation:karaoke 7s linear infinite}
@keyframes karaoke{0%{color:var(--light)}5%,80%{color:var(--char)}90%,100%{color:var(--light)}}
/* 3B two-pane */
.two{display:flex;gap:10px;flex:1;min-height:0}
.pane{flex:1;display:flex;flex-direction:column;font-size:10.5px}
.pane.dark{background:var(--char);color:#fff;border-radius:8px;padding:8px 10px}
.lrow.st{opacity:1;animation:none;padding:3px 0;font-size:10.5px}
.lh2{display:flex;justify-content:space-between;font-size:10px;color:var(--light);font-weight:600;margin-bottom:4px}
.ln{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:500;padding:3px 0;opacity:0;transform:translateX(-8px);animation:lnin 7s var(--ease) infinite}
.ln i{width:12px;height:12px;border-radius:3px;background:var(--green);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}.ln svg{width:8px;height:8px}
.ln .price{margin-left:auto;color:var(--light);font-variant-numeric:tabular-nums}
@keyframes lnin{0%{opacity:0;transform:translateX(-8px)}4%,86%{opacity:1;transform:none}92%,100%{opacity:0}}
.tot{display:flex;justify-content:space-between;margin-top:auto;padding-top:6px;border-top:1px solid rgba(255,255,255,.15);font-size:11px;opacity:0;animation:lnin 7s var(--ease) 4s infinite}
.lcta.flip{position:relative;animation:ctaflip 7s var(--ease) infinite}.lcta.flip .l2{display:none}
@keyframes ctaflip{0%,62%{background:var(--char);color:#fff}66%,88%{background:var(--green);color:var(--ink)}94%,100%{background:var(--char);color:#fff}}
.lcta.flip .l1{animation:l1 7s linear infinite}.lcta.flip .l2{display:inline;position:absolute;left:0;right:0;animation:l2 7s linear infinite}
@keyframes l1{0%,63%{opacity:1}66%,88%{opacity:0}92%,100%{opacity:1}}@keyframes l2{0%,63%{opacity:0}66%,88%{opacity:1}92%,100%{opacity:0}}
.count{display:flex;gap:8px}.count span{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;background:var(--sheet);border-radius:999px;padding:3px 8px}.count .dot{width:8px;height:8px}
/* 3D transcript to form */
.pane.quote{display:block;font-size:12px;line-height:1.45;font-weight:500;color:var(--char);padding-right:6px}
.pane.quote mark{border-radius:4px;padding:0 3px;font-weight:700;background:var(--sheet)}.pane.quote mark.y{background:var(--yellow)}.pane.quote mark.g{background:var(--green)}
.pane.form{gap:4px}.pane.form .f{display:flex;justify-content:space-between;font-size:10.5px;padding:4px 0;border-bottom:1px solid var(--sheet)}.pane.form .f b{font-variant-numeric:tabular-nums}.pane.form .f b.yy{color:#8a6d00}
/* 4B approvals */
.rep2 .body{padding:14px 16px 0}
.thumb.sm{height:84px}
.grp{background:var(--paper);border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
.gh{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:700;color:var(--mid)}.gh .dot{width:8px;height:8px}
.item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid var(--sheet)}
.item b{display:block;font-size:12.5px}.item small{font-size:11px;color:var(--mid)}
.appr{position:relative;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;min-width:70px;padding:6px 10px;border-radius:999px;background:var(--char);color:#fff;font-weight:700;font-size:11px;overflow:hidden;animation:apprbg 7s var(--ease) infinite}
.appr.st{animation:none}.appr .a2{position:absolute;display:inline-flex;align-items:center;gap:4px;opacity:0;animation:a2 7s var(--ease) infinite}.appr .a2 svg{width:10px;height:10px}
.appr .a1{animation:a1 7s var(--ease) infinite}.appr.st .a1{animation:none}
.appr .tap{position:absolute;left:50%;top:50%;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.4);transform:translate(-50%,-50%) scale(0);animation:apptap 7s var(--ease) infinite}
@keyframes apprbg{0%,28%{background:var(--char);color:#fff}34%,88%{background:var(--green);color:var(--ink)}94%,100%{background:var(--char);color:#fff}}
@keyframes a1{0%,30%{opacity:1}34%,88%{opacity:0}94%,100%{opacity:1}}@keyframes a2{0%,30%{opacity:0}34%,88%{opacity:1}94%,100%{opacity:0}}
@keyframes apptap{0%,26%{transform:translate(-50%,-50%) scale(0);opacity:1}34%{transform:translate(-50%,-50%) scale(2.4);opacity:0}100%{opacity:0}}
.abar{margin-top:auto;display:flex;justify-content:space-between;align-items:center;padding:14px 20px 22px;font-size:13px;font-weight:600;color:var(--char);opacity:0;transform:translateY(10px);animation:abar 7s var(--ease) infinite}.abar b{font-size:16px}
@keyframes abar{0%,34%{opacity:0;transform:translateY(10px)}40%,88%{opacity:1;transform:none}94%,100%{opacity:0}}
/* 4D video first */
.brand2{position:absolute;top:18px;left:16px;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:#fff}
.brand2 .lg{width:26px;height:26px;border-radius:7px;background:var(--navy);display:inline-flex;align-items:center;justify-content:center;position:relative}.brand2 .lg:after{content:"";width:12px;height:12px;border:2.5px solid var(--teal-l);border-radius:50%;border-right-color:transparent;transform:rotate(-30deg)}
.vfirst .chaps{top:52px}.vfirst .ch.on{transform:none;opacity:1}
.bigplay{position:absolute;left:50%;top:44%;width:56px;height:56px;border-radius:50%;background:#fff;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center}.bigplay:after{content:"";border-left:18px solid var(--char);border-top:11px solid transparent;border-bottom:11px solid transparent;margin-left:5px}
.vsheet{position:absolute;left:0;right:0;bottom:0;background:var(--paper);color:var(--char);border-radius:22px 22px 30px 30px;padding:16px 18px 20px;display:flex;flex-direction:column;gap:10px;z-index:3}
.vh{font-weight:700;font-size:14px;display:flex;justify-content:space-between}.vh span{color:var(--mid);font-weight:600;font-size:11px}
.vsheet .lcta{margin-top:4px;font-size:12px;padding:9px}
.vfirst .vf:after{top:40%}
@media (prefers-reduced-motion:reduce){.sheetpage *{animation:none !important}}
'''+TR2_CSS+STEP2_CSS+STEP2F_CSS+STEP3_CSS+STEP4_CSS+'\n.sheetpage{width:1360px}'
def opt(code,title,html,cap,motion,wide=False):
    return f'<div class="opt{" wide" if wide else ""}"><div class="stage">{html}</div><div class="cap"><b>{code}</b> {title}. {cap} {"<em>Motion</em>" if motion else "Static"}</div></div>'
rows=[
 ('Step 1: Walk & talk (phone)',[
  opt('1A','Tiles fill as the tech talks',s1A,'What the page shows today. Voice sheet streams the words, the four tread tiles fill with color and numbers, two findings land as rows.',True),
  opt('1B','Color-coded carousel',s1B,'The 38-item catalog as a card carousel. It steps to the next item as the tech moves on, and each card takes its color when a finding lands.',True),
  opt('1C','Live transcript with findings',s1C,'Each sentence builds a word at a time. A finding pops in a beat after the words that caused it. The sentence clears, the next one starts, and the findings stay and stack up. Three sentences, then it loops.',True),
  opt('1D','Finished tires screen',s1D,'The calm end state: four tiles filled, two findings listed, no sheet. Reads instantly in a thumbnail.',False)]),
 ('Step 2: Shoot some video (phone)',[
  opt('2A','Shot list card',s2A,'What the page shows today, for reference.',True),
  opt('2E','Guided shots',s2E,'REC counts up. A chapter strip at the top fills as the tech works (Under hood done, Tires filling, Brakes added). The shot card at the bottom shows what to film and what to say, with its own progress line, and slides to the next shot. Each time the tech says a measurement, a "captured" chip pops above the card.',True),
  opt('2F','Captions to findings',s2F,'Caption builds word by word at the bottom. When a measurement is recognized a white New finding card pops in, holds a beat, then flies up and shrinks into a chip at the top. The chips stay and stack. Three findings (cabin filter, belt, battery), none repeated from step 1, then it loops.',True)]),
 ('Step 3: TenthGear fills out the forms (laptop)',[
  opt('3G','Findings become lines (round 2)',s3G,'For comparison: two lists and a button.',True,True),
  opt('3H','Lines appear as RO tabs',s3H,'No button: it runs on its own. Each red and yellow row glows, lifts off as a chip and flies up into the RO tab strip, where it becomes a new tab. The new tab opens a line card with the tech\'s own words from the walkaround or the video. Earlier tabs fold down to their number. The row on the report gets its line number.',True,True),
  opt('3I','Lines deal onto a stack',s3I,'No button. Each row lifts off as a chip and flies onto a stack of line cards; the new card lands on top with the tech\'s words and pushes the earlier ones back.',True,True)]),
 ('Step 4: Your customer gets a gorgeous report (phone)',[
  opt('4E','Text to report',s4E,'The phone lights up with a text from the dealership (the advisor\'s real default message). A tap opens the report under the dealership\'s name: the inspection video starts and walks through its chapters, then the page scrolls to the five recommendations with their photos.',True),
  opt('4F','Swipe to decide',s4F,'The customer\'s card deck, as in the app: one recommendation per card with the photo, a plain-English reason and the price. Approve, approve, approve, approve, decline the cabin filter; the approved total ticks up. Then Your decisions and Send to my advisor.',True),
  opt('4G','Video with chapters and captions',s4G,'The customer\'s video player: the tech\'s footage with chapter names only, captions word by word. Mid-loop the customer taps ES and the captions switch to Spanish.',True),
  opt('4H','Every item, color-coded',s4H,'The full MPI report as a 38-tile grid that fills red, yellow and green. Each finding gets tapped in turn and opens its card: photo, plain-English reason and the tech\'s own words.',True)])]
body=''.join(f'<section class="srow"><h2>{t}</h2><div class="opts">{"".join(o)}</div></section>' for t,o in rows)
script=main[main.index('<script type="text/x-dc"'):main.index('</script>')+9].replace('"height":7400','"height":3000')
page=f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Device screen options</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap">
<style>
{css}
{extra}
</style>
</helmet>
<div class="sheetpage">
<div><h1>Device screen options</h1><p class="intro">Four options per step, two or three with motion. The first in each row is what the page shows today. Reply with one code per step (for example 1C, 2B, 3B, 4B). Motion options loop every seven seconds.</p></div>
{body}
</div>
</x-dc>
{script}
</body>
</html>
'''
open('board/project/Screens.dc.html','w').write(page); print('ok',len(page))

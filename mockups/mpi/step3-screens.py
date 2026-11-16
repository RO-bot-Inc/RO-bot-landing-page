# Step 3 laptop screens, round 2 (3E, 3F, 3G). Exec'd by build-screens.py; uses laptop() and CHK from it.
# Same rules as 2F: every animated element starts hidden, all animation in stylesheet classes (no inline animation).
# Items continue the story from steps 1 and 2: front tread, rear pads, wheel balance (walkaround), cabin filter, belt, battery (video).
S3_KF=[]; S3_RULES=[]; S3_BASE=[]
def s3_anim(prefix,T):
    """Returns kf(name, segs) and rule(sel, name) bound to one option's loop length T."""
    def kf(name,segs):
        name=f'{prefix}_{name}'
        S3_KF.append(f'@keyframes {name}{{'+''.join(f'{round(100*min(t,T)/T,2)}%{{{c}}}' for t,c in segs)+'}')
        return name
    def rule(sel,name): S3_RULES.append(f'{sel}{{animation-name:{name}}}')
    return kf,rule
H='opacity:0'; V='opacity:1;transform:none'
MIC3='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><path d="M12 18v3"></path></svg>'
PLAY3='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"></path></svg>'
CUR3='<svg class="cur3" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8.5-6.2 1.3L9.6 19z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"></path></svg>'
def src(kind): return f'<i class="src {kind}">{MIC3 if kind=="mic" else PLAY3}</i>'
def stack(cls,vals,kf,rule,T,tag):
    """A number that ticks: vals = [(text, t_on), ...]; each value shows from its t_on to the next one."""
    out=''
    for i,(v,t) in enumerate(vals):
        t2=vals[i+1][1] if i+1<len(vals) else T-0.5
        n=kf(f'{tag}{i}',[(0,H),(t,H),(t+0.01,'opacity:1'),(t2,'opacity:1'),(t2+0.01,H),(T,H)])
        rule(f'.{cls} .{tag} b:nth-child({i+1})',n)
        out+=f'<b>{v}</b>'
    return f'<span class="tick {tag}">{out}</span>'

# ---------- 3E: the report builds itself from both sources
T=12.0; kf,rule=s3_anim('e',T)
rows3e=[('y','Tire tread, front','4/32"','mic',1.0),('r','Brake pads, rear','2 mm','mic',2.2),('y','Wheel balance','Recommend','mic',3.4),
        ('y','Cabin air filter','Replace','vid',4.8),('r','Serpentine belt','Cracked','vid',6.0)]
END=T-0.5
r=''
for i,(c,l,v,s,t) in enumerate(rows3e):
    n=kf(f'row{i}',[(0,'opacity:0;transform:translateX(-14px)'),(t,'opacity:0;transform:translateX(-14px)'),(t+0.3,V),(END,V),(END+0.3,H),(T,H)])
    rule(f'.s3e .r3.n{i}',n)
    n=kf(f'hl{i}',[(0,'background:rgba(255,213,74,0)'),(t+0.1,'background:rgba(255,213,74,0)'),(t+0.3,'background:rgba(255,213,74,.45)'),(t+1.0,'background:rgba(255,213,74,0)'),(T,'background:rgba(255,213,74,0)')])
    rule(f'.s3e .r3.n{i} .hl',n)
    n=kf(f'pulse{i}',[(0,'transform:scale(1)'),(t-0.05,'transform:scale(1)'),(t+0.15,'transform:scale(1.25)'),(t+0.45,'transform:scale(1)'),(T,'transform:scale(1)')])
    rule(f'.s3e .srcpill.{s}{i}',n)
    r+=f'<div class="r3 n{i}"><span class="hl"></span><i class="dot {c}"></i><span class="l">{l}</span><span class="v">{v}</span>{src("mic" if s=="mic" else "vid")}</div>'
t_ok=7.3
n=kf('ok',[(0,'opacity:0;transform:translateX(-14px)'),(t_ok,'opacity:0;transform:translateX(-14px)'),(t_ok+0.3,V),(END,V),(END+0.3,H),(T,H)]); rule('.s3e .r3.ok',n)
r+='<div class="r3 ok"><span class="hl"></span><i class="dot g"></i><span class="l">33 more items, incl. battery</span><span class="v">OK</span></div>'
# source pills pulse when a row from them lands; one pulse element per row so the keyframes stay simple
pills='<div class="srcs"><span class="srcpill">'+''.join(f'<span class="pp mic{i}"></span>' for i,x in enumerate(rows3e) if x[3]=='mic')+f'<span class="ico">{MIC3}</span>Walkaround</span><span class="srcpill">'+''.join(f'<span class="pp vid{i}"></span>' for i,x in enumerate(rows3e) if x[3]=='vid')+f'<span class="ico">{PLAY3}</span>Video</span></div>'
for i,x in enumerate(rows3e):
    t=x[4]; n=kf(f'pp{i}',[(0,'opacity:0;transform:scale(.8)'),(t-0.1,'opacity:0;transform:scale(.8)'),(t+0.05,'opacity:.9;transform:scale(1)'),(t+0.6,'opacity:0;transform:scale(1.15)'),(T,'opacity:0')])
    rule(f'.s3e .pp.{x[3]}{i}',n)
cnt=('<div class="cnt">'
     '<span><i class="dot r"></i>'+stack('s3e',[('0',0.2),('1',2.2),('2',6.0)],kf,rule,T,'cr')+'</span>'
     '<span><i class="dot y"></i>'+stack('s3e',[('0',0.2),('1',1.0),('2',3.4),('3',4.8)],kf,rule,T,'cy')+'</span>'
     '<span><i class="dot g"></i>'+stack('s3e',[('0',0.2),('33',t_ok)],kf,rule,T,'cg')+'</span></div>')
tc=8.6; tk=9.3
n=kf('cur',[(0,'opacity:0;transform:translate(60px,40px)'),(tc,'opacity:0;transform:translate(60px,40px)'),(tc+0.2,'opacity:1;transform:translate(60px,40px)'),(tk-0.05,'opacity:1;transform:translate(0,0)'),(tk+0.1,'opacity:1;transform:translate(0,0) scale(.85)'),(tk+0.25,'opacity:1;transform:translate(0,0)'),(tk+0.9,'opacity:0;transform:translate(0,0)'),(T,'opacity:0')]); rule('.s3e .cur3',n)
n=kf('b1',[(0,'opacity:1'),(tk+0.1,'opacity:1'),(tk+0.2,'opacity:0'),(END,'opacity:0'),(END+0.3,'opacity:1'),(T,'opacity:1')]); rule('.s3e .btn3 .l1',n)
n=kf('b2',[(0,H),(tk+0.1,H),(tk+0.25,'opacity:1'),(END,'opacity:1'),(END+0.3,H),(T,H)]); rule('.s3e .btn3 .l2',n)
n=kf('bp',[(0,'transform:scale(1)'),(tk+0.05,'transform:scale(1)'),(tk+0.15,'transform:scale(.97)'),(tk+0.3,'transform:scale(1)'),(T,'transform:scale(1)')]); rule('.s3e .btn3',n)
i3E=('<div class="lh">MPI report<span>RO 587, 2023 Rogue</span></div>'
     '<div class="srow3">'+pills+cnt+'</div>'
     '<div class="rows3">'+r+'</div>'
     f'<div class="btn3"><span class="l1">Save &amp; Create Lines</span><span class="l2">{CHK}5 lines created</span></div>'+CUR3)
s3E='<div class="lap lapwrap s3e">'+laptop(i3E)+'</div>'
S3_BASE.append(f'.s3e .r3,.s3e .r3 .hl,.s3e .pp,.s3e .tick b,.s3e .cur3,.s3e .btn3,.s3e .btn3 span{{animation-duration:{T}s;animation-timing-function:cubic-bezier(.2,.8,.2,1);animation-iteration-count:infinite;animation-fill-mode:both}}')

# ---------- 3F: the tech's words land in the right field
T=12.4; kf,rule=s3_anim('f',T)
beats=[("Front tread is at","four thirty-seconds,","a little wear on the outside edge.",'mic','Walkaround','0:12',0,'4/32"','y'),
       ("Rear pads are down to","two millimeters,","I'd recommend replacing them.",'mic','Walkaround','0:31',1,'2 mm','r'),
       ("Cabin air filter is","pretty clogged,","I'd replace it.",'vid','Video','0:44',2,'Replace','y'),
       ("Serpentine belt is","cracking","along the ribs.",'vid','Video','1:05',3,'Cracked','r'),
       ("Battery","tested good,","terminals are clean.",'vid','Video','1:19',4,'Pass','g')]
fields=['Tire tread, front','Brake pads, rear','Cabin air filter','Serpentine belt','Battery']
BEAT=1.9; t0=0.4; END=T-0.6
quotes=''; flys=''; vals=''
for i,(a,m,b,s,sname,ts,fi,val,c) in enumerate(beats):
    t=t0+i*BEAT
    n=kf(f'q{i}',[(0,'opacity:0;transform:translateY(5px)'),(t,'opacity:0;transform:translateY(5px)'),(t+0.25,V),(t+BEAT-0.25,V),(t+BEAT-0.05,H),(T,H)])
    rule(f'.s3f .q.n{i}',n)
    n=kf(f'mk{i}',[(0,'background-size:0% 100%;color:#fff'),(t+0.45,'background-size:0% 100%;color:#fff'),(t+0.8,'background-size:100% 100%;color:#000'),(T,'background-size:100% 100%;color:#000')])
    rule(f'.s3f .q.n{i} mark',n)
    quotes+=f'<div class="q n{i}"><div class="qs">{src(s)}{sname}<em>{ts}</em></div><p>{a} <mark class="{c}">{m}</mark> {b}</p></div>'
    # chip flies from the quote to the field row
    ty=fi*21
    n=kf(f'fly{i}',[(0,'opacity:0;transform:translate(0,0) scale(.9)'),(t+0.8,'opacity:0;transform:translate(0,0) scale(.9)'),(t+0.95,'opacity:1;transform:translate(0,0) scale(1)'),(t+1.45,f'opacity:1;transform:translate(245px,{ty-30}px) scale(.9)'),(t+1.55,f'opacity:0;transform:translate(245px,{ty-30}px) scale(.9)'),(T,'opacity:0')])
    rule(f'.s3f .fly.n{i}',n)
    flys+=f'<span class="fly n{i}"><i class="dot {c}"></i>{val}</span>'
    n=kf(f'fv{i}',[(0,'opacity:0;transform:scale(.7)'),(t+1.45,'opacity:0;transform:scale(.7)'),(t+1.65,V),(END,V),(END+0.3,H),(T,H)])
    rule(f'.s3f .fr.n{fi} .fv',n)
    n=kf(f'fe{i}',[(0,'opacity:1'),(t+1.45,'opacity:1'),(t+1.5,'opacity:0'),(END+0.3,'opacity:0'),(END+0.4,'opacity:1'),(T,'opacity:1')])
    rule(f'.s3f .fr.n{fi} .fe',n)
    n=kf(f'fbg{i}',[(0,'background:rgba(255,213,74,0)'),(t+1.4,'background:rgba(255,213,74,0)'),(t+1.55,'background:rgba(255,213,74,.5)'),(t+2.4,'background:rgba(255,213,74,0)'),(T,'background:rgba(255,213,74,0)')])
    rule(f'.s3f .fr.n{fi}',n)
    vals+=f'<div class="fr n{fi}"><span class="l">{fields[fi]}</span><span class="fe">&mdash;</span><span class="fv"><i class="dot {c}"></i>{val}</span></div>'
tk=t0+len(beats)*BEAT+0.5; tc=tk-0.7
tq=t0+len(beats)*BEAT
n=kf('qend',[(0,'opacity:0;transform:translateY(5px)'),(tq,'opacity:0;transform:translateY(5px)'),(tq+0.25,V),(END,V),(END+0.3,H),(T,H)]); rule('.s3f .q.end',n)
quotes+='<div class="q end"><div class="qs">Ready for review</div><p>5 findings from the walkaround and the video. Nothing goes on the report until the tech applies them.</p></div>'
n=kf('cur',[(0,'opacity:0;transform:translate(70px,30px)'),(tc,'opacity:0;transform:translate(70px,30px)'),(tc+0.2,'opacity:1;transform:translate(70px,30px)'),(tk-0.05,'opacity:1;transform:translate(0,0)'),(tk+0.1,'opacity:1;transform:translate(0,0) scale(.85)'),(tk+0.25,'opacity:1;transform:translate(0,0)'),(tk+0.9,'opacity:0;transform:translate(0,0)'),(T,'opacity:0')]); rule('.s3f .cur3',n)
n=kf('b1',[(0,'opacity:1'),(tk+0.1,'opacity:1'),(tk+0.2,'opacity:0'),(END,'opacity:0'),(END+0.3,'opacity:1'),(T,'opacity:1')]); rule('.s3f .btn3 .l1',n)
n=kf('b2',[(0,H),(tk+0.1,H),(tk+0.25,'opacity:1'),(END,'opacity:1'),(END+0.3,H),(T,H)]); rule('.s3f .btn3 .l2',n)
n=kf('bp',[(0,'transform:scale(1)'),(tk+0.05,'transform:scale(1)'),(tk+0.15,'transform:scale(.97)'),(tk+0.3,'transform:scale(1)'),(T,'transform:scale(1)')]); rule('.s3f .btn3',n)
i3F=('<div class="lh">Findings to review<span>RO 587, 2023 Rogue</span></div>'
     '<div class="two3"><div class="qpane">'+quotes+'</div><div class="fpane"><div class="fh">MPI report</div>'+vals+'</div></div>'
     '<div class="flys">'+flys+'</div>'
     f'<div class="btn3"><span class="l1">Apply 5 findings</span><span class="l2">{CHK}Applied to the MPI report</span></div>'+CUR3)
s3F='<div class="lap lapwrap s3f">'+laptop(i3F)+'</div>'
S3_BASE.append(f'.s3f .q,.s3f .q mark,.s3f .fly,.s3f .fv,.s3f .fe,.s3f .fr,.s3f .cur3,.s3f .btn3,.s3f .btn3 span{{animation-duration:{T}s;animation-timing-function:cubic-bezier(.2,.8,.2,1);animation-iteration-count:infinite;animation-fill-mode:both}}')

# ---------- 3G: red and yellow findings become lines on the RO
T=11.0; kf,rule=s3_anim('g',T)
find3g=[('r','Brake pads, rear','2 mm','Replace rear brake pads','Now'),('r','Serpentine belt','Cracked','Replace serpentine belt','Now'),
        ('y','Tire tread, front','4/32"','Replace front tires','Soon'),('y','Wheel balance','Recommend','Balance wheels','Soon'),
        ('y','Cabin air filter','Replace','Replace cabin air filter','Soon')]
END=T-0.6; tk=2.6; tc=1.9
left=''; right=''
for i,(c,l,v,line,when) in enumerate(find3g):
    t=0.3+i*0.22
    n=kf(f'fr{i}',[(0,'opacity:0;transform:translateY(4px)'),(t,'opacity:0;transform:translateY(4px)'),(t+0.25,V),(END,V),(END+0.3,H),(T,H)]); rule(f'.s3g .r3.n{i}',n)
    tl=tk+0.5+i*0.55
    n=kf(f'gh{i}',[(0,'opacity:0;transform:translate(0,0)'),(tl-0.02,'opacity:0;transform:translate(0,0)'),(tl,'opacity:1;transform:translate(0,0)'),(tl+0.45,'opacity:.9;transform:translate(160px,0)'),(tl+0.5,'opacity:0;transform:translate(160px,0)'),(T,'opacity:0')]); rule(f'.s3g .r3.n{i} .gh',n)
    n=kf(f'ln{i}',[(0,'opacity:0;transform:translateX(-10px)'),(tl+0.4,'opacity:0;transform:translateX(-10px)'),(tl+0.6,V),(END,V),(END+0.3,H),(T,H)]); rule(f'.s3g .ln3.n{i}',n)
    left+=f'<div class="r3 n{i}"><span class="gh"><i class="dot {c}"></i>{l}</span><i class="dot {c}"></i><span class="l">{l}</span><span class="v">{v}</span></div>'
    right+=f'<div class="ln3 n{i}"><span class="l">{line}</span><span class="tg {c}">{when}</span></div>'
t_ok=0.3+len(find3g)*0.22
n=kf('ok',[(0,'opacity:0;transform:translateY(4px)'),(t_ok,'opacity:0;transform:translateY(4px)'),(t_ok+0.25,V),(END,V),(END+0.3,H),(T,H)]); rule('.s3g .r3.ok',n)
left+='<div class="r3 ok"><i class="dot g"></i><span class="l">33 items OK</span><span class="v">Pass</span></div>'
n=kf('empty',[(0,'opacity:1'),(tk+0.8,'opacity:1'),(tk+0.9,'opacity:0'),(END+0.3,'opacity:0'),(END+0.4,'opacity:1'),(T,'opacity:1')]); rule('.s3g .empty',n)
nlines=stack('s3g',[('0',0.1)]+[(str(i+1),tk+0.5+i*0.55+0.45) for i in range(len(find3g))],kf,rule,T,'nl')
tdone=tk+0.5+len(find3g)*0.55+0.4
n=kf('cur',[(0,'opacity:0;transform:translate(60px,40px)'),(tc,'opacity:0;transform:translate(60px,40px)'),(tc+0.2,'opacity:1;transform:translate(60px,40px)'),(tk-0.05,'opacity:1;transform:translate(0,0)'),(tk+0.1,'opacity:1;transform:translate(0,0) scale(.85)'),(tk+0.25,'opacity:1;transform:translate(0,0)'),(tk+0.9,'opacity:0;transform:translate(0,0)'),(T,'opacity:0')]); rule('.s3g .cur3',n)
n=kf('b1',[(0,'opacity:1'),(tk+0.1,'opacity:1'),(tk+0.2,'opacity:0'),(END,'opacity:0'),(END+0.3,'opacity:1'),(T,'opacity:1')]); rule('.s3g .btn3 .l1',n)
n=kf('b3',[(0,H),(tk+0.1,H),(tk+0.2,'opacity:1'),(tdone,'opacity:1'),(tdone+0.1,H),(T,H)]); rule('.s3g .btn3 .l3',n)
n=kf('b2',[(0,H),(tdone,H),(tdone+0.15,'opacity:1'),(END,'opacity:1'),(END+0.3,H),(T,H)]); rule('.s3g .btn3 .l2',n)
n=kf('bp',[(0,'transform:scale(1)'),(tk+0.05,'transform:scale(1)'),(tk+0.15,'transform:scale(.97)'),(tk+0.3,'transform:scale(1)'),(T,'transform:scale(1)')]); rule('.s3g .btn3',n)
i3G=('<div class="lh">MPI report<span>RO 587, 2023 Rogue</span></div>'
     '<div class="two3 g"><div class="lpane">'+left+'</div><div class="rpane"><div class="fh">Lines on RO 587<b>'+nlines+'</b></div><div class="empty">No lines yet</div>'+right+'</div></div>'
     f'<div class="btn3"><span class="l1">Save &amp; Create Lines</span><span class="l3">Creating lines</span><span class="l2">{CHK}5 lines created</span></div>'+CUR3)
s3G='<div class="lap lapwrap s3g">'+laptop(i3G)+'</div>'
S3_BASE.append(f'.s3g .r3,.s3g .gh,.s3g .ln3,.s3g .empty,.s3g .tick b,.s3g .cur3,.s3g .btn3,.s3g .btn3 span{{animation-duration:{T}s;animation-timing-function:cubic-bezier(.2,.8,.2,1);animation-iteration-count:infinite;animation-fill-mode:both}}')

STEP3_CSS="\n".join(S3_KF)+"\n"+"\n".join(S3_BASE)+"\n"+"\n".join(S3_RULES)+r"""
.s3e .lscreen,.s3f .lscreen,.s3g .lscreen{gap:6px;padding:11px 13px}
.lap .lscreen .dot{display:inline-block;border-radius:50%;flex:0 0 auto}
.srow3{display:flex;align-items:center;justify-content:space-between;gap:6px}
.srcs{display:flex;gap:5px}
.srcpill{position:relative;display:inline-flex;align-items:center;gap:4px;background:var(--sheet);border-radius:999px;padding:3px 8px 3px 4px;font-size:10px;font-weight:700}
.srcpill em{font-style:normal;color:var(--mid);font-weight:600}
.srcpill .ico{width:15px;height:15px;border-radius:50%;background:var(--char);color:#fff;display:grid;place-items:center}.srcpill .ico svg{width:9px;height:9px}
.srcpill .pp{position:absolute;inset:-2px;border-radius:999px;border:2px solid var(--char);opacity:0}
.cnt{display:flex;gap:4px}.cnt span{display:inline-flex;align-items:center;gap:4px;background:var(--sheet);border-radius:999px;padding:2px 7px;font-size:10px;font-weight:700}.cnt .dot{width:7px;height:7px}
.tick{position:relative;display:inline-block;min-width:13px;height:1.2em}.tick b{position:absolute;left:0;top:0;opacity:0;font-variant-numeric:tabular-nums}
.rows3{display:flex;flex-direction:column}
.r3{position:relative;display:flex;align-items:center;gap:7px;padding:3.2px 4px;border-bottom:1px solid var(--sheet);font-size:11px;font-weight:500;opacity:0}
.r3 .hl{position:absolute;inset:0;border-radius:3px}.r3>*:not(.hl):not(.gh){position:relative}
.r3 .dot{width:8px;height:8px}.r3 .l{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.r3 .v{font-weight:700;font-variant-numeric:tabular-nums}
.src{width:15px;height:15px;border-radius:4px;display:grid;place-items:center;background:var(--sheet);color:var(--char);flex:0 0 auto}.src svg{width:9px;height:9px}
.btn3{position:relative;margin-top:auto;height:24px;flex:0 0 24px;border-radius:6px;background:var(--char);color:#fff;font-weight:700;font-size:11px;overflow:hidden}
.btn3 span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:5px}
.btn3 .l2{background:var(--green);color:#000;opacity:0}.btn3 .l3{opacity:0;color:var(--light)}.btn3 .l2 svg{width:11px;height:11px}
.cur3{position:absolute;right:120px;bottom:2px;width:18px;height:18px;opacity:0;z-index:6;transform-origin:5px 3px}
.two3{display:grid;grid-template-columns:1fr 1.05fr;gap:8px;flex:1;min-height:0}
.qpane{position:relative;background:var(--char);color:#fff;border-radius:8px}
.q{position:absolute;inset:0;padding:9px 10px;opacity:0;display:flex;flex-direction:column;gap:6px}
.q .qs{display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:700;color:var(--light)}.q .qs em{font-style:normal;color:var(--mid);margin-left:auto}
.q .src{background:rgba(255,255,255,.14);color:#fff}
.q p{margin:0;font-size:12px;line-height:1.38;font-weight:600}
.q mark{color:#000;border-radius:3px;padding:0 2px;background-repeat:no-repeat;background-color:transparent;background-image:linear-gradient(var(--yellow),var(--yellow));background-size:0% 100%;color:#fff}
.q mark.r{background-image:linear-gradient(#e0607b,#e0607b)}.q mark.g{background-image:linear-gradient(var(--green),var(--green))}.q mark.y{color:#fff}
.fpane{display:flex;flex-direction:column}
.fh{display:flex;justify-content:space-between;align-items:center;font-size:9.5px;font-weight:700;color:var(--mid);text-transform:uppercase;letter-spacing:.04em;padding:0 4px 4px}
.fh b{color:var(--char);font-size:11px}
.fr{position:relative;display:flex;align-items:center;justify-content:space-between;height:21px;padding:0 4px;border-bottom:1px solid var(--sheet);font-size:11px;font-weight:500;border-radius:3px}
.fr .fe{color:var(--mid)}.fr .fv{position:absolute;right:4px;display:inline-flex;align-items:center;gap:5px;font-weight:700;opacity:0}.fr .dot{width:8px;height:8px}
.fe{position:absolute;right:6px}
.flys{position:absolute;left:0;top:0;width:0;height:0}
.fly{position:absolute;left:30px;top:80px;display:inline-flex;align-items:center;gap:5px;background:#fff;color:var(--char);font-weight:700;font-size:11px;padding:3px 9px;border-radius:999px;box-shadow:0 8px 18px -6px rgba(0,0,0,.55);white-space:nowrap;opacity:0;z-index:5}.fly .dot{width:8px;height:8px}
.s3f .cur3{right:150px}
.two3.g{grid-template-columns:1fr 1fr}
.lpane{display:flex;flex-direction:column}
.lpane .r3{padding:2.5px 2px;font-size:10.5px}
.lpane .gh{position:absolute;left:0;top:0;display:inline-flex;align-items:center;gap:5px;background:#fff;border-radius:999px;padding:1px 8px;box-shadow:0 6px 14px -4px rgba(0,0,0,.45);font-weight:700;opacity:0;z-index:4;white-space:nowrap}
.rpane{position:relative;background:var(--char);color:#fff;border-radius:8px;padding:7px 8px;display:flex;flex-direction:column;gap:3px}
.rpane .fh{padding:0 0 3px;color:var(--light)}.rpane .fh b{color:#fff}
.rpane .empty{position:absolute;left:0;right:0;top:50%;text-align:center;font-size:10.5px;color:var(--mid);font-weight:600}
.ln3{display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:10.5px;font-weight:600;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.1);opacity:0}
.ln3 .l{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tg{font-size:9px;font-weight:800;border-radius:999px;padding:1px 6px;color:#000}.tg.r{background:#e0607b}.tg.y{background:var(--yellow)}
"""

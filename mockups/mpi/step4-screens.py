# Step 4 phone screens, round 2 (4E, 4F, 4G, 4H): what the customer sees. Exec'd by build-screens.py.
# Same rules as 2F and step 3: animation lives in stylesheet classes, animated elements start hidden.
# Story continuity: RO 587, 2023 Rogue, the five lines from step 3 in the same order, the same photos.
# Labels come from the app's owner report (app/client/src/components/owner-report/strings.ts):
# Approve / Decline, "Ask a question about this", "Send to my advisor", "Approved total", "Inspection Video",
# and the advisor's default text "Inspection results are ready for your vehicle. Please review below and let me know if you have any questions!"
# Prices are mockup placeholders.
S4_KF=[]; S4_RULES=[]; S4_BASE=[]
def s4_anim(prefix,T):
    def kf(name,segs):
        name=f'q{prefix}_{name}'
        S4_KF.append(f'@keyframes {name}{{'+''.join(f'{round(100*min(max(t,0),T)/T,2)}%{{{c}}}' for t,c in segs)+'}')
        return name
    def rule(sel,name): S4_RULES.append(f'{sel}{{animation-name:{name}}}')
    S4_BASE.append(f'.s4{prefix} .a{{animation-duration:{T}s;animation-timing-function:cubic-bezier(.2,.8,.2,1);animation-iteration-count:infinite;animation-fill-mode:both}}')
    return kf,rule
IMG={'brakes':'/_blob/26bfaa3e7ad07135277bc88e69d3d678','belt':'/_blob/cc5b525269a0a01fe966c67b64e0c76d','tires':'/_blob/e1d974f354cc73fa933e3133b56f995f','cabin':'/_blob/385351b33e1ea6cd43ce3783e6c075d9'}
FIND=[ # key, dot, item, reading, plain-English line for the customer, price, photo key
 ('brakes','r','Rear brake pads','2 mm','Your rear pads are down to 2 mm. Replacing them now keeps the rotors from wearing.','$289','brakes'),
 ('belt','r','Serpentine belt','Cracked','The belt that runs the alternator and water pump is cracking along the ribs.','$145','belt'),
 ('tires','y','Front tires','4/32"','Your front tires are getting low. Plan to replace them before winter.','$412','tires'),
 ('bal','y','Wheel balance','Uneven wear','The wear pattern says the wheels are out of balance. Balancing evens it out.','$79',None),
 ('cabin','y','Cabin air filter','Clogged','Packed with leaves and dust. A new one keeps the air in the cabin clean.','$59','cabin')]
PHONE_I='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path></svg>'
PLAY_I='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"></path></svg>'
CHAT_I='<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 4c-4.9 0-8.5 3.1-8.5 7 0 2.2 1.2 4.2 3.1 5.5L6 20l4-2.1c.6.1 1.3.2 2 .2 4.9 0 8.5-3.1 8.5-7S16.9 4 12 4z"></path></svg>'
CHK4='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"></path></svg>'
MIC4='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><path d="M12 18v3"></path></svg>'
def brandbar(dark=False):
    return (f'<div class="bh4{" dk" if dark else ""}"><span class="lg4"><svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="sumg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b5fa8"/><stop offset="1" stop-color="#173a6b"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#sumg)"/><path d="M5 23.5 12.6 11l3.6 5.6 2.6-3.8L27 23.5Z" fill="#fff"/><path d="M5 23.5c5.5-2.4 11.5-2.4 22 0" fill="none" stroke="#e8b04b" stroke-width="1.6" stroke-linecap="round"/></svg></span><div class="bn"><b>Summit Auto</b><small>(555) 010-2030</small></div>'
            f'<span class="call4">{PHONE_I}</span></div>')
def phone4(cls,inner,dark=False): return f'<div class="p4 s4{cls}"><div class="phone"><div class="screen{" dk4" if dark else ""}">{inner}</div></div></div>'
def finger(kf,rule,cls,taps,T):
    """taps = [(t, x, y)]: a touch dot that glides between tap points and presses at each."""
    segs=[(0,f'opacity:0;transform:translate({taps[0][1]}px,{taps[0][2]+30}px)')]
    for i,(t,x,y) in enumerate(taps):
        segs+=[(t-0.45,f'opacity:0;transform:translate({x}px,{y+26}px) scale(1)') if i==0 else (t-0.4,f'opacity:.9;transform:translate({x}px,{y}px) scale(1)'),
               (t-0.15,f'opacity:.9;transform:translate({x}px,{y}px) scale(1)'),(t,f'opacity:.9;transform:translate({x}px,{y}px) scale(.78)'),(t+0.18,f'opacity:.9;transform:translate({x}px,{y}px) scale(1)')]
        nxt=taps[i+1][0] if i+1<len(taps) else None
        if nxt is None or nxt-t>1.4:
            segs+=[(t+0.45,f'opacity:0;transform:translate({x}px,{y}px) scale(1)')]
            if nxt is not None: segs+=[(nxt-0.6,f'opacity:0;transform:translate({taps[i+1][1]}px,{taps[i+1][2]+26}px) scale(1)')]
    segs+=[(T,f'opacity:0;transform:translate({taps[-1][1]}px,{taps[-1][2]}px)')]
    rule(f'.s4{cls} .fing',kf('fing',segs))
    return '<span class="fing a"></span>'
def show(kf,rule,sel,name,t_in,t_out,T,hid='opacity:0',vis='opacity:1;transform:none',d=0.3):
    rule(sel,kf(name,[(0,hid),(t_in,hid),(t_in+d,vis),(t_out,vis),(t_out+d,hid),(T,hid)]))
def ticker(kf,rule,cls,tag,vals,T,end):
    out=''
    for i,(v,t) in enumerate(vals):
        t2=vals[i+1][1] if i+1<len(vals) else end
        rule(f'.s4{cls} .{tag} b:nth-child({i+1})',kf(f'{tag}{i}',[(0,'opacity:0'),(t,'opacity:0'),(t+0.01,'opacity:1'),(t2,'opacity:1'),(t2+0.01,'opacity:0'),(T,'opacity:0')]))
        out+=f'<b class="a">{v}</b>'
    return f'<span class="tk4 {tag}">{out}</span>'

# ---------- 4E: the text arrives, the customer taps, the report opens and plays
T=11.6; kf,rule=s4_anim('e',T); END=T-0.6
lock=('<div class="lock4"><div class="lt4">9:41</div><div class="ld4">Tuesday, November 17</div></div>')
notif=(f'<div class="nt4 a"><div class="nh"><span class="ni">{CHAT_I}</span><b>Summit Auto</b><em>now</em></div>'
       '<p>Inspection results are ready for your vehicle. Please review below and let me know if you have any questions!</p>'
       '<div class="nl"><span class="lg4 sm"><svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="sumg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b5fa8"/><stop offset="1" stop-color="#173a6b"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#sumg)"/><path d="M5 23.5 12.6 11l3.6 5.6 2.6-3.8L27 23.5Z" fill="#fff"/><path d="M5 23.5c5.5-2.4 11.5-2.4 22 0" fill="none" stroke="#e8b04b" stroke-width="1.6" stroke-linecap="round"/></svg></span><div><b>Your 2023 Rogue report</b><small>RO 587</small></div></div></div>')
rule('.s4e .nt4',kf('nt',[(0,'opacity:0;transform:translateY(-24px) scale(.96)'),(0.6,'opacity:0;transform:translateY(-24px) scale(.96)'),(0.95,V),(2.25,V),(2.35,'opacity:1;transform:scale(.97)'),(2.55,'opacity:1;transform:scale(1)'),(2.9,'opacity:0;transform:scale(1)'),(T,'opacity:0;transform:translateY(-24px) scale(.96)')]))
chapters=['Under hood','Tires','Brakes']; tch=[4.1,5.9,7.7]
posters=''.join(f'<img class="pst a ps{i}" src="{IMG[k]}" alt="">' for i,k in enumerate(['belt','tires','brakes']))
for i in range(3):
    t_in=tch[i]; t_out=tch[i+1] if i<2 else END
    rule(f'.s4e .ps{i}',kf(f'ps{i}',[(0,'opacity:1' if i==0 else 'opacity:0'),(t_in-0.01 if i else 0,'opacity:1' if i==0 else 'opacity:0'),(t_in+0.4 if i else 0,'opacity:1'),(t_out,'opacity:1'),(t_out+0.4,'opacity:0' if i<2 else 'opacity:1'),(T,'opacity:1' if i==0 else 'opacity:0')]))
    rule(f'.s4e .chp.c{i}',kf(f'chp{i}',[(0,'background:var(--sheet);color:var(--char)'),(t_in-0.01,'background:var(--sheet);color:var(--char)'),(t_in+0.2,'background:var(--char);color:#fff'),(t_out,'background:var(--char);color:#fff'),(t_out+0.2,'background:var(--sheet);color:var(--char)'),(T,'background:var(--sheet);color:var(--char)')]))
rule('.s4e .vplay',kf('vplay',[(0,'opacity:1;transform:translate(-50%,-50%) scale(1)'),(3.9,'opacity:1;transform:translate(-50%,-50%) scale(1)'),(4.1,'opacity:0;transform:translate(-50%,-50%) scale(1.3)'),(T,'opacity:0;transform:translate(-50%,-50%) scale(1)')]))
rule('.s4e .vbar i',kf('vbar',[(0,'transform:scaleX(0)'),(4.1,'transform:scaleX(0)'),(END,'transform:scaleX(.62)'),(T,'transform:scaleX(.62)')]))
video=(f'<div class="vc4">{posters}<span class="vplay a">{PLAY_I}</span><span class="vlab">Inspection Video<em>2:48</em></span><span class="vbar"><i class="a"></i></span></div>'
       '<div class="chps">'+''.join(f'<span class="chp a c{i}">{c}</span>' for i,c in enumerate(chapters))+'</div>')
rows=''
for i,(k,c,item,val,plain,price,ph) in enumerate(FIND):
    show(kf,rule,f'.s4e .rr.n{i}',f'rr{i}',3.3+i*0.18,END,T,hid='opacity:0;transform:translateY(8px)')
    th=f'<img src="{IMG[ph]}" alt="">' if ph else '<span class="noph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3.2"></circle><path d="M12 3v5.8M12 15.2V21M3 12h5.8M15.2 12H21"></path></svg></span>'
    rows+=f'<div class="rr a n{i}">{th}<div><b>{item}</b><small>{val}</small></div><span class="tg4 {c}">{"Now" if c=="r" else "Soon"}</span></div>'
rep=(f'<div class="rep4 a"><div class="rsc a">{brandbar()}'
     '<div class="rt4"><b>Your 2023 Rogue</b><small>Inspection results, RO 587</small></div>'
     +video+
     '<div class="cnt4"><span><i class="d4 r"></i>2 now</span><span><i class="d4 y"></i>3 soon</span><span><i class="d4 g"></i>33 good</span></div>'
     '<div class="sh4">Recommended</div>'+rows+'</div></div>')
rule('.s4e .rep4',kf('rep',[(0,'opacity:1;transform:translateY(105%)'),(2.6,'opacity:1;transform:translateY(105%)'),(3.1,'opacity:1;transform:none'),(END,'opacity:1;transform:none'),(END+0.4,'opacity:0;transform:none'),(T,'opacity:0;transform:translateY(105%)')]))
rule('.s4e .rsc',kf('rsc',[(0,'transform:none'),(8.6,'transform:none'),(9.4,'transform:translateY(-196px)'),(T,'transform:translateY(-196px)')]))
s4E=phone4('e',lock+notif+rep+finger(kf,rule,'e',[(2.35,121,223)],T),dark=True)

# ---------- 4F: the customer decides, card by card
T=13.6; kf,rule=s4_anim('f',T); END=T-0.6
tin=[0.3]; taps=[]; deck=''; total=[('$0',0.05)]; run=0
TOPS=[1.7,3.4,5.1,6.8,8.5]; ACT=['ok','ok','ok','ok','no']
for i,(k,c,item,val,plain,price,ph) in enumerate(FIND):
    tt=TOPS[i]; t_top=0.3 if i==0 else TOPS[i-1]+0.25
    out='translate(330px,-30px) rotate(14deg)' if ACT[i]=='ok' else 'translate(-330px,-30px) rotate(-14deg)'
    behind1='opacity:1;transform:translateY(14px) scale(.94)'; behind2='opacity:0;transform:translateY(26px) scale(.88)'
    segs=[(0,behind2 if i>0 else behind1)]
    if i>=2: segs+=[(TOPS[i-2]+0.25,behind2)]
    if i>=1: segs+=[(TOPS[i-2]+0.5 if i>=2 else 0,behind1),(t_top,behind1)]
    segs+=[(t_top+0.35,'opacity:1;transform:none'),(tt+0.2,'opacity:1;transform:none'),(tt+0.65,f'opacity:0;transform:{out}'),(T,f'opacity:0;transform:{out}')]
    if i==0: segs=[(0,'opacity:0;transform:translateY(14px) scale(.94)'),(0.05,'opacity:0;transform:translateY(14px) scale(.94)'),(0.35,'opacity:1;transform:none'),(tt+0.2,'opacity:1;transform:none'),(tt+0.65,f'opacity:0;transform:{out}'),(T,f'opacity:0;transform:{out}')]
    rule(f'.s4f .dc.n{i}',kf(f'dc{i}',segs))
    rule(f'.s4f .dc.n{i} .stp',kf(f'stp{i}',[(0,'opacity:0;transform:rotate(-12deg) scale(1.4)'),(tt+0.02,'opacity:0;transform:rotate(-12deg) scale(1.4)'),(tt+0.15,'opacity:1;transform:rotate(-12deg) scale(1)'),(T,'opacity:1;transform:rotate(-12deg) scale(1)')]))
    taps.append((tt,184 if ACT[i]=='ok' else 57,455))
    if ACT[i]=='ok':
        run+=int(price[1:]); total.append((f'${run}',tt+0.2))
    photo=f'<div class="dph"><img src="{IMG[ph]}" alt=""></div>' if ph else f'<div class="dph none"><span>{val}</span></div>'
    stamp=f'<span class="stp a ok">{CHK4}Approved</span>' if ACT[i]=='ok' else '<span class="stp a no">Declined</span>'
    deck+=(f'<div class="dc a n{i}" style="z-index:{10-i}">{photo}<div class="db"><span class="tg4 {c} big">{"Needs attention now" if c=="r" else "Recommended soon"}</span>'
           f'<b>{item}</b><p>{plain}</p><div class="dp"><span>Ask a question about this</span><b>{price}</b></div></div>{stamp}</div>')
rule('.s4f .dots4 i',kf('dotsx',[(0,'opacity:1'),(T,'opacity:1')]))
for i in range(5):
    t_on=0.3 if i==0 else TOPS[i-1]+0.25
    rule(f'.s4f .dots4 i:nth-child({i+1})',kf(f'dt{i}',[(0,'background:var(--light);width:6px'),(t_on,'background:var(--light);width:6px'),(t_on+0.25,'background:var(--char);width:16px'),(TOPS[i]+0.4,'background:var(--char);width:16px'),(TOPS[i]+0.6,'background:var(--mid);width:6px'),(T,'background:var(--mid);width:6px')]))
t_send=TOPS[-1]+0.9; t_done=t_send+1.0
rule('.s4f .btns4',kf('btns',[(0,'opacity:1'),(TOPS[-1]+0.4,'opacity:1'),(TOPS[-1]+0.6,'opacity:0'),(END+0.3,'opacity:0'),(END+0.5,'opacity:1'),(T,'opacity:1')]))
show(kf,rule,'.s4f .sum4','sum',TOPS[-1]+0.55,END,T,hid='opacity:0;transform:translateY(10px)')
show(kf,rule,'.s4f .send4','send',TOPS[-1]+0.6,END,T,hid='opacity:0;transform:translateY(10px)')
rule('.s4f .send4 .s1',kf('s1',[(0,'opacity:1'),(t_send+0.1,'opacity:1'),(t_send+0.25,'opacity:0'),(END+0.3,'opacity:0'),(END+0.5,'opacity:1'),(T,'opacity:1')]))
rule('.s4f .send4 .s2',kf('s2',[(0,'opacity:0'),(t_send+0.1,'opacity:0'),(t_send+0.3,'opacity:1'),(END,'opacity:1'),(END+0.3,'opacity:0'),(T,'opacity:0')]))
taps.append((t_send,121,455))
summary=('<div class="sum4 a"><div class="sh4">Your decisions</div>'+''.join(
    f'<div class="sr"><span class="{"ok" if ACT[i]=="ok" else "no"}">{CHK4 if ACT[i]=="ok" else "&times;"}</span>{x[2]}<b>{x[5] if ACT[i]=="ok" else "Declined"}</b></div>' for i,x in enumerate(FIND))+'</div>')
inner=(brandbar()+'<div class="dhd"><b>Your recommendations</b><span class="dots4"><i class="a"></i><i class="a"></i><i class="a"></i><i class="a"></i><i class="a"></i></span></div>'
       f'<div class="deck4">{deck}{summary}</div>'
       f'<div class="btns4 a"><span class="bd">Decline</span><span class="ba">Approve</span></div>'
       f'<div class="send4 a"><span class="s1 a">Send to my advisor</span><span class="s2 a">{CHK4}All set. Sent to your advisor</span></div>'
       '<div class="tot4"><span>Approved total</span>'+ticker(kf,rule,'f','tt',total,T,END)+'</div>'
       +finger(kf,rule,'f',taps,T))
s4F=phone4('f',inner)

# ---------- 4G: the customer's video: chapters, captions, English or Spanish
T=11.6; kf,rule=s4_anim('g',T); END=T-0.6
scenes=[('belt','Under hood',0.3,3.7,"Serpentine belt is cracking along the ribs.",'en'),
        ('tires','Tires',3.7,7.1,"The front tires are at four and the rears are at seven.",'en'),
        ('brakes','Brakes',7.1,END,"Las pastillas traseras están en dos milímetros.",'es')]
frames=''; caps=''; wn=0
for i,(k,ch,t0,t1,cap,lang) in enumerate(scenes):
    rule(f'.s4g .fr4.n{i}',kf(f'fr{i}',[(0,'opacity:0;transform:scale(1.04)'),(max(t0-0.3,0),'opacity:0;transform:scale(1.04)'),(t0+0.1,'opacity:1;transform:scale(1.05)'),(t1,'opacity:1;transform:scale(1.13)'),(t1+0.4,'opacity:0;transform:scale(1.14)'),(T,'opacity:0;transform:scale(1.04)')] if i else
         [(0,'opacity:1;transform:scale(1.05)'),(t1,'opacity:1;transform:scale(1.13)'),(t1+0.4,'opacity:0;transform:scale(1.14)'),(END+0.3,'opacity:0;transform:scale(1.05)'),(END+0.5,'opacity:1;transform:scale(1.05)'),(T,'opacity:1;transform:scale(1.05)')]))
    frames+=f'<img class="fr4 a n{i}" src="{IMG[k]}" alt="">'
    rule(f'.s4g .gch.c{i}',kf(f'gch{i}',[(0,'background:rgba(255,255,255,.16);color:#fff'),(t0,'background:rgba(255,255,255,.16);color:#fff'),(t0+0.2,'background:#fff;color:#000'),(t1,'background:#fff;color:#000'),(t1+0.2,'background:rgba(255,255,255,.16);color:#fff'),(T,'background:rgba(255,255,255,.16);color:#fff')]))
    words=cap.split(' '); t=t0+0.5; spans=[]; te=t0+0.5+len(words)*0.2+0.9
    for w in words:
        wn+=1
        rule(f'.s4g .w{wn}',kf(f'w{wn}',[(0,'opacity:0;transform:translateY(4px)'),(t,'opacity:0;transform:translateY(4px)'),(t+0.14,'opacity:1;transform:none'),(min(te,t1-0.1),'opacity:1;transform:none'),(min(te,t1-0.1)+0.25,'opacity:0'),(T,'opacity:0')]))
        spans.append(f'<span class="a w{wn}">{w}</span>'); t+=0.2
    caps+=f'<p class="gcap">{" ".join(spans)}</p>'
t_es=6.9
rule('.s4g .lng .en',kf('en',[(0,'background:#fff;color:#000'),(t_es,'background:#fff;color:#000'),(t_es+0.2,'background:transparent;color:#fff'),(END+0.3,'background:transparent;color:#fff'),(END+0.5,'background:#fff;color:#000'),(T,'background:#fff;color:#000')]))
rule('.s4g .lng .es',kf('es',[(0,'background:transparent;color:#fff'),(t_es,'background:transparent;color:#fff'),(t_es+0.2,'background:#fff;color:#000'),(END+0.3,'background:#fff;color:#000'),(END+0.5,'background:transparent;color:#fff'),(T,'background:transparent;color:#fff')]))
rule('.s4g .gbar i',kf('gbar',[(0,'transform:scaleX(.05)'),(END,'transform:scaleX(.98)'),(T,'transform:scaleX(.98)')]))
segs=[]; tim=''
for s in range(int(END)):
    rule(f'.s4g .gtm b:nth-child({s+1})',kf(f'gt{s}',[(0,'opacity:0'),(max(s-0.01,0),'opacity:0'),(s,'opacity:1'),(s+0.99,'opacity:1'),(s+1,'opacity:0'),(T,'opacity:0')] if s<int(END)-1 else [(0,'opacity:0'),(s,'opacity:0'),(s+0.01,'opacity:1'),(T,'opacity:1')]))
    v=12+s*14; tim+=f'<b class="a">{v//60}:{v%60:02d}</b>'
inner=(f'<div class="gfr">{frames}</div><div class="gshade"></div>'+brandbar(dark=True)+
       '<div class="gtop"><span class="gtl">Inspection Video</span><span class="lng"><b class="a en">EN</b><b class="a es">ES</b></span></div>'
       '<div class="gchs">'+''.join(f'<span class="gch a c{i}">{s[1]}</span>' for i,s in enumerate(scenes))+'</div>'
       f'<div class="gcaps">{caps}</div>'
       f'<div class="gctl"><span class="gpp">{PLAY_I}</span><span class="gtm">{tim}</span><span class="gbar"><i class="a"></i><em style="left:31%"></em><em style="left:64%"></em></span><span class="gdur">2:48</span></div>'
       +finger(kf,rule,'g',[(t_es,223,57)],T))
s4G=phone4('g',inner,dark=True)

# ---------- 4H: the full MPI report, color-coded, with the tech's notes behind every finding
T=12.0; kf,rule=s4_anim('h',T); END=T-0.5
SPOT={0:4,1:13,2:22,3:23,4:31}   # finding -> tile index on the 38-tile grid
tiles=''
for j in range(38):
    f=[i for i,v in SPOT.items() if v==j]; c=FIND[f[0]][1] if f else 'g'
    t=0.25+j*0.045
    col={'r':'var(--red)','y':'var(--yellow)','g':'var(--green)'}[c]
    rule(f'.s4h .tl4.n{j}',kf(f'tl{j}',[(0,'background:var(--sheet)'),(t,'background:var(--sheet)'),(t+0.2,f'background:{col}'),(END,f'background:{col}'),(END+0.3,'background:var(--sheet)'),(T,'background:var(--sheet)')]))
    tiles+=f'<span class="tl4 a n{j}{" f" if f else ""}"></span>'
STEP=1.75; T0=2.3; cards=''; taps=[]
for i,(k,c,item,val,plain,price,ph) in enumerate(FIND):
    t=T0+i*STEP; j=SPOT[i]; x=20+(j%8)*30+12; y=168+(j//8)*30+12
    taps.append((t,x-17,y-17))
    rule(f'.s4h .ring.n{i}',kf(f'rg{i}',[(0,'opacity:0;transform:scale(.6)'),(t,'opacity:0;transform:scale(.6)'),(t+0.15,'opacity:1;transform:scale(1)'),(t+STEP-0.1,'opacity:1;transform:scale(1)'),(t+STEP+0.05,'opacity:0;transform:scale(1)'),(T,'opacity:0')] if i<4 else
         [(0,'opacity:0;transform:scale(.6)'),(t,'opacity:0;transform:scale(.6)'),(t+0.15,'opacity:1;transform:scale(1)'),(END,'opacity:1;transform:scale(1)'),(END+0.3,'opacity:0'),(T,'opacity:0')]))
    t_out=t+STEP if i<4 else END
    rule(f'.s4h .an4.n{i}',kf(f'an{i}',[(0,'opacity:0;transform:translateY(16px)'),(t+0.15,'opacity:0;transform:translateY(16px)'),(t+0.45,'opacity:1;transform:none'),(t_out,'opacity:1;transform:none'),(t_out+0.25,'opacity:0;transform:translateY(-8px)'),(T,'opacity:0')]))
    ph_html=f'<img src="{IMG[ph]}" alt="">' if ph else ''
    quote={'brakes':'Rear pads are down to two millimeters.','belt':'Serpentine belt is cracking along the ribs.','tires':'The front tires are at four and the rears are at seven.','bal':"A little irregular wear, looks like they're out of balance.",'cabin':"Cabin air filter is pretty clogged, I'd replace it."}[k]
    cards+=(f'<div class="an4 a n{i}{" np" if not ph else ""}">{ph_html}<div class="ab"><div class="at"><i class="d4 {c}"></i><b>{item}</b><em>{val}</em></div>'
            f'<p>{plain}</p><div class="aq"><span>{MIC4}</span>&ldquo;{quote}&rdquo;</div></div></div>')
rings=''.join(f'<span class="ring a n{i}" style="left:{20+(SPOT[i]%8)*30-3}px;top:{168+(SPOT[i]//8)*30-3}px"></span>' for i in range(5))
show(kf,rule,'.s4h .hint4','hint',1.9,T0+0.1,T,hid='opacity:0',vis='opacity:1',d=0.2)
inner=(brandbar()+'<div class="rt4"><b>Vehicle inspection</b><small>38 items checked, 2023 Rogue</small></div>'
       '<div class="cnt4"><span><i class="d4 r"></i>2 now</span><span><i class="d4 y"></i>3 soon</span><span><i class="d4 g"></i>33 good</span></div>'
       f'<div class="grid4">{tiles}</div>{rings}<div class="hint4 a">Tap any item to see what the tech found</div>'
       f'<div class="ans4">{cards}</div>'+finger(kf,rule,'h',taps,T))
s4H=phone4('h',inner)

exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'step4-hybrid.py')).read())
STEP4_CSS="\n".join(S4_KF)+"\n"+"\n".join(S4_BASE)+"\n"+"\n".join(S4_RULES)+r"""
.p4 .screen{font-family:var(--font)}
.p4 .a{opacity:0}
.p4 .tk4 b.a,.p4 .gtm b.a{opacity:0}
.d4{display:inline-block;width:8px;height:8px;border-radius:50%;flex:0 0 auto}.d4.r{background:var(--red)}.d4.y{background:var(--yellow)}.d4.g{background:var(--green)}
.bh4{display:flex;align-items:center;gap:9px;padding:20px 18px 0}
.lg4{width:32px;height:32px;border-radius:9px;background:var(--char);color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;letter-spacing:.02em;flex:0 0 auto}
.lg4.sm{width:26px;height:26px;font-size:10px;border-radius:7px}
.lg4{background:none!important;color:transparent!important;overflow:hidden}.lg4 svg{display:block}
.bh4 .bn{flex:1;display:flex;flex-direction:column}.bh4 .bn b{font-size:13.5px}.bh4 .bn small{font-size:11px;color:var(--mid)}
.call4{width:30px;height:30px;border-radius:50%;background:var(--sheet);display:grid;place-items:center;color:var(--char)}.call4 svg{width:14px;height:14px}
.bh4.dk{position:relative;z-index:3}.bh4.dk .bn b{color:#fff}.bh4.dk .bn small{color:rgba(255,255,255,.7)}.bh4.dk .lg4{background:#fff;color:#000}.bh4.dk .call4{background:rgba(255,255,255,.18);color:#fff}
.rt4{padding:14px 18px 0;display:flex;flex-direction:column}.rt4 b{font-size:18px;letter-spacing:-.01em}.rt4 small{font-size:11.5px;color:var(--mid);font-weight:600}
.cnt4{display:flex;gap:6px;padding:10px 18px 0}.cnt4 span{display:inline-flex;align-items:center;gap:5px;background:var(--sheet);border-radius:999px;padding:4px 9px;font-size:11px;font-weight:700}
.sh4{padding:14px 18px 6px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mid)}
.tg4{font-size:9.5px;font-weight:800;border-radius:999px;padding:2px 7px;color:#000;flex:0 0 auto}.tg4.r{background:#e0607b}.tg4.y{background:var(--yellow)}
.fing{position:absolute;left:0;top:0;width:34px;height:34px;border-radius:50%;background:rgba(40,40,40,.28);border:2px solid rgba(255,255,255,.85);box-shadow:0 4px 12px rgba(0,0,0,.3);z-index:30;pointer-events:none}
/* 4E */
.screen.dk4{background:#0e1116}
.lock4{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 0%,#2a3442 0%,#0e1116 70%);color:#fff;text-align:center;padding-top:64px}
.lt4{font-size:62px;font-weight:300;letter-spacing:-.02em;line-height:1}.ld4{font-size:14px;font-weight:600;opacity:.8;margin-top:6px}
.nt4{position:absolute;left:10px;right:10px;top:168px;background:rgba(245,245,247,.94);color:var(--char);border-radius:20px;padding:11px 12px;box-shadow:0 12px 30px -10px rgba(0,0,0,.6);z-index:4}
.nt4 .nh{display:flex;align-items:center;gap:7px;font-size:12px}.nt4 .nh em{margin-left:auto;font-style:normal;color:var(--mid);font-size:11px}
.ni{width:20px;height:20px;border-radius:6px;background:#34c759;display:grid;place-items:center}.ni svg{width:13px;height:13px}
.nt4 p{margin:5px 0 8px;font-size:12.5px;line-height:1.35}
.nt4 .nl{display:flex;align-items:center;gap:8px;background:#fff;border-radius:11px;padding:7px}.nt4 .nl div{display:flex;flex-direction:column}.nt4 .nl b{font-size:12px}.nt4 .nl small{font-size:10.5px;color:var(--mid)}
.rep4{position:absolute;inset:0;background:#fff;color:var(--char);z-index:6;overflow:hidden}
.rsc{display:flex;flex-direction:column}
.p4 .rsc.a{opacity:1}
.vc4{position:relative;margin:12px 18px 0;height:136px;border-radius:14px;overflow:hidden;background:#222}
.vc4 .pst{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.vc4:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 50%,rgba(0,0,0,.6))}
.vplay{position:absolute;left:50%;top:50%;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.92);color:#000;display:grid;place-items:center;z-index:2}.vplay svg{width:20px;height:20px;margin-left:3px}
.vlab{position:absolute;left:10px;bottom:12px;color:#fff;font-size:11.5px;font-weight:700;z-index:2;display:flex;gap:6px}.vlab em{font-style:normal;opacity:.75;font-weight:600}
.vbar{position:absolute;left:10px;right:10px;bottom:6px;height:3px;border-radius:2px;background:rgba(255,255,255,.3);z-index:2;overflow:hidden}.vbar i{display:block;height:100%;background:#fff;transform-origin:left}
.p4 .vbar i.a{opacity:1}
.chps{display:flex;gap:6px;padding:8px 18px 0}.chp{font-size:11px;font-weight:700;border-radius:999px;padding:4px 10px;background:var(--sheet)}
.p4 .chp.a{opacity:1}
.rr{display:flex;align-items:center;gap:10px;margin:0 18px;padding:8px 0;border-bottom:1px solid var(--sheet)}
.rr .noph{display:grid;place-items:center;color:var(--mid)}.rr .noph svg{width:22px;height:22px}
.rr img,.rr .noph{width:42px;height:42px;border-radius:9px;object-fit:cover;flex:0 0 42px;background:var(--sheet)}
.rr div{flex:1;display:flex;flex-direction:column}.rr b{font-size:13px}.rr small{font-size:11px;color:var(--mid)}
/* 4F */
.dhd{display:flex;align-items:center;justify-content:space-between;padding:14px 18px 0}.dhd b{font-size:15px}
.dots4{display:flex;gap:4px}.dots4 i{display:block;height:6px;width:6px;border-radius:3px;background:var(--light)}
.p4 .dots4 i.a{opacity:1}
.deck4{position:relative;margin:12px 16px 0;height:330px}
.dc{position:absolute;inset:0;background:#fff;border-radius:18px;box-shadow:0 14px 30px -14px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.06);overflow:hidden;display:flex;flex-direction:column;transform-origin:50% 100%}
.dph{height:142px;flex:0 0 142px;background:var(--sheet)}.dph img{width:100%;height:100%;object-fit:cover;display:block}
.dph.none{display:grid;place-items:center;background:linear-gradient(135deg,#f2f1f1,#e4e2e3)}.dph.none span{font-size:22px;font-weight:800;color:var(--char)}
.db{padding:12px 14px;display:flex;flex-direction:column;gap:6px;flex:1}.db .tg4.big{align-self:flex-start;font-size:10px;padding:3px 9px}
.db b{font-size:18px;letter-spacing:-.01em}.db p{margin:0;font-size:12.5px;line-height:1.4;color:#4a4748}
.dp{margin-top:auto;display:flex;align-items:center;justify-content:space-between}.dp span{font-size:11.5px;font-weight:700;color:var(--char);text-decoration:underline;text-underline-offset:2px}.dp b{font-size:20px}
.stp{position:absolute;top:22px;left:16px;display:inline-flex;align-items:center;gap:5px;font-size:15px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;border:3px solid;border-radius:10px;padding:4px 10px;background:rgba(255,255,255,.9)}
.stp.ok{color:#2f7d1c;border-color:#2f7d1c}.stp.no{color:var(--red);border-color:var(--red);left:auto;right:16px}.stp svg{width:15px;height:15px}
.sum4{position:absolute;inset:0;background:#fff;border-radius:18px;box-shadow:0 0 0 1px rgba(0,0,0,.06);padding:4px 14px}
.sum4 .sh4{padding:12px 0 6px}
.sr{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;padding:9px 0;border-bottom:1px solid var(--sheet)}.sr b{margin-left:auto}
.sr span{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-weight:800}.sr span.ok{background:var(--green);color:#000}.sr span.no{background:var(--sheet);color:var(--mid)}.sr span svg{width:12px;height:12px}
.btns4{position:absolute;left:16px;right:16px;top:450px;display:flex;gap:10px}
.btns4 span{flex:1;height:44px;border-radius:12px;display:grid;place-items:center;font-weight:800;font-size:14px}.btns4 .bd{border:2px solid var(--light);color:var(--char)}.btns4 .ba{background:var(--char);color:#fff}
.send4{position:absolute;left:16px;right:16px;top:450px;height:44px}
.send4 span{position:absolute;inset:0;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:6px;font-weight:800;font-size:14px}.send4 .s1{background:var(--char);color:#fff}.send4 .s2{background:var(--green);color:#000}.send4 svg{width:14px;height:14px}
.tot4{position:absolute;left:16px;right:16px;top:508px;display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:700;color:var(--mid);padding-top:10px;border-top:1px solid var(--sheet)}
.tk4{position:relative;display:inline-block;width:60px;height:22px;text-align:right}.tk4 b{position:absolute;right:0;top:0;font-size:19px;color:var(--char)}
/* 4G */
.gfr{position:absolute;inset:0;overflow:hidden;background:#111}.fr4{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.gshade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.65) 0%,rgba(0,0,0,0) 34%,rgba(0,0,0,0) 52%,rgba(0,0,0,.8) 100%)}
.gtop{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;padding:12px 18px 0;color:#fff}.gtl{font-size:12px;font-weight:700;opacity:.9}
.lng{display:flex;background:rgba(255,255,255,.18);border-radius:999px;padding:2px}.lng b{font-size:10.5px;font-weight:800;padding:3px 9px;border-radius:999px}
.p4 .lng b.a{opacity:1}
.gchs{position:relative;z-index:3;display:flex;gap:6px;padding:10px 18px 0}.gch{font-size:11px;font-weight:700;border-radius:999px;padding:4px 10px;color:#fff;background:rgba(255,255,255,.16)}
.p4 .gch.a{opacity:1}
.gcaps{position:absolute;left:16px;right:16px;bottom:96px;height:70px;z-index:3}
.gcap{position:absolute;left:0;right:0;bottom:0;margin:0;text-align:center;font-size:16px;line-height:1.35;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.8),0 0 12px rgba(0,0,0,.6)}.gcap span{display:inline-block}
.gctl{position:absolute;left:16px;right:16px;bottom:34px;z-index:3;display:flex;align-items:center;gap:8px;color:#fff;font-size:11px;font-weight:600}
.gpp{width:26px;height:26px;display:grid;place-items:center}.gpp svg{width:16px;height:16px}
.gtm{position:relative;width:30px;height:14px}.gtm b{position:absolute;left:0;top:0;font-weight:600}
.gbar{position:relative;flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.3)}.gbar i{display:block;height:100%;background:#fff;border-radius:2px;transform-origin:left}.gbar em{position:absolute;top:-1px;width:2px;height:6px;background:rgba(0,0,0,.6)}
.p4 .gbar i.a{opacity:1}
.gdur{opacity:.8}
/* 4H */
.grid4{position:absolute;left:20px;top:168px;display:grid;grid-template-columns:repeat(8,24px);gap:6px}
.tl4{width:24px;height:24px;border-radius:6px;background:var(--sheet)}
.p4 .tl4.a{opacity:1}
.ring{position:absolute;width:26px;height:26px;border-radius:8px;border:3px solid var(--char);box-sizing:content-box;z-index:4}
.hint4{position:absolute;left:20px;right:20px;top:326px;font-size:11.5px;color:var(--mid);font-weight:600}
.ans4{position:absolute;left:14px;right:14px;top:322px;bottom:16px}
.an4{position:absolute;inset:0;background:#fff;border-radius:16px;box-shadow:0 14px 30px -14px rgba(0,0,0,.45),0 0 0 1px rgba(0,0,0,.06);overflow:hidden;display:flex;flex-direction:column}
.an4 img{width:100%;height:104px;object-fit:cover;display:block;flex:0 0 104px}
.an4 .ab{padding:10px 12px;display:flex;flex-direction:column;gap:6px}
.an4 .at{display:flex;align-items:center;gap:7px}.an4 .at b{font-size:15px}.an4 .at em{margin-left:auto;font-style:normal;font-weight:800;font-size:12.5px}
.an4 p{margin:0;font-size:12px;line-height:1.4;color:#4a4748}
.aq{display:flex;gap:6px;align-items:flex-start;background:var(--sheet);border-radius:9px;padding:7px 8px;font-size:11px;font-style:italic;line-height:1.35}
.aq span{width:16px;height:16px;border-radius:4px;background:var(--char);color:#fff;display:grid;place-items:center;flex:0 0 auto;font-style:normal}.aq span svg{width:10px;height:10px}
.an4.np .ab{padding-top:14px}
"""+S4I_CSS+r"""
@media (prefers-reduced-motion:reduce){.p4 .a{animation:none !important;opacity:1}}
"""

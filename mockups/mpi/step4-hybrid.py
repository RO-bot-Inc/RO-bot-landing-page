# 4I: hybrid of 4E and 4F. Text arrives, report opens and plays, the customer taps the top recommendation,
# the recommendation cards slide in and the customer decides. Exec'd from step4-screens.py after 4E/4F.
T=18.4; kf,rule=s4_anim('i',T); END=T-0.6
# report part (4E, compressed)
notif=(f'<div class="nt4 a"><div class="nh"><span class="ni">{CHAT_I}</span><b>Your Dealership</b><em>now</em></div>'
       '<p>Inspection results are ready for your vehicle. Please review below and let me know if you have any questions!</p>'
       '<div class="nl"><span class="lg4 sm">YD</span><div><b>Your 2023 Rogue report</b><small>RO 587</small></div></div></div>')
t_n=1.9
rule('.s4i .nt4',kf('nt',[(0,'opacity:0;transform:translateY(-24px) scale(.96)'),(0.5,'opacity:0;transform:translateY(-24px) scale(.96)'),(0.85,V),(t_n-0.1,V),(t_n,'opacity:1;transform:scale(.97)'),(t_n+0.2,'opacity:1;transform:scale(1)'),(t_n+0.55,'opacity:0;transform:scale(1)'),(T,'opacity:0;transform:translateY(-24px) scale(.96)')]))
tch=[2.9,3.9,4.9]; t_v1=6.0
posters=''.join(f'<img class="pst a ps{i}" src="{IMG[k]}" alt="">' for i,k in enumerate(['belt','tires','brakes']))
for i in range(3):
    t_in=tch[i]; t_out=tch[i+1] if i<2 else END
    rule(f'.s4i .ps{i}',kf(f'ps{i}',[(0,'opacity:1' if i==0 else 'opacity:0'),(t_in-0.01 if i else 0,'opacity:1' if i==0 else 'opacity:0'),(t_in+0.4 if i else 0,'opacity:1'),(t_out,'opacity:1'),(t_out+0.4,'opacity:0' if i<2 else 'opacity:1'),(T,'opacity:1' if i==0 else 'opacity:0')]))
    rule(f'.s4i .chp.c{i}',kf(f'chp{i}',[(0,'background:var(--sheet);color:var(--char)'),(t_in-0.01,'background:var(--sheet);color:var(--char)'),(t_in+0.2,'background:var(--char);color:#fff'),(t_out,'background:var(--char);color:#fff'),(t_out+0.2,'background:var(--sheet);color:var(--char)'),(T,'background:var(--sheet);color:var(--char)')]))
rule('.s4i .vplay',kf('vplay',[(0,'opacity:1;transform:translate(-50%,-50%) scale(1)'),(2.7,'opacity:1;transform:translate(-50%,-50%) scale(1)'),(2.9,'opacity:0;transform:translate(-50%,-50%) scale(1.3)'),(T,'opacity:0;transform:translate(-50%,-50%) scale(1)')]))
rule('.s4i .vbar i',kf('vbar',[(0,'transform:scaleX(0)'),(2.9,'transform:scaleX(0)'),(7.2,'transform:scaleX(.4)'),(T,'transform:scaleX(.4)')]))
video=(f'<div class="vc4">{posters}<span class="vplay a">{PLAY_I}</span><span class="vlab">Inspection Video<em>2:48</em></span><span class="vbar"><i class="a"></i></span></div>'
       '<div class="chps">'+''.join(f'<span class="chp a c{i}">{c}</span>' for i,c in enumerate(['Under hood','Tires','Brakes']))+'</div>')
WHEEL='<span class="noph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="3.2"></circle><path d="M12 3v5.8M12 15.2V21M3 12h5.8M15.2 12H21"></path></svg></span>'
t_tap=6.9; t_open=7.1
rows=''
for i,(k,c,item,val,plain,price,ph) in enumerate(FIND):
    rule(f'.s4i .rr.n{i}',kf(f'rr{i}',[(0,'opacity:0;transform:translateY(8px)'),(2.7+i*0.15,'opacity:0;transform:translateY(8px)'),(3.0+i*0.15,'opacity:1;transform:none'),(T,'opacity:1;transform:none')]))
    th=f'<img src="{IMG[ph]}" alt="">' if ph else WHEEL
    rows+=f'<div class="rr a n{i}">{th}<div><b>{item}</b><small>{val}</small></div><span class="tg4 {c}">{"Now" if c=="r" else "Soon"}</span><span class="chev">&rsaquo;</span></div>'
rule('.s4i .rr.n0 .rrhl',kf('rrhl',[(0,'opacity:0'),(t_tap-0.05,'opacity:0'),(t_tap+0.05,'opacity:1'),(t_open+0.3,'opacity:1'),(t_open+0.5,'opacity:0'),(T,'opacity:0')]))
rows=rows.replace('<div class="rr a n0">','<div class="rr a n0"><span class="rrhl a"></span>',1)
rep=(f'<div class="rep4 a"><div class="rsc a">{brandbar()}'
     '<div class="rt4"><b>Your 2023 Rogue</b><small>Inspection results, RO 587</small></div>'+video+
     '<div class="cnt4"><span><i class="d4 r"></i>2 now</span><span><i class="d4 y"></i>3 soon</span><span><i class="d4 g"></i>33 good</span></div>'
     '<div class="sh4">Recommended</div>'+rows+'</div></div>')
rule('.s4i .rep4',kf('rep',[(0,'opacity:1;transform:translateY(105%)'),(2.1,'opacity:1;transform:translateY(105%)'),(2.6,'opacity:1;transform:none'),(t_open,'opacity:1;transform:none'),(t_open+0.45,'opacity:1;transform:translateX(-30%)'),(END,'opacity:1;transform:translateX(-30%)'),(END+0.4,'opacity:0;transform:translateX(-30%)'),(T,'opacity:0;transform:translateY(105%)')]))
rule('.s4i .rsc',kf('rsc',[(0,'transform:none'),(5.3,'transform:none'),(6.0,'transform:translateY(-196px)'),(T,'transform:translateY(-196px)')]))
# deck part (4F, shifted)
TOPS=[8.8,10.35,11.9,13.45,15.0]; ACT=['ok','ok','ok','ok','no']
taps=[(t_n,121,223),(t_tap,121,165)]; deck=''; total=[('$0',0.05)]; run=0
for i,(k,c,item,val,plain,price,ph) in enumerate(FIND):
    tt=TOPS[i]; t_top=TOPS[i-1]+0.25 if i else 0
    out='translate(330px,-30px) rotate(14deg)' if ACT[i]=='ok' else 'translate(-330px,-30px) rotate(-14deg)'
    b1='opacity:1;transform:translateY(14px) scale(.94)'; b2='opacity:0;transform:translateY(26px) scale(.88)'; top='opacity:1;transform:none'
    if i==0: segs=[(0,top)]
    elif i==1: segs=[(0,b1),(t_top,b1),(t_top+0.35,top)]
    else: segs=[(0,b2),(TOPS[i-2]+0.25,b2),(TOPS[i-2]+0.5,b1),(t_top,b1),(t_top+0.35,top)]
    segs+=[(tt+0.2,top),(tt+0.65,f'opacity:0;transform:{out}'),(END+0.39,f'opacity:0;transform:{out}'),(END+0.4,segs[0][1]),(T,segs[0][1])]
    rule(f'.s4i .dc.n{i}',kf(f'dc{i}',segs))
    rule(f'.s4i .dc.n{i} .stp',kf(f'stp{i}',[(0,'opacity:0;transform:rotate(-12deg) scale(1.4)'),(tt+0.02,'opacity:0;transform:rotate(-12deg) scale(1.4)'),(tt+0.15,'opacity:1;transform:rotate(-12deg) scale(1)'),(END+0.39,'opacity:1;transform:rotate(-12deg) scale(1)'),(END+0.4,'opacity:0'),(T,'opacity:0')]))
    taps.append((tt,184 if ACT[i]=='ok' else 57,455))
    if ACT[i]=='ok': run+=int(price[1:]); total.append((f'${run}',tt+0.2))
    photo=f'<div class="dph"><img src="{IMG[ph]}" alt=""></div>' if ph else f'<div class="dph none"><span>{val}</span></div>'
    stamp=f'<span class="stp a ok">{CHK4}Approved</span>' if ACT[i]=='ok' else '<span class="stp a no">Declined</span>'
    deck+=(f'<div class="dc a n{i}" style="z-index:{10-i}">{photo}<div class="db"><span class="tg4 {c} big">{"Needs attention now" if c=="r" else "Recommended soon"}</span>'
           f'<b>{item}</b><p>{plain}</p><div class="dp"><span>Ask a question about this</span><b>{price}</b></div></div>{stamp}</div>')
for i in range(5):
    t_on=TOPS[i-1]+0.25 if i else 0
    on='background:var(--char);width:16px'; off='background:var(--light);width:6px'; done='background:var(--mid);width:6px'
    rule(f'.s4i .dots4 i:nth-child({i+1})',kf(f'dt{i}',([(0,on)] if i==0 else [(0,off),(t_on,off),(t_on+0.25,on)])+[(TOPS[i]+0.4,on),(TOPS[i]+0.6,done),(END+0.39,done),(END+0.4,on if i==0 else off),(T,on if i==0 else off)]))
t_send=TOPS[-1]+0.9
rule('.s4i .btns4',kf('btns',[(0,'opacity:1'),(TOPS[-1]+0.4,'opacity:1'),(TOPS[-1]+0.6,'opacity:0'),(END+0.39,'opacity:0'),(END+0.4,'opacity:1'),(T,'opacity:1')]))
rule('.s4i .sum4',kf('sum',[(0,'opacity:0;transform:translateY(10px)'),(TOPS[-1]+0.55,'opacity:0;transform:translateY(10px)'),(TOPS[-1]+0.85,V),(END+0.39,V),(END+0.4,'opacity:0'),(T,'opacity:0')]))
rule('.s4i .send4',kf('send',[(0,'opacity:0;transform:translateY(10px)'),(TOPS[-1]+0.6,'opacity:0;transform:translateY(10px)'),(TOPS[-1]+0.9,V),(END+0.39,V),(END+0.4,'opacity:0'),(T,'opacity:0')]))
rule('.s4i .send4 .s1',kf('s1',[(0,'opacity:1'),(t_send+0.1,'opacity:1'),(t_send+0.25,'opacity:0'),(END+0.39,'opacity:0'),(END+0.4,'opacity:1'),(T,'opacity:1')]))
rule('.s4i .send4 .s2',kf('s2',[(0,'opacity:0'),(t_send+0.1,'opacity:0'),(t_send+0.3,'opacity:1'),(END+0.39,'opacity:1'),(END+0.4,'opacity:0'),(T,'opacity:0')]))
taps.append((t_send,121,455))
summary=('<div class="sum4 a"><div class="sh4">Your decisions</div>'+''.join(
    f'<div class="sr"><span class="{"ok" if ACT[i]=="ok" else "no"}">{CHK4 if ACT[i]=="ok" else "&times;"}</span>{x[2]}<b>{x[5] if ACT[i]=="ok" else "Declined"}</b></div>' for i,x in enumerate(FIND))+'</div>')
deckl=(f'<div class="dkl a">{brandbar()}<div class="dhd"><span class="back">&lsaquo;</span><b>Your recommendations</b><span class="dots4"><i class="a"></i><i class="a"></i><i class="a"></i><i class="a"></i><i class="a"></i></span></div>'
       f'<div class="deck4">{deck}{summary}</div>'
       f'<div class="btns4 a"><span class="bd">Decline</span><span class="ba">Approve</span></div>'
       f'<div class="send4 a"><span class="s1 a">Send to my advisor</span><span class="s2 a">{CHK4}All set. Sent to your advisor</span></div>'
       '<div class="tot4"><span>Approved total</span>'+ticker(kf,rule,'i','tt',total,T,END+0.4)+'</div></div>')
rule('.s4i .dkl',kf('dkl',[(0,'opacity:1;transform:translateX(102%)'),(t_open,'opacity:1;transform:translateX(102%)'),(t_open+0.45,'opacity:1;transform:none'),(END,'opacity:1;transform:none'),(END+0.4,'opacity:0;transform:none'),(T,'opacity:0;transform:translateX(102%)')]))
lock=('<div class="lock4"><div class="lt4">9:41</div><div class="ld4">Tuesday, November 17</div></div>')
s4I=phone4('i',lock+notif+rep+deckl+finger(kf,rule,'i',taps,T),dark=True)
S4I_CSS=r"""
.dkl{position:absolute;inset:0;background:#fff;color:var(--char);z-index:8;box-shadow:-10px 0 30px -10px rgba(0,0,0,.4)}
.p4 .dkl .dots4 i.a,.p4 .dkl .tk4{opacity:1}
.dhd .back{font-size:22px;line-height:1;font-weight:700;margin-right:6px;color:var(--char)}.s4i .dhd b{flex:1}
.rr{position:relative}.rr .chev{font-size:20px;color:var(--mid);line-height:1;margin-left:2px}
.rrhl{position:absolute;inset:0 -8px;border-radius:10px;background:rgba(0,0,0,.07);z-index:-1}
.rr>*:not(.rrhl){position:relative}
"""

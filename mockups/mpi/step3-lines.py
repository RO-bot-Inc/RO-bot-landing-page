# Step 3 round 3: findings become RO lines on their own, no button (3H tabs, 3I card stack).
# Exec'd from step3-screens.py; uses s3_anim, laptop, src, stack, CHK, H, V from it.
# Geometry is in laptop-screen px (screen 340x212, padding 11/13).
LINES=[ # (dot, MPI item, value, line title, when, source, tech's words from steps 1 and 2, short tab name)
 ('r','Brake pads, rear','2 mm','Replace rear brake pads','Now','mic','Rear pads are down to two millimeters.','Brakes'),
 ('r','Serpentine belt','Cracked','Replace serpentine belt','Now','vid','Serpentine belt is cracking along the ribs.','Belt'),
 ('y','Tire tread, front','4/32"','Replace front tires','Soon','mic','The front tires are at four and the rears are at seven.','Tires'),
 ('y','Wheel balance','Recommend','Balance wheels','Soon','mic',"A little irregular wear, looks like they're out of balance.",'Balance'),
 ('y','Cabin air filter','Replace','Replace cabin air filter','Soon','vid',"Cabin air filter is pretty clogged, I'd replace it.",'Cabin filter')]
SRCNAME={'mic':'Walkaround','vid':'Video'}
# photos on the lines that came with one (Fal-generated mockup stand-ins, prompts in pl-*.txt); uploaded to the board's asset store
PHOTO={0:'/_blob/26bfaa3e7ad07135277bc88e69d3d678',1:'/_blob/cc5b525269a0a01fe966c67b64e0c76d',2:'/_blob/e1d974f354cc73fa933e3133b56f995f',4:'/_blob/385351b33e1ea6cd43ce3783e6c075d9'}
S3L_CSS=[]
def lines_option(code,variant):
    T=11.6; kf,rule=s3_anim(code,T); cls=f's3{code}'
    END=T-0.7; T0=0.9; STEP=1.35; FLY=0.55
    land=[T0+i*STEP+FLY for i in range(len(LINES))]          # moment each line exists
    done=land[-1]+0.35
    ROW_TOP=61 if variant=='tabs' else 35; ROW_H=19.5
    left=''; chips=''; cards=''; tabs=''
    for i,(c,item,val,title,when,s,quote,short) in enumerate(LINES):
        t=T0+i*STEP
        # the MPI row: glows while it is being read, then shows which line it became
        n=kf(f'hl{i}',[(0,'background:rgba(255,213,74,0)'),(t-0.05,'background:rgba(255,213,74,0)'),(t+0.15,'background:rgba(255,213,74,.55)'),(land[i]+0.3,'background:rgba(255,213,74,0)'),(T,'background:rgba(255,213,74,0)')])
        rule(f'.{cls} .mr.n{i}',n)
        n=kf(f'ln{i}',[(0,'opacity:0;transform:scale(.6)'),(land[i],'opacity:0;transform:scale(.6)'),(land[i]+0.2,V),(END,V),(END+0.3,'opacity:0'),(T,'opacity:0')])
        rule(f'.{cls} .mr.n{i} .lno',n)
        left+=f'<div class="mr n{i}"><i class="dot {c}"></i><span class="l">{item}</span><span class="v">{val}</span><span class="lno">{i+1}</span></div>'
        # the chip that lifts off the row and travels to its line, always above everything
        y0=ROW_TOP+i*ROW_H
        if variant=='tabs':
            x1=13+i*34; y1=34   # next free tab slot (earlier tabs have collapsed to number pills)
        else:
            x1=182; y1=70
        dx=x1-15; dy=y1-y0
        n=kf(f'ch{i}',[(0,'opacity:0;transform:translate(0,0) scale(1)'),(t+0.1,'opacity:0;transform:translate(0,0) scale(1)'),(t+0.2,'opacity:1;transform:translate(0,-3px) scale(1.04)'),(land[i]-0.05,f'opacity:1;transform:translate({dx}px,{dy}px) scale(.82)'),(land[i]+0.1,f'opacity:0;transform:translate({dx}px,{dy}px) scale(.82)'),(T,'opacity:0')])
        rule(f'.{cls} .lchip.n{i}',n)
        chips+=f'<span class="lchip n{i}" style="top:{y0}px"><i class="dot {c}"></i>{item}</span>'
        body=(f'<div class="lt"><span class="cno">{i+1}</span><b>{title}</b><span class="tg {c}">{when}</span></div>'
              +(f'<div class="lphoto"><img src="{PHOTO[i]}" alt=""><span class="pchip"><i class="dot {c}"></i>{item}<b>{val}</b></span></div><div class="lq ph">{src(s)}<p>&ldquo;{quote}&rdquo;</p></div>' if i in PHOTO else f'<div class="lfrom"><i class="dot {c}"></i>{item}<b>{val}</b></div>'+ f'<div class="lq">{src(s)}<p>&ldquo;{quote}&rdquo;</p></div>'))
        if variant=='tabs':
            nxt=land[i+1] if i+1<len(LINES) else END
            n=kf(f'tab{i}',[(0,'opacity:0;max-width:0;padding:0;background:var(--char);color:#fff'),(land[i]-0.1,'opacity:0;max-width:0;padding:0;background:var(--char);color:#fff'),(land[i]+0.15,'opacity:1;max-width:120px;padding:0 7px;background:var(--char);color:#fff'),(nxt,'opacity:1;max-width:120px;padding:0 7px;background:var(--char);color:#fff'),(nxt+0.25,'opacity:1;max-width:120px;padding:0 7px;background:var(--sheet);color:var(--char)'),(END,'opacity:1;max-width:120px;padding:0 7px;background:var(--sheet);color:var(--char)'),(END+0.3,'opacity:0;max-width:120px;padding:0 7px'),(T,'opacity:0;max-width:0;padding:0')])
            rule(f'.{cls} .rtab.n{i}',n)
            n=kf(f'tl{i}',[(0,'max-width:0'),(land[i],'max-width:0'),(land[i]+0.25,'max-width:90px'),(nxt,'max-width:90px'),(nxt+0.25,'max-width:0'),(T,'max-width:0')] if i+1<len(LINES) else [(0,'max-width:0'),(land[i],'max-width:0'),(land[i]+0.25,'max-width:90px'),(T,'max-width:90px')])
            rule(f'.{cls} .rtab.n{i} .tl',n)
            tabs+=f'<span class="rtab n{i}"><b>{i+1}</b><i class="dot {c}"></i><span class="tl">{short}</span></span>'
            n=kf(f'cd{i}',[(0,'opacity:0;transform:translateY(6px)'),(land[i],'opacity:0;transform:translateY(6px)'),(land[i]+0.25,V),(nxt,V),(nxt+0.2,'opacity:0;transform:none') if i+1<len(LINES) else (END,V),(END+0.3,'opacity:0'),(T,'opacity:0')])
            rule(f'.{cls} .lcard.n{i}',n)
        else:
            segs=[(0,'opacity:0;transform:translate(-30px,0) scale(.9)'),(land[i]-0.1,'opacity:0;transform:translate(-30px,0) scale(.9)'),(land[i]+0.2,'opacity:1;transform:none')]
            for k in range(i+1,len(LINES)):   # each later card pushes this one back into the stack
                d=k-i; segs+= [(land[k]-0.05,f'opacity:1;transform:translateY({-(d-1)*7}px) scale({1-(d-1)*.05:.2f})'),(land[k]+0.2,f'opacity:{1 if d<3 else 0};transform:translateY({-d*7}px) scale({1-d*.05:.2f})')]
            last=segs[-1][1]
            segs+=[(END,last),(END+0.3,'opacity:0;transform:none'),(T,'opacity:0;transform:translate(-30px,0) scale(.9)')]
            n=kf(f'cd{i}',segs); rule(f'.{cls} .lcard.n{i}',n)
        cards+=f'<div class="lcard n{i}" style="z-index:{i+2}">{body}</div>'
    # status: working, then done
    n=kf('st1',[(0,'opacity:0'),(T0-0.3,'opacity:0'),(T0,'opacity:1'),(done,'opacity:1'),(done+0.15,'opacity:0'),(T,'opacity:0')]); rule(f'.{cls} .lstat .s1',n)
    n=kf('st2',[(0,'opacity:0'),(done,'opacity:0'),(done+0.2,'opacity:1'),(END,'opacity:1'),(END+0.3,'opacity:0'),(T,'opacity:0')]); rule(f'.{cls} .lstat .s2',n)
    cnt=stack(cls,[('0',0.05)]+[(str(i+1),land[i]) for i in range(len(LINES))],kf,rule,T,'nl')
    stat=f'<span class="lstat"><span class="s1"><i class="spin"></i>Adding lines {cnt} of 5</span><span class="s2">{CHK}5 lines added</span></span>'
    n=kf('cdb',[(0,'opacity:1'),(land[0],'opacity:1'),(land[0]+0.2,'opacity:0'),(END+0.3,'opacity:0'),(END+0.5,'opacity:1'),(T,'opacity:1')]); rule(f'.{cls} .lcard.l1',n)
    base='<div class="lcard l1 empty3" style="z-index:1"><span>Lines will appear here</span></div>'
    if variant=='tabs':
        inner=(f'<div class="lh">RO 587, 2023 Rogue{stat}</div>'
               f'<div class="tabs3">{tabs}</div>'
               f'<div class="two3 lg"><div class="mpane"><div class="fh">MPI report</div>{left}<div class="mr ok"><i class="dot g"></i><span class="l">33 items OK</span><span class="v">Pass</span></div></div>'
               f'<div class="cpane">{base}{cards}</div></div><div class="lflys">{chips}</div>')
    else:
        inner=(f'<div class="lh">RO 587, 2023 Rogue{stat}</div>'
               f'<div class="two3 lg st"><div class="mpane">{left}<div class="mr ok"><i class="dot g"></i><span class="l">33 items OK</span><span class="v">Pass</span></div></div>'
               f'<div class="cpane stack"><div class="fh">Lines on the RO</div><div class="deck">{base}{cards}</div></div></div><div class="lflys">{chips}</div>')
    S3_BASE.append(f'.{cls} .mr,.{cls} .lno,.{cls} .lchip,.{cls} .lcard,.{cls} .rtab,.{cls} .rtab .tl,.{cls} .lstat span,.{cls} .tick b{{animation-duration:{T}s;animation-timing-function:cubic-bezier(.2,.8,.2,1);animation-iteration-count:infinite;animation-fill-mode:both}}')
    return f'<div class="lap lapwrap {cls}">'+laptop(inner)+'</div>'
s3H=lines_option('h','tabs')
s3I=lines_option('i','stack')
S3L_CSS=r"""
.s3h .lscreen,.s3i .lscreen{gap:6px;padding:11px 13px}
.s3h .lh,.s3i .lh{align-items:center}
.lstat{position:relative;width:118px;height:16px;font-size:10px;font-weight:700;color:var(--char)}
.lstat>span{position:absolute;right:0;top:0;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;opacity:0;height:16px}
.lap .lh .lstat span{font-size:10px}.lap .lh .lstat .s1{color:var(--mid)}.lap .lh .lstat .tick{color:var(--char)}.lap .lh .lstat .s2{background:var(--green);color:#000;border-radius:999px;padding:0 7px}.lstat .s2 svg{width:10px;height:10px}
.lstat .tick{min-width:6px;color:var(--char)}
.spin{width:9px;height:9px;border-radius:50%;border:2px solid var(--sheet);border-top-color:var(--char);animation:spin3 .8s linear infinite}
@keyframes spin3{to{transform:rotate(360deg)}}
.tabs3{display:flex;gap:4px;height:22px;border-bottom:1px solid var(--sheet);padding-bottom:4px}
.rtab{display:inline-flex;align-items:center;gap:4px;height:20px;border-radius:6px;font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;opacity:0;padding:0 7px;background:var(--sheet)}
.rtab b{font-variant-numeric:tabular-nums}.rtab .dot{width:7px;height:7px}
.rtab .tl{display:inline-block;overflow:hidden;max-width:0}
.rtab.l1{opacity:1}
.two3.lg{display:grid;grid-template-columns:154px 1fr;gap:10px;flex:1;min-height:0}
.mpane{display:flex;flex-direction:column}
.mpane .fh{padding:0 2px 3px}
.mr{display:flex;align-items:center;gap:5px;height:19.5px;padding:0 4px;border-bottom:1px solid var(--sheet);font-size:10.5px;font-weight:500;border-radius:3px;box-sizing:border-box}
.mr .dot{width:7px;height:7px}.mr .l{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mr .v{font-weight:700;font-size:10px}
.mr .lno{width:14px;height:14px;border-radius:4px;background:var(--char);color:#fff;font-size:9px;font-weight:800;display:grid;place-items:center;opacity:0;flex:0 0 auto}
.mr.ok .lno{display:none}
.cpane{position:relative}
.lcard{position:absolute;inset:0;background:#fff;border:1px solid var(--light);border-radius:9px;padding:9px 10px;display:flex;flex-direction:column;gap:6px;opacity:0;box-shadow:0 8px 18px -10px rgba(0,0,0,.35);box-sizing:border-box}
.lcard.l1{opacity:1}
.lt{display:flex;align-items:flex-start;gap:6px}.lt b{flex:1}.cno{flex:0 0 auto;width:16px;height:16px;border-radius:4px;background:var(--char);color:#fff;font-size:10px;font-weight:800;display:grid;place-items:center;margin-top:-1px}
.empty3{border:1px dashed var(--light);box-shadow:none;align-items:center;justify-content:center;font-size:10.5px;color:var(--mid);font-weight:600}.lt b{font-size:12.5px;line-height:1.2}
.lcard .tg{flex:0 0 auto}.tg.cp{background:var(--sheet)}
.lfrom{display:flex;align-items:center;gap:5px;font-size:10px;color:var(--mid);font-weight:600}.lfrom b{margin-left:auto;color:var(--char)}.lfrom .dot{width:7px;height:7px}
.lq{display:flex;gap:6px;align-items:flex-start;background:var(--sheet);border-radius:7px;padding:6px 7px}
.lq p{margin:0;font-size:10.5px;line-height:1.35;font-style:italic;color:var(--char)}
.lsrc{margin-top:auto;font-size:9.5px;color:var(--mid);font-weight:600}
.lflys{position:absolute;left:0;top:0;width:0;height:0}
.lchip{position:absolute;left:15px;display:inline-flex;align-items:center;gap:5px;background:#fff;color:var(--char);font-weight:700;font-size:10.5px;padding:2px 9px;border-radius:999px;box-shadow:0 10px 22px -6px rgba(0,0,0,.5),0 0 0 1px rgba(0,0,0,.06);white-space:nowrap;opacity:0;z-index:20}.lchip .dot{width:7px;height:7px}
.cpane.stack{display:flex;flex-direction:column}.cpane.stack .fh{padding:0 2px 4px}
.deck{position:relative;flex:1;margin-top:16px}
.deck .lcard{transform-origin:top center}
.lphoto{position:relative;height:56px;border-radius:6px;overflow:hidden;flex:0 0 56px}
.lphoto img{width:100%;height:100%;object-fit:cover;display:block}
.pchip{position:absolute;left:5px;bottom:5px;display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.94);border-radius:999px;padding:1px 7px;font-size:9.5px;font-weight:600;color:var(--char)}.pchip b{margin-left:3px}.pchip .dot{width:7px;height:7px}
.lq.ph{padding:5px 7px}.lq.ph p{font-size:10px}
.lcard .lt b{font-size:11.5px}
.sheetlap{width:386px;left:7px}
"""

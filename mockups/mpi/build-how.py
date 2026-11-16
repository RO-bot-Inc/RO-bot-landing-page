import re, json
src=open('board/project/Main.dc.html').read()

import re as _re
def strip_treatment(css):
    """Remove every rule or @-block that belongs to the how-it-works visual treatment, so rebuilds never stack copies."""
    PFX=('.photo','.laptop','.lap ','.lap.','.scene','.ill','.hstep .demo{','.hstep .vis','.hstep:nth-child(even) .vis','.hstep:nth-child(even) .photo','@keyframes flyin','@keyframes fly-','@keyframes row-','@keyframes lfill','@media (min-width:900px){.how .hstep','@media (prefers-reduced-motion:reduce){.chip','@media (prefers-reduced-motion:reduce){.lap','.how{padding:96px 0}')
    out=[]; i=0; n=len(css)
    while i<n:
        j=css.find('{',i)
        if j<0: out.append(css[i:]); break
        sel=css[i:j]
        # find the matching close brace for this block
        d=0; k=j
        while k<n:
            if css[k]=='{': d+=1
            elif css[k]=='}':
                d-=1
                if d==0: break
            k+=1
        block=css[i:k+1]
        lead=sel.lstrip()
        keep=not any(lead.startswith(x) or (lead+'{').startswith(x) for x in PFX)
        if lead.startswith('/* how-it-works photo treatment */'): keep=False
        if keep: out.append(block)
        i=k+1
    r=''.join(out)
    return _re.sub(r'\n{3,}','\n\n',r)
css=strip_treatment(src[src.index('<style>')+7:src.index('</style>')])
# balanced extraction of the four demo blocks and the copy blocks
def block(s,start_pat,pos=0):
    i=s.index(start_pat,pos); d=0; j=i
    while True:
        m=re.compile(r'<div\b|</div>').search(s,j)
        if m.group()=='</div>': d-=1
        else: d+=1
        j=m.end()
        if d==0: return s[i:j], j
demos={}; dsrc=open('board/project/HowA.dc.html').read(); pos=dsrc.index('<div class="steps4">')
for k in ['mpi','video','review','customer']:
    b,pos=block(dsrc,'<div class="demo" data-kind="%s"'%k,pos); demos[k]=b
copies=[]; pos=src.index('<div class="steps4">')
for n in range(4):
    b,pos=block(src,'<div class="copy">',pos)
    h3=re.search(r'<h3>(.*?)</h3>',b,re.S).group(1); p=re.search(r'<p>(.*?)</p>',b,re.S).group(1)
    copies.append((h3,p))
head=src[src.index('<div class="head">'):src.index('<div class="steps4">')]
order=['mpi','video','review','customer']
NAVY='#0F2137'; TEAL='#2A9D8F'; TL='#2DD4BF'
def svg(kind,stroke,w=240,h=200,chips=True,animate=False,accent=None):
    accent=accent or TEAL
    A=f'fill="none" stroke="{stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"'
    if kind=='mpi':
        body=f'''<g {A}>
<path d="M18 132h22l20-36h66l34 36h26a10 10 0 0 1 10 10v12H18z"/><path d="M62 96l-16 36M124 96l30 36M78 96v36"/>
<circle cx="60" cy="154" r="14"/><circle cx="60" cy="154" r="5"/><circle cx="162" cy="154" r="14"/><circle cx="162" cy="154" r="5"/>
<circle cx="212" cy="66" r="12"/><path d="M212 78v62M212 140l-12 44M212 140l12 44M210 98l-48 22M214 98l8-14"/>
<rect x="219" y="66" width="9" height="17" rx="2.5"/>
</g><g fill="none" stroke="{accent}" stroke-width="2.5" stroke-linecap="round"><path d="M196 58a14 14 0 0 0-8 10M190 50a22 22 0 0 0-12 16M184 42a30 30 0 0 0-16 22"/></g>'''
    elif kind=='video':
        body=f'''<g {A}>
<circle cx="74" cy="104" r="52"/><circle cx="74" cy="104" r="30"/><circle cx="74" cy="104" r="8"/>
<path d="M74 74v22M74 112v22M44 104h22M82 104h22M53 83l15 15M80 110l15 15M95 83l-15 15M68 110l-15 15"/>
<circle cx="180" cy="86" r="12"/><path d="M180 98c6 14 10 28 8 44M188 142l-30 10 8 20M188 142l16 22M176 110l-34-6M182 112l-40 2"/>
<rect x="112" y="92" width="30" height="18" rx="3"/>
</g><g fill="none" stroke="{accent}" stroke-width="2.5" stroke-linecap="round"><path d="M28 50h-10v10M110 50h10v10M28 158h-10v-10M110 158h10v-10"/></g><circle cx="118" cy="97" r="2.5" fill="#b9314f"/>'''
    elif kind=='review':
        body=f'''<g {A}>
<rect x="138" y="28" width="84" height="144" rx="8"/><path d="M152 52h40M152 78h56M152 104h56M152 130h32"/>
<circle cx="208" cy="52" r="5" fill="#ffd23f" stroke="none"/><circle cx="208" cy="130" r="5" fill="#b9314f" stroke="none"/>
</g>
<g class="chip c1"><rect x="18" y="40" width="54" height="24" rx="12" {A}/><text x="45" y="56" font-size="12" font-weight="700" text-anchor="middle" fill="{stroke}" font-family="DM Sans, sans-serif">4/32"</text></g>
<g class="chip c2"><rect x="10" y="88" width="84" height="24" rx="12" {A}/><text x="52" y="104" font-size="11.5" font-weight="700" text-anchor="middle" fill="{stroke}" font-family="DM Sans, sans-serif">pads 2 mm</text></g>
<g class="chip c3"><rect x="28" y="136" width="44" height="34" rx="6" {A}/><path d="M34 164l12-14 8 8 6-6 10 12" {A}/><circle cx="60" cy="146" r="3" fill="{accent}" stroke="none"/></g>
<g fill="none" stroke="{accent}" stroke-width="2" stroke-dasharray="4 5" stroke-linecap="round"><path d="M78 52c24 0 36 0 56 0M100 100c16 0 24-14 36-18M78 152c26 0 36-20 56-24"/></g>'''
    else:
        body=f'''<g {A}>
<rect x="92" y="22" width="64" height="124" rx="10"/><path d="M112 32h24"/>
<circle cx="124" cy="62" r="12" fill="{accent}" stroke="none"/><path d="M121 56l9 6-9 6z" fill="#fff" stroke="none"/>
<path d="M104 92h40M104 108h40M104 124h40" stroke="#e3e7ec" stroke-width="6"/>
<path d="M104 92h10" stroke="#b9314f" stroke-width="6"/><path d="M104 108h18" stroke="#ffd23f" stroke-width="6"/><path d="M104 124h40" stroke="#78bc61" stroke-width="6"/>
<path d="M84 102c-14 12-14 46 6 62h78c18-4 22-28 12-46l-12-14"/><path d="M84 102c8-10 22-4 16 10"/>
<rect x="138" y="86" width="40" height="14" rx="7" fill="var(--surface)"/><rect x="138" y="106" width="44" height="14" rx="7" fill="var(--surface)"/><rect x="138" y="126" width="40" height="14" rx="7" fill="var(--surface)"/>
</g>'''
    return f'<svg viewBox="0 0 240 200" width="{w}" height="{h}" role="img" aria-label="{kind} illustration">{body}</svg>'

extra_css='''

.laptop{position:absolute;right:-40px;bottom:-72px;width:360px;transform:scale(0.85);transform-origin:bottom right;z-index:3;filter:drop-shadow(0 30px 40px rgba(0,0,0,.45))}
.laptop .lid{background:var(--char);border-radius:14px 14px 4px 4px;padding:10px;position:relative}
.laptop .lid:before{content:"";position:absolute;inset:0;border-radius:14px 14px 4px 4px;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,0) 40%);pointer-events:none}
.laptop .cam{position:absolute;left:50%;top:4px;width:4px;height:4px;border-radius:50%;background:#000;transform:translateX(-50%)}
.laptop .base{height:16px;background:linear-gradient(#55524f,#333132);border-radius:0 0 12px 12px;position:relative}
.laptop .base:after{content:"";position:absolute;left:50%;top:0;width:70px;height:5px;border-radius:0 0 5px 5px;background:#242222;transform:translateX(-50%)}
.lap .lscreen{position:relative;width:340px;height:212px;background:#fff;border-radius:4px;overflow:hidden;font-size:11.5px;line-height:1.25;color:var(--char);padding:12px 14px;display:flex;flex-direction:column;gap:7px}
.lap .lh{display:flex;justify-content:space-between;align-items:baseline;font-weight:700;font-size:13px}.lap .lh span{color:var(--mid);font-weight:600;font-size:10.5px}
.lap .lbar{height:4px;border-radius:2px;background:var(--sheet);overflow:hidden}.lap .lbar i{display:block;height:100%;background:var(--green);animation:lfill 7s linear infinite}
@keyframes lfill{0%{width:0}62%{width:100%}89%{width:100%}94%,100%{width:0}}
.lap .lrow{display:flex;align-items:center;gap:8px;font-weight:500;opacity:0;animation:none 7s var(--ease) infinite;padding:3px 0;border-bottom:1px solid var(--sheet)}
.lap .lrow .dot{width:8px;height:8px}.lap .lrow .lbl{flex:1}.lap .lrow .v{font-weight:700;font-variant-numeric:tabular-nums}
.lap .lrow.k3 .th{width:30px;height:20px;border-radius:3px;background:radial-gradient(120% 90% at 50% 80%,#4a4849,#232223)}
.lap .lcta{margin-top:auto;background:var(--char);color:#fff;border-radius:6px;text-align:center;font-weight:700;font-size:11px;padding:6px}
.lap .fchip{position:absolute;display:inline-flex;align-items:center;gap:6px;background:#fff;color:var(--char);font-weight:700;font-size:12.5px;padding:6px 11px;border-radius:999px;box-shadow:0 10px 24px -8px rgba(0,0,0,.45);white-space:nowrap;opacity:0;animation:none 7s var(--ease) infinite;z-index:4}
.lap .fchip .dot{width:9px;height:9px}
.lap .fchip.k3{width:60px;height:44px;padding:0;border-radius:8px;background:radial-gradient(120% 90% at 50% 80%,#4a4849,#232223);box-shadow:0 10px 24px -8px rgba(0,0,0,.6)}
@keyframes fly-k0{0%,0.0%{opacity:0;transform:translate(0,0)}3.6%{opacity:1}18.6%{opacity:1;transform:translate(508px,387px) scale(.85)}22.1%,100%{opacity:0;transform:translate(508px,387px) scale(.3)}}
@keyframes row-k0{0%,17.1%{opacity:0;transform:translateY(6px)}20.7%{opacity:1;transform:none}89%{opacity:1}94%,100%{opacity:0}}
@keyframes fly-k1{0%,14.3%{opacity:0;transform:translate(0,0)}17.9%{opacity:1}32.9%{opacity:1;transform:translate(536px,287px) scale(.85)}36.4%,100%{opacity:0;transform:translate(536px,287px) scale(.3)}}
@keyframes row-k1{0%,31.4%{opacity:0;transform:translateY(6px)}35.0%{opacity:1;transform:none}89%{opacity:1}94%,100%{opacity:0}}
@keyframes fly-k2{0%,28.6%{opacity:0;transform:translate(0,0)}32.1%{opacity:1}47.1%{opacity:1;transform:translate(513px,177px) scale(.85)}50.7%,100%{opacity:0;transform:translate(513px,177px) scale(.3)}}
@keyframes row-k2{0%,45.7%{opacity:0;transform:translateY(6px)}49.3%{opacity:1;transform:none}89%{opacity:1}94%,100%{opacity:0}}
@keyframes fly-k3{0%,42.9%{opacity:0;transform:translate(0,0)}46.4%{opacity:1}61.4%{opacity:1;transform:translate(553px,78px) scale(.85)}65.0%,100%{opacity:0;transform:translate(553px,78px) scale(.3)}}
@keyframes row-k3{0%,60.0%{opacity:0;transform:translateY(6px)}63.6%{opacity:1;transform:none}89%{opacity:1}94%,100%{opacity:0}}
.lap .fchip.k0{left:-40px;top:80px;animation-name:fly-k0}.lap .lrow.k0{animation-name:row-k0}
.lap .fchip.k1{left:-64px;top:180px;animation-name:fly-k1}.lap .lrow.k1{animation-name:row-k1}
.lap .fchip.k2{left:-40px;top:290px;animation-name:fly-k2}.lap .lrow.k2{animation-name:row-k2}
.lap .fchip.k3{left:-56px;top:380px;animation-name:fly-k3}.lap .lrow.k3{animation-name:row-k3}
@media (prefers-reduced-motion:reduce){.lap .fchip{display:none}.lap .lrow{opacity:1 !important;animation:none !important}.lap .lbar i{width:100%;animation:none}}

.how{padding:96px 0}
.ill{width:220px;height:184px;border-radius:20px;background:var(--surface);display:flex;align-items:center;justify-content:center;margin-bottom:22px}
.ill svg{width:200px;height:166px}
.scene{position:relative;width:560px;height:600px;border-radius:28px;background:var(--surface);overflow:visible;flex-shrink:0}
.scene>svg{position:absolute;left:24px;top:40px;width:420px;height:350px}
.scene .phone{position:absolute;right:-24px;bottom:-24px;transform:scale(.86);transform-origin:bottom right}
.scene .chip{opacity:0;transform-box:fill-box;transform-origin:center;animation:flyin 4.2s var(--ease) infinite}
.scene .c1{animation-delay:.2s;--dx:150px;--dy:70px}.scene .c2{animation-delay:1.3s;--dx:130px;--dy:60px}.scene .c3{animation-delay:2.4s;--dx:150px;--dy:-10px}
@keyframes flyin{0%{opacity:0;transform:translate(-20px,0) scale(.9)}14%{opacity:1;transform:translate(0,0) scale(1)}62%{opacity:1;transform:translate(var(--dx),var(--dy)) scale(1)}76%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.5)}100%{opacity:0}}
@media (min-width:900px){.how .hstep{grid-template-columns:minmax(0,1fr) minmax(0,1.6fr);gap:48px}.how .hstep:nth-child(even){grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)}}
.photo{position:relative;width:100%;max-width:640px;height:520px;border-radius:28px;overflow:visible;flex-shrink:0}
.photo img{width:100%;height:100%;object-fit:cover;border-radius:28px;display:block}
.photo .phone{position:absolute;right:-40px;bottom:-40px;transform:scale(.78);transform-origin:bottom right;box-shadow:0 30px 60px -20px rgba(0,0,0,.55),0 0 0 1px rgba(0,0,0,.2) inset}
.hstep:nth-child(even) .photo .phone{right:auto;left:-40px;transform-origin:bottom left}
.photo .chip{opacity:0;transform-box:fill-box;transform-origin:center;animation:flyin 4.2s var(--ease) infinite}
.photo .c1{animation-delay:.2s;--dx:150px;--dy:70px}.photo .c2{animation-delay:1.3s;--dx:130px;--dy:60px}.photo .c3{animation-delay:2.4s;--dx:150px;--dy:-10px}
.hstep .demo{display:contents}
.hstep .vis{justify-self:end}.hstep:nth-child(even) .vis{justify-self:start}
@media (prefers-reduced-motion:reduce){.chip{animation:none !important;opacity:1 !important}}
'''
script=src[src.index('<script type="text/x-dc"'):src.index('</script>')+9]
script=script.replace('"height":7400','"height":3100')
def page(title,steps_html):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap">
<style>
{css}
{extra_css}
</style>
</helmet>
<div class="page" style="width: 100%; min-height: 100%; background: #F7F9FC; font-family: 'DM Sans', system-ui, sans-serif; color: #1b2430">
<section class="sec alt how" id="how">
  <div class="wrap">
    {head}
    <div class="steps4">
{steps_html}
    </div>
  </div>
</section>
</div>
</x-dc>
{script}
</body>
</html>
'''
LAP='''<div class="vis photo lap"><img src="/_blob/0382d9487f86ad4a604060b1538692ef" alt="" style="object-position: 50% 40%">
<div class="laptop"><div class="lid"><span class="cam"></span><div class="lscreen"><div class="lh">Report summary<span>RO 587, 38 items inspected</span></div><div class="lbar"><i></i></div>
<div class="lrow k0"><span class="dot y"></span><span class="lbl">Tire tread, front</span><span class="v">4/32"</span></div>
<div class="lrow k1"><span class="dot r"></span><span class="lbl">Brake pads, rear</span><span class="v">2 mm</span></div>
<div class="lrow k2"><span class="dot y"></span><span class="lbl">Wheel balance</span><span class="v">Recommend</span></div>
<div class="lrow k3"><span class="th"></span><span class="lbl">Photo, front tread</span></div>
<div class="lcta">Save &amp; Create Lines</div></div></div><div class="base"></div></div>
<span class="fchip k0"><span class="dot y"></span>4/32" front tread</span><span class="fchip k1"><span class="dot r"></span>Rear pads 2 mm</span><span class="fchip k2"><span class="dot y"></span>Wheel balance</span><span class="fchip k3"></span></div>'''
FOCUS={'mpi':'50% 68%','video':'50% 71%','customer':'100% 50%'}
PHOTOS={'mpi':'/_blob/2cdf35438068f580d84e16a251b7f588','video':'/_blob/f797652c307da3346fed07cdcf5b2a3d','customer':'/_blob/0d0fb9bd853124c45abbb784e1f5f4a9'}
def copy(n,ill=''):
    h3,p=copies[n]
    return f'<div class="copy">{ill}<div class="num">{n+1}</div><h3>{h3}</h3><p>{p}</p></div>'
# A: line drawings in the copy column
A=[]; B=[]; C=[]
for n,k in enumerate(order):
    ill='<div class="ill">'+svg(k,NAVY)+'</div>'
    A.append('      <div class="hstep">'+copy(n,ill)+demos[k]+'</div>')
    B.append('      <div class="hstep">'+copy(n)+'<div class="vis scene">'+svg(k,'#b9c3cf',accent=TEAL)+demos[k]+'</div></div>')
    if k=='review':
        C.append('      <div class="hstep">'+copy(n)+LAP+'</div>')
    else:
        C.append(f'      <div class="hstep">{copy(n)}<div class="vis photo"><img src="{PHOTOS[k]}" alt="" style="object-position: {FOCUS[k]}">{demos[k]}</div></div>')
open('board/project/HowA.dc.html','w').write(page('How it works, line drawings','\n'.join(A)))
open('board/project/HowB.dc.html','w').write(page('How it works, scene behind the phone','\n'.join(B)))
open('board/project/HowC.dc.html','w').write(page('How it works, photos','\n'.join(C)))
# canvas index
c=json.load(open('artifact-files/2b08cfe7-bed3-493f-9b2a-4b024fe1e01d/project/canvas.json'))
for i,(f,t) in enumerate([('HowA.dc.html','How it works A: line drawings'),('HowB.dc.html','How it works B: scene behind the phone'),('HowC.dc.html','How it works C: photos')]):
    c['boards'][f]={'x':1800+i*1400,'y':0,'w':1280,'h':3100,'title':t,'expand':'fill','is_interactive':True}
    if f not in c['order']: c['order'].append(f)
c['notes']['how-title']={'x':1800,'y':-300,'text':'How it works: three visual treatments','kind':'title1','maxW':4000}
c['notes']['how-key']={'x':1800,'y':3220,'w':420,'text':'A. Monoline drawings above each step\'s copy; phones unchanged.\nB. Light line-drawn scene as a backdrop card, phone overlapping it; step 3 chips fly toward the phone.\nC. Generated documentary photos (Fal, nano-banana-pro) with the phone overlapping; step 3 is a dark card with the flying chips.\n\nAll three keep your copy and the Motion 1 phone loops.','fill':'blue'}
c.setdefault('noteOrder',[]); 
for k in ('how-title','how-key'):
    if k not in c['noteOrder']: c['noteOrder'].append(k)
json.dump(c,open('board/project/canvas.json','w'),indent=2)
print('built')

# ---- fold C into the main page
m=open('board/project/Main.dc.html').read()
a=m.index('<div class="steps4">')+len('<div class="steps4">'); b=m.index('\n    </div>\n  </div>\n</section>',a)
m=m[:a]+'\n'+'\n'.join(C)+m[b:]
MK='/* how-it-works photo treatment */\n'
st=m.index('<style>')+7; en=m.index('</style>')
m=m[:st]+css+'\n'+MK+extra_css.replace('.how{padding:96px 0}\n','')+m[en:]
assert m.count('class="laptop"')==1 and m.count('class="vis photo')==4
open('board/project/Main.dc.html','w').write(m); print('main folded')

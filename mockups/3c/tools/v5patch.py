p='board/project/Main.dc.html'; s=open(p).read()
def R(o,n,cnt=1):
    global s
    c=s.count(o); assert c==cnt,(c,o[:90]); s=s.replace(o,n)
def RB(start,end,new):
    global s
    i=s.index(start); j=s.index(end,i); s=s[:i]+new+s[j:]
MIC='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path></svg>'
def ring(a=''):
    segs=''.join(f'<circle class="sg g{i} {a}" cx="60" cy="60" r="52"></circle>' for i in range(1,7))
    return f'<svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="52"></circle>{segs}</svg>'
def kf(name,a,b=None,hold=100):
    return f'@keyframes {name}{{0%,{a}%{{opacity:0}}{b if b else a+1.5}%,{hold}%{{opacity:1}}' + (f'{hold+.5}%,100%{{opacity:0}}' if hold<100 else '') + '}'

# ======================= HERO =======================
L=[(3,8,12),(13,19,23),(25,29,33),(35,39,43),(45,50,54)]   # speak start, speak end, sentence landed
X=[9,20,30,40,51]                                           # sentence appears
SEG=[12,23,24.5,33,43,54]                                   # ring segment fills
kl=''.join(f'@keyframes h_l{i+1}{{0%,{a}%{{clip-path:inset(0 100% 0 0);opacity:1}}{b}%,{c}%{{clip-path:inset(0 0 0 0);opacity:1}}{c+2}%,100%{{clip-path:inset(0 0 0 0);opacity:.4}}}}\n' for i,(a,b,c) in enumerate(L))
kx=''.join(f'@keyframes h_x{i+1}{{0%,{a}%{{opacity:0;background:transparent}}{a+1.5}%{{opacity:1;background:rgba(45,212,191,.28)}}{a+7}%,100%{{opacity:1;background:transparent}}}}\n' for i,a in enumerate(X))
kr=''.join(f'@keyframes h_r{i+1}{{0%,{a-1}%{{opacity:0}}{a}%,100%{{opacity:1}}}}\n' for i,a in enumerate(SEG))
# counter in the ring: 0..6 of 6
bounds=[3]+SEG
kc=''
for n in range(7):
    a=bounds[n]; b=SEG[n] if n<6 else 56
    kc+=f'@keyframes h_c{n}{{0%,{a-.5 if n else 0}%{{opacity:{0 if n else 1}}}{a}%,{b-.5}%{{opacity:1}}{b}%,100%{{opacity:0}}}}\n' if n else f'@keyframes h_c0{{0%,{SEG[0]-.5}%{{opacity:1}}{SEG[0]}%,100%{{opacity:0}}}}\n'
km=''
MW=[(3,12),(13,24),(25,34),(35,44),(45,100)]
for i,(a,b) in enumerate(MW):
    km+=f'@keyframes h_m{i+1}{{0%,{a}%{{opacity:0;transform:translateY(6px)}}{a+1.5}%,{b-1 if b<100 else 100}%{{opacity:1;transform:none}}' + (f'{b}%,100%{{opacity:0;transform:translateY(-6px)}}' if b<100 else '') + '}\n'
HERO_CSS='''/* hero visual: every sentence the tech says becomes a line of the story, and each one fills a segment of the grade (12s) */
.hvw{position:relative;width:560px;height:620px;justify-self:center}
.hv{position:absolute;inset:0}
.hv *{box-sizing:border-box}
.hv .a{animation-duration:12s;animation-timing-function:var(--ease);animation-iteration-count:infinite;animation-fill-mode:both}
.hv .tx{position:absolute;left:0;top:0;width:560px;animation-name:h_out}
.hv .who{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:var(--mutedn)}
.hv .who .mic{width:26px;height:26px;border-radius:50%;background:var(--red);display:inline-flex;align-items:center;justify-content:center}
.hv .who .mic svg{width:13px;height:13px}
.hv .bars{display:flex;align-items:center;gap:3px;height:22px;margin-left:6px;animation-name:h_talk}
.hv .bars i{width:3px;border-radius:2px;background:var(--teal-l);height:18px;animation:wv .9s ease-in-out infinite}
.hv .bars i:nth-child(2n){animation-duration:.7s;height:12px}.hv .bars i:nth-child(3n){animation-duration:1.1s;height:20px}.hv .bars i:nth-child(5n){animation-duration:.8s;height:8px}
@keyframes wv{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
.hv .said{margin-top:12px;font-size:16px;line-height:1.5;font-weight:500;color:#fff;letter-spacing:-.005em}
.hv .said span{display:block;white-space:nowrap}
.hv .said mark{background:none;color:#5eead4;font-weight:600}
.hv .l1{animation-name:h_l1}.hv .l2{animation-name:h_l2}.hv .l3{animation-name:h_l3}.hv .l4{animation-name:h_l4}.hv .l5{animation-name:h_l5}
.hlap{position:absolute;left:0;top:186px;width:540px;filter:drop-shadow(0 36px 50px rgba(0,0,0,.55));animation-name:h_lap}
.hlap .lid{background:var(--char);border-radius:16px 16px 4px 4px;padding:12px;position:relative}
.hlap .lid:before{content:"";position:absolute;inset:0;border-radius:16px 16px 4px 4px;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,0) 40%);pointer-events:none}
.hlap .base{height:16px;margin:0 -22px;background:linear-gradient(#55524f,#333132);border-radius:0 0 12px 12px;position:relative}
.hlap .base:after{content:"";position:absolute;left:50%;top:0;width:80px;height:5px;border-radius:0 0 5px 5px;background:#242222;transform:translateX(-50%)}
.hscr{position:relative;background:#fff;border-radius:5px;color:#0f172a;padding:16px 18px 20px;font-size:13.5px;line-height:1.55}
.hscr .rh{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:10px;border-bottom:1px solid #eef1f4}
.hscr .rh b{font-size:13px}
.hscr .rh small{display:block;color:#64748b;font-size:11px;font-weight:600}
.hscr .pill{position:relative;display:inline-flex;font-size:11px;font-weight:700;white-space:nowrap}
.hscr .pill .w1{color:#0b7f76;background:#e6f6f4;border-radius:999px;padding:4px 10px;animation-name:h_w1}
.hscr .pill .w2{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--ws);color:#fff;border-radius:999px;animation-name:h_done}
.hscr .blk{margin-top:12px}
.hscr .lab{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:800;letter-spacing:.08em;color:#2563eb}
.hscr .lab em{font-style:normal;font-weight:600;letter-spacing:0;color:#94a3b8;font-size:10.5px}
.hscr .blk p{margin-top:2px;color:#1e293b}
.hscr .b3 p{max-width:calc(100% - 132px)}
.hscr .blk p span{border-radius:3px}
.hscr mark{background:#ccfbf1;color:inherit;border-radius:3px;padding:0 2px}
.hscr .x1{animation-name:h_x1}.hscr .x2{animation-name:h_x2}.hscr .x3{animation-name:h_x3}.hscr .x4{animation-name:h_x4}.hscr .x5{animation-name:h_x5}
.hv .seal{position:absolute;right:0;top:420px;display:flex;flex-direction:column;align-items:center;gap:10px;animation-name:h_seal}
.hv .seal .ring{width:140px;height:140px;box-shadow:0 24px 48px -14px rgba(0,0,0,.6),0 0 0 6px rgba(255,255,255,.1)}
.hv .ring .g1{animation-name:h_r1}.hv .ring .g2{animation-name:h_r2}.hv .ring .g3{animation-name:h_r3}.hv .ring .g4{animation-name:h_r4}.hv .ring .g5{animation-name:h_r5}.hv .ring .g6{animation-name:h_r6}
.hv .ring .lt b{animation-name:h_gl}
.hv .ring .cnt{position:relative;width:100%;height:16px}
.hv .ring .cnt span{position:absolute;left:0;right:0;top:0;text-align:center;font-size:12px;font-weight:700;color:#64748b}
.hv .ring .lt .big{position:relative;height:44px;width:100%}
.hv .ring .lt .big b{position:absolute;left:0;right:0;top:0;text-align:center}
.hv .ring .lt .big .n{color:#cbd5e1;font-size:40px;font-weight:800;line-height:1;position:absolute;left:0;right:0;top:2px;text-align:center}
'''+''.join(f'.hv .ring .c{n}{{animation-name:h_c{n}}}' for n in range(7))+'''
.hv .rdy{font-size:12px;font-weight:700;color:#fff;background:#15803d;border-radius:999px;padding:6px 13px;white-space:nowrap;animation-name:h_rdy}
@keyframes h_out{0%{opacity:0}2%,93%{opacity:1}97%,100%{opacity:0}}
@keyframes h_lap{0%{opacity:0;transform:translateY(10px)}3%,93%{opacity:1;transform:none}97%,100%{opacity:0;transform:none}}
@keyframes h_seal{0%{opacity:0;transform:scale(.85)}3%,93%{opacity:1;transform:none}97%,100%{opacity:0;transform:none}}
@keyframes h_talk{0%,2%{opacity:.25}4%,50%{opacity:1}52%,100%{opacity:.25}}
@keyframes h_w1{0%,8%{opacity:.45}9%,100%{opacity:1}}
@keyframes h_done{0%,54%{opacity:0}56%,100%{opacity:1}}
@keyframes h_gl{0%,55.5%{opacity:0;transform:scale(.6)}58.5%,100%{opacity:1;transform:none}}
@keyframes h_rdy{0%,58%{opacity:0;transform:translateY(6px)}61%,100%{opacity:1;transform:none}}
'''+kl+kx+kr+kc+km+'''@media (max-width:620px){
  .hvw{width:100%;height:auto}
  .hv{position:relative}
  .hv .tx{position:relative;width:auto}
  .hv .said{position:relative;height:52px;font-size:16px;line-height:1.45}
  .hv .said span{position:absolute;left:0;right:0;top:0;white-space:normal;clip-path:none}
  .hv .l1{animation-name:h_m1}.hv .l2{animation-name:h_m2}.hv .l3{animation-name:h_m3}.hv .l4{animation-name:h_m4}.hv .l5{animation-name:h_m5}
  .hlap{position:relative;left:auto;top:auto;width:auto;margin-top:16px}
  .hlap .lid{background:none;padding:0}
  .hlap .lid:before,.hlap .base{display:none}
  .hscr{border-radius:14px;font-size:13px;padding-bottom:72px}
  .hscr .b3 p{max-width:none}
  .hv .seal{right:12px;top:auto;bottom:-34px;flex-direction:row-reverse;align-items:center}
  .hv .seal .ring{width:108px;height:108px}
  .hv .seal .ring .lt b,.hv .ring .lt .big .n{font-size:34px}
}

'''
RB('/* hero visual:','/* grade ring:',HERO_CSS)
cnt=''.join(f'<span class="c{n} a">{n} of 6</span>' for n in range(7))
bigs=''.join(f'<span class="n c{n} a">{n}</span>' for n in range(7))
HERO_HTML='''    <div class="hvw" aria-hidden="true">
      <div class="hv">
        <div class="tx a">
          <div class="who"><span class="mic">'''+MIC+'''</span>Marcus, Tech, bay 14<span class="bars a"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
          <div class="said">
            <span class="l1 a"><mark>Verified the smell.</mark> Reservoir's low.</span>
            <span class="l2 a"><mark>Pressure tested at 16.</mark> <mark>Pump's dripping at the weep hole.</mark></span>
            <span class="l3 a">Coolant down the block. <mark>Seal's gone.</mark></span>
            <span class="l4 a"><mark>New pump and gasket</mark>, refilled and bled.</span>
            <span class="l5 a"><mark>Holds 16, road tested, no leaks.</mark></span>
          </div>
        </div>
        <div class="hlap a"><div class="lid"><div class="hscr">
          <div class="rh"><div><b>RO 41187, Line 1: Coolant smell</b><small>Warranty</small></div><span class="pill"><span class="w1 a">Writing it…</span><span class="w2 a">Story written</span></span></div>
          <div class="blk"><div class="lab">COMPLAINT <em>from the RO</em></div><p>Customer states coolant smell after driving.</p></div>
          <div class="blk b2"><div class="lab">CAUSE</div><p><span class="x1 a"><mark>Verified concern.</mark> Coolant low in reservoir.</span> <span class="x2 a"><mark>Pressure tested cooling system at 16 psi</mark> and found the <mark>water pump dripping from the weep hole</mark>,</span> <span class="x3 a">with coolant trailing down the block. <mark>Failed water pump seal.</mark></span></p></div>
          <div class="blk b3"><div class="lab">CORRECTION</div><p><span class="x4 a"><mark>Replaced water pump and gasket.</mark> Refilled and bled cooling system.</span> <span class="x5 a"><mark>System holds 16 psi. Road tested, no leaks.</mark></span></p></div>
        </div></div><div class="base"></div></div>
        <div class="seal a"><div class="ring">'''+ring('a')+'''<div class="lt"><span class="big">'''+bigs+'''<b class="a">A</b></span><span class="cnt">'''+cnt+'''</span></div></div><span class="rdy a">Ready to submit</span></div>
      </div>
    </div>'''
RB('    <div class="hvw" aria-hidden="true">','\n  </div>\n</header>',HERO_HTML)

# ======================= STEP 1 =======================
R('.c-keys{left:24px;top:24px}','''.c-keys{left:24px;top:24px;padding:12px 16px}
.c-keys .half{display:flex;align-items:center;gap:10px}
.c-keys .dv{width:1px;align-self:stretch;background:#e2e8f0;margin:0 6px}
.c-keys .tm{position:relative;display:block;width:58px;height:24px}
.c-keys .tm b{position:absolute;left:0;top:0}
.c-keys .a{animation-duration:13s;animation-timing-function:var(--ease);animation-iteration-count:infinite;animation-fill-mode:both}
.c-keys .t0{animation-name:s1_c1}.c-keys .t1{animation-name:s1_c2}.c-keys .t2{animation-name:s1_c3}.c-keys .t3{animation-name:s1_c4}''')
KEYS='<span class="ic" style="background:#fdecef"><svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"></path><path d="M3 3l18 18" stroke="#b9314f" stroke-width="2.2"></path></svg></span>'
MICI='<span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path></svg></span>'
i=s.index('<div class="callout c-keys">'); j=s.index('<div class="phone s1">',i)
s=s[:i]+'<div class="callout c-keys"><span class="half">'+MICI+'<span><span class="tm"><b class="t0 a">0:00</b><b class="t1 a">0:04</b><b class="t2 a">0:11</b><b class="t3 a">0:17</b></span><small>talking</small></span></span><span class="dv"></span><span class="half">'+KEYS+'<span><b>0</b><small>typing</small></span></span></div>\n          '+s[j:]
R('<div class="nt n2 a"><div class="who3">Marcus, Tech</div>','<div class="nt n2 a">')
R('<div class="nt n3 a"><div class="who3">Marcus, Tech</div>','<div class="nt n3 a">')
R('.photo .phone{position:absolute;right:-40px;bottom:-40px;transform:scale(.78);','.photo .phone{position:absolute;right:-40px;bottom:-40px;transform:scale(.86);')

# ======================= STEP 2 =======================
R('.s2 .mic{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:4px}','.s2 .mic{display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:6px}')
R('@keyframes s2_wbar{0%,35%{opacity:0}36%,51%{opacity:1}53%,100%{opacity:0}}','@keyframes s2_wbar{0%,35%{opacity:0}36%,44%{opacity:1}45.5%,100%{opacity:0}}')
R('@keyframes s2_h2{0%,34%{opacity:0}35%,51%{opacity:1}52%,100%{opacity:0}}','@keyframes s2_h2{0%,34%{opacity:0}35%,44%{opacity:1}45%,100%{opacity:0}}')
R('@keyframes s2_pr{0%,34%{opacity:0;transform:scale(.92)}36%,50%{opacity:1;transform:scale(1.06)}52%,100%{opacity:0}}','@keyframes s2_pr{0%,34%{opacity:0;transform:scale(.92)}36%,44%{opacity:1;transform:scale(1.06)}46%,100%{opacity:0}}')
R('@keyframes s2_done{0%,62%{opacity:0;transform:translateY(14px)}66%,100%{opacity:1;transform:none}}','@keyframes s2_done{0%,59%{opacity:0;transform:translateY(14px)}63%,100%{opacity:1;transform:none}}')
R('/* step 3: one tap','''.c-cov{right:24px;top:24px;flex-direction:column;align-items:center;gap:8px;padding:14px 16px 12px}
.c-cov .a{animation-duration:13s;animation-timing-function:var(--ease);animation-iteration-count:infinite;animation-fill-mode:both}
.c-cov .ring{width:92px;height:92px}
.c-cov .ring circle{stroke-width:10}
.c-cov .ring .g5{animation-name:s2_r5}.c-cov .ring .g6{animation-name:s2_r6}
.c-cov .num{position:relative;width:40px;height:34px}
.c-cov .num b{position:absolute;left:0;right:0;top:0;text-align:center;font-size:32px;color:var(--navy)}
.c-cov .num .n4{animation-name:s2_n4}.c-cov .num .n5{animation-name:s2_n5}.c-cov .num .n6{animation-name:s2_n6;color:#15803d}
.c-cov .lt small{margin-top:0}
.c-cov .cap{font-size:12px;font-weight:700;color:var(--text-2)}
@keyframes s2_r5{0%,16%{opacity:0}17.5%,96.5%{opacity:1}97%,100%{opacity:0}}
@keyframes s2_r6{0%,55%{opacity:0}56.5%,96.5%{opacity:1}97%,100%{opacity:0}}
@media (min-width:900px) and (max-width:1279px){.c-cov{right:16px;top:16px}}
@media (max-width:899px){.c-cov{left:auto;right:12px;transform-origin:top right}}

/* step 3: one tap''')
i=s.index('<div class="phone s2">')
s=s[:i]+'<div class="callout c-cov"><span class="ring">'+ring('a')+'<span class="lt"><span class="num"><b class="n4 a">4</b><b class="n5 a">5</b><b class="n6 a">6</b></span><small>of 6</small></span></span><span class="cap">Story coverage</span></div>\n          '+s[i:]

# ======================= STEP 3 =======================
S3_CSS='''/* step 3: tap Write Story, it writes and grades, Copy fills the DMS (10s) */
.lap3{position:absolute;right:-20px;bottom:-72px;width:540px;z-index:3;filter:drop-shadow(0 30px 40px rgba(0,0,0,.45))}
.lap3 .lid{background:var(--char);border-radius:14px 14px 4px 4px;padding:11px;position:relative}
.lap3 .lid:before{content:"";position:absolute;inset:0;border-radius:14px 14px 4px 4px;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,0) 40%);pointer-events:none}
.lap3 .base{height:16px;margin:0 -20px;background:linear-gradient(#55524f,#333132);border-radius:0 0 12px 12px;position:relative}
.lap3 .base:after{content:"";position:absolute;left:50%;top:0;width:70px;height:5px;border-radius:0 0 5px 5px;background:#242222;transform:translateX(-50%)}
.ls{position:relative;height:310px;background:#eef2f6;border-radius:4px;overflow:hidden;color:#0f172a;font-size:10.5px;line-height:1.45;padding:10px;display:grid;grid-template-columns:56fr 44fr;gap:10px}
.ls *{box-sizing:border-box}
.ls .a{animation-duration:10s;animation-timing-function:var(--ease);animation-iteration-count:infinite;animation-fill-mode:both}
.ls .app{background:#fff;border-radius:6px;padding:10px;display:flex;flex-direction:column;min-width:0}
.ls .rh{display:flex;align-items:center;gap:8px;font-weight:700;font-size:11.5px;min-height:56px;padding-bottom:8px;border-bottom:1px solid #eef1f4}
.ls .rh small{font-weight:600;color:#64748b;font-size:9.5px;display:block}
.ls .slot{position:relative;margin-left:auto;width:60px;height:52px;flex-shrink:0}
.ls .slot>*{position:absolute;right:0;top:50%}
.ls .wsp{transform:translateY(-50%);white-space:nowrap;background:var(--ws);color:#fff;font-size:10.5px;font-weight:700;border-radius:8px;padding:7px 10px;animation-name:l_wsp}
.ls .wsp .tap{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(255,255,255,.6);opacity:0;animation-name:l_tap1}
.ls .wrt{transform:translateY(-50%);display:flex;align-items:center;gap:5px;white-space:nowrap;font-size:10px;font-weight:700;color:var(--app-teal);animation-name:l_wrt}
.ls .wrt i{width:11px;height:11px;border-radius:50%;border:2px solid #99d6cf;border-top-color:var(--app-teal);animation:spin .8s linear infinite}
.ls .slot .ring{width:52px;height:52px;margin-top:-26px;animation-name:l_ring}
.ls .slot .ring circle{stroke-width:10}
.ls .slot .ring .lt b{font-size:22px}
.ls .rdy{position:absolute;right:58px;top:-4px;font-size:9px;font-weight:700;color:#15803d;background:#dcfce7;border-radius:999px;padding:3px 8px;white-space:nowrap;animation-name:l_ring}
.ls .cards{margin-top:8px;display:flex;flex-direction:column;gap:6px}
.ls .cc{position:relative;border:1px solid #e2e8f0;border-radius:7px;padding:5px 46px 6px 9px;background:#fff}
.ls .cc b{display:block;font-size:8.5px;letter-spacing:.08em;color:#2563eb;font-weight:800}
.ls .cc p{margin:1px 0 0;font-size:10.5px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ls .cc .cp{position:absolute;right:7px;top:6px;border:1px solid #cbd5e1;border-radius:5px;font-size:9px;font-weight:700;color:#475569;padding:2px 6px;background:#fff}
.ls .t2{animation-name:l_t2}.ls .t3{animation-name:l_t3}
.ls .k2{animation-name:l_k2}.ls .k3{animation-name:l_k3}
.ls .k2 .cp{animation-name:l_p2}.ls .k3 .cp{animation-name:l_p3}
.dms{background:#dfe5ec;border:1px solid #b8c4d2;border-radius:6px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.dms .tb{background:#5b6b7f;color:#fff;font-size:9.5px;font-weight:700;padding:6px 9px;display:flex;justify-content:space-between;gap:6px;white-space:nowrap}
.dms .tb i{font-style:normal;opacity:.7}
.dms .fld{padding:7px 8px 0;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:7.6px;line-height:1.45;color:#1f2a37}
.dms .fld label{display:block;font-weight:700;color:#475569;margin-bottom:2px;font-size:7.5px}
.dms .box{background:#fff;border:1px solid #b8c4d2;border-radius:3px;padding:4px 5px;min-height:20px}
.dms .f2 .box{min-height:78px}.dms .f3 .box{min-height:44px}
.dms .box span{display:block}
.dms .v2{animation-name:l_v2}.dms .v3{animation-name:l_v3}
.dms .f2 .box{animation-name:l_b2}.dms .f3 .box{animation-name:l_b3}
.dms .ok{display:flex;align-items:center;gap:4px;margin:auto 8px 8px;font-family:var(--font);font-size:9.5px;font-weight:700;color:#15803d;animation-name:l_ok}
@keyframes l_wsp{0%,9.5%{opacity:1;transform:translateY(-50%)}8%{transform:translateY(-50%) scale(.94)}11%,100%{opacity:0;transform:translateY(-50%)}}
@keyframes l_tap1{0%,6%{opacity:0;transform:scale(.3)}7%{opacity:1;transform:scale(.6)}10%,100%{opacity:0;transform:scale(2.2)}}
@keyframes l_wrt{0%,10.5%{opacity:0}12%,29%{opacity:1}30%,100%{opacity:0}}
@keyframes l_ring{0%,30%{opacity:0;transform:scale(.6)}34%,92%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}}
@keyframes l_t2{0%,12%{clip-path:inset(0 0 100% 0);opacity:1}21%,92%{clip-path:inset(0 0 0 0);opacity:1}96%,100%{clip-path:inset(0 0 0 0);opacity:0}}
@keyframes l_t3{0%,21%{clip-path:inset(0 0 100% 0);opacity:1}29%,92%{clip-path:inset(0 0 0 0);opacity:1}96%,100%{clip-path:inset(0 0 0 0);opacity:0}}
@keyframes l_k2{0%,42%{box-shadow:0 0 0 0 rgba(13,148,136,0);border-color:#e2e8f0}44%,54%{box-shadow:0 0 0 2px #0d9488;border-color:#0d9488}57%,100%{box-shadow:0 0 0 0 rgba(13,148,136,0);border-color:#e2e8f0}}
@keyframes l_k3{0%,58%{box-shadow:0 0 0 0 rgba(13,148,136,0);border-color:#e2e8f0}60%,70%{box-shadow:0 0 0 2px #0d9488;border-color:#0d9488}73%,100%{box-shadow:0 0 0 0 rgba(13,148,136,0);border-color:#e2e8f0}}
@keyframes l_p2{0%,44%{transform:none;background:#fff;color:#475569}45.5%{transform:scale(.9);background:#0d9488;color:#fff}47%,54%{transform:none;background:#0d9488;color:#fff}56%,100%{transform:none;background:#fff;color:#475569}}
@keyframes l_p3{0%,60%{transform:none;background:#fff;color:#475569}61.5%{transform:scale(.9);background:#0d9488;color:#fff}63%,70%{transform:none;background:#0d9488;color:#fff}72%,100%{transform:none;background:#fff;color:#475569}}
@keyframes l_v2{0%,47%{opacity:0;clip-path:inset(0 0 100% 0)}48%{opacity:1}54%,92%{opacity:1;clip-path:inset(0 0 0 0)}96%,100%{opacity:0;clip-path:inset(0 0 0 0)}}
@keyframes l_v3{0%,63%{opacity:0;clip-path:inset(0 0 100% 0)}64%{opacity:1}68%,92%{opacity:1;clip-path:inset(0 0 0 0)}96%,100%{opacity:0;clip-path:inset(0 0 0 0)}}
@keyframes l_b2{0%,46%{border-color:#b8c4d2;box-shadow:none}48%,56%{border-color:#0d9488;box-shadow:0 0 0 2px rgba(13,148,136,.25)}59%,100%{border-color:#b8c4d2;box-shadow:none}}
@keyframes l_b3{0%,62%{border-color:#b8c4d2;box-shadow:none}64%,71%{border-color:#0d9488;box-shadow:0 0 0 2px rgba(13,148,136,.25)}74%,100%{border-color:#b8c4d2;box-shadow:none}}
@keyframes l_ok{0%,70%{opacity:0;transform:translateY(4px)}73%,92%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}}

'''
RB('/* step 3: one tap','/* mid CTA */',S3_CSS)
CAUSE='Verified concern. Coolant low in reservoir. Pressure tested cooling system at 16 psi and found the water pump dripping from the weep hole, with coolant trailing down the block. Failed water pump seal.'
CORR='Replaced water pump and gasket. Refilled and bled cooling system. System holds 16 psi. Road tested, no leaks.'
S3_HTML='''<div class="lap3"><div class="lid"><div class="ls">
            <div class="app">
              <div class="rh"><div>RO 41187, Line 1: Coolant smell<small>Warranty</small></div><span class="slot"><span class="wsp a">Write Story<i class="tap a"></i></span><span class="wrt a"><i></i>Writing…</span><span class="ring a">'''+ring()+'''<span class="lt"><b>A</b></span></span><span class="rdy a">Ready to submit</span></span></div>
              <div class="cards">
                <div class="cc"><b>COMPLAINT</b><p>Customer states coolant smell after driving.</p><span class="cp">Copy</span></div>
                <div class="cc k2 a"><b>CAUSE</b><p class="t2 a">'''+CAUSE+'''</p><span class="cp a">Copy</span></div>
                <div class="cc k3 a"><b>CORRECTION</b><p class="t3 a">'''+CORR+'''</p><span class="cp a">Copy</span></div>
              </div>
            </div>
            <div class="dms"><div class="tb">Your DMS<i>RO 41187 · Line 1</i></div>
              <div class="fld"><label>COMPLAINT</label><div class="box"><span>CUSTOMER STATES COOLANT SMELL AFTER DRIVING.</span></div></div>
              <div class="fld f2"><label>CAUSE</label><div class="box a"><span class="v2 a">'''+CAUSE.upper()+'''</span></div></div>
              <div class="fld f3"><label>CORRECTION</label><div class="box a"><span class="v3 a">'''+CORR.upper()+'''</span></div></div>
              <span class="ok a">✓ Pasted, nothing retyped</span></div>
          </div></div><div class="base"></div></div>'''
RB('<div class="lap3">','\n        </div>\n      </div>\n\n    </div>\n    <div class="midcta">',S3_HTML)
# phone/tablet: laptop becomes a stacked card
RB('  .ls{height:auto;','  .steps{gap:72px}','''  .ls{height:auto;border-radius:14px;font-size:12.5px;padding:10px;grid-template-columns:1fr;border:1px solid var(--line)}
  .ls .rh{font-size:13px}
  .ls .cc b{font-size:10px}
  .ls .cc p{font-size:12.5px}
  .ls .cc .cp{font-size:11px;padding:2px 8px}
  .ls .rdy{font-size:10.5px;right:60px}
  .dms .fld{font-size:9.5px}
  .dms .fld label{font-size:9px}
  .dms .f2 .box{min-height:70px}.dms .f3 .box{min-height:40px}
  .dms .ok{margin-top:10px}
''')

# ======================= GRADER =======================
G_CSS='''.gs{width:460px;max-width:100%;justify-self:center}
.gs *{box-sizing:border-box}
.gs .a{animation-duration:10s;animation-timing-function:var(--ease);animation-iteration-count:infinite;animation-fill-mode:both}
.gs .gin{animation-name:g_in}
.gcard{background:#fff;color:#0f172a;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}
.gcard .gtop{display:flex;align-items:center;gap:18px;padding:18px 18px 14px}
.gcard .ring{width:108px;height:108px}
.gcard .ring .lt b{font-size:38px;width:60px;height:42px}
.gcard .ring .lt b span{position:absolute;left:0;right:0;top:0;text-align:center}
.gcard .ring .g5{stroke:#3b82f6}
.gcard .ring .g6{animation-name:g_s6}
.gcard .bB{color:var(--gB);animation-name:g_bB}.gcard .bA{color:#15803d;animation-name:g_bA}
.gcard .gmeta b{display:block;font-size:17px;letter-spacing:-.01em}
.gcard .gmeta small{display:block;font-size:12px;color:#64748b;font-weight:600;margin-top:1px}
.gcard .st{position:relative;display:block;height:26px;margin-top:10px}
.gcard .st span{position:absolute;left:0;top:0;font-size:12px;font-weight:700;border-radius:999px;padding:5px 11px;white-space:nowrap}
.gcard .s-w{background:#fff3d6;color:#92400e;animation-name:g_sw}
.gcard .s-ok{background:#dcfce7;color:#15803d;animation-name:g_sok}
.gcard .five{margin:0 18px;padding:10px 12px;border-radius:12px;background:#f8fafc;display:flex;align-items:center;gap:10px}
.gcard .five .cs{display:flex;gap:4px}
.gcard .five .chip{height:20px;min-width:22px}
.gcard .five span:last-child{font-size:12px;color:#64748b;font-weight:600;line-height:1.35}
.gcard .five b{color:#0f172a}
.gcard .fv{margin:10px 18px 14px;padding:12px;border-radius:12px;border:1.5px solid #fcd9a4;background:#fff7ed;display:flex;gap:12px;align-items:flex-start;animation-name:g_row}
.gcard .fv .chipw{position:relative;width:32px;height:30px;flex-shrink:0}
.gcard .fv .chip{position:absolute;inset:0;height:30px;font-size:15px;border-radius:8px}
.gcard .fv .chip.m{background:#fde7c4;color:#b45309;animation-name:g_m}
.gcard .fv .chip.A{animation-name:g_A}
.gcard .fv .lb{flex:1;min-width:0}
.gcard .fv .lb>b{display:block;font-size:15px}
.gcard .fv .sw{display:grid;margin-top:2px}
.gcard .fv .sw small{grid-area:1/1;display:block;font-weight:600;font-size:13px}
.gcard .fv .sug{color:#b45309;animation-name:g_sug}
.gcard .fv .dsc{color:#15803d;animation-name:g_dsc}
.gcard .fix{padding:12px 18px 18px;background:#f8fafc;border-top:1px solid #eef1f4;display:flex;flex-direction:column;gap:10px}
.gcard .vn{align-self:flex-end;max-width:84%;background:var(--sky);border-radius:14px 14px 4px 14px;padding:8px 12px;font-size:13px;font-weight:500;line-height:1.4;animation-name:g_vn}
.gcard .vn small{display:flex;align-items:center;gap:4px;font-size:10.5px;color:#0e7490;font-weight:700;margin-bottom:2px}
.gcard .vn small svg{width:11px;height:11px}
.gcard .upd{position:relative;height:42px;border-radius:10px;background:var(--ws);color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;animation-name:g_upd}
.gcard .upd .tap{position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(255,255,255,.55);opacity:0;animation-name:g_tap}
@keyframes g_in{0%{opacity:0}3%,93%{opacity:1}97%,100%{opacity:0}}
@keyframes g_row{0%,4%{border-color:#fcd9a4;background:#fff7ed;box-shadow:0 0 0 0 rgba(245,158,11,0)}9%{box-shadow:0 0 0 6px rgba(245,158,11,.18)}14%{box-shadow:0 0 0 0 rgba(245,158,11,0)}19%{box-shadow:0 0 0 6px rgba(245,158,11,.18)}24%,52%{border-color:#fcd9a4;background:#fff7ed;box-shadow:0 0 0 0 rgba(245,158,11,0)}56%,100%{border-color:#bbf7d0;background:#f0fdf4;box-shadow:none}}
@keyframes g_sug{0%,53%{opacity:1}54.5%,100%{opacity:0}}
@keyframes g_dsc{0%,54.5%{opacity:0}57%,100%{opacity:1}}
@keyframes g_m{0%,53%{opacity:1}54%,100%{opacity:0}}
@keyframes g_A{0%,53.5%{opacity:0;transform:scale(.4)}57%,100%{opacity:1;transform:none}}
@keyframes g_s6{0%,54%{stroke:#e2e8f0}57%,100%{stroke:#22a06b}}
@keyframes g_bB{0%,55%{opacity:1}56%,100%{opacity:0}}
@keyframes g_bA{0%,56%{opacity:0;transform:scale(.6)}59%,100%{opacity:1;transform:none}}
@keyframes g_sw{0%,55%{opacity:1}56%,100%{opacity:0}}
@keyframes g_sok{0%,56%{opacity:0;transform:scale(.9)}59%,100%{opacity:1;transform:none}}
@keyframes g_vn{0%,30%{opacity:0;transform:translateY(14px)}35%,100%{opacity:1;transform:none}}
@keyframes g_upd{0%,40%{box-shadow:0 0 0 0 rgba(16,185,129,0)}45%{box-shadow:0 0 0 7px rgba(16,185,129,.28)}49%{box-shadow:0 0 0 0 rgba(16,185,129,0);transform:none}50.5%{transform:scale(.97)}52%,100%{transform:none}}
@keyframes g_tap{0%,49.5%{opacity:0;transform:scale(.3)}50.5%{opacity:1;transform:scale(.6)}54%,100%{opacity:0;transform:scale(2.2)}}

'''
RB('.gs{width:460px','/* why */',G_CSS)
G_HTML='''<div class="gs" aria-hidden="true"><div class="gin a">
      <div class="gcard">
        <div class="gtop"><div class="ring">'''+ring()+'''<div class="lt"><b><span class="bB a">B+</span><span class="bA a">A</span></b></div></div>
          <div class="gmeta"><b>Story Grade</b><small>RO 41203, Line 2: Check engine light</small><span class="st"><span class="s-w a">1 item missing</span><span class="s-ok a">Ready to submit</span></span></div></div>
        <div class="five"><span class="cs"><i class="chip A">A</i><i class="chip A">A</i><i class="chip A">A</i><i class="chip A">A</i><i class="chip B">B</i></span><span><b>5 of 6 covered:</b> verification, diagnostics, component, root cause, repair</span></div>
        <div class="fv a"><span class="chipw"><i class="chip m a">—</i><i class="chip A a">A</i></span><span class="lb"><b>Final Verification</b><span class="sw"><small class="sug a">Missing: how was the repair confirmed?</small><small class="dsc a">Codes stayed clear after a road test.</small></span></span></div>
        <div class="fix"><div class="vn a"><small><svg viewBox="0 0 24 24" fill="none" stroke="#0e7490" stroke-width="2.6" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path></svg>Marcus, new voice note</small>Cleared codes. Road tested 12 miles, no codes returned.</div><span class="upd a">Update Story<i class="tap a"></i></span></div>
      </div>
    </div></div>'''
RB('<div class="gs" aria-hidden="true">','\n  </div>\n</section>\n\n<!-- ===== Why',G_HTML)

# ======================= mobile scales + reduced motion =======================
R('  .photo .phone{transform:scale(.6);right:-4px;bottom:-170px}\n  .hstep.even .photo .phone{left:-4px;transform:scale(.68);bottom:-200px}\n  .hstep.even .photo{margin-bottom:220px}',
  '  .photo .phone{transform:scale(.72);right:-4px;bottom:-200px}\n  .hstep.even .photo .phone{left:-4px;transform:scale(.72);bottom:-200px}\n  .photo,.hstep.even .photo{margin-bottom:220px}')
R('  .s1 .a,.s2 .a{animation-delay:-11.9s !important;animation-play-state:paused !important}','  .s1 .a,.s2 .a,.c-keys .a,.c-cov .a{animation-delay:-11.9s !important;animation-play-state:paused !important}')
R('.hv .bars i,.s1 .spin,.s1 .lis .wb i,.s2 .wbar i{animation:none}','.hv .bars i,.s1 .spin,.s1 .lis .wb i,.s2 .wbar i,.ls .wrt i{animation:none}')
open(p,'w').write(s); print('v5 patched')

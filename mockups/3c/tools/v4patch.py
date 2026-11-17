p='board/project/Main.dc.html'; s=open(p).read()
def R(o,n,cnt=1):
    global s
    c=s.count(o); assert c==cnt,(c,o[:90]); s=s.replace(o,n)
def RB(start,end,new,keep_end=True):
    global s
    i=s.index(start); j=s.index(end,i); s=s[:i]+new+s[j:]

MIC='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path></svg>'
def ring(cls='',extra=''):
    segs=''.join(f'<circle class="sg g{i} {extra}" cx="60" cy="60" r="52"></circle>' for i in range(1,7))
    return f'<svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="52"></circle>{segs}</svg>'

# ================= shared ring + callout CSS (insert before /* problem */) =================
SHARED='''/* grade ring: one segment per warranty criterion */
.ring{position:relative;width:132px;height:132px;border-radius:50%;background:#fff;flex-shrink:0}
.ring svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.ring circle{fill:none;stroke-width:9}
.ring .trk{stroke:#eef1f4}
.ring .sg{stroke:#22a06b;stroke-dasharray:49.45 277.28}
.ring .g1{stroke-dashoffset:-2.5}.ring .g2{stroke-dashoffset:-56.95}.ring .g3{stroke-dashoffset:-111.4}.ring .g4{stroke-dashoffset:-165.85}.ring .g5{stroke-dashoffset:-220.3}.ring .g6{stroke-dashoffset:-274.75}
.ring .lt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring .lt b{position:relative;font-size:44px;font-weight:800;color:#15803d;line-height:1;letter-spacing:-.02em}
.ring .lt small{font-size:11px;font-weight:700;color:#64748b;margin-top:3px}
.callout{position:absolute;z-index:4;background:#fff;border-radius:14px;padding:10px 16px 10px 10px;box-shadow:0 18px 40px -16px rgba(0,0,0,.5);display:flex;align-items:center;gap:10px}
.callout .ic{width:38px;height:38px;border-radius:10px;background:#e6f6f4;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.callout .ic svg{width:20px;height:20px}
.callout b{display:block;font-size:24px;font-weight:800;color:var(--navy);letter-spacing:-.02em;line-height:1}
.callout small{display:block;font-size:12px;color:var(--text-2);font-weight:600;margin-top:2px}

'''
R('/* problem */',SHARED+'/* problem */')

# ================= HERO =================
HERO_CSS='''/* hero visual: the tech talks, the story writes itself, the grade lands (12s) */
.hvw{position:relative;width:560px;height:640px;justify-self:center}
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
.hv .said{margin-top:12px;font-size:19px;line-height:1.45;font-weight:500;color:rgba(255,255,255,.86);letter-spacing:-.005em}
.hv .said span{display:block;white-space:nowrap}
.hv .said mark{background:linear-gradient(transparent 58%,rgba(45,212,191,.38) 58%);color:#fff;font-weight:600;padding:0 1px}
.hv .l1{animation-name:h_l1}.hv .l2{animation-name:h_l2}.hv .l3{animation-name:h_l3}.hv .l4{animation-name:h_l4}.hv .l5{animation-name:h_l5}
.hlap{position:absolute;left:0;top:214px;width:540px;filter:drop-shadow(0 36px 50px rgba(0,0,0,.55));animation-name:h_lap}
.hlap .lid{background:var(--char);border-radius:16px 16px 4px 4px;padding:12px;position:relative}
.hlap .lid:before{content:"";position:absolute;inset:0;border-radius:16px 16px 4px 4px;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,0) 40%);pointer-events:none}
.hlap .base{height:16px;margin:0 -22px;background:linear-gradient(#55524f,#333132);border-radius:0 0 12px 12px;position:relative}
.hlap .base:after{content:"";position:absolute;left:50%;top:0;width:80px;height:5px;border-radius:0 0 5px 5px;background:#242222;transform:translateX(-50%)}
.hscr{position:relative;background:#fff;border-radius:5px;color:#0f172a;padding:16px 18px 18px;font-size:12.5px;line-height:1.5}
.hscr .rh{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:10px;border-bottom:1px solid #eef1f4}
.hscr .rh b{font-size:13px}
.hscr .rh small{display:block;color:#64748b;font-size:11px;font-weight:600}
.hscr .pill{position:relative;display:inline-flex;font-size:11px;font-weight:700;white-space:nowrap}
.hscr .pill .w1{color:#0b7f76;background:#e6f6f4;border-radius:999px;padding:4px 10px;animation-name:h_w1}
.hscr .pill .w2{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--ws);color:#fff;border-radius:999px;animation-name:h_done}
.hscr .blk{margin-top:11px}
.hscr .lab{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:800;letter-spacing:.08em;color:#2563eb}
.hscr .lab em{font-style:normal;font-weight:600;letter-spacing:0;color:#94a3b8;font-size:10.5px}
.hscr .blk p{margin-top:2px;color:#1e293b}
.hscr .b3 p{max-width:calc(100% - 128px)}
.hscr mark{background:#ccfbf1;color:inherit;border-radius:3px;padding:0 2px}
.hscr .b2 p{animation-name:h_b2}.hscr .b3 p{animation-name:h_b3}
.hv .seal{position:absolute;right:6px;top:452px;display:flex;flex-direction:column;align-items:center;gap:10px;animation-name:h_seal}
.hv .seal .ring{box-shadow:0 24px 48px -14px rgba(0,0,0,.6),0 0 0 6px rgba(255,255,255,.1)}
.hv .ring .g1{animation-name:h_r1}.hv .ring .g2{animation-name:h_r2}.hv .ring .g3{animation-name:h_r3}.hv .ring .g4{animation-name:h_r4}.hv .ring .g5{animation-name:h_r5}.hv .ring .g6{animation-name:h_r6}
.hv .ring .lt b{animation-name:h_gl}
.hv .rdy{font-size:12px;font-weight:700;color:#fff;background:#15803d;border-radius:999px;padding:6px 13px;white-space:nowrap;animation-name:h_rdy}
@keyframes h_out{0%{opacity:0}3%,94%{opacity:1}98%,100%{opacity:0}}
@keyframes h_lap{0%{opacity:0;transform:translateY(10px)}4%,94%{opacity:1;transform:none}98%,100%{opacity:0;transform:none}}
@keyframes h_talk{0%,2%{opacity:.25}4%,26%{opacity:1}29%,100%{opacity:.25}}
@keyframes h_l1{0%,3%{clip-path:inset(0 100% 0 0)}8%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l2{0%,8%{clip-path:inset(0 100% 0 0)}14%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l3{0%,14%{clip-path:inset(0 100% 0 0)}18.5%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l4{0%,18.5%{clip-path:inset(0 100% 0 0)}23%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l5{0%,23%{clip-path:inset(0 100% 0 0)}27%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_m1{0%,3%{opacity:0}7%,100%{opacity:1}}
@keyframes h_m2{0%,8%{opacity:0}12%,100%{opacity:1}}
@keyframes h_m3{0%,14%{opacity:0}18%,100%{opacity:1}}
@keyframes h_m4{0%,18.5%{opacity:0}22.5%,100%{opacity:1}}
@keyframes h_m5{0%,23%{opacity:0}27%,100%{opacity:1}}
@keyframes h_w1{0%,26%{opacity:.45}28%,100%{opacity:1}}
@keyframes h_b2{0%,29%{clip-path:inset(0 0 100% 0)}37%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_b3{0%,37%{clip-path:inset(0 0 100% 0)}43%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_done{0%,43%{opacity:0}45%,100%{opacity:1}}
@keyframes h_seal{0%,44%{opacity:0;transform:scale(.6)}48%,94%{opacity:1;transform:none}98%,100%{opacity:0;transform:none}}
@keyframes h_r1{0%,48%{opacity:0}49.5%,100%{opacity:1}}
@keyframes h_r2{0%,49.5%{opacity:0}51%,100%{opacity:1}}
@keyframes h_r3{0%,51%{opacity:0}52.5%,100%{opacity:1}}
@keyframes h_r4{0%,52.5%{opacity:0}54%,100%{opacity:1}}
@keyframes h_r5{0%,54%{opacity:0}55.5%,100%{opacity:1}}
@keyframes h_r6{0%,55.5%{opacity:0}57%,100%{opacity:1}}
@keyframes h_gl{0%,57%{opacity:0;transform:scale(.6)}60%,100%{opacity:1;transform:none}}
@keyframes h_rdy{0%,60%{opacity:0;transform:translateY(6px)}63%,100%{opacity:1;transform:none}}
@media (max-width:620px){
  .hvw{width:100%;height:auto}
  .hv{position:relative}
  .hv .tx{position:relative;width:auto}
  .hv .said{font-size:16.5px}
  .hv .said span{display:inline;white-space:normal}
  .hv .l1{animation-name:h_m1}.hv .l2{animation-name:h_m2}.hv .l3{animation-name:h_m3}.hv .l4{animation-name:h_m4}.hv .l5{animation-name:h_m5}
  .hlap{position:relative;left:auto;top:auto;width:auto;margin-top:20px}
  .hlap .lid{background:none;padding:0}
  .hlap .lid:before,.hlap .base{display:none}
  .hscr{border-radius:14px;font-size:13px;padding-bottom:22px}
  .hscr .b3 p{max-width:calc(100% - 96px)}
  .hv .seal{right:-6px;top:auto;bottom:-26px}
  .hv .seal .ring{width:104px;height:104px}
  .hv .seal .ring .lt b{font-size:34px}
  .hv .rdy{display:none}
}

'''
RB('/* hero visual:','/* grade ring:',HERO_CSS)
HERO_HTML='''    <div class="hvw" aria-hidden="true">
      <div class="hv">
        <div class="tx a">
          <div class="who"><span class="mic">'''+MIC+'''</span>Marcus, Tech, bay 14<span class="bars a"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
          <div class="said">
            <span class="l1 a">Verified the smell. Reservoir's low. </span>
            <span class="l2 a"><mark>Pressure tested at 16.</mark> <mark>Pump's dripping at the weep hole</mark>, </span>
            <span class="l3 a">coolant down the block. <mark>Seal's gone.</mark> </span>
            <span class="l4 a">New pump and gasket, refilled and bled. </span>
            <span class="l5 a"><mark>Holds 16, road tested, no leaks.</mark></span>
          </div>
        </div>
        <div class="hlap a"><div class="lid"><div class="hscr">
          <div class="rh"><div><b>RO 41187, Line 1: Coolant smell</b><small>Warranty</small></div><span class="pill"><span class="w1 a">Writing it…</span><span class="w2 a">Story written</span></span></div>
          <div class="blk"><div class="lab">COMPLAINT <em>from the RO</em></div><p>Customer states coolant smell after driving.</p></div>
          <div class="blk b2"><div class="lab">CAUSE</div><p class="a">Verified concern. Coolant low in reservoir. <mark>Pressure tested cooling system at 16 psi</mark> and found the <mark>water pump dripping from the weep hole</mark>, with coolant trailing down the block. <mark>Failed water pump seal.</mark></p></div>
          <div class="blk b3"><div class="lab">CORRECTION</div><p class="a">Replaced water pump and gasket. Refilled and bled cooling system. <mark>System holds 16 psi. Road tested, no leaks.</mark></p></div>
        </div></div><div class="base"></div></div>
        <div class="seal a"><div class="ring">'''+ring()+'''<div class="lt"><b class="a">A</b><small>6 of 6</small></div></div><span class="rdy a">Ready to submit</span></div>
      </div>
    </div>
  </div>
</header>'''
RB('    <div class="hvw" aria-hidden="true">','</header>',HERO_HTML)
s=s.replace(HERO_HTML+'</header>',HERO_HTML,1)

# ================= STEP 1 =================
S1_CSS='''/* step 1: talk, and the notes land on the line (13s) */
.s1 .apbar{padding:22px 16px 10px;border-bottom:1px solid #e5e7eb}
.s1 .apbar small{display:block;font-size:11px;color:#64748b;font-weight:600}
.s1 .apbar b{font-size:17px;letter-spacing:-.01em}
.s1 .np{padding:12px 12px 0}
.s1 .nph{display:flex;align-items:center;gap:6px;font-weight:700;font-size:12px;color:#334155}
.s1 .nph svg{width:14px;height:14px}
.s1 .cnt{position:relative;margin-left:auto;width:22px;height:20px}
.s1 .cnt span{position:absolute;inset:0;background:var(--app-teal);color:#fff;border-radius:999px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}
.s1 .cnt .c1{animation-name:s1_c1}.s1 .cnt .c2{animation-name:s1_c2}.s1 .cnt .c3{animation-name:s1_c3}.s1 .cnt .c4{animation-name:s1_c4}
.s1 .nt{margin-top:9px}
.s1 .nt.a{overflow:hidden}
.s1 .who3{font-size:10px;font-weight:700;color:#64748b;margin-bottom:3px}
.s1 .bub{background:var(--sky);border-radius:14px 14px 14px 4px;padding:8px 11px;font-size:13.5px;line-height:1.35;font-weight:500;color:#0f172a}
.s1 .nt.adv .bub{background:#fef9c3}
.s1 .vtag{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:#0e7490;margin-top:5px}
.s1 .vtag svg{width:11px;height:11px}
.s1 .n1{animation-name:s1_n1}.s1 .n2{animation-name:s1_n2}.s1 .n3{animation-name:s1_n3}
.s1 .wsrow{position:absolute;left:12px;right:12px;bottom:96px;display:flex;gap:8px}
.s1 .wsb{flex:1;background:var(--ws);color:#fff;font-weight:700;font-size:13px;text-align:center;border-radius:10px;padding:10px;animation-name:s1_ws}
.s1 .gmb{border:1.5px solid var(--app-teal);color:#0f766e;font-weight:700;font-size:13px;border-radius:10px;padding:9px 12px;background:#fff}
.s1 .bar{position:absolute;left:0;right:0;bottom:0;padding:12px 14px 18px;border-top:1px solid #e5e7eb;background:#fff;display:flex;gap:10px;align-items:center}
.s1 .hold{position:relative;flex:1;height:54px;border-radius:999px;background:linear-gradient(90deg,var(--app-teal),var(--app-teal-d));color:#fff;font-weight:700;font-size:13.5px;display:flex;align-items:center;justify-content:center;gap:8px;animation-name:s1_press}
.s1 .hold svg{width:18px;height:18px}
.s1 .hold .ring2{position:absolute;inset:-6px;border-radius:999px;border:2px solid rgba(13,148,136,.45);opacity:0;animation-name:s1_ring}
.s1 .hold .lis{position:absolute;inset:0;border-radius:999px;background:#0a5f58;display:flex;align-items:center;justify-content:center;gap:10px;opacity:0;animation-name:s1_lis}
.s1 .lis .wb{display:flex;align-items:center;gap:3px;height:24px}
.s1 .lis .wb i{width:3px;height:22px;border-radius:2px;background:#fff;animation:wv .8s ease-in-out infinite}
.s1 .lis .wb i:nth-child(2n){animation-duration:.6s}.s1 .lis .wb i:nth-child(3n){animation-duration:1s}.s1 .lis .wb i:nth-child(5n){animation-duration:.7s}
.s1 .hold .proc{position:absolute;inset:0;border-radius:999px;background:#fff;color:var(--app-teal);border:1.5px solid #cbd5e1;display:flex;align-items:center;justify-content:center;gap:8px;opacity:0;animation-name:s1_proc}
.s1 .spin{width:14px;height:14px;border-radius:50%;border:2px solid #99d6cf;border-top-color:var(--app-teal);animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.s1 .cam{width:54px;height:54px;border-radius:50%;background:#475569;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.s1 .cam svg{width:20px;height:20px}
.c-keys{left:24px;top:24px}
@keyframes s1_press{0%,5%{transform:none}7%,17%{transform:scale(.97)}19%,32%{transform:none}34%,44%{transform:scale(.97)}46%,59%{transform:none}61%,71%{transform:scale(.97)}73%,100%{transform:none}}
@keyframes s1_ring{0%,6%{opacity:0;transform:scale(.96)}9%,16%{opacity:1;transform:scale(1.05)}18%,33%{opacity:0}36%,43%{opacity:1;transform:scale(1.05)}45%,60%{opacity:0}63%,70%{opacity:1;transform:scale(1.05)}72%,100%{opacity:0}}
@keyframes s1_lis{0%,6%{opacity:0}8%,17%{opacity:1}18.5%,33%{opacity:0}35%,44%{opacity:1}45.5%,60%{opacity:0}62%,71%{opacity:1}72.5%,100%{opacity:0}}
@keyframes s1_proc{0%,17.5%{opacity:0}18.5%,22.5%{opacity:1}24%,44.5%{opacity:0}45.5%,49.5%{opacity:1}51%,71.5%{opacity:0}72.5%,76.5%{opacity:1}78%,100%{opacity:0}}
@keyframes s1_n1{0%,22.5%{opacity:0;max-height:0;margin-top:0}25.5%,93%{opacity:1;max-height:110px;margin-top:9px}97%,100%{opacity:0;max-height:0;margin-top:0}}
@keyframes s1_n2{0%,49.5%{opacity:0;max-height:0;margin-top:0}52.5%,93%{opacity:1;max-height:110px;margin-top:9px}97%,100%{opacity:0;max-height:0;margin-top:0}}
@keyframes s1_n3{0%,76.5%{opacity:0;max-height:0;margin-top:0}79.5%,93%{opacity:1;max-height:110px;margin-top:9px}97%,100%{opacity:0;max-height:0;margin-top:0}}
@keyframes s1_c1{0%,23%{opacity:1}23.5%,96.5%{opacity:0}97%,100%{opacity:1}}
@keyframes s1_c2{0%,23%{opacity:0}23.5%,50%{opacity:1}50.5%,100%{opacity:0}}
@keyframes s1_c3{0%,50%{opacity:0}50.5%,77%{opacity:1}77.5%,100%{opacity:0}}
@keyframes s1_c4{0%,77%{opacity:0}77.5%,96.5%{opacity:1}97%,100%{opacity:0}}
@keyframes s1_ws{0%,82%{box-shadow:0 0 0 0 rgba(16,185,129,0)}86%{box-shadow:0 0 0 7px rgba(16,185,129,.28)}90%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}

'''
RB('/* step 1: Story Notes */','/* step 2:',S1_CSS)
VT='<div class="vtag"><svg viewBox="0 0 24 24" fill="none" stroke="#0e7490" stroke-width="2.6" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path></svg>Voice note, {t}</div>'
S1_HTML='''<div class="callout c-keys"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"></path><path d="M3 3l18 18" stroke="#b9314f" stroke-width="2.2"></path></svg></span><span><b>0</b><small>keystrokes</small></span></div>
          <div class="phone s1"><div class="scr">
            <div class="apbar"><small>RO 41187, Line 1</small><b>Coolant smell</b></div>
            <div class="np">
              <div class="nph"><svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>Story Notes<span class="cnt"><span class="c1 a">1</span><span class="c2 a">2</span><span class="c3 a">3</span><span class="c4 a">4</span></span></div>
              <div class="nt adv"><div class="who3">Dana, Advisor</div><div class="bub">Customer states coolant smell after driving.</div></div>
              <div class="nt n1 a"><div class="who3">Marcus, Tech</div><div class="bub">Verified the smell. Reservoir's low.</div>'''+VT.format(t='0:04')+'''</div>
              <div class="nt n2 a"><div class="who3">Marcus, Tech</div><div class="bub">Pressure tested at 16. Dripping at the weep hole. Seal's gone.</div>'''+VT.format(t='0:07')+'''</div>
              <div class="nt n3 a"><div class="who3">Marcus, Tech</div><div class="bub">New pump and gasket. Holds 16, road tested, no leaks.</div>'''+VT.format(t='0:06')+'''</div>
            </div>
            <div class="wsrow"><span class="wsb a">Write Story</span><span class="gmb">Guide me</span></div>
            <div class="bar"><span class="hold a"><span class="ring2 a"></span>'''+MIC.replace('<svg ','<svg ')+'''Hold to make a note<span class="lis a"><span class="wb"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>Listening</span><span class="proc a"><span class="spin"></span>Processing</span></span><span class="cam"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle></svg></span></div>
          </div></div>'''
RB('<div class="phone s1">','\n        </div>\n      </div>\n\n      <div class="hstep even">',S1_HTML)

# ================= STEP 2 =================
S2_CSS='''/* step 2: Guide me fills the gaps, one question at a time (13s) */
.s2 .scr{background:#f3f4f6}
.s2 .gh{background:var(--app-navy);color:#fff;padding:22px 14px 14px}
.s2 .gh .t{display:flex;align-items:center;gap:8px}
.s2 .gh .t small{display:block;font-size:10px;color:#94a3b8;font-weight:800;letter-spacing:.06em}
.s2 .gh .t b{display:block;font-size:15px}
.s2 .gh .x{margin-left:auto;font-size:16px;color:#cbd5e1}
.s2 .cov{margin-top:12px}
.s2 .cov .lbl{display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#cbd5e1}
.s2 .cov .nn{position:relative;width:60px;height:14px}
.s2 .cov .nn span{position:absolute;right:0;top:0;white-space:nowrap}
.s2 .n4{animation-name:s2_n4}.s2 .n5{animation-name:s2_n5}.s2 .n6{animation-name:s2_n6}
.s2 .segs{display:flex;gap:4px;margin-top:6px}
.s2 .segs i{flex:1;height:7px;border-radius:4px;background:var(--teal-l)}
.s2 .segs .f5{animation-name:s2_f5}.s2 .segs .f6{animation-name:s2_f6}
.s2 .body{position:absolute;left:0;right:0;top:122px;bottom:0;overflow:hidden;animation-name:s2_wrap}
.s2 .card{position:absolute;left:12px;right:12px;top:16px;background:#fff;border-radius:18px;padding:16px 14px 14px;box-shadow:0 12px 26px -16px rgba(15,23,42,.4)}
.s2 .card .qk{font-size:10px;font-weight:800;letter-spacing:.07em;color:var(--app-teal)}
.s2 .card h4{margin:4px 0 10px;font-size:17px;line-height:1.25;letter-spacing:-.01em}
.s2 .opt{position:relative;display:flex;align-items:center;height:40px;border-radius:12px;border:1.5px solid #d1d5db;padding:0 12px;font-size:13px;font-weight:600;color:#334155;margin-top:7px;background:#fff}
.s2 .opt.g{color:#6b7280;border-style:dashed}
.s2 .opt .ck{margin-left:auto;width:20px;height:20px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;opacity:0}
.s2 .opt .ck svg{width:12px;height:12px}
.s2 .c1{animation-name:s2_c1}.s2 .c2{animation-name:s2_c2}
.s2 .o1{animation-name:s2_o1}.s2 .o1 .ck{animation-name:s2_ck}
.s2 .tap{position:absolute;left:50%;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(13,148,136,.35);opacity:0;animation-duration:13s;animation-iteration-count:infinite}
.s2 .o1 .tap{animation-name:s2_tp1}
.s2 .mic{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:4px}
.s2 .mbtn{position:relative;width:66px;height:66px;border-radius:50%;background:var(--app-teal);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 20px -8px rgba(13,148,136,.6)}
.s2 .mbtn svg{position:relative;width:26px;height:26px}
.s2 .mbtn .pr{position:absolute;inset:-9px;border-radius:50%;border:2.5px solid rgba(13,148,136,.45);opacity:0;animation-name:s2_pr}
.s2 .mbtn .tap{animation-name:s2_tp2}
.s2 .mic .hint{position:relative;height:16px;width:100%;text-align:center;font-size:11.5px;color:#64748b;font-weight:600}
.s2 .mic .hint span{position:absolute;left:0;right:0;top:0}
.s2 .h1{animation-name:s2_h1}.s2 .h2{animation-name:s2_h2}
.s2 .wbar{display:flex;align-items:center;justify-content:center;gap:3px;height:22px;animation-name:s2_wbar}
.s2 .wbar i{width:3px;height:20px;border-radius:2px;background:var(--app-teal);animation:wv .8s ease-in-out infinite}
.s2 .wbar i:nth-child(2n){animation-duration:.6s}.s2 .wbar i:nth-child(3n){animation-duration:1s}
.s2 .said2{margin-top:2px;width:100%;background:var(--sky);border-radius:14px;padding:10px 12px;font-size:14px;font-weight:600;line-height:1.35;animation-name:s2_said}
.s2 .toast{position:absolute;left:50%;bottom:18px;background:#0f172a;color:#fff;font-size:11.5px;font-weight:600;border-radius:999px;padding:8px 13px;white-space:nowrap;display:flex;gap:6px;align-items:center;opacity:0}
.s2 .toast svg{width:12px;height:12px}
.s2 .tt1{animation-name:s2_tt1}.s2 .tt2{animation-name:s2_tt2}
.s2 .done{position:absolute;left:14px;right:14px;top:44px;display:flex;flex-direction:column;align-items:center;text-align:center;animation-name:s2_done}
.s2 .done .okc{width:68px;height:68px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center}
.s2 .done .okc svg{width:32px;height:32px}
.s2 .done b{font-size:18px;margin-top:14px;letter-spacing:-.01em}
.s2 .done p{font-size:12.5px;color:#64748b;margin-top:4px;max-width:210px}
.s2 .done .ws2{margin-top:20px;width:100%;height:48px;border-radius:12px;background:var(--ws);color:#fff;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;animation-name:s2_glow}
@keyframes s2_wrap{0%{opacity:0}3%,94%{opacity:1}98%,100%{opacity:0}}
@keyframes s2_n4{0%,16%{opacity:1}17%,96.5%{opacity:0}97%,100%{opacity:1}}
@keyframes s2_n5{0%,16%{opacity:0}17%,55%{opacity:1}56%,100%{opacity:0}}
@keyframes s2_n6{0%,55%{opacity:0}56%,96.5%{opacity:1}97%,100%{opacity:0}}
@keyframes s2_f5{0%,16%{background:rgba(255,255,255,.18)}17.5%,96.5%{background:#2DD4BF}97%,100%{background:rgba(255,255,255,.18)}}
@keyframes s2_f6{0%,55%{background:rgba(255,255,255,.18)}56.5%,96.5%{background:#2DD4BF}97%,100%{background:rgba(255,255,255,.18)}}
@keyframes s2_c1{0%,2%{opacity:0;transform:translateY(14px)}5%,21%{opacity:1;transform:none}25%,100%{opacity:0;transform:translateX(-112%)}}
@keyframes s2_o1{0%,13.5%{background:#fff;border-color:#d1d5db;color:#334155}14%,100%{background:#0d9488;border-color:#0d9488;color:#fff}}
@keyframes s2_ck{0%,14%{opacity:0;transform:scale(.5)}16%,100%{opacity:1;transform:none}}
@keyframes s2_tp1{0%,13%{opacity:0;transform:scale(.3)}13.5%{opacity:1;transform:scale(.6)}17%,100%{opacity:0;transform:scale(2.2)}}
@keyframes s2_tt1{0%,16%{opacity:0;transform:translate(-50%,8px)}18%,22%{opacity:1;transform:translate(-50%,0)}24%,100%{opacity:0;transform:translate(-50%,0)}}
@keyframes s2_c2{0%,24%{opacity:0;transform:translateX(112%)}28%,59%{opacity:1;transform:none}63%,100%{opacity:0;transform:translateX(-112%)}}
@keyframes s2_tp2{0%,33.5%{opacity:0;transform:scale(.3)}34%{opacity:1;transform:scale(.6)}37%,100%{opacity:0;transform:scale(2.2)}}
@keyframes s2_pr{0%,34%{opacity:0;transform:scale(.92)}36%,50%{opacity:1;transform:scale(1.06)}52%,100%{opacity:0}}
@keyframes s2_h1{0%,34%{opacity:1}35%,100%{opacity:0}}
@keyframes s2_h2{0%,34%{opacity:0}35%,51%{opacity:1}52%,100%{opacity:0}}
@keyframes s2_wbar{0%,35%{opacity:0}36%,51%{opacity:1}53%,100%{opacity:0}}
@keyframes s2_said{0%,41%{opacity:0;transform:translateY(6px)}45%,100%{opacity:1;transform:none}}
@keyframes s2_tt2{0%,53%{opacity:0;transform:translate(-50%,8px)}55%,59%{opacity:1;transform:translate(-50%,0)}61%,100%{opacity:0;transform:translate(-50%,0)}}
@keyframes s2_done{0%,62%{opacity:0;transform:translateY(14px)}66%,100%{opacity:1;transform:none}}
@keyframes s2_glow{0%,74%{box-shadow:0 0 0 0 rgba(16,185,129,0)}80%{box-shadow:0 0 0 8px rgba(16,185,129,.25)}86%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}

'''
RB('/* step 2: Guide me','/* step 3: laptop',S2_CSS)
CK='<span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"></path></svg></span>'
TOASTI='<svg viewBox="0 0 24 24" fill="none" stroke="#2DD4BF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"></path></svg>'
S2_HTML='''<div class="phone s2"><div class="scr">
            <div class="gh"><div class="t"><div><small>GUIDE ME</small><b>Coolant smell</b></div><span class="x">✕</span></div>
              <div class="cov"><div class="lbl"><span>Story coverage</span><span class="nn"><span class="n4 a">4 of 6</span><span class="n5 a">5 of 6</span><span class="n6 a">6 of 6</span></span></div>
                <div class="segs"><i></i><i></i><i></i><i></i><i class="f5 a"></i><i class="f6 a"></i></div></div></div>
            <div class="body a">
              <div class="card c1 a"><div class="qk">QUESTION 1 OF 2</div><h4>How did you find the leak?</h4>
                <div class="opt o1 a">Pressure tested the system'''+CK+'''<i class="tap a"></i></div><div class="opt">UV dye</div><div class="opt">Visual inspection</div><div class="opt g">Something else</div></div>
              <div class="card c2 a"><div class="qk">QUESTION 2 OF 2</div><h4>How did you confirm the repair?</h4>
                <div class="mic"><span class="mbtn"><i class="pr a"></i>'''+MIC.replace('<svg ','<svg ')+'''<i class="tap a"></i></span><span class="hint"><span class="h1 a">Tap the mic and say it</span><span class="h2 a">Listening…</span></span><span class="wbar a"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><div class="said2 a">"Holds 16 psi. Road tested, no leaks."</div></div></div>
              <div class="done a"><span class="okc"><svg viewBox="0 0 24 24" fill="none" stroke="#15803d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"></path></svg></span><b>All 6 covered</b><p>Everything warranty looks for is in the notes.</p><span class="ws2 a">Write Story</span></div>
              <span class="toast tt1 a">'''+TOASTI+'''Saved as a story note</span>
              <span class="toast tt2 a">'''+TOASTI+'''Saved as a story note</span>
            </div>
          </div></div>'''
RB('<div class="phone s2">','\n        </div>\n      </div>\n\n      <div class="hstep">',S2_HTML)
R('<p class="fine">Here the notes covered the leak and the repair but not the test, so Guide me asks for it. It never guesses a code, a reading or a part number: the tech says it, or it comes from the notes or a scan-tool photo. On phones, for diagnostic warranty lines.</p>',
  '<p class="fine">Say the notes skipped how the leak was found and how the fix was checked. Guide me asks only for those. It never guesses a code, a reading or a part number. On phones, for diagnostic warranty lines.</p>')
R('<h3>Not sure what to say? Tap Guide me.</h3>','<h3><span style="white-space:nowrap">Not sure what to say?</span> Tap Guide me.</h3>')

# ================= STEP 3 =================
S3_CSS='''/* step 3: one tap writes and grades it, Copy puts it in the DMS (10s) */
.lap3{position:absolute;right:-20px;bottom:-72px;width:500px;z-index:3;filter:drop-shadow(0 30px 40px rgba(0,0,0,.45))}
.lap3 .lid{background:var(--char);border-radius:14px 14px 4px 4px;padding:11px;position:relative}
.lap3 .lid:before{content:"";position:absolute;inset:0;border-radius:14px 14px 4px 4px;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,0) 40%);pointer-events:none}
.lap3 .base{height:16px;margin:0 -20px;background:linear-gradient(#55524f,#333132);border-radius:0 0 12px 12px;position:relative}
.lap3 .base:after{content:"";position:absolute;left:50%;top:0;width:70px;height:5px;border-radius:0 0 5px 5px;background:#242222;transform:translateX(-50%)}
.ls{position:relative;height:296px;background:#f8fafc;border-radius:4px;overflow:hidden;color:#0f172a;font-size:10.5px;line-height:1.45;padding:12px 14px}
.ls *{box-sizing:border-box}
.ls .a{animation-duration:10s;animation-timing-function:var(--ease);animation-iteration-count:infinite;animation-fill-mode:both}
.ls .rh{display:flex;align-items:center;gap:10px;font-weight:700;font-size:12px;min-height:42px}
.ls .rh small{font-weight:600;color:#64748b;font-size:10px;display:block}
.ls .mini{margin-left:auto;display:flex;align-items:center;gap:8px;animation-name:l_mini}
.ls .mini .ring{width:42px;height:42px}
.ls .mini .ring circle{stroke-width:11}
.ls .mini .ring .lt b{font-size:16px}
.ls .mini em{font-style:normal;font-size:10px;font-weight:700;color:#15803d;background:#dcfce7;border-radius:999px;padding:3px 9px}
.ls .cards{margin-top:8px;display:flex;flex-direction:column;gap:7px;animation-name:l_wrap}
.ls .cc{position:relative;background:#fff;border:1px solid #e2e8f0;border-radius:7px;padding:6px 58px 7px 10px}
.ls .cc b{display:block;font-size:8.5px;letter-spacing:.08em;color:#2563eb;font-weight:800}
.ls .cc p{margin:1px 0 0}
.ls .cc .cp{position:absolute;right:8px;top:7px;border:1px solid #cbd5e1;border-radius:5px;font-size:9px;font-weight:700;color:#475569;padding:2px 7px;background:#fff}
.ls .t2{animation-name:l_t2}.ls .t3{animation-name:l_t3}
.ls .cpd{position:absolute;top:-1px;right:-1px;bottom:-1px;padding:0 6px;white-space:nowrap;border-radius:5px;background:#ecfdf5;color:#047857;border:1px solid #6ee7b7;display:flex;align-items:center;justify-content:center;font-weight:700;animation-name:l_cpd}
.ls .tap{position:absolute;left:50%;top:50%;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:rgba(37,99,235,.35);opacity:0;animation-name:l_tap}
.dms{position:absolute;right:10px;bottom:10px;width:262px;background:#e9eef4;border:1px solid #b8c4d2;border-radius:6px;box-shadow:0 18px 34px -12px rgba(15,23,42,.55);overflow:hidden;animation-name:l_dms}
.dms .tb{background:#5b6b7f;color:#fff;font-size:9.5px;font-weight:700;padding:5px 9px;display:flex;justify-content:space-between}
.dms .tb i{font-style:normal;opacity:.7}
.dms .fld{padding:8px 9px 9px;font-family:ui-monospace,"SF Mono",Menlo,monospace;font-size:8.5px;line-height:1.5;color:#1f2a37}
.dms .fld label{display:block;font-weight:700;color:#475569;margin-bottom:3px}
.dms .box{background:#fff;border:1px solid #b8c4d2;border-radius:3px;padding:5px 6px;min-height:66px}
.dms .box span{display:block;animation-name:l_paste}
.dms .ok{display:flex;align-items:center;gap:4px;margin-top:6px;font-family:var(--font);font-size:9.5px;font-weight:700;color:#15803d;animation-name:l_ok}
@keyframes l_wrap{0%{opacity:0}3%,92%{opacity:1}97%,100%{opacity:0}}
@keyframes l_t2{0%,4%{clip-path:inset(0 0 100% 0)}16%,100%{clip-path:inset(0 0 0 0)}}
@keyframes l_t3{0%,16%{clip-path:inset(0 0 100% 0)}27%,100%{clip-path:inset(0 0 0 0)}}
@keyframes l_mini{0%,29%{opacity:0;transform:scale(.6)}33%,92%{opacity:1;transform:none}97%,100%{opacity:0;transform:none}}
@keyframes l_tap{0%,44%{opacity:0;transform:scale(.3)}45%{opacity:1;transform:scale(.6)}49%,100%{opacity:0;transform:scale(2.2)}}
@keyframes l_cpd{0%,45.5%{opacity:0}47%,88%{opacity:1}90%,100%{opacity:0}}
@keyframes l_dms{0%,48%{opacity:0;transform:translateY(26px)}53%,90%{opacity:1;transform:none}95%,100%{opacity:0;transform:translateY(10px)}}
@keyframes l_paste{0%,55%{opacity:0;clip-path:inset(0 0 100% 0)}56%{opacity:1}64%,100%{opacity:1;clip-path:inset(0 0 0 0)}}
@keyframes l_ok{0%,65%{opacity:0}67%,100%{opacity:1}}

'''
RB('/* step 3: laptop','/* mid CTA */',S3_CSS)
S3_HTML='''<div class="lap3"><div class="lid"><div class="ls">
            <div class="rh"><div>RO 41187, Line 1: Coolant smell<small>Warranty</small></div><span class="mini a"><em>Ready to submit</em><span class="ring">'''+ring()+'''<span class="lt"><b>A</b></span></span></span></div>
            <div class="cards a">
              <div class="cc"><b>COMPLAINT</b><p>Customer states coolant smell after driving.</p><span class="cp">Copy</span></div>
              <div class="cc"><b>CAUSE</b><p class="t2 a">Verified concern. Coolant low in reservoir. Pressure tested cooling system at 16 psi and found the water pump dripping from the weep hole, with coolant trailing down the block. Failed water pump seal.</p><span class="cp">Copy<span class="cpd a">✓ Copied</span><i class="tap a"></i></span></div>
              <div class="cc"><b>CORRECTION</b><p class="t3 a">Replaced water pump and gasket. Refilled and bled cooling system. System holds 16 psi. Road tested, no leaks.</p><span class="cp">Copy</span></div>
            </div>
            <div class="dms a"><div class="tb">Your DMS<i>RO 41187 · Line 1</i></div><div class="fld"><label>CAUSE</label><div class="box"><span class="a">VERIFIED CONCERN. COOLANT LOW IN RESERVOIR. PRESSURE TESTED COOLING SYSTEM AT 16 PSI AND FOUND THE WATER PUMP DRIPPING FROM THE WEEP HOLE, WITH COOLANT TRAILING DOWN THE BLOCK. FAILED WATER PUMP SEAL.</span></div><span class="ok a">✓ Pasted, nothing retyped</span></div></div>
          </div></div><div class="base"></div></div>'''
RB('<div class="lap3">','\n        </div>\n      </div>\n\n    </div>\n    <div class="midcta">',S3_HTML)
R('<h3>One tap. Written and graded.</h3>','<h3>One tap. <span style="white-space:nowrap">Written and graded.</span></h3>')

# ================= GRADER =================
G_CSS='''.gs{width:460px;max-width:100%;justify-self:center}
.gs *{box-sizing:border-box}
.gs .a{animation-duration:10s;animation-timing-function:var(--ease);animation-iteration-count:infinite;animation-fill-mode:both}
.gs .gin{animation-name:g_in}
.gcard{background:#fff;color:#0f172a;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}
.gcard .gtop{display:flex;align-items:center;gap:18px;padding:18px 18px 14px}
.gcard .ring{width:104px;height:104px}
.gcard .ring .lt b{font-size:36px;width:56px;height:40px}
.gcard .ring .lt b span{position:absolute;left:0;right:0;top:0;text-align:center}
.gcard .ring .g5{stroke:#f59e0b}
.gcard .ring .g6{animation-name:g_s6}
.gcard .bB{color:#1d4ed8;animation-name:g_bB}.gcard .bA{color:#15803d;animation-name:g_bA}
.gcard .gmeta b{display:block;font-size:17px;letter-spacing:-.01em}
.gcard .gmeta small{display:block;font-size:12px;color:#64748b;font-weight:600;margin-top:1px}
.gcard .st{position:relative;display:block;height:26px;margin-top:10px}
.gcard .st span{position:absolute;left:0;top:0;font-size:12px;font-weight:700;border-radius:999px;padding:5px 11px;white-space:nowrap}
.gcard .s-w{background:#fff3d6;color:#92400e;animation-name:g_sw}
.gcard .s-ok{background:#dcfce7;color:#15803d;animation-name:g_sok}
.gcard .rows{padding:2px 18px 6px;border-top:1px solid #f1f5f9}
.gcard .r{display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-top:1px solid #f1f5f9;font-size:13.5px;font-weight:600}
.gcard .r:first-child{border-top:0}
.gcard .r>span:last-child{flex:1;min-width:0}
.gcard .r .chipw{position:relative;width:26px;height:20px;flex-shrink:0}
.gcard .r .chipw .chip{position:absolute;inset:0;height:20px}
.gcard .chip.B{background:#fef3c7;color:#b45309}
.gcard .fv{margin:0 -18px;padding:7px 18px;animation-name:g_row}
.gcard .fv .chip.m{animation-name:g_m}.gcard .fv .chip.A{animation-name:g_A}
.gcard .fv .sw{display:grid}
.gcard .fv .sw small{grid-area:1/1;display:block;font-weight:500;font-size:12.5px}
.gcard .fv .sug{color:var(--teal);animation-name:g_sug}
.gcard .fv .dsc{color:#64748b;animation-name:g_dsc}
.gcard .fix{padding:12px 18px 18px;background:#f8fafc;border-top:1px solid #eef1f4;display:flex;flex-direction:column;gap:10px}
.gcard .vn{align-self:flex-end;max-width:84%;background:var(--sky);border-radius:14px 14px 4px 14px;padding:8px 12px;font-size:13px;font-weight:500;line-height:1.4;animation-name:g_vn}
.gcard .vn small{display:flex;align-items:center;gap:4px;font-size:10.5px;color:#0e7490;font-weight:700;margin-bottom:2px}
.gcard .vn small svg{width:11px;height:11px}
.gcard .upd{position:relative;height:40px;border-radius:10px;background:var(--ws);color:#fff;font-weight:700;font-size:13.5px;display:flex;align-items:center;justify-content:center;animation-name:g_upd}
.gcard .upd .tap{position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(255,255,255,.55);opacity:0;animation-name:g_tap}
@keyframes g_in{0%{opacity:0}4%,94%{opacity:1}98%,100%{opacity:0}}
@keyframes g_row{0%,8%{background:transparent}12%,42%{background:#fff7ed}46%,100%{background:transparent}}
@keyframes g_sug{0%,41%{opacity:1}43%,100%{opacity:0}}
@keyframes g_dsc{0%,43%{opacity:0}46%,100%{opacity:1}}
@keyframes g_m{0%,42%{opacity:1}43%,100%{opacity:0}}
@keyframes g_A{0%,42%{opacity:0;transform:scale(.4)}45%,100%{opacity:1;transform:none}}
@keyframes g_s6{0%,43%{stroke:#e2e8f0}46%,100%{stroke:#22a06b}}
@keyframes g_bB{0%,43%{opacity:1}44%,100%{opacity:0}}
@keyframes g_bA{0%,44%{opacity:0;transform:scale(.6)}47%,100%{opacity:1;transform:none}}
@keyframes g_sw{0%,44%{opacity:1}45%,100%{opacity:0}}
@keyframes g_sok{0%,44.5%{opacity:0;transform:scale(.9)}47%,100%{opacity:1;transform:none}}
@keyframes g_vn{0%,15%{opacity:0;transform:translateY(14px)}20%,100%{opacity:1;transform:none}}
@keyframes g_upd{0%,24%{opacity:.35}28%,100%{opacity:1}}
@keyframes g_tap{0%,37%{opacity:0;transform:scale(.3)}38%{opacity:1;transform:scale(.6)}42%,100%{opacity:0;transform:scale(2.2)}}

'''
RB('.gs{width:460px','/* why */',G_CSS)
CH=lambda c,t:f'<span class="chipw"><i class="chip {c}">{t}</i></span>'
G_HTML='''<div class="gs" aria-hidden="true"><div class="gin a">
      <div class="gcard">
        <div class="gtop"><div class="ring">'''+ring()+'''<div class="lt"><b><span class="bB a">B+</span><span class="bA a">A</span></b></div></div>
          <div class="gmeta"><b>Story Grade</b><small>RO 41203, Line 2: Check engine light</small><span class="st"><span class="s-w a">1 item missing</span><span class="s-ok a">Ready to submit</span></span></div></div>
        <div class="rows">
          <div class="r">'''+CH('A','A')+'''<span>Complaint Verification</span></div>
          <div class="r">'''+CH('A','A')+'''<span>Diagnostics Performed</span></div>
          <div class="r">'''+CH('A','A')+'''<span>Component Involved</span></div>
          <div class="r">'''+CH('A','A')+'''<span>Root Cause</span></div>
          <div class="r">'''+CH('B','B')+'''<span>Repair Action</span></div>
          <div class="r fv a"><span class="chipw"><i class="chip m a">—</i><i class="chip A a">A</i></span><span>Final Verification<span class="sw"><small class="sug a">Add how you confirmed the repair.</small><small class="dsc a">Codes stayed clear after a road test.</small></span></span></div>
        </div>
        <div class="fix"><div class="vn a"><small><svg viewBox="0 0 24 24" fill="none" stroke="#0e7490" stroke-width="2.6" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path></svg>Marcus, new voice note</small>Cleared codes. Road tested 12 miles, no codes returned.</div><span class="upd a">Update Story<i class="tap a"></i></span></div>
      </div>
    </div></div>'''
RB('<div class="gs" aria-hidden="true">','\n  </div>\n</section>\n\n<!-- ===== Why',G_HTML)
R('<li><span>2</span>The tech says it or types it into the story.</li>','<li><span>2</span>The tech adds it with a quick voice note.</li>')
R('<li><span>3</span>Re-Grade confirms it in one tap.</li>','<li><span>3</span>One tap updates the story and the grade.</li>')

# ================= responsive + reduced motion =================
RB('@media (max-width:1279px){.lap3{right:-8px}}','@media (prefers-reduced-motion',
'''@media (min-width:900px) and (max-width:1279px){.photo .phone{right:-16px}.hstep.even .photo .phone{left:-16px}.lap3{right:-8px}.c-keys{left:16px;top:16px}}
@media (max-width:899px){
  .photo{height:auto;aspect-ratio:5/4;justify-self:stretch;max-width:none;margin-bottom:190px}
  .photo .phone{transform:scale(.6);right:-4px;bottom:-170px}
  .hstep.even .photo .phone{left:-4px;transform:scale(.68);bottom:-200px}
  .hstep.even .photo{margin-bottom:220px}
  .callout{transform:scale(.82);transform-origin:top left;left:12px;top:12px}
  .hstep:last-child .photo{aspect-ratio:auto;height:auto;margin-bottom:0}
  .hstep:last-child .photo>img{aspect-ratio:5/4;height:auto}
  .lap3{position:relative;right:auto;bottom:auto;width:auto;margin:-80px 20px 0;filter:drop-shadow(0 20px 30px rgba(0,0,0,.3))}
  .lap3 .lid{background:none;padding:0}
  .lap3 .lid:before,.lap3 .base{display:none}
  .ls{height:auto;border-radius:14px;font-size:12.5px;padding:14px 14px 210px;border:1px solid var(--line)}
  .ls .rh{font-size:13px}
  .ls .cc b{font-size:10px}
  .ls .cc .cp{font-size:11px;padding:2px 8px}
  .dms{left:12px;right:12px;width:auto;bottom:12px}
  .dms .fld{font-size:10.5px}
  .steps{gap:72px}
}
@media (min-width:621px) and (max-width:899px){
  .photo{max-width:600px;justify-self:center}
  .photo .phone,.hstep.even .photo .phone{transform:scale(.72);bottom:-210px}
  .photo,.hstep.even .photo{margin-bottom:240px}
  .hstep:last-child .photo{margin-bottom:0}
}
@media (min-width:900px) and (max-width:1099px){.stat{grid-template-columns:1fr}}
p,li{text-wrap:pretty}
''')
RB('@media (prefers-reduced-motion:reduce){','</style>','''@media (prefers-reduced-motion:reduce){
  .hv .a{animation-delay:-10.8s !important;animation-play-state:paused !important}
  .s1 .a,.s2 .a{animation-delay:-11.9s !important;animation-play-state:paused !important}
  .ls .a{animation-delay:-8s !important;animation-play-state:paused !important}
  .gs .a{animation-delay:-8s !important;animation-play-state:paused !important}
  .hv .bars i,.s1 .spin,.s1 .lis .wb i,.s2 .wbar i{animation:none}
}
''')
# hero breakpoint 1000 -> 1180
R('@media (min-width:1000px){.hero .grid{grid-template-columns:minmax(0,1fr) 560px;gap:48px}.hvw{margin-top:24px}}','@media (min-width:1180px){.hero .grid{grid-template-columns:minmax(0,1fr) 560px;gap:48px}.hvw{margin-top:24px}}')
R('@media (min-width:1000px){.hero .copy{text-align:left}','@media (min-width:1180px){.hero .copy{text-align:left}')

# ================= copy fixes =================
R('<details><summary>Does it work in a loud shop?</summary><div class="ans">Yes. The tech holds the mic button and talks with the phone close, the way they would on a call, so the app hears their voice over air tools and compressors. Every note shows on the line before the story is written, and every section stays editable.</div></details>',
  '<details><summary>Does it work in a loud shop?</summary><div class="ans">The tech holds the mic button and talks with the phone close, the way they would on a call. Every note shows on the line before the story is written, so a misheard word gets fixed in seconds, and every section stays editable.</div></details>')
R('and Enhanced spells out diagnostic steps the notes clearly imply.','and Enhanced writes out the steps behind what the tech said, within strict bounds, and never adds a test, reading or part they didn\'t mention.')
R('<details><summary>Does it work with our DMS?</summary><div class="ans">TenthGear currently integrates with Auto/Mate, Tekion, CDK, Reynolds, Dealertrack, PBS, Quorum, Autosoft, DealerBuilt and Dominion, and DMS integration isn\'t required for all implementations. Each story section has a Copy button, so the tech or the warranty admin pastes complaint, cause and correction into the DMS. On Reynolds, turn on blue-screen formatting in your profile and each section gets Copy to CC Screen and Copy to M# Screen buttons.</div></details>',
  '<details><summary>Does it work with our DMS?</summary><div class="ans">Yes. Each story section has a Copy button, so the tech or the warranty admin pastes complaint, cause and correction straight into the DMS. On Reynolds, turn on blue-screen formatting in your profile and each section gets Copy to CC Screen and Copy to M# Screen buttons. TenthGear currently integrates with Auto/Mate, Tekion, CDK, Reynolds, Dealertrack, PBS, Quorum, Autosoft, DealerBuilt and Dominion, and DMS integration isn\'t required for all implementations.</div></details>\n      <details><summary>We run several stores. Does it work across all of them?</summary><div class="ans">Yes. One login covers all your stores, and you switch between them without logging out.</div></details>')
R('<p>Concern: Customer states coolant smell after driving.</p>','<p>Complaint (concern): Customer states coolant smell after driving.</p>')
open(p,'w').write(s); print('v4 patched')

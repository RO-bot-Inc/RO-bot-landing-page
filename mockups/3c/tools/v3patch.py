import re,sys
p='board/project/Main.dc.html'; s=open(p).read()
def R(o,n,cnt=1):
    global s
    c=s.count(o); assert c==cnt,(c,o[:80]); s=s.replace(o,n)
def RB(start,end,new):
    global s
    i=s.index(start); j=s.index(end,i); s=s[:i]+new+s[j:]

# ---------- hero ----------
R('<div class="kicker">AI 3C Story Writer for dealerships</div>','<div class="kicker">3C Story Writer for dealerships</div>')
R('.hvw{position:relative;width:560px;height:572px;justify-self:center}','.hvw{position:relative;width:560px;height:600px;justify-self:center}')
R('.hv .said{margin-top:12px;font-size:19px;line-height:1.45;font-weight:600;color:#fff;letter-spacing:-.005em}','.hv .said{margin-top:12px;font-size:19px;line-height:1.45;font-weight:500;color:rgba(255,255,255,.86);letter-spacing:-.005em}')
R('.hv mark{background:linear-gradient(transparent 58%,rgba(45,212,191,.38) 58%);color:inherit;padding:0 1px}','.hv mark{background:linear-gradient(transparent 58%,rgba(45,212,191,.38) 58%);color:#fff;font-weight:600;padding:0 1px}')
R('.hv .l1{animation-name:h_l1}.hv .l2{animation-name:h_l2}.hv .l3{animation-name:h_l3}.hv .l4{animation-name:h_l4}','.hv .l1{animation-name:h_l1}.hv .l2{animation-name:h_l2}.hv .l3{animation-name:h_l3}.hv .l4{animation-name:h_l4}.hv .l5{animation-name:h_l5}')
R('.hlap{position:absolute;left:20px;top:184px;','.hlap{position:absolute;left:20px;top:206px;')
R('''@keyframes h_l1{0%,3%{clip-path:inset(0 100% 0 0)}9%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l2{0%,9%{clip-path:inset(0 100% 0 0)}16%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l3{0%,16%{clip-path:inset(0 100% 0 0)}21%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l4{0%,21%{clip-path:inset(0 100% 0 0)}27%,100%{clip-path:inset(0 0 0 0)}}''','''@keyframes h_l1{0%,3%{clip-path:inset(0 100% 0 0)}8%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l2{0%,8%{clip-path:inset(0 100% 0 0)}14%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l3{0%,14%{clip-path:inset(0 100% 0 0)}18.5%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l4{0%,18.5%{clip-path:inset(0 100% 0 0)}23%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_l5{0%,23%{clip-path:inset(0 100% 0 0)}27%,100%{clip-path:inset(0 0 0 0)}}
@keyframes h_m1{0%,3%{opacity:0}7%,100%{opacity:1}}
@keyframes h_m2{0%,8%{opacity:0}12%,100%{opacity:1}}
@keyframes h_m3{0%,14%{opacity:0}18%,100%{opacity:1}}
@keyframes h_m4{0%,18.5%{opacity:0}22.5%,100%{opacity:1}}
@keyframes h_m5{0%,23%{opacity:0}27%,100%{opacity:1}}''')
R('''  .hv .said{font-size:16.5px}
  .hv .said span{white-space:normal}''','''  .hv .said{font-size:16.5px}
  .hv .said span{display:inline;white-space:normal}
  .hv .l1{animation-name:h_m1}.hv .l2{animation-name:h_m2}.hv .l3{animation-name:h_m3}.hv .l4{animation-name:h_m4}.hv .l5{animation-name:h_m5}''')
R('''            <span class="l4 a">New pump and gasket, refilled and bled. <mark>Holds 16, road tested.</mark></span>''','''            <span class="l4 a">New pump and gasket, refilled and bled. </span>
            <span class="l5 a"><mark>Holds 16, road tested, no leaks.</mark></span>''')
R('''<span class="l1 a">Verified the smell. Reservoir's low.</span>''','''<span class="l1 a">Verified the smell. Reservoir's low. </span>''')
R('''<span class="l2 a">Pressure tested at 16. <mark>Pump's dripping at the weep hole</mark>,</span>''','''<span class="l2 a">Pressure tested at 16. <mark>Pump's dripping at the weep hole</mark>, </span>''')
R('''<span class="l3 a">coolant down the block. <mark>Seal's gone.</mark></span>''','''<span class="l3 a">coolant down the block. <mark>Seal's gone.</mark> </span>''')
R('@media (min-width:1000px){.hero .grid{grid-template-columns:minmax(0,1fr) 560px;gap:48px}}','@media (min-width:1000px){.hero .grid{grid-template-columns:minmax(0,1fr) 560px;gap:48px}.hvw{margin-top:24px}}')

# ---------- problem ----------
R('so stories come out thin: "found pump leaking, replaced pump."','so stories come out thin: "pump leaking, replaced pump."')
R('<div class="stat"><div class="n">12%</div>','<div class="stat"><div class="n"><small class="ghost">x</small>12%</div>')
R('.stat .n small{display:block;font-size:13px;font-weight:700;letter-spacing:0;color:var(--text-2);margin-bottom:4px}','.stat .n small{display:block;font-size:13px;font-weight:700;letter-spacing:0;color:var(--text-2);margin-bottom:4px}\n.stat .n small.ghost{visibility:hidden}')

# ---------- how lede ----------
R('TenthGear writes cause and correction from their words, using the complaint already on the RO, and grades the story before it goes on the claim.</p>','TenthGear writes cause and correction from their words, using the complaint already on the RO, and grades the story against the six things a warranty reviewer checks.</p>')

# ---------- step 1 ----------
R('''<p class="fine">Shop talk is fine. "Pump's dripping from the weep hole" is all it needs.</p>''','''<p class="fine">Shop talk is fine. "Pump's dripping at the weep hole" works as is.</p>''')
R('<div class="bub">Verified the smell. Coolant is low in the reservoir.</div>','<div class="bub">Verified the smell. Reservoir\'s low.</div>')
R("<div class=\"bub\">Pressure tested at 16 psi. Pump dripping from the weep hole, coolant down the block. Seal's gone.</div>","<div class=\"bub\">Pressure tested at 16. Pump's dripping at the weep hole, coolant down the block. Seal's gone.</div>")
R('<div class="bub">Replaced pump and gasket. Refilled and bled. Holds 16 psi. Road tested, no leaks.</div>','<div class="bub">New pump and gasket, refilled and bled. Holds 16, road tested, no leaks.</div>')
R('.s1 .np{margin:10px 10px 0;border:2px solid var(--app-teal);border-radius:14px;padding:10px 10px 12px;animation-name:s1_wrap}','.s1 .np{margin:10px 10px 0;border:2px solid var(--app-teal);border-radius:14px;padding:10px 10px 12px}\n.s1 .scr{animation:s1_wrap 13s infinite both}')
for n,a,b in [('n1','23%','25.5%'),('n2','50%','52.5%'),('n3','77%','79.5%')]:
    R(f'@keyframes s1_{n}{{0%,{a}{{opacity:0;max-height:0;margin-top:0}}{b},100%{{opacity:1;max-height:80px;margin-top:8px}}}}',
      f'@keyframes s1_{n}{{0%,{a}{{opacity:0;max-height:0;margin-top:0}}{b},93%{{opacity:1;max-height:80px;margin-top:8px}}97%,100%{{opacity:0;max-height:0;margin-top:0}}}}')
R('@keyframes s1_c1{0%,23.5%{opacity:1}24%,100%{opacity:0}}','@keyframes s1_c1{0%,23.5%{opacity:1}24%,96.5%{opacity:0}97%,100%{opacity:1}}')
R('@keyframes s1_c4{0%,77.5%{opacity:0}78%,100%{opacity:1}}','@keyframes s1_c4{0%,77.5%{opacity:0}78%,96.5%{opacity:1}97%,100%{opacity:0}}')
R('@keyframes s1_wrap{0%{opacity:0}3%,94%{opacity:1}98%,100%{opacity:0}}','@keyframes s1_wrap{0%,100%{opacity:1}}')
R('.s1 .scr{animation:s1_wrap 13s infinite both}','')

# ---------- step 2: Guide me, rebuilt bottom-anchored ----------
S2CSS='''/* step 2: Guide me (bottom-anchored thread, like the app) */
.s2 .scr{background:#f3f4f6;display:flex;flex-direction:column}
.s2 .gh{position:relative;z-index:2;flex-shrink:0;background:var(--app-navy);color:#fff;padding:24px 14px 12px;display:flex;align-items:flex-start;gap:8px}
.s2 .gh b{display:block;font-size:14px}
.s2 .gh .prog{position:relative;height:16px;font-size:11.5px;color:#cbd5e1;margin-top:2px;width:110px}
.s2 .gh .prog span{position:absolute;left:0;top:0;white-space:nowrap}
.s2 .p5{animation-name:s2_p5}.s2 .p6{animation-name:s2_p6}
.s2 .gh .mini{margin-left:auto;background:var(--ws);border-radius:8px;font-size:11px;font-weight:700;padding:6px 9px;white-space:nowrap}
.s2 .gh .x{font-size:16px;line-height:1;color:#cbd5e1;padding:4px 2px}
.s2 .th{flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;padding:0 12px 14px;animation-name:s2_wrap}
.s2 .th>*{flex-shrink:0;margin-top:9px}
.s2 .q,.s2 .ans,.s2 .td{font-size:12.5px;line-height:1.35;padding:8px 11px;max-width:208px;overflow:hidden}
.s2 .q,.s2 .td{align-self:flex-start;background:#fff;border:1px solid #e5e7eb;border-radius:16px 16px 16px 4px}
.s2 .q.cmp{color:#374151}
.s2 .ans{align-self:flex-end;background:var(--sky);border-radius:16px 16px 4px 16px}
.s2 .td{display:flex;gap:4px;padding:11px 12px}
.s2 .td i{width:6px;height:6px;border-radius:50%;background:#9ca3af;animation:bob 1s ease-in-out infinite}
.s2 .td i:nth-child(2){animation-delay:.15s}.s2 .td i:nth-child(3){animation-delay:.3s}
@keyframes bob{0%,100%{transform:translateY(0)}40%{transform:translateY(-3px)}}
.s2 .ch{display:flex;flex-wrap:wrap;gap:6px;overflow:hidden}
.s2 .ch span{position:relative;height:32px;border-radius:20px;border:1.5px solid var(--app-teal);color:#0f766e;font-weight:600;font-size:12px;display:inline-flex;align-items:center;padding:0 12px;background:#fff}
.s2 .ch span.g{border-color:#d1d5db;color:#6b7280}
.s2 .tap{position:absolute;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:rgba(13,148,136,.35);opacity:0;animation-duration:13s;animation-iteration-count:infinite}
.s2 .q1{animation-name:s2_q1}.s2 .ch1{animation-name:s2_ch1}.s2 .ch1 .t1{animation-name:s2_t1}.s2 .ch1 .tap{animation-name:s2_tap1}
.s2 .a1{animation-name:s2_a1}.s2 .td1{animation-name:s2_td1}.s2 .q2{animation-name:s2_q2}
.s2 .ch2{animation-name:s2_ch2}.s2 .ch2 .t2{animation-name:s2_t2}.s2 .ch2 .tap{animation-name:s2_tap2}
.s2 .a2{animation-name:s2_a2}.s2 .td2{animation-name:s2_td2}.s2 .q3{max-width:222px;animation-name:s2_q3}
.s2 .endws{height:42px;border-radius:12px;background:var(--ws);color:#fff;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;overflow:hidden;animation-name:s2_end}
.s2 .add{align-self:flex-start;height:32px;border-radius:18px;border:1.5px solid #d1d5db;color:#6b7280;font-weight:600;font-size:12px;display:flex;align-items:center;padding:0 12px;background:#fff;overflow:hidden;animation-name:s2_end}
.s2 .vc{background:#fff;border:1.5px solid var(--app-teal);border-radius:14px;overflow:hidden;animation-name:s2_vc}
.s2 .vc .top{display:flex;align-items:center;gap:10px;padding:11px 10px 6px}
.s2 .vc .micb{position:relative;width:34px;height:34px;flex-shrink:0}
.s2 .vc .micb>span{position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;justify-content:center}
.s2 .vc .micb .on{background:var(--app-teal);animation-name:s2_on}
.s2 .vc .micb .off{background:var(--app-navy);animation-name:s2_off}
.s2 .vc .micb svg{position:relative;width:16px;height:16px}
.s2 .vc .micb .off svg{animation-name:s2_th}
.s2 .vc .micb .wsp{position:absolute;width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:spin .8s linear infinite}
.s2 .vc .micb .wsw{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;animation-name:s2_tg}
.s2 .vc .ping{position:absolute;inset:-4px;border-radius:50%;background:rgba(13,148,136,.3);animation:ping 1.2s ease-out infinite}
@keyframes ping{0%{transform:scale(.8);opacity:.8}100%{transform:scale(1.35);opacity:0}}
.s2 .vc .micb .tap{animation-name:s2_tapm}
.s2 .vc .ttl{position:relative;height:30px;flex:1}
.s2 .vc .ttl div{position:absolute;left:0;top:0}
.s2 .vc .ttl b{display:block;font-size:13.5px}
.s2 .vc .ttl small{display:block;font-size:10.5px;color:#4b5563}
.s2 .vc .t-l{animation-name:s2_tl}.s2 .vc .t-g{animation-name:s2_tg}.s2 .vc .t-h{animation-name:s2_th}
.s2 .vc .heard{min-height:22px;padding:0 10px 6px;font-size:15px;font-weight:600;animation-name:s2_heard}
.s2 .vc .pills{display:flex;gap:6px;padding:0 10px 10px}
.s2 .vc .pg,.s2 .vc .pd{height:30px;border-radius:16px;font-size:12px;display:inline-flex;align-items:center;padding:0 12px}
.s2 .vc .pg{border:1.5px solid #9ca3af;color:#374151;background:#fff}
.s2 .vc .again{animation-name:s2_th}
.s2 .vc .foot{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e5e7eb;padding:8px 10px}
.s2 .vc .pd{position:relative;background:var(--app-navy);color:#fff;font-weight:600;padding:0 18px;animation-name:s2_dn}
.s2 .vc .pd .tap{animation-name:s2_tap3}
@keyframes s2_wrap{0%{opacity:0}3%,94%{opacity:1}98%,100%{opacity:0}}
@keyframes s2_q1{0%,3%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0;border-width:0}6%,100%{opacity:1;max-height:60px;margin-top:9px}}
@keyframes s2_ch1{0%,7%{opacity:0;max-height:0;margin-top:0}10%,21%{opacity:1;max-height:80px;margin-top:9px}24%,100%{opacity:0;max-height:0;margin-top:0}}
@keyframes s2_t1{0%,17%{background:#fff;color:#0f766e}18%,100%{background:var(--app-teal);color:#fff}}
@keyframes s2_tap1{0%,16.5%{opacity:0;transform:scale(.3)}17%{opacity:1;transform:scale(.6)}20%,100%{opacity:0;transform:scale(2.2)}}
@keyframes s2_a1{0%,22%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0}24.5%,100%{opacity:1;max-height:60px;margin-top:9px}}
@keyframes s2_td1{0%,25%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0;border-width:0}26.5%,28.5%{opacity:1;max-height:40px;margin-top:9px}30%,100%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0;border-width:0}}
@keyframes s2_q2{0%,29.5%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0;border-width:0}32%,100%{opacity:1;max-height:60px;margin-top:9px}}
@keyframes s2_ch2{0%,33%{opacity:0;max-height:0;margin-top:0}36%,42%{opacity:1;max-height:80px;margin-top:9px}44.5%,100%{opacity:0;max-height:0;margin-top:0}}
@keyframes s2_t2{0%,40%{background:#fff;color:#0f766e}41%,100%{background:var(--app-teal);color:#fff}}
@keyframes s2_tap2{0%,39.5%{opacity:0;transform:scale(.3)}40%{opacity:1;transform:scale(.6)}43%,100%{opacity:0;transform:scale(2.2)}}
@keyframes s2_vc{0%,43%{opacity:0;max-height:0;margin-top:0;border-width:0}46%,63%{opacity:1;max-height:220px;margin-top:9px;border-width:1.5px}66%,100%{opacity:0;max-height:0;margin-top:0;border-width:0}}
@keyframes s2_on{0%,52%{opacity:1}53%,100%{opacity:0}}
@keyframes s2_off{0%,52%{opacity:0}53%,100%{opacity:1}}
@keyframes s2_tapm{0%,51.5%{opacity:0;transform:scale(.3)}52%{opacity:1;transform:scale(.6)}55%,100%{opacity:0;transform:scale(2.2)}}
@keyframes s2_tl{0%,52%{opacity:1}53%,100%{opacity:0}}
@keyframes s2_tg{0%,52%{opacity:0}53%,55.5%{opacity:1}56%,100%{opacity:0}}
@keyframes s2_th{0%,55.5%{opacity:0}56%,100%{opacity:1}}
@keyframes s2_heard{0%,55.5%{opacity:0;clip-path:inset(0 100% 0 0)}56%{opacity:1}58%,100%{opacity:1;clip-path:inset(0 0 0 0)}}
@keyframes s2_dn{0%,55.5%{background:#d1d5db;color:#6b7280}56%,100%{background:var(--app-navy);color:#fff}}
@keyframes s2_tap3{0%,59.5%{opacity:0;transform:scale(.3)}60%{opacity:1;transform:scale(.6)}63%,100%{opacity:0;transform:scale(2.4)}}
@keyframes s2_a2{0%,65%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0}67.5%,100%{opacity:1;max-height:60px;margin-top:9px}}
@keyframes s2_p5{0%,68%{opacity:1}69%,100%{opacity:0}}
@keyframes s2_p6{0%,68%{opacity:0}69%,100%{opacity:1}}
@keyframes s2_td2{0%,68%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0;border-width:0}69.5%,71.5%{opacity:1;max-height:40px;margin-top:9px}73%,100%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0;border-width:0}}
@keyframes s2_q3{0%,72.5%{opacity:0;max-height:0;margin-top:0;padding-top:0;padding-bottom:0;border-width:0}75.5%,100%{opacity:1;max-height:60px;margin-top:9px}}
@keyframes s2_end{0%,77%{opacity:0;max-height:0;margin-top:0;border-width:0}80%,100%{opacity:1;max-height:44px;margin-top:9px}}

'''
RB('/* step 2: Guide me */','/* step 3: laptop',S2CSS)
S2HTML='''<div class="phone s2"><div class="scr">
            <div class="gh"><div><b>Coolant smell</b><div class="prog"><span class="p5 a">5 of 6 covered</span><span class="p6 a">6 of 6 covered</span></div></div><span class="mini">Write Story</span><span class="x">✕</span></div>
            <div class="th a">
              <div class="q cmp">Complaint: Customer states coolant smell after driving.</div>
              <div class="q q1 a">How did you find the leak?</div>
              <div class="ch ch1 a"><span class="t1 a">Pressure tested the system<i class="tap a"></i></span><span>UV dye</span><span>Visual inspection</span><span class="g">Something else</span><span class="g">Skip</span></div>
              <div class="ans a1 a">Pressure tested the system</div>
              <div class="td td1 a"><i></i><i></i><i></i></div>
              <div class="q q2 a">What pressure did you test at?</div>
              <div class="ch ch2 a"><span class="t2 a">Say the reading<i class="tap a"></i></span><span class="g">Something else</span><span class="g">Skip</span></div>
              <div class="vc a">
                <div class="top"><span class="micb"><span class="on a"><i class="ping"></i><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path></svg></span><span class="off a"><span class="wsw a"><i class="wsp"></i></span><svg class="a" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0M12 18v3"></path></svg></span><i class="tap a"></i></span>
                  <div class="ttl"><div class="t-l a"><b>Listening…</b><small>Tap the mic when you are done</small></div><div class="t-g a"><b>Getting your words…</b></div><div class="t-h a"><b>Heard</b></div></div></div>
                <div class="heard a">16 psi</div>
                <div class="pills"><span class="pg again a">Try again</span><span class="pg">Type it</span></div>
                <div class="foot"><span class="pg">Cancel</span><span class="pd a">Done<i class="tap a"></i></span></div>
              </div>
              <div class="ans a2 a">16 psi</div>
              <div class="td td2 a"><i></i><i></i><i></i></div>
              <div class="q q3 a">That covers everything the story needs. Anything to add?</div>
              <div class="endws a">Write Story</div>
              <div class="add a">Add something</div>
            </div>
          </div></div>'''
RB('<div class="phone s2"><div class="scr">','\n        </div>\n      </div>\n\n      <div class="hstep">',S2HTML)
R('<p class="fine">It never guesses a code, a reading or a part number. The tech says it, or it comes from the notes or a scan-tool photo. On phones, for diagnostic warranty lines.</p>',
  '<p class="fine">Here the notes covered the leak and the repair but not the test, so Guide me asks for it. It never guesses a code, a reading or a part number: the tech says it, or it comes from the notes or a scan-tool photo. On phones, for diagnostic warranty lines.</p>')

# ---------- step 3 ----------
R('<h3>The story writes itself, and grades itself</h3>','<h3>One tap. Written and graded.</h3>')
R('.lap3{position:absolute;right:-48px;bottom:-72px;','.lap3{position:absolute;right:-20px;bottom:-72px;')
R('.ls .cc b{display:block;background:#2563eb;color:#fff;text-align:center;font-size:8px;letter-spacing:.08em;padding:3px 0}','.ls .cc b{display:block;background:#2563eb;color:#fff;text-align:left;font-size:8px;letter-spacing:.08em;padding:3px 7px}')
R('.ls .cc:not(.full) p{min-height:84px}','.ls .cc:not(.full) p{min-height:96px}\n.ls{height:280px}')
R('.ls .gc{background:#fff;border:1px solid #fde68a;border-radius:6px;overflow:hidden;align-self:start;animation-name:l_wrap}','.ls .gc{background:#fff;border:1px solid #fde68a;border-radius:6px;overflow:hidden;align-self:start;animation-name:l_gc}')
R('.ls .t1{animation-name:l_t1}.ls .t2{animation-name:l_t2}.ls .t3{animation-name:l_t3}','.ls .t2{animation-name:l_t2}.ls .t3{animation-name:l_t3}')
R('''@keyframes l_t2{0%,10%{clip-path:inset(0 0 100% 0)}22%,100%{clip-path:inset(0 0 0 0)}}
@keyframes l_t3{0%,22%{clip-path:inset(0 0 100% 0)}33%,100%{clip-path:inset(0 0 0 0)}}''','''@keyframes l_t2{0%,4%{clip-path:inset(0 0 100% 0)}17%,100%{clip-path:inset(0 0 0 0)}}
@keyframes l_t3{0%,17%{clip-path:inset(0 0 100% 0)}28%,100%{clip-path:inset(0 0 0 0)}}
@keyframes l_gc{0%,31%{opacity:0;transform:translateY(4px)}34%,92%{opacity:1;transform:none}97%,100%{opacity:0;transform:none}}''')
R('<p class="t1 a">Customer states coolant smell after driving.</p>','<p>Customer states coolant smell after driving.</p>')
R('<p class="t2 a">Verified concern. Coolant low in reservoir. Pressure tested at 16 psi, water pump dripping from weep hole, coolant trailing down block. Failed pump seal.</p>',
  '<p class="t2 a">Verified concern. Coolant low in reservoir. Pressure tested cooling system at 16 psi and found the water pump dripping from the weep hole, with coolant trailing down the block. Failed water pump seal.</p>')
R('<p class="t3 a">Replaced water pump and gasket. Refilled and bled. System holds 16 psi. Road tested, no leaks.</p>',
  '<p class="t3 a">Replaced water pump and gasket. Refilled and bled cooling system. System holds 16 psi. Road tested, no leaks.</p>')

# ---------- before / after ----------
R('<div class="typed">CUST STATES COOLANT SMELL.<br>FOUND WATER PUMP LEAKING.<br>REPLACED WATER PUMP.</div>','<div class="typed">CUST STATES COOLANT SMELL.<br>WATER PUMP LEAKING.<br>REPLACED WATER PUMP.</div>')
R('.sc{background:#fff;border:1px solid var(--line);border-top:3px solid var(--mid);border-radius:20px;padding:24px;display:flex;flex-direction:column}\n.sc.good{border-top-color:var(--teal)}',
  '.sc{position:relative;overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:20px;padding:27px 24px 24px;display:flex;flex-direction:column}\n.sc:before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--mid)}\n.sc.good:before{background:var(--teal)}\n.sc .ccc mark{background:linear-gradient(transparent 60%,rgba(20,184,166,.24) 60%);color:inherit;padding:0 1px}')
R('<div><b>CAUSE</b><p>Verified concern. Coolant low in reservoir. Pressure tested cooling system at 16 psi and found the water pump dripping from the weep hole, with coolant trailing down the block. Failed water pump seal.</p></div>\n          <div><b>CORRECTION</b><p>Replaced water pump and gasket. Refilled and bled cooling system. System holds 16 psi. Road tested, no leaks.</p></div>\n        </div>\n        <div class="gstrip"><div><span class="gl A">',
  '<div><b>CAUSE</b><p><mark>Verified concern.</mark> Coolant low in reservoir. <mark>Pressure tested cooling system at 16 psi</mark> and found the water pump dripping from the weep hole, with coolant trailing down the block. <mark>Failed water pump seal.</mark></p></div>\n          <div><b>CORRECTION</b><p>Replaced water pump and gasket. Refilled and bled cooling system. <mark>System holds 16 psi. Road tested, no leaks.</mark></p></div>\n        </div>\n        <div class="gstrip"><div><span class="gl A">')
R('<p class="fine">Example job and grades, for illustration. A dash means the grader found nothing for that criterion, and it counts as zero in the overall grade.</p>',
  '<p class="fine">Example job and grades, for illustration. A dash means the grader found nothing for that criterion, and it counts as zero in the overall grade.</p>\n    <a class="chk" href="#top">Already have a story written? Paste it into the free Warranty Story Checker and see how it grades →</a>')
R('.ba .fine{font-size:13px;color:var(--text-2);margin-top:16px}','.ba .fine{font-size:13px;color:var(--text-2);margin-top:16px}\n.ba .chk{display:inline-block;margin-top:20px;font-weight:600;color:var(--teal);font-size:16px}')

# ---------- grader ----------
R('.grader{background:var(--navy);color:#fff}','.grader{background:var(--navy);color:#fff;position:relative;overflow:clip}')
R('.gcard{margin-top:14px;background:#fff;color:#0f172a;border-radius:18px;overflow:hidden;box-shadow:0 40px 80px -30px rgba(0,0,0,.8)}','.gcard{margin-top:14px;background:#fff;color:#0f172a;border-radius:18px;overflow:hidden;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}')
R('.gcard .gtop small{display:block;font-size:12px;color:#92400e;font-weight:600}','.gcard .gtop small{display:block;font-size:12px;color:#64748b;font-weight:600}')
R('.gs .ed b{display:block;background:#2563eb;','.gs .ed b{display:block;background:#2563eb;')
R('.gcard .fv .sw{position:relative;display:block;min-height:36px}','.gcard .fv .sw{display:grid}')
R('.gcard .fv .sw small{position:absolute;left:0;right:0;top:0}','.gcard .fv .sw small{grid-area:1/1}')
R('.gs .ed .add{display:block;width:max-content;max-width:100%;background:#eff6ff;border-radius:3px;animation-name:g_type}','.gs .ed .add{display:block;width:max-content;max-width:100%;background:#eff6ff;border-radius:3px;animation-name:g_type}\n@media (max-width:620px){.gs .ed .add{animation-name:g_type2}}\n@keyframes g_type2{0%,18%{clip-path:inset(0 0 100% 0)}30%,100%{clip-path:inset(0 0 0 0)}}')
for o,n in [
 ('@keyframes g_bB{0%,62%{opacity:1}63%,100%{opacity:0}}','@keyframes g_bB{0%,49%{opacity:1}50%,100%{opacity:0}}'),
 ('@keyframes g_bA{0%,63%{opacity:0;transform:scale(.6)}66%,100%{opacity:1;transform:none}}','@keyframes g_bA{0%,50%{opacity:0;transform:scale(.6)}53%,100%{opacity:1;transform:none}}'),
 ('@keyframes g_m{0%,62%{opacity:1}63%,100%{opacity:0}}','@keyframes g_m{0%,49%{opacity:1}50%,100%{opacity:0}}'),
 ('@keyframes g_A{0%,62%{opacity:0;transform:scale(.4)}65%,100%{opacity:1;transform:none}}','@keyframes g_A{0%,49%{opacity:0;transform:scale(.4)}52%,100%{opacity:1;transform:none}}'),
 ('@keyframes g_sug{0%,61%{opacity:1}63%,100%{opacity:0}}','@keyframes g_sug{0%,48%{opacity:1}50%,100%{opacity:0}}'),
 ('@keyframes g_dsc{0%,63%{opacity:0}66%,100%{opacity:1}}','@keyframes g_dsc{0%,50%{opacity:0}53%,100%{opacity:1}}'),
 ('@keyframes g_row{0%,8%{background:transparent}12%,61%{background:#fff7ed}65%,100%{background:transparent}}','@keyframes g_row{0%,8%{background:transparent}12%,48%{background:#fff7ed}52%,100%{background:transparent}}'),
 ('@keyframes g_rg{0%,31%{opacity:0;transform:scale(.9)}34%,64%{opacity:1;transform:none}68%,100%{opacity:0;transform:scale(.95)}}','@keyframes g_rg{0%,31%{opacity:0;transform:scale(.9)}34%,51%{opacity:1;transform:none}55%,100%{opacity:0;transform:scale(.95)}}'),
 ('@keyframes g_tap{0%,55%{opacity:0;transform:scale(.3)}56%{opacity:1;transform:scale(.6)}60%,100%{opacity:0;transform:scale(2.2)}}','@keyframes g_tap{0%,42%{opacity:0;transform:scale(.3)}43%{opacity:1;transform:scale(.6)}47%,100%{opacity:0;transform:scale(2.2)}}')]:
    R(o,n)
R('<p class="fine">Six criteria apply to diagnostic warranty work. Customer-pay stories are graded on five, and scheduled maintenance on four.</p>','<p class="fine">Six criteria apply to diagnostic warranty work. Customer-pay stories are graded on five, and warranty scheduled maintenance on four.</p>')

# ---------- reduced motion + phones ----------
R('.gs .a{animation-delay:-4.5s !important;animation-play-state:paused !important}','.gs .a{animation-delay:-8s !important;animation-play-state:paused !important}')
R('.hv .bars i,.s2 .vc .ping,.s1 .spin{animation:none}','.hv .bars i,.s2 .vc .ping,.s1 .spin,.s2 .td i,.s2 .wsp{animation:none}')
R('''  .lap3{transform:scale(.7);transform-origin:bottom right;right:12px;bottom:-120px}
  .hstep:last-child .photo{margin-bottom:140px}''','''  .hstep.even .photo .phone{transform:scale(.68);bottom:-200px}
  .hstep.even .photo{margin-bottom:220px}
  .hstep:last-child .photo{aspect-ratio:auto;height:auto;margin-bottom:0}
  .hstep:last-child .photo>img{aspect-ratio:5/4;height:auto}
  .lap3{position:relative;right:auto;bottom:auto;width:auto;margin:-72px 10px 0;filter:drop-shadow(0 20px 30px rgba(0,0,0,.3))}
  .lap3 .lid{background:none;padding:0}
  .lap3 .lid:before,.lap3 .base{display:none}
  .ls{height:auto;grid-template-columns:minmax(0,1fr);border-radius:14px;font-size:12.5px;padding:14px;border:1px solid var(--line)}
  .ls .rh{font-size:13px}.ls .rh span{font-size:11px}
  .ls .cards{grid-template-columns:minmax(0,1fr)}
  .ls .cc b{font-size:10px;padding:4px 10px}
  .ls .cc p,.ls .cc:not(.full) p{font-size:13px;min-height:0;padding:7px 10px 30px}
  .ls .cc .cp{font-size:11px;padding:2px 8px}
  .ls .gc .gh2{font-size:13px;padding:8px 10px}.ls .gc .gh2 b{font-size:22px}
  .ls .gc .gr{font-size:12px;padding:5px 10px}.ls .gc .gr i{width:20px;height:16px;font-size:10px}''')
R('@media (max-width:899px){\n  .photo{','@media (max-width:1279px){.lap3{right:-8px}}\n@media (max-width:899px){\n  .photo{')

# ---------- why tiles / FAQ ----------
FAQ='''<div class="list">
      <details open=""><summary>What is a 3C story?</summary><div class="ans">A 3C story, also called the 3Cs, is the write-up a technician adds to each repair line: the concern (what the customer reported, also called the complaint), the cause (what the tech found and how they confirmed it) and the correction (what was repaired or replaced, and how the fix was verified). Warranty administrators submit it with the claim, and the manufacturer uses it to decide whether to pay.</div></details>
      <details><summary>Complaint or concern: which is it?</summary><div class="ans">Both mean the same thing. Some automakers say complaint, some say concern. TenthGear labels the sections complaint, cause and correction.</div></details>
      <details><summary>What does a good 3C story look like?</summary><div class="ans"><p>Concern: Customer states coolant smell after driving.</p><p>Cause: Verified concern. Coolant low in reservoir. Pressure tested cooling system at 16 psi and found the water pump dripping from the weep hole, with coolant trailing down the block. Failed water pump seal.</p><p>Correction: Replaced water pump and gasket. Refilled and bled cooling system. System holds 16 psi. Road tested, no leaks.</p></div></details>
      <details><summary>What does a warranty reviewer look for in a 3C story?</summary><div class="ans">A reviewer wants to see that the concern was verified, how it was diagnosed, the specific part, the root cause, the repair, and proof the repair worked. For diagnostic warranty work, TenthGear's grader checks for exactly those six things.</div></details>
      <details><summary>Does the AI make anything up?</summary><div class="ans">It writes only from the tech's notes and the complaint already on the RO. Each line can be set to one of three modes: Strict states only what the tech said, Standard (the default) adds professional phrasing without adding claims, and Enhanced spells out diagnostic steps the notes clearly imply. Guide me never guesses a fault code, reading or part number. Every section stays editable before it's copied.</div></details>
      <details><summary>How is a story graded?</summary><div class="ans">Each criterion gets a letter grade, and the story gets an overall grade. A missing item shows as a dash with a suggestion for what to add. The tech adds it, taps Re-Grade, and the grade updates.</div></details>
      <details><summary>What is Guide me?</summary><div class="ans">On a phone, a diagnostic warranty line has a Guide me button beside Write Story. It checks the notes first, then asks one short question at a time about what's missing, with answers to tap, or the tech can say or type their own. Each answer is saved as a story note, and when the six warranty criteria are covered, Write Story runs as usual.</div></details>
      <details><summary>How much time does it save?</summary><div class="ans">AI Story Writer alone saves about 7 minutes per repair order. Pilot shops report saving 30+ minutes a day on story writing.</div></details>
      <details><summary>Does it work in a loud shop?</summary><div class="ans">Yes. The tech holds the mic button and talks with the phone close, the way they would on a call, so the app hears their voice over air tools and compressors. Every note shows on the line before the story is written, and every section stays editable.</div></details>
      <details><summary>Does it write customer-pay stories too?</summary><div class="ans">Yes. Customer-pay stories are graded on five criteria, including plain language and a professional tone, because the customer reads them. Warranty scheduled maintenance lines are graded on four.</div></details>
      <details><summary>Does it work with our DMS?</summary><div class="ans">TenthGear currently integrates with Auto/Mate, Tekion, CDK, Reynolds, Dealertrack, PBS, Quorum, Autosoft, DealerBuilt and Dominion, and DMS integration isn't required for all implementations. Each story section has a Copy button, so the tech or the warranty admin pastes complaint, cause and correction into the DMS. On Reynolds, turn on blue-screen formatting in your profile and each section gets Copy to CC Screen and Copy to M# Screen buttons.</div></details>
      <details><summary>Why not just use ChatGPT?</summary><div class="ans">A chatbot writes from whatever is pasted in and doesn't know what a warranty reviewer checks. TenthGear writes from the tech's notes and the complaint on the RO, never adds a repair the tech didn't describe, and grades the story on six warranty criteria before it goes on the claim.</div></details>
    </div>'''
i=s.index('<div class="list">'); j=s.index('</div>\n  </div>\n</section>\n\n<section class="fns">',i); s=s[:i]+FAQ+'\n  '+s[j:]
s=s.replace('"height":8340}}','"height":8700}}')
open(p,'w').write(s); print('patched')

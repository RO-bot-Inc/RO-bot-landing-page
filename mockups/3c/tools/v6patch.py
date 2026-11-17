import re
p='board/project/Main.dc.html'; s=open(p).read()
def R(o,n):
    global s; assert s.count(o)==1,(s.count(o),o[:80]); s=s.replace(o,n)
def KF(name,body):
    global s
    m=re.search(r'@keyframes '+name+r'\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}',s); assert m,name
    s=s[:m.start()]+f'@keyframes {name}{{{body}}}'+s[m.end():]
# 1 grader ring gap actually animates
gi=s.index('<div class="gtop">'); j=s.index('</svg>',gi)
assert s[gi:j].count('class="sg g6 "')==1
s=s[:gi]+s[gi:j].replace('class="sg g6 "','class="sg g6 a"')+s[j:]
# 2 phones leave the people visible on small screens
R('@media (min-width:900px) and (max-width:1099px){.stat{grid-template-columns:1fr}}','''@media (min-width:900px) and (max-width:1099px){.stat{grid-template-columns:1fr}}
@media (max-width:620px){
  .hstep:not(:last-child) .photo{aspect-ratio:4/5}
  .hstep:nth-child(1) .photo>img{object-position:100% 50% !important}
  .hstep.even .photo>img{object-position:30% 40% !important}
  .photo .c-keys{top:auto;bottom:12px;transform-origin:bottom left}
}''')
# 3 no contradiction once it is an A
R('<b>5 of 6 covered:</b> verification','<b>Already covered:</b> verification')
# 4 B+ to A overlaps instead of blinking
KF('g_bB','0%,54.5%{opacity:1}56.5%,95%{opacity:0}97%,100%{opacity:1}')
KF('g_bA','0%,54.5%{opacity:0;transform:scale(.6)}57.5%,94%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}')
KF('g_sw','0%,54.5%{opacity:1}56.5%,95%{opacity:0}97%,100%{opacity:1}')
KF('g_sok','0%,54.5%{opacity:0;transform:scale(.9)}57.5%,94%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}')
# 8 pull the fix forward: stops between 30% and 59% move 8 points earlier
def sh(m):
    v=float(m.group(1)); return (f'{v-8:g}' if 30<=v<=59 else m.group(1))+'%'
for n in ['g_vn','g_upd','g_tap','g_sug','g_dsc','g_m','g_A','g_s6','g_bB','g_bA','g_sw','g_sok','g_row']:
    m=re.search(r'@keyframes '+n+r'\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}',s); assert m,n
    s=s[:m.start()]+re.sub(r'(\d+(?:\.\d+)?)%',sh,m.group(0))+s[m.end():]
# 5 Guide me: no hole between the mic and the answer
R('.s2 .wbar{display:flex;','.s2 .h2{display:none}\n.s2 .wbar{margin-top:-35px;display:flex;')
# 6 step 3: soft fade instead of "system.…"; Write Story is there at the loop start
R('.ls .cc p{margin:1px 0 0;font-size:10.5px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
  '.ls .cc p{margin:1px 0 0;font-size:10.5px;line-height:1.45;display:block;max-height:2.9em;overflow:hidden;-webkit-mask-image:linear-gradient(#000 55%,transparent);mask-image:linear-gradient(#000 55%,transparent)}')
KF('l_wsp','0%{opacity:0;transform:translateY(-50%)}2%,6.5%{opacity:1;transform:translateY(-50%)}8%{opacity:1;transform:translateY(-50%) scale(.94)}9.5%{opacity:1;transform:translateY(-50%)}11%,100%{opacity:0;transform:translateY(-50%)}')
# 7 step 3 payoff becomes a photo callout like steps 1 and 2
R('.dms .ok{display:flex;align-items:center;gap:4px;margin:auto 8px 8px;font-family:var(--font);font-size:9.5px;font-weight:700;color:#15803d;animation-name:l_ok}',
  '.c-paste{left:24px;top:24px;animation:l_pst 10s var(--ease) infinite both}\n@keyframes l_pst{0%,70%{transform:none;box-shadow:0 18px 40px -16px rgba(0,0,0,.5)}73%{transform:scale(1.06);box-shadow:0 18px 40px -16px rgba(0,0,0,.5),0 0 0 6px rgba(45,212,191,.35)}77%,100%{transform:none;box-shadow:0 18px 40px -16px rgba(0,0,0,.5)}}')
R('\n              <span class="ok a">✓ Pasted, nothing retyped</span></div>','</div>')
R('<div class="lap3">','<div class="callout c-paste"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="4" rx="1"></rect><path d="M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"></path><path d="M9 14l2 2 4-4"></path></svg></span><span><b>0</b><small>words retyped</small></span></div>\n          <div class="lap3">')
R('  .gs .a{animation-delay:-8s !important;animation-play-state:paused !important}','  .gs .a,.c-paste{animation-delay:-8s !important;animation-play-state:paused !important}')
R('@media (min-width:900px) and (max-width:1279px){.c-cov{right:16px;top:16px}}','@media (min-width:900px) and (max-width:1279px){.c-cov{right:16px;top:16px}.c-paste{left:16px;top:16px}}')
# one "Ready to submit" style page-wide
R('.hv .rdy{font-size:12px;font-weight:700;color:#fff;background:#15803d;','.hv .rdy{font-size:12px;font-weight:700;color:#15803d;background:#dcfce7;')
open(p,'w').write(s); print('v6 ok')

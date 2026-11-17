import re
p='board/project/Main.dc.html'; s=open(p).read()
def R(o,n):
    global s; assert s.count(o)==1,(s.count(o),o[:80]); s=s.replace(o,n)
def KF(name,body):
    global s
    m=re.search(r'@keyframes '+name+r'\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}',s); assert m,name
    s=s[:m.start()]+f'@keyframes {name}{{{body}}}'+s[m.end():]
# 1. hero: laptop and ring stay put across the seam; only the changing parts reset
R('.hlap{position:absolute;left:0;top:186px;width:540px;filter:drop-shadow(0 36px 50px rgba(0,0,0,.55));animation-name:h_lap}','.hlap{position:absolute;left:0;top:186px;width:540px;filter:drop-shadow(0 36px 50px rgba(0,0,0,.55));animation:h_lap .7s var(--ease) both !important}')
R('display:flex;flex-direction:column;align-items:center;gap:10px;animation-name:h_seal}','display:flex;flex-direction:column;align-items:center;gap:10px;animation:h_seal .7s var(--ease) both !important}')
KF('h_lap','from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}')
KF('h_seal','from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}')
for i,a in enumerate([9,20,30,40,51]):
    KF(f'h_x{i+1}',f'0%,{a}%{{opacity:0;background:transparent}}{a+1.5}%{{opacity:1;background:rgba(45,212,191,.28)}}{a+7}%,94%{{opacity:1;background:transparent}}98%,100%{{opacity:0;background:transparent}}')
for i,a in enumerate([12,23,24.5,33,43,54]):
    KF(f'h_r{i+1}',f'0%,{a-1}%{{opacity:0}}{a}%,94%{{opacity:1}}98%,100%{{opacity:0}}')
KF('h_c0','0%,11.5%{opacity:1}12%,95%{opacity:0}98%,100%{opacity:1}')
KF('h_c6k','0%,53.5%{opacity:0}54%,94%{opacity:1}97%,100%{opacity:0}')
KF('h_gl','0%,55.5%{opacity:0;transform:scale(.6)}58.5%,94%{opacity:1;transform:none}97%,100%{opacity:0;transform:none}')
KF('h_rdy','0%,58%{opacity:0;transform:translateY(6px)}61%,94%{opacity:1;transform:none}97%,100%{opacity:0;transform:none}')
KF('h_done','0%,54%{opacity:0}56%,94%{opacity:1}98%,100%{opacity:0}')
KF('h_w1','0%,8%{opacity:.45}9%,94%{opacity:1}98%,100%{opacity:.45}')
# 3. Guide me: push carousel, no blank screen between cards
KF('s2_c1','0%,2%{opacity:0;transform:translateY(14px)}5%,21%{opacity:1;transform:none}25%,100%{opacity:1;transform:translateX(-112%)}')
KF('s2_c2','0%,21%{opacity:1;transform:translateX(112%)}25%,59%{opacity:1;transform:none}63%,100%{opacity:1;transform:translateX(-112%)}')
KF('s2_done','0%,59%{opacity:1;transform:translateX(112%)}63%,100%{opacity:1;transform:none}')
# 4. grader: card stays; states reset at the seam
R('.gs .gin{animation-name:g_in}','.gs .gin{animation:none}')
KF('g_sug','0%,53%{opacity:1}54.5%,94%{opacity:0}98%,100%{opacity:1}')
KF('g_dsc','0%,54.5%{opacity:0}57%,94%{opacity:1}97%,100%{opacity:0}')
KF('g_m','0%,53%{opacity:1}54%,94%{opacity:0}98%,100%{opacity:1}')
KF('g_A','0%,53.5%{opacity:0;transform:scale(.4)}57%,94%{opacity:1;transform:none}97%,100%{opacity:0;transform:none}')
KF('g_s6','0%,54%{stroke:#e2e8f0}57%,94%{stroke:#22a06b}98%,100%{stroke:#e2e8f0}')
KF('g_bB','0%,55%{opacity:1}56%,95%{opacity:0}97%,100%{opacity:1}')
KF('g_bA','0%,56%{opacity:0;transform:scale(.6)}59%,94%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}')
KF('g_sw','0%,55%{opacity:1}56%,95%{opacity:0}97%,100%{opacity:1}')
KF('g_sok','0%,56%{opacity:0;transform:scale(.9)}59%,94%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}')
KF('g_vn','0%,30%{opacity:0;transform:translateY(14px)}35%,94%{opacity:1;transform:none}98%,100%{opacity:0;transform:none}')
KF('g_row','0%,4%{border-color:#fcd9a4;background:#fff7ed;box-shadow:0 0 0 0 rgba(245,158,11,0)}9%{box-shadow:0 0 0 6px rgba(245,158,11,.18)}14%{box-shadow:0 0 0 0 rgba(245,158,11,0)}19%{box-shadow:0 0 0 6px rgba(245,158,11,.18)}24%,52%{border-color:#fcd9a4;background:#fff7ed;box-shadow:0 0 0 0 rgba(245,158,11,0)}56%,94%{border-color:#bbf7d0;background:#f0fdf4;box-shadow:none}98%,100%{border-color:#fcd9a4;background:#fff7ed;box-shadow:none}')
# 7. missing animation class on the tapped answer's check
R('<div class="opt o1 a">Pressure tested the system<span class="ck">','<div class="opt o1 a">Pressure tested the system<span class="ck a">')
# 8. Guide me coverage fades back at the seam instead of snapping
KF('s2_f5','0%,16%{background:rgba(255,255,255,.18)}17.5%,94%{background:#2DD4BF}98%,100%{background:rgba(255,255,255,.18)}')
KF('s2_f6','0%,55%{background:rgba(255,255,255,.18)}56.5%,94%{background:#2DD4BF}98%,100%{background:rgba(255,255,255,.18)}')
KF('s2_n4','0%,16%{opacity:1}17%,95%{opacity:0}97%,100%{opacity:1}')
KF('s2_n6','0%,55%{opacity:0}56%,95%{opacity:1}97%,100%{opacity:0}')
KF('s2_r5','0%,16%{opacity:0}17.5%,94%{opacity:1}98%,100%{opacity:0}')
KF('s2_r6','0%,55%{opacity:0}56.5%,94%{opacity:1}98%,100%{opacity:0}')
# 9. step 1: notes 22% apart so the finished stack holds ~2.9s
def shift(m):
    v=float(m.group(1))
    if 28<=v<55: v-=5
    elif 55<=v<92: v-=10
    return (f'{v:g}')+'%'
for name in ['s1_press','s1_ring','s1_lis','s1_proc','s1_n2','s1_n3','s1_c2','s1_c3','s1_c4','s1_ws']:
    m=re.search(r'@keyframes '+name+r'\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}',s); assert m,name
    s=s[:m.start()]+re.sub(r'(\d+(?:\.\d+)?)%',shift,m.group(0))+s[m.end():]
open(p,'w').write(s); print('ok')

# Folds the chosen device screens (1C, 2F, 3H, 4I) into the board's live Main.dc.html.
# Surgical: only the device inside each how-it-works photo card and one marked CSS block change, so Dave's copy edits stay.
# Usage (from the scratchpad layout in README.md): python3 fold-main.py <live Main.dc.html> <out Main.dc.html>
import re, sys, os, runpy
here=os.path.dirname(os.path.abspath(__file__))
ns=runpy.run_path(os.path.join(here,'build-screens.py'))
src=open(sys.argv[1]).read()

def blocks(css):
    """Split CSS into top-level blocks (rules and @-blocks)."""
    out=[]; i=0; n=len(css)
    while i<n:
        j=css.find('{',i)
        if j<0: break
        d=0; k=j
        while k<n:
            if css[k]=='{': d+=1
            elif css[k]=='}':
                d-=1
                if d==0: break
            k+=1
        out.append(css[i:k+1].strip()); i=k+1
    return out
def keep(css,drop_sel,drop_kf):
    r=[]
    for b in blocks(css):
        head=b[:b.index('{')]
        if any(x in head for x in drop_sel): continue
        if head.startswith('@keyframes') and any(head.split()[1].startswith(p) for p in drop_kf): continue
        r.append(b)
    return '\n'.join(r)
css=(keep(ns['extra'],['.sheetpage','.srow','.opts','.opt','.sheetlap','.lapwrap','.s3e','.s3f','.s3g','.s3i','.s4e','.s4f','.s4g','.s4h'],['e_','f_','g_','i_','qe_','qf_','qg_','qh_'])
     +'\n.photo .laptop.s3h{width:386px}'
     # the page's photo-card rule (.photo img) must not reach the images inside the devices
     +'\n.photo .lphoto img,.photo .vc4 .pst,.photo .dph img{width:100%;height:100%;border-radius:0;object-fit:cover}'
     +'\n.photo .rr img{width:42px;height:42px;border-radius:9px}\n')
MARK_A='/* chosen device screens: start */'; MARK_B='/* chosen device screens: end */'
st=src.index('<style>')+7; en=src.index('</style>')
style=src[st:en]
if MARK_A in style: style=style[:style.index(MARK_A)]+style[style.index(MARK_B)+len(MARK_B):]
style=style.rstrip()+'\n'+MARK_A+'\n'+css+'\n'+MARK_B+'\n'
src=src[:st]+style+src[en:]

def balanced(s,i):
    d=0; j=i
    while True:
        m=re.compile(r'<div\b|</div>').search(s,j)
        d+= -1 if m.group()=='</div>' else 1
        j=m.end()
        if d==0: return j
lap_inner=ns['s3H'][ns['s3H'].index('<div class="lscreen">')+len('<div class="lscreen">'):]
lap_inner=lap_inner[:lap_inner.rindex('</div></div><div class="base"></div></div></div>')]
devices=[ns['s1C'],ns['s2F'],
         '<div class="laptop s3h"><div class="lid"><span class="cam"></span><div class="lscreen">'+lap_inner+'</div></div><div class="base"></div></div>',
         ns['s4I']]
pos=src.index('<div class="steps4">')
for n,dev in enumerate(devices):
    i=src.index('<div class="vis photo',pos); e=balanced(src,i)
    img_end=src.index('>',src.index('<img',i))+1
    src=src[:img_end]+dev+'</div>'+src[e:]
    pos=img_end+len(dev)
open(sys.argv[2],'w').write(src); print('ok',len(src))

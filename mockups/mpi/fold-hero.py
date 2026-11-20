# Folds hero option HA into the board's live Main.dc.html: swaps the hero's phone for the HA visual and adds HA's CSS in one marked block.
# Usage: python3 fold-hero.py <live Main.dc.html> <out Main.dc.html>
import sys, os, re, runpy
here=os.path.dirname(os.path.abspath(__file__))
IN,OUT=sys.argv[1],sys.argv[2]
src=open(IN).read()
sys.argv=[sys.argv[0],sys.argv[1],os.devnull]
ns=runpy.run_path(os.path.join(here,'hero-options.py'))
pick=lambda L,pre:[x for x in L if x.startswith(pre)]
css='\n'.join(pick(ns['BASE'],'.h1 ')+pick(ns['KF'],'@keyframes h1_')+pick(ns['RULES'],'.h1 ')+pick(ns['VW'],'.h1 '))+ns['CSS1']+'\n.hv{position:relative;flex:0 0 auto}\n.hv .a{will-change:transform,opacity}\n'
A='/* hero HA: start */'; B='/* hero HA: end */'
st=src.index('<style>')+7; en=src.index('</style>'); style=src[st:en]
if A in style: style=style[:style.index(A)]+style[style.index(B)+len(B):]
src=src[:st]+style.rstrip()+'\n'+A+'\n'+css+B+'\n'+src[en:]
h=src.index('<header class="hero')
i=src.find('<div class="demo"',h); j=src.find('<div class="hv h1 ',h); hend=src.index('</header>',h)
k=i if 0<=i<hend else j
assert 0<=k<hend, 'hero visual not found'
d=0; p=k
while True:
    m=re.compile(r'<div\b|</div>').search(src,p); d+=-1 if m.group()=='</div>' else 1; p=m.end()
    if d==0: break
src=src[:k]+ns['h1']+src[p:]
open(OUT,"w").write(src); print("ok",len(src))

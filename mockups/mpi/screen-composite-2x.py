# 2x composites: base photos upscaled with Fal ESRGAN (upscale.mjs), corners measured on the 1x photos and doubled.
from comp import run
X=lambda pts:[(x*2,y*2) for x,y in pts]
B=lambda b:tuple(v*2 for v in b)
ph=lambda s:(s.min(2)>175)&(s.mean(2)>205)&((s.max(2)-s.min(2))<45)
lap=lambda s:(s.min(2)>140)&((s.max(2)-s.min(2))<35)
# step 4: top corners as approved; bottom corners from the fitted left, right and bottom edges (2026-11-16)
run('up/how4.png','stills/scr4.png',B((320,490,620,760)),ph,'stills/how4-comp2.jpg',(940,1240),X([(334,526),(430,499),(606.5,707.5),(513,750.8)]))
for v,box,seed,c in [('a',(640,300,1020,570),(840,420),[(705,323),(1003,319),(955,550),(664,494)]),
                     ('b',(540,250,1050,580),(780,400),[(564,274),(987,272),(1030,530),(585,553)]),
                     ('c',(150,370,380,530),(265,445),[(168,392),(341,380),(367,479),(199,516)])]:
    run(f'up/p3{v}.png','stills/scr3.png',B(box),lap,f'stills/how3{v}-comp2.jpg',(seed[0]*2,seed[1]*2),X(c))

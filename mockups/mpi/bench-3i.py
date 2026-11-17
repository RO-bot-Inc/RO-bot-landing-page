# Step 3 bench laptop: 3I end-state still onto the 2x-upscaled photo, corner to corner (Dave picked this over
# rows parallel to the hinge, 2026-11-16), then the same blur/darken as dim-bench.py.
# Corners traced by hand on p3new/a.jpg at 1x: TL (703.5,323) TR (1003,318) BR (955,550) BL (663,494).
# Usage (scratchpad layout): python bench-3i.py up/p3a.png stills/scr3i.png out-web.jpg
import sys, numpy as np, importlib.util, os
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
spec=importlib.util.spec_from_file_location('sc',os.path.join(os.path.dirname(os.path.abspath(__file__)),'screen-composite.py')); sc=importlib.util.module_from_spec(spec); spec.loader.exec_module(sc)
P=Image.open(sys.argv[1]).convert('RGB'); St=Image.open(sys.argv[2]).convert('RGB'); w,h=St.size
TL,TR,BR,BL=[(x*2,y*2) for x,y in [(703.5,323),(1003,318),(955,550),(663,494)]]
mask=Image.new('L',P.size,0); ImageDraw.Draw(mask).polygon([TL,TR,BR,BL],fill=255); mask=mask.filter(ImageFilter.GaussianBlur(1.2))
Wp=St.transform(P.size,Image.PERSPECTIVE,sc.coeffs([TL,TR,BR,BL],[(0,0),(w,0),(w,h),(0,h)]),Image.BICUBIC,fillcolor=(255,255,255))
out=P.copy(); out.paste(Wp,(0,0),mask)
m=Image.new('L',out.size,0); ImageDraw.Draw(m).polygon([(x*2,y*2) for x,y in [(640,290),(1030,290),(1110,560),(1110,760),(560,760),(590,470)]],fill=255); m=m.filter(ImageFilter.GaussianBlur(50))
out=Image.composite(ImageEnhance.Brightness(out.filter(ImageFilter.GaussianBlur(6))).enhance(0.72),out,m)
out.resize((1600,round(out.height*1600/out.width)),Image.LANCZOS).save(sys.argv[3],quality=86,optimize=True,progressive=True)

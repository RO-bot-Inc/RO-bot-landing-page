# Step 3: soften the bench laptop in the 2x composite so the pop-out laptop leads. Usage: python dim-bench.py in.jpg out-web.jpg
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
im=Image.open(sys.argv[1]).convert('RGB'); m=Image.new('L',im.size,0)
ImageDraw.Draw(m).polygon([(x*2,y*2) for x,y in [(640,290),(1030,290),(1110,560),(1110,760),(560,760),(590,470)]],fill=255)
m=m.filter(ImageFilter.GaussianBlur(50))
out=Image.composite(ImageEnhance.Brightness(im.filter(ImageFilter.GaussianBlur(6))).enhance(0.72),im,m)
out.resize((1600,round(out.height*1600/out.width)),Image.LANCZOS).save(sys.argv[2],quality=86,optimize=True,progressive=True)

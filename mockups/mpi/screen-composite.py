# Composite a still of a device screen onto the blank screen in a photo (perspective warp, mask from the screen's own pixels).
import sys, numpy as np
from PIL import Image, ImageFilter
def coeffs(dst,src):
    A=[];B=[]
    for (x,y),(u,v) in zip(dst,src):
        A.append([x,y,1,0,0,0,-u*x,-u*y]); B.append(u)
        A.append([0,0,0,x,y,1,-v*x,-v*y]); B.append(v)
    return np.linalg.solve(np.array(A,float),np.array(B,float)).tolist()
def run(photo,still,box,test,out,seed,corners=None):
    P=Image.open(photo).convert('RGB'); a=np.asarray(P).astype(float)
    x0,y0,x1,y1=box
    sub=a[y0:y1,x0:x1]
    m0=test(sub); m=np.zeros_like(m0)
    from collections import deque
    sy,sx=seed[1]-y0,seed[0]-x0; q=deque([(sy,sx)]); m[sy,sx]=True
    while q:
        y,x=q.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<m.shape[0] and 0<=nx<m.shape[1] and m0[ny,nx] and not m[ny,nx]:
                m[ny,nx]=True; q.append((ny,nx))
    ys,xs=np.nonzero(m); xs=xs+x0; ys=ys+y0
    s=xs+ys; d=xs-ys
    TL=(xs[s.argmin()],ys[s.argmin()]); BR=(xs[s.argmax()],ys[s.argmax()])
    TR=(xs[d.argmax()],ys[d.argmax()]); BL=(xs[d.argmin()],ys[d.argmin()])
    if corners: TL,TR,BR,BL=corners
    print(photo.split('/')[-1],'TL',TL,'TR',TR,'BR',BR,'BL',BL)
    S=Image.open(still).convert('RGB'); w,h=S.size
    W=S.transform(P.size,Image.PERSPECTIVE,coeffs([TL,TR,BR,BL],[(0,0),(w,0),(w,h),(0,h)]),Image.BICUBIC)
    mask=np.zeros(a.shape[:2],bool); mask[y0:y1,x0:x1]=m
    M=Image.fromarray((mask*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    # keep the photo's light falloff across the screen so the UI sits in the scene, not on top of it
    lum=a.mean(2); ref=np.percentile(lum[mask],90)
    shade=np.clip(lum/ref,0.75,1.0)[...,None]
    Wa=np.asarray(W).astype(float)*(0.55+0.45*shade)
    Wi=Image.fromarray(np.clip(Wa,0,255).astype('uint8'))
    P.paste(Wi,(0,0),M); P.save(out,quality=90); return TL,TR,BR,BL
if __name__=='__main__':
    lap=lambda s:(s.min(2)>185)&((s.max(2)-s.min(2))<40)
    ph=lambda s:(s.min(2)>175)&(s.mean(2)>205)&((s.max(2)-s.min(2))<45)
    W='/private/tmp/claude-501/-Users-davidsonders-ro-bot-website/ad76a92c-2493-43d2-a59e-264c562203b8/scratchpad/mpi-design/public/images/mpi/'
    run(W+'how-3-laptop-bench.jpg','stills/scr3.png',(735,535,935,675),lap,'stills/how3-comp.jpg',(835,600),[(770,547),(923,567),(894,667),(742,635)])
    run(W+'how-4-customer-report.jpg','stills/scr4.png',(325,490,615,750),ph,'stills/how4-comp.jpg',(470,620),[(341,540),(430,498),(608,707),(513,751)])
    # step 3, unattended laptop (candidate A, 2026-11-16)
    lap2=lambda s:(s.min(2)>150)&((s.max(2)-s.min(2))<35)
    run('p3new/a.jpg','stills/scr3.png',(640,300,1020,570),lap2,'stills/how3b-comp.jpg',(840,420),[(705,323),(1002,319),(955,550),(665,490)])

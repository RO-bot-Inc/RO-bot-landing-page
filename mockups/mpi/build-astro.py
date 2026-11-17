# Converts the board's Main.dc.html into the live /mpi/ page: src/styles/mpi.css (scoped under .mpi, pruned
# to the classes the page uses) and src/data/mpi-body.html (page body, read raw by src/pages/mpi.astro).
# Usage: python3 build-astro.py <board Main.dc.html> <website repo root>
import re, sys, json, html as H
src=open(sys.argv[1]).read(); ROOT=sys.argv[2]
BLOB={'462d950e354884a47dc899b098854d21':'/images/mpi/how-3-bench-unattended-ui.jpg','b7380d12b5e1449ca4ae391600b6f0f2':'/images/mpi/how-4-customer-report-ui.jpg',
 '2cdf35438068f580d84e16a251b7f588':'/images/mpi/how-1-walk-and-talk.jpg','f797652c307da3346fed07cdcf5b2a3d':'/images/mpi/how-2-shoot-video.jpg',
 '26bfaa3e7ad07135277bc88e69d3d678':'/images/mpi/lines/brakes.jpg','cc5b525269a0a01fe966c67b64e0c76d':'/images/mpi/lines/belt.jpg',
 'e1d974f354cc73fa933e3133b56f995f':'/images/mpi/lines/tires.jpg','385351b33e1ea6cd43ce3783e6c075d9':'/images/mpi/lines/cabin.jpg'}
LOUD=("Yes. The tech presses and holds the mic and talks with the phone close, the way they would on a call, so the app hears "
      "their voice over the air tools and compressors. Every finding shows up on the report for the tech to review before it is saved, "
      "so a misheard word gets caught in the bay, not by the customer.")
# ---- body
body=src[src.index('<header class="hero'):src.index('<footer')]
for k,v in BLOB.items(): body=body.replace('/_blob/'+k,v)
assert '/_blob/' not in body, 'unmapped blob'
body=body.replace('<a class="btn" href="#top">','<a class="btn" href="/book-demo/">')
body=body.replace('<a class="more" href="#top">','<a class="more" href="/product/#3cs">')
body=body.replace('<div class="a">Answer pending.</div>','<div class="a">'+LOUD+'</div>')
body=body.replace('Our printable multi point inspection checklist lists every item.',
  'Our <a href="/blog/multi-point-inspection-checklist/">printable multi point inspection checklist</a> lists every item.')
body=re.sub(r'<!--.*?-->','',body,flags=re.S)
body=re.sub(r'\n\s*\n+','\n',body)
# alt text for the step photos (decorative device screens stay alt="")
ALT={'how-1-walk-and-talk.jpg':'A technician talks into his phone while checking a tire on a lifted truck',
     'how-2-shoot-video.jpg':'A technician records an inspection video under a vehicle',
     'how-3-bench-unattended-ui.jpg':'A laptop on a shop workbench shows the MPI report filling in while the technician works on a car',
     'how-4-customer-report-ui.jpg':'A customer reviews their inspection report on a phone at home'}
for f,a in ALT.items():
    body=re.sub(r'<img([^>]*?)src="/images/mpi/'+re.escape(f)+'"([^>]*?)>',lambda m:'<img'+re.sub(r'\salt="[^"]*"','',m.group(1))+f'src="/images/mpi/{f}" alt="{a}" loading="lazy"'+re.sub(r'\salt="[^"]*"','',m.group(2))+'>',body)
body=re.sub(r'<img((?:(?!alt=)[^>])*)>',r'<img\1 alt="">',body)
open(f'{ROOT}/src/data/mpi-body.html','w').write(body.strip()+'\n')
# ---- FAQ schema
faq=[]
for q,a in re.findall(r'<summary>(.*?)</summary><div class="a">(.*?)</div>',body,flags=re.S):
    faq.append({"@type":"Question","name":H.unescape(re.sub('<[^>]+>','',q)).strip(),"acceptedAnswer":{"@type":"Answer","text":H.unescape(re.sub('<[^>]+>','',a)).replace('\xa0',' ').strip()}})
json.dump({"@context":"https://schema.org","@type":"FAQPage","mainEntity":faq},open(f'{ROOT}/src/data/mpi-faq.json','w'),indent=1)
# ---- CSS: scope under .mpi, drop rules for classes the page doesn't use
css=src[src.index('<style>')+7:src.index('</style>')]
css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
used=set()
for c in re.findall(r'class="([^"]*)"',body): used.update(c.split())
def blocks(t):
    out=[];i=0;n=len(t)
    while i<n:
        j=t.find('{',i)
        if j<0: break
        d=0;k=j
        while k<n:
            if t[k]=='{': d+=1
            elif t[k]=='}':
                d-=1
                if d==0: break
            k+=1
        out.append((t[i:j].strip(),t[j+1:k])); i=k+1
    return out
def sel_ok(sel):
    return all(c in used for c in re.findall(r'\.(-?[_a-zA-Z][\w-]*)',re.sub(r'\[[^\]]*\]','',sel)))
def scope(sel):
    sel=sel.strip()
    if sel in(':root','html','body') or sel.startswith(':root'): return '.mpi'
    if sel.startswith('body '): return '.mpi '+sel[5:]
    return '.mpi '+sel
KF={}
def walk(t):
    out=[]
    for head,inner in blocks(t):
        if head.startswith('@keyframes'): KF[head.split()[1]]=f'{head}{{{inner}}}'; continue
        if head.startswith('@media') or head.startswith('@supports'):
            r=walk(inner)
            if r: out.append(f'{head}{{{r}}}')
            continue
        if head.startswith('@'): continue
        sels=[x for x in head.split(',') if x.strip() and sel_ok(x)]
        if not sels: continue
        out.append(','.join(scope(x) for x in sels)+'{'+inner.strip()+'}')
    return '\n'.join(out)
rules=walk(css)
names=set(re.findall(r'animation(?:-name)?\s*:\s*([\w-]+)',rules))
for m in re.findall(r'animation\s*:[^;}]*',rules): names.update(re.findall(r'[\w-]+',m))
kfs='\n'.join(v for k,v in KF.items() if k in names)
open(f'{ROOT}/src/styles/mpi.css','w').write('/* Generated from the design board by mockups/mpi/build-astro.py (PR #199). Hand edits go in mpi-site.css. */\n'+rules+'\n'+kfs+'\n')
print('body',len(body),'css',len(rules)+len(kfs),'faq',len(faq),'kf',len([1 for k in KF if k in names]),'/',len(KF))

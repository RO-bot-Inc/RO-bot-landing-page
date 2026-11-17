# Turn a .dc.html artboard into a plain page for screenshots: helmet -> head, x-dc body -> body, /_blob/<id> -> local blobs.
import sys,re
src,out,blobs=sys.argv[1],sys.argv[2],sys.argv[3]
s=open(src).read()
h=re.search(r'<helmet>(.*?)</helmet>',s,re.S).group(1)
b=s[s.index('</helmet>')+9:s.index('</x-dc>')]
extra=sys.argv[4] if len(sys.argv)>4 else ''
page='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+h+'<style>'+extra+'</style></head><body>'+b+'</body></html>'
page=page.replace('/_blob/','file://'+blobs+'/')
open(out,'w').write(page)

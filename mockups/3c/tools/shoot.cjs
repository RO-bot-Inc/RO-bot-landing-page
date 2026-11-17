// node shoot.cjs <page.html|url> <outprefix> [fraction]  -> -d.png (1280) and -m.png (390), every CSS animation frozen at fraction of its own duration
const {chromium}=require('/Users/davidsonders/ro-bot/app/node_modules/playwright');
(async()=>{const [src,out,f='0.9',only]=process.argv.slice(2); const b=await chromium.launch();
for (const [w,tag,dpr] of [[1280,'d',1],[390,'m',2]]){
 if(only && only!==tag) continue;
 const p=await b.newPage({viewport:{width:w,height:900},deviceScaleFactor:dpr});
 await p.goto(src.startsWith('http')?src:'file://'+src,{waitUntil:'networkidle'});
 await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(async()=>{ for(const d of document.querySelectorAll('details')) d.open=d.open; window.scrollTo(0,document.body.scrollHeight); await new Promise(r=>setTimeout(r,300)); window.scrollTo(0,0); });
 await p.evaluate((f)=>{ document.getAnimations().forEach(a=>{ try{ a.pause(); const d=a.effect.getTiming().duration; if(typeof d==='number') a.currentTime=f*d; }catch(e){} }); }, +f);
 await p.waitForTimeout(300);
 await p.screenshot({path:`${out}-${tag}.png`,fullPage:true});
 await p.close();}
await b.close();})();

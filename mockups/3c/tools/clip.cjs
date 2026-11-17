// node clip.cjs <html> <out.png> <selector> [fraction] [width]
const {chromium}=require('/Users/davidsonders/ro-bot/app/node_modules/playwright');
(async()=>{const [src,out,sel,f='0.9',w='1280']=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:+w,height:900},deviceScaleFactor:2});await p.goto('file://'+src,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.evaluate((f)=>document.getAnimations().forEach(a=>{a.pause();const d=a.effect.getTiming().duration;if(typeof d==='number')a.currentTime=f*d;}),+f);
await p.waitForTimeout(200);await p.locator(sel).first().screenshot({path:out});await b.close();})();

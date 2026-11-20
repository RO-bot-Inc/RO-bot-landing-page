const fs=require('fs');
const src=fs.readFileSync('mpi-page.html','utf8').split('\n');
const L=(a,b)=>src.slice(a-1,b).join('\n');
// --- screens: eval the helper functions from the mockup script
const js=L(594,644); // var MIC ... var SCREENS
const fn=new Function(js+'\nreturn {mpiScreen,reviewScreen,videoScreen,customerScreen};');
const S=fn();
// --- css
let css=[L(5,15),L(18,37),L(47,80),L(84,90),L(131,349),L(357,360)].join('\n');
css=css.replace('padding-top:44px','padding-top:0')
 .replace('.nav{height:64px;border-bottom:1px solid var(--line);background:var(--white);position:sticky;top:44px;z-index:50}','.nav{height:64px;border-bottom:1px solid var(--line);background:var(--white);position:relative;z-index:50}')
 .replace('html{scroll-behavior:smooth}\n','')
 .replace(',.heroC .quote .words span{opacity:1;transform:none}','{opacity:1;transform:none}');
if(/heroB|heroC|\.rb|\.notes/.test(css)) throw new Error('leftover css: '+css.match(/.*(heroB|heroC|\.rb|\.notes).*/)[0]);
// --- markup
let nav=L(374,391), hero=L(393,404), secs=L(455,577);
let body=[nav,hero,secs].join('\n\n');
body=body.replace(/href="#"/g,'href="#top"');
body=body.replace('<nav class="nav">','<nav class="nav" id="top">');
const fill=(kind,html)=>body=body.replace(new RegExp('<div class="demo" data-kind="'+kind+'" data-driver="auto" data-stage="0"></div>','g'),
  '<div class="demo" data-kind="'+kind+'" data-stage="3">'+html+'</div>');
fill('mpi',S.mpiScreen());fill('review',S.reviewScreen());fill('video',S.videoScreen());fill('customer',S.customerScreen());
if(/data-driver/.test(body)) throw new Error('unfilled demo');
if(/\{\{/.test(body)) throw new Error('mustache in body');
const head=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>MPI page, hero A</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap">
<style>
${css}
</style>
</helmet>
<div class="page" style="width: 100%; min-height: 100%; background: #ffffff; font-family: 'DM Sans', system-ui, sans-serif; color: #1b2430">
${body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1280,"height":7400}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
  componentDidMount() {
    var self = this; this.demos = [];
    var els = document.querySelectorAll('.demo[data-kind]');
    for (var i = 0; i < els.length; i++) this.demos.push(new Loop(els[i]));
  }
  componentWillUnmount() {
    for (var i = 0; i < (this.demos || []).length; i++) this.demos[i].stop();
  }
}
function Loop(root) {
  this.root = root; this.kind = root.getAttribute('data-kind');
  this.words = root.querySelectorAll('.words span'); this.timers = []; this.wi = 0; this.playing = false;
  var self = this;
  if ('IntersectionObserver' in window) {
    this.io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !self.playing) { self.playing = true; self.cycle(); }
        else if (!e.isIntersecting && self.playing) { self.playing = false; self.clear(); }
      });
    }, { threshold: 0.2 });
    this.io.observe(root);
  } else { this.playing = true; this.cycle(); }
}
Loop.prototype.set = function (s) { this.root.setAttribute('data-stage', s); };
Loop.prototype.after = function (ms, fn) { var t = setTimeout(fn, ms); this.timers.push(t); return t; };
Loop.prototype.clear = function () { for (var i = 0; i < this.timers.length; i++) clearTimeout(this.timers[i]); this.timers = []; if (this.wt) { clearInterval(this.wt); this.wt = null; } };
Loop.prototype.stop = function () { this.clear(); if (this.io) this.io.disconnect(); this.set(3); this.showWords(this.words.length); };
Loop.prototype.showWords = function (n) { for (var i = 0; i < this.words.length; i++) this.words[i].classList.toggle('on', i < n); this.wi = n; };
Loop.prototype.streamWords = function (ms, done) { var self = this; self.showWords(0); self.wt = setInterval(function () { if (self.wi >= self.words.length) { clearInterval(self.wt); self.wt = null; if (done) done(); return; } self.showWords(self.wi + 1); }, ms); };
Loop.prototype.reset = function () { var r = this.root; r.classList.add('reset'); this.set(0); this.showWords(0); void r.offsetWidth; r.classList.remove('reset'); };
Loop.prototype.cycle = function () {
  var self = this, hold = self.kind === 'mpi' ? 2600 : 2800;
  self.reset();
  self.after(900, function () {
    self.set(1);
    var go = function () { self.after(700, function () { self.set(2); self.after(self.kind === 'customer' || self.kind === 'video' ? 1800 : 1500, function () { self.set(3); self.after(hold, function () { self.cycle(); }); }); }); };
    if (self.words.length) self.streamWords(150, go); else self.after(1500, go);
  });
};
</script>
</body>
</html>
`;
fs.writeFileSync('board/project/Main.dc.html',head);
const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');
const canvas={v:3,createdOnFiles:{v:1,at:now},title:"MPI Page Design Board",launch:{view:"canvas"},pages:[],
 boards:{"Main.dc.html":{x:0,y:0,w:1280,h:7400,title:"MPI page, hero A",expand:"fill",is_interactive:true}},
 order:["Main.dc.html"],
 notes:{
  "open-inputs":{x:1360,y:0,w:360,text:"Open inputs (amber tags on the page)\n\n1. 61 of 100 stat: keep or drop\n2. Three benefit figures in Why it gets done\n3. One MPI quote from a service manager\n4. Which stores can be named\n5. Loud-shop FAQ answer\n6. MPI time figures and the per-tech dollar estimate (not on the page yet)",fill:"orange"},
  "how-to":{x:1360,y:420,w:360,text:"Click any text on the page to retype it. Leave notes with comments or stickies. Phones loop while on screen; Play shows the finished page.",fill:"teal"}
 },
 designSystems:[]};
fs.writeFileSync('board/project/canvas.json',JSON.stringify(canvas,null,1));
console.log('Main bytes',head.length,'css lines',css.split('\n').length);

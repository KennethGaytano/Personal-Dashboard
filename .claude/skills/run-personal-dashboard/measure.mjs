import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT=path.resolve(process.cwd(),'../../..');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)){res.writeHead(404);return res.end('nf');}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(3140,r));
const b=await chromium.launch();
const now=new Date().toISOString();
const tasks=[
 {id:'a1',title:'Review Q3 accessibility audit',description:'',dueDate:'',dueTime:'',status:'todo',priority:'high',createdAt:now,updatedAt:now},
 {id:'a2',title:'Draft portfolio case study write-up',description:'',dueDate:'',dueTime:'',status:'in_progress',priority:'medium',createdAt:now,updatedAt:now},
 {id:'a3',title:'Fix calendar overflow on mobile',description:'',dueDate:'',dueTime:'',status:'todo',priority:'high',createdAt:now,updatedAt:now},
 {id:'a4',title:'Set up local test fixtures',description:'',dueDate:'',dueTime:'',status:'completed',priority:'low',createdAt:now,updatedAt:now},
];

for(const vw of [1920,1600,1366,1024,800]){
  const ctx=await b.newContext({viewport:{width:vw,height:900}});
  await ctx.addInitScript(t=>{localStorage.setItem('dashboard_tasks',JSON.stringify(t));},tasks);
  const p=await ctx.newPage();
  await p.goto('http://localhost:3140/index.html');
  await p.waitForTimeout(350);
  const m=await p.evaluate(()=>{
    const sec=document.querySelectorAll('.two-col > section')[0];
    const hdr=sec.querySelector('.section-header');
    const h2=hdr.querySelector('h2');
    const link=hdr.querySelector('.section-link');
    const card=sec.querySelector('.card');
    const cs=getComputedStyle(link);
    const R=el=>{const r=el.getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),b:Math.round(r.bottom),r:Math.round(r.right)};};
    const two=document.querySelector('.two-col');
    const kids=[...two.children].map(c=>{const r=c.getBoundingClientRect();return Math.round(r.height);});
    return {hdr:R(hdr),h2:R(h2),link:R(link),card:R(card),secBottom:Math.round(sec.getBoundingClientRect().bottom),
      gapH2Link:Math.round(link.getBoundingClientRect().left-h2.getBoundingClientRect().right),
      alignMid:Math.round((link.getBoundingClientRect().y+link.getBoundingClientRect().height/2)-(h2.getBoundingClientRect().y+h2.getBoundingClientRect().height/2)),
      linkStyle:{color:cs.color,fontSize:cs.fontSize,fontWeight:cs.fontWeight},
      colHeights:kids, twoH:Math.round(two.getBoundingClientRect().height),
      taskCount:document.querySelectorAll('.task-list .task-item').length};
  });
  console.log(`\n=== ${vw}px ===`);
  console.log(`  section-header ${m.hdr.w}x${m.hdr.h} at x=${m.hdr.x} | h2 ${m.h2.w}x${m.h2.h} y=${m.h2.y}..${m.h2.b} | link ${m.link.w}x${m.link.h} y=${m.link.y}..${m.link.b}`);
  console.log(`  gap h2->link: ${m.gapH2Link}px | vertical center delta: ${m.alignMid}px`);
  console.log(`  card top=${m.card.y} (hdr bottom=${m.hdr.b}, margin gap=${m.card.y-m.hdr.b}) | section bottom=${m.secBottom}`);
  console.log(`  link style: ${m.linkStyle.color} ${m.linkStyle.fontSize} / ${m.linkStyle.fontWeight}`);
  console.log(`  .two-col height=${m.twoH} | column heights=[${m.colHeights}] | tasks rendered=${m.taskCount}`);
  await ctx.close();
}
await b.close(); server.close();

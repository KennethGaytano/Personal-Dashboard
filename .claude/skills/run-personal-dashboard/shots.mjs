import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
const ROOT=path.resolve(process.cwd(),'../../..');
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript'};
const server=http.createServer((req,res)=>{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/')p='/index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)){res.writeHead(404);return res.end('nf');}res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});res.end(fs.readFileSync(f));});
await new Promise(r=>server.listen(3141,r));
const b=await chromium.launch();
const now=new Date().toISOString();
const tasks=[
 {id:'a1',title:'Review Q3 accessibility audit',dueDate:'',dueTime:'',status:'todo',priority:'high',createdAt:now,updatedAt:now},
 {id:'a2',title:'Draft portfolio case study write-up',dueDate:'',dueTime:'',status:'in_progress',priority:'medium',createdAt:now,updatedAt:now},
 {id:'a3',title:'Fix calendar overflow on mobile',dueDate:'',dueTime:'',status:'todo',priority:'high',createdAt:now,updatedAt:now},
 {id:'a4',title:'Set up local test fixtures',dueDate:'',dueTime:'',status:'completed',priority:'low',createdAt:now,updatedAt:now},
];
const OUT='C:/Users/kenne/AppData/Local/Temp/dashshots';
fs.mkdirSync(OUT,{recursive:true});

for (const [tag,extra] of [['current',''],['below','.section-link{margin-top:0.75rem;align-self:flex-start;}']]) {
  const ctx=await b.newContext({viewport:{width:1366,height:900},deviceScaleFactor:2});
  await ctx.addInitScript(t=>{localStorage.setItem('dashboard_tasks',JSON.stringify(t));},tasks);
  const p=await ctx.newPage();
  await p.goto('http://localhost:3141/index.html');
  if(extra) await p.addStyleTag({content:`@media(min-width:769px){
    .two-col > section:first-child .section-header{flex-direction:column;align-items:flex-start;}
    .two-col > section:first-child .section-link{order:3;margin-top:0.75rem;align-self:flex-start;}
    .two-col > section:first-child{display:flex;flex-direction:column;}
    .two-col > section:first-child .card{order:2;}
  }`});
  await p.waitForTimeout(400);
  const sec=await p.locator('.two-col > section').first().boundingBox();
  const two=await p.locator('.two-col').boundingBox();
  const link=await p.locator('.two-col .section-link').first().boundingBox();
  const card=await p.locator('.two-col .card').first().boundingBox();
  await p.locator('.two-col').screenshot({path:path.join(OUT,`${tag}.png`)});
  console.log(`${tag}: section h=${Math.round(sec.height)} | two-col h=${Math.round(two.height)} | card h=${Math.round(card.height)} bottom=${Math.round(card.y+card.height)} | link y=${Math.round(link.y)} belowCard=${link.y>card.y+card.height-2}`);
  await ctx.close();
}
console.log('\nshots ->',OUT);
await b.close(); server.close();

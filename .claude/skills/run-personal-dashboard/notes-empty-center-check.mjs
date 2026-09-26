import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';

const ROOT = path.resolve(process.cwd(), '../../..');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  res.end(fs.readFileSync(f));
});
await new Promise(r => server.listen(3142, r));

const OUT = 'C:/Users/kenne/AppData/Local/Temp/dashshots';
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? '  PASS' : '  FAIL'}  ${msg}`);
  if (!cond) failures++;
}

// Measures the union rect of the actual rendered glyphs (text + link),
// not just the CSS property, so "centered" is proven rather than assumed.
const measure = (sel) => `(() => {
  const el = document.querySelector('${sel}');
  if (!el) return { missing: true };
  const cs = getComputedStyle(el);
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = [...range.getClientRects()];
  if (!rects.length) return { noText: true, textAlign: cs.textAlign };
  const left = Math.min(...rects.map(r => r.left));
  const right = Math.max(...rects.map(r => r.right));
  const c = el.parentElement.getBoundingClientRect();
  const self = el.getBoundingClientRect();
  return {
    textAlign: cs.textAlign,
    padding: cs.padding,
    textLeft: left, textRight: right, textCenter: (left + right) / 2,
    containerCenter: (c.left + c.right) / 2, containerWidth: c.width,
    selfWidth: self.width, selfLeft: self.left, containerLeft: c.left,
    text: el.textContent.trim()
  };
})()`;

function report(tag, m) {
  if (m.missing) { console.log(`  FAIL  ${tag}: element not found`); failures++; return; }
  console.log(`\n--- ${tag} ---`);
  console.log(`  text        : "${m.text}"`);
  console.log(`  text-align  : ${m.textAlign}   padding: ${m.padding}`);
  console.log(`  el width    : ${Math.round(m.selfWidth)}px  (container: ${Math.round(m.containerWidth)}px)`);
  console.log(`  offset drift: ${(m.textCenter - m.containerCenter).toFixed(2)}px from container center`);
  assert(m.textAlign === 'center', `${tag}: computed text-align is center`);
  assert(Math.abs(m.selfWidth - m.containerWidth) <= 1, `${tag}: empty state spans the full grid width`);
  assert(Math.abs(m.textCenter - m.containerCenter) <= 2, `${tag}: rendered text is centered (within 2px)`);
}

// ---- 1. Empty states (notes page + home page) ----
for (const [tag, url, sel, file] of [
  ['Notes page', 'http://localhost:3142/pages/notes.html', '#notesList .empty-state', 'empty-notes.png'],
  ['Home page', 'http://localhost:3142/index.html', '#quickNotesList .empty-state', 'empty-home.png']
]) {
  for (const [label, vw, vh] of [['desktop', 1366, 900], ['mobile', 390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => localStorage.removeItem('dashboard_notes'));
    const p = await ctx.newPage();
    await p.goto(url);
    await p.waitForTimeout(400);
    report(`${tag} (${label} ${vw}px)`, await p.evaluate(measure(sel)));
    if (label === 'desktop') await p.screenshot({ path: path.join(OUT, file), fullPage: true });
    await ctx.close();
  }
}

// ---- 2. Regression: real note cards must still flow as a multi-column grid ----
{
  const now = new Date().toISOString();
  const notes = [
    { id: 'n1', title: 'Review Q3 accessibility audit', body: 'Check color contrast and focus order.', color: 'accent', createdAt: now, updatedAt: now },
    { id: 'n2', title: 'Draft portfolio case study', body: 'Outline the three flagship projects.', color: 'cyan', createdAt: now, updatedAt: now },
    { id: 'n3', title: 'Fix calendar overflow on mobile', body: 'The day panel wraps awkwardly.', color: 'success', createdAt: now, updatedAt: now }
  ];
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(t => localStorage.setItem('dashboard_notes', JSON.stringify(t)), notes);
  const p = await ctx.newPage();
  await p.goto('http://localhost:3142/pages/notes.html');
  await p.waitForTimeout(400);
  const boxes = await p.evaluate(() => [...document.querySelectorAll('#notesList .note-card')].map(c => c.getBoundingClientRect()));
  const empty = await p.evaluate(() => !!document.querySelector('#notesList .empty-state'));
  console.log(`\n--- Regression: ${boxes.length} note cards at 1366px ---`);
  assert(!empty, 'empty state is NOT rendered when notes exist');
  assert(boxes.length === 3, 'all 3 note cards render');
  assert(new Set(boxes.map(b => Math.round(b.left))).size > 1, 'cards still flow into multiple grid columns');
  assert(boxes.every(b => b.width > 200), 'cards keep their column width (not collapsed/stretched)');
  console.log(`  card lefts: ${boxes.map(b => Math.round(b.left)).join(', ')} | widths: ${boxes.map(b => Math.round(b.width)).join(', ')}`);
  await p.screenshot({ path: path.join(OUT, 'notes-with-cards.png'), fullPage: true });
  await ctx.close();
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
console.log('shots ->', OUT);
await b.close(); server.close();
process.exit(failures === 0 ? 0 : 1);
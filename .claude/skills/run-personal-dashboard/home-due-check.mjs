import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const server = spawn('node', ['server.mjs'], { cwd: here, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));

await page.goto('http://localhost:3000/index.html');

const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
await page.evaluate(([past, today, future]) => {
  localStorage.setItem('dashboard_tasks', JSON.stringify([
    { id: 'h1', title: 'Overdue task, no time', description: '', dueDate: past, dueTime: '', status: 'todo', priority: 'high', createdAt: '', updatedAt: '' },
    { id: 'h2', title: 'Overdue task with time', description: '', dueDate: past, dueTime: '09:00', status: 'in_progress', priority: 'medium', createdAt: '', updatedAt: '' },
    { id: 'h3', title: 'Due today, not overdue', description: '', dueDate: today, dueTime: '', status: 'todo', priority: 'low', createdAt: '', updatedAt: '' }
  ]));
}, [d(-3), d(0), d(5)]);
await page.reload();
await page.waitForTimeout(400);

const rows = await page.locator('.task-item').evaluateAll(items => items.map(i => ({
  title: i.querySelector('.task-text')?.textContent,
  due: i.querySelector('.task-due-date')?.textContent.trim() || null,
  overdue: i.querySelector('.task-overdue')?.textContent.trim() || null
})));
console.log(JSON.stringify(rows, null, 2));

// Responsive check: long titles + overdue badge must not overflow the card
for (const vw of [390, 768, 1280]) {
  await page.setViewportSize({ width: vw, height: 900 });
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => {
    const out = [];
    for (const i of document.querySelectorAll('.task-item')) {
      const ir = i.getBoundingClientRect();
      const h = i.querySelector('.task-header').getBoundingClientRect();
      const b = i.querySelector('.task-overdue');
      if (!b) continue;
      const br = b.getBoundingClientRect();
      const t = i.querySelector('.task-text').getBoundingClientRect();
      out.push({
        title: i.querySelector('.task-text').textContent.slice(0, 22),
        badgeBottom: Math.round(br.bottom),
        titleBottom: Math.round(t.bottom),
        headerTop: Math.round(h.top),
        cardRight: Math.round(ir.right),
        badgeRight: Math.round(br.right),
        overflows: br.right > ir.right + 1
      });
    }
    return { docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, items: out };
  });
  console.log(`\n--- ${vw}px --- docOverflowX=${m.docOverflow}`);
  m.items.forEach(r => console.log(`   ${r.overflows ? 'OVERFLOW' : 'ok      '} "${r.title}" badgeY=${r.badgeBottom} titleY=${r.titleBottom} badgeRight=${r.badgeRight} cardRight=${r.cardRight}`));
}

await page.locator('.two-col > section').first().screenshot({ path: 'home-due-check.png' });
console.log('screenshot: home-due-check.png');

await browser.close();
server.kill();

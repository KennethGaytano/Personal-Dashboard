import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const server = spawn('node', ['server.mjs'], { cwd: path.dirname(fileURLToPath(import.meta.url)), stdio: 'ignore' });
await new Promise(r => setTimeout(r, 1200));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
page.on('console', m => m.type() === 'error' && console.log('CONSOLE ERROR:', m.text()));

await page.goto('http://localhost:3000/pages/tasks.html');

const d = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
await page.evaluate(([past, today, future]) => {
  localStorage.setItem('dashboard_tasks', JSON.stringify([
    { id: 'a1', title: 'Overdue task, no time', description: 'Deadline slipped days ago.', dueDate: past, dueTime: '', status: 'todo', priority: 'high', createdAt: '', updatedAt: '' },
    { id: 'a2', title: 'Overdue task with time', description: '', dueDate: past, dueTime: '09:00', status: 'in_progress', priority: 'medium', createdAt: '', updatedAt: '' },
    { id: 'a3', title: 'Overdue but completed', description: '', dueDate: past, dueTime: '', status: 'completed', priority: 'low', createdAt: '', updatedAt: '' },
    { id: 'a4', title: 'Due today, not overdue yet', description: '', dueDate: today, dueTime: '', status: 'todo', priority: 'low', createdAt: '', updatedAt: '' },
    { id: 'a5', title: 'Future task', description: '', dueDate: future, dueTime: '', status: 'todo', priority: 'low', createdAt: '', updatedAt: '' },
    { id: 'a6', title: 'No due date', description: '', dueDate: '', dueTime: '', status: 'todo', priority: 'low', createdAt: '', updatedAt: '' }
  ]));
}, [d(-3), d(0), d(5)]);
await page.reload();
await page.waitForTimeout(400);

const rows = await page.locator('.task-item').evaluateAll(items => items.map(i => ({
  title: i.querySelector('.task-text')?.textContent,
  section: i.closest('div[id]')?.id,
  overdue: !!i.querySelector('.task-overdue'),
  text: i.querySelector('.task-overdue')?.textContent.trim() || null
})));
console.log(JSON.stringify(rows, null, 2));

await page.screenshot({ path: 'overdue-check.png', fullPage: true });
console.log('screenshot: overdue-check.png');

await browser.close();
server.kill();

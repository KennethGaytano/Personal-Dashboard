#!/usr/bin/env node
/**
 * Interactive driver for Personal Dashboard
 * Usage: node driver.mjs <command> [args...]
 *
 * Commands:
 *   launch                    - Start server and open browser
 *   screenshot <path>         - Take screenshot of current page
 *   navigate <page>           - Navigate to page (home, tasks, calendar, notes, progress, goals)
 *   click <selector>          - Click element
 *   type <selector> <text>    - Type text into element
 *   eval <code>               - Evaluate JavaScript in page
 *   quit                      - Close browser and stop server
 */

import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVER_SCRIPT = join(__dirname, 'server.mjs');
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

let browser = null;
let page = null;
let serverProcess = null;

async function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', [SERVER_SCRIPT], {
      env: { ...process.env, PORT: PORT.toString() },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running')) {
        console.log(`[SERVER] ${output.trim()}`);
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[SERVER ERROR] ${data}`);
    });

    serverProcess.on('error', reject);

    setTimeout(() => resolve(), 2000);
  });
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

async function launch() {
  console.log('Starting server...');
  await startServer();

  console.log('Launching browser...');
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage();
  await page.goto(BASE_URL);

  const title = await page.title();
  console.log(`Opened: ${title}`);
  console.log(`URL: ${BASE_URL}`);
}

async function screenshot(path) {
  if (!page) throw new Error('Browser not launched. Run "launch" first.');
  await page.screenshot({ path, fullPage: true });
  console.log(`Screenshot saved: ${path}`);
}

async function navigate(pageName) {
  if (!page) throw new Error('Browser not launched. Run "launch" first.');

  const pages = {
    home: 'index.html',
    tasks: 'pages/tasks.html',
    calendar: 'pages/calendar.html',
    notes: 'pages/notes.html',
    progress: 'pages/progress.html',
    goals: 'pages/goals.html'
  };

  const url = pages[pageName.toLowerCase()];
  if (!url) {
    throw new Error(`Unknown page: ${pageName}. Valid: ${Object.keys(pages).join(', ')}`);
  }

  await page.goto(`${BASE_URL}/${url}`);
  const title = await page.title();
  console.log(`Navigated to: ${title}`);
}

async function click(selector) {
  if (!page) throw new Error('Browser not launched. Run "launch" first.');
  await page.click(selector);
  console.log(`Clicked: ${selector}`);
}

async function type(selector, text) {
  if (!page) throw new Error('Browser not launched. Run "launch" first.');
  await page.fill(selector, text);
  console.log(`Typed "${text}" into: ${selector}`);
}

async function evaluate(code) {
  if (!page) throw new Error('Browser not launched. Run "launch" first.');
  const result = await page.evaluate(code);
  console.log('Result:', result);
  return result;
}

async function quit() {
  console.log('Closing browser...');
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }

  console.log('Stopping server...');
  await stopServer();

  console.log('Done.');
}

// CLI interface
async function main() {
  const [command, ...args] = process.argv.slice(2);

  try {
    switch (command) {
      case 'launch':
        await launch();
        break;
      case 'screenshot':
        await screenshot(args[0]);
        break;
      case 'navigate':
        await navigate(args[0]);
        break;
      case 'click':
        await click(args[0]);
        break;
      case 'type':
        await type(args[0], args.slice(1).join(' '));
        break;
      case 'eval':
        await evaluate(args.join(' '));
        break;
      case 'quit':
        await quit();
        break;
      default:
        console.error('Unknown command:', command);
        console.error('Available commands: launch, screenshot, navigate, click, type, eval, quit');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

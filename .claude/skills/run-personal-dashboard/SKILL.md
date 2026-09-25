---
name: run-personal-dashboard
description: Run, screenshot, and interact with the Personal Dashboard web app
tags: [run, start, launch, screenshot, dashboard, web]
---

# Run Personal Dashboard

Launch and interact with the Personal Dashboard - a static HTML/CSS web app for managing tasks, calendar, notes, progress tracking, and goals.

The app is driven by Playwright via Node.js scripts in this skill directory. The smoke test covers all pages and interactive elements.

**All paths in this document are relative to the project root** (`Personal_DashBoard/`).

---

## Prerequisites

- **Node.js** v18+ (tested with v24.21.0)
- **npm** v9+ (tested with v11.19.0)
- **Playwright** with Chromium (installed in skill directory)

Already installed in `.claude/skills/run-personal-dashboard/node_modules/`.

---

## Build

No build step required - this is a static HTML/CSS app.

---

## Run (Agent Path - Primary)

### Quick Smoke Test

Run the complete smoke test that navigates all pages, tests interactive elements, and captures screenshots:

```bash
cd .claude/skills/run-personal-dashboard
node smoke.mjs
```

**Output:** Screenshots saved to `$CLAUDE_JOB_DIR/tmp/` (or `./screenshots/` if `CLAUDE_JOB_DIR` not set):
- `home.png` - Dashboard home page with overview stats
- `tasks.png` - Task management page
- `calendar.png` - Calendar view
- `notes.png` - Notes page
- `progress.png` - Progress tracking page
- `goals.png` - Goals page
- `tasks-interacted.png` - Tasks page after adding a new task
- `home-timer.png` - Home page with Pomodoro timer started

**What it tests:**
- HTTP server starts successfully
- All 6 pages load with correct titles
- Navigation works across all pages
- Checkboxes can be toggled
- New tasks can be added with text and priority
- Pomodoro timer button responds to clicks

### Interactive Driver

For manual control, use the driver script:

```bash
cd .claude/skills/run-personal-dashboard

# Start server and open browser
node driver.mjs launch

# Navigate to different pages
node driver.mjs navigate tasks
node driver.mjs navigate calendar
node driver.mjs navigate notes

# Take screenshots
node driver.mjs screenshot /path/to/output.png

# Click elements
node driver.mjs click "text=Tasks"
node driver.mjs click ".btn-primary"

# Type into inputs
node driver.mjs type "input[type='text']" "My new task"

# Evaluate JavaScript
node driver.mjs eval "document.querySelectorAll('.task-item').length"

# Clean up
node driver.mjs quit
```

**Driver Commands:**
- `launch` - Start HTTP server on port 3000, launch headless Chromium
- `screenshot <path>` - Take full-page screenshot
- `navigate <page>` - Go to page (home, tasks, calendar, notes, progress, goals)
- `click <selector>` - Click element by CSS selector or text
- `type <selector> <text>` - Fill input field
- `eval <code>` - Run JavaScript in page context
- `quit` - Close browser and stop server

---

## Run (Human Path - Secondary)

### Manual Testing with a Live Browser

Start a local HTTP server:

```bash
# Using Node.js built-in http-server from skill directory
cd .claude/skills/run-personal-dashboard
node server.mjs
```

Server runs at `http://localhost:3000/`.

Open in your browser to interact manually. Press Ctrl-C to stop.

**Note:** This path is for human visual testing only. Agents should use the smoke test or driver script above.

---

## Direct Server Script

The HTTP server is a simple Node.js ES module that serves static files from the project root:

```bash
cd .claude/skills/run-personal-dashboard
node server.mjs
# Server running at http://localhost:3000/
```

Set `PORT` environment variable to change port:

```bash
PORT=8080 node server.mjs
```

---

## Project Structure

```
Personal_DashBoard/
├── index.html           # Home page - dashboard overview
├── tasks.html          # Task management
├── calendar.html       # Calendar view
├── notes.html          # Notes page
├── progress.html       # Progress tracking
├── goals.html          # Goals page
├── styles.css          # Shared stylesheet
└── .claude/skills/run-personal-dashboard/
    ├── SKILL.md        # This file
    ├── server.mjs      # HTTP server for serving static files
    ├── driver.mjs      # Interactive Playwright driver
    ├── smoke.mjs       # Complete smoke test script
    ├── package.json    # Node dependencies
    └── node_modules/   # Playwright installed here
        └── playwright/
```

---

## Gotchas

### 1. Static App = No Backend Persistence

This is a **static HTML/CSS** app with no JavaScript state management or backend. All interactions (checking tasks, adding items, starting timers) are **visual only** and not persisted. Refreshing the page resets everything.

**Why this matters:** When testing changes, you're verifying UI appearance and interaction responsiveness, not data persistence. If a PR adds data storage (localStorage, backend API), you'll need to extend the smoke test to verify that.

### 2. Windows Path Handling

The project is on Windows (`C:\Users\kenne\OneDrive\...`). The server script uses `path.join()` and handles forward slashes in URLs correctly, but if you add file operations, remember:
- URLs always use forward slashes (`/tasks.html`)
- Node.js `path` module handles OS differences automatically
- Don't hardcode `\` or `/` in path operations

### 3. Playwright on Windows

Chromium installs to `C:\Users\kenne\AppData\Local\ms-playwright\`. First run of Playwright may take time to download browser binaries. Already installed and tested working.

### 4. Port 3000 Conflicts

The server defaults to port 3000. If something else is using it:
- The driver/smoke scripts will fail silently or time out
- Set `PORT` env var: `PORT=3001 node server.mjs`
- Or kill the conflicting process: `netstat -ano | findstr :3000` then `taskkill /PID <pid> /F`

### 5. No JavaScript in the App Yet

The HTML files have no `<script>` tags. Buttons, checkboxes, and inputs render but don't have event handlers attached. This is expected for the current state - it's a static prototype.

**What works via Playwright:**
- Checking checkboxes (Playwright manipulates DOM directly)
- Filling input fields
- Clicking buttons (they respond visually)

**What doesn't work yet:**
- Pomodoro timer countdown (no JS)
- Task persistence (no storage)
- Adding tasks dynamically (no JS to append DOM nodes)

If a PR adds JavaScript, update the smoke test to verify the actual behavior (timer counts down, tasks persist, etc.).

### 6. Screenshot Timing

The smoke test uses `fullPage: true` for screenshots, which captures everything including below-the-fold content. For very long pages, this can take 1-2 seconds. No issues observed with current page lengths.

---

## Troubleshooting

### Error: "Server not responding" or "Connection refused"

**Symptom:** Smoke test fails immediately, or driver can't connect.

**Cause:** Server didn't start, or port 3000 is already in use.

**Fix:**
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# If occupied, kill the process
taskkill /PID <pid> /F

# Or use a different port
PORT=3001 node server.mjs
```

### Error: "Cannot find module 'playwright'"

**Symptom:** `node driver.mjs` or `node smoke.mjs` fails with module not found.

**Cause:** Playwright not installed in skill directory.

**Fix:**
```bash
cd .claude/skills/run-personal-dashboard
npm install playwright
npx playwright install chromium
```

### Screenshots are blank or show error page

**Symptom:** PNG files generated but contain white screen or 404 error.

**Cause:** Server not running, or wrong base URL.

**Fix:**
- Verify server is running: `curl http://localhost:3000/`
- Check server logs for errors
- Ensure `driver.mjs` has correct `PORT` constant (default 3000)
- If using custom port, update both server and driver scripts

### Smoke test hangs or times out

**Symptom:** Script runs but never completes, no screenshots generated.

**Cause:** Playwright waiting for page element that doesn't exist, or network timeout.

**Fix:**
- Check page HTML structure hasn't changed (driver assumes specific selectors)
- Increase timeout in smoke script if network is slow
- Run `node driver.mjs launch` then `node driver.mjs screenshot test.png` manually to isolate issue

---

## Extending the Skill

### Adding New Pages

If you add a new HTML page (e.g., `settings.html`):

1. Add to navigation in all existing HTML files
2. Update `smoke.mjs` `pages` array:
   ```javascript
   { name: 'Settings', url: '/settings.html', file: 'settings.png' }
   ```
3. Run smoke test to verify

### Testing JavaScript Interactions

When JavaScript is added for real interactivity:

1. Update `smoke.mjs` to test actual behavior:
   ```javascript
   // Example: Test Pomodoro timer actually counts down
   await page.click('.pomodoro button.btn-primary');
   await page.waitForTimeout(1000);
   const timerText = await page.textContent('.timer-display');
   console.log('Timer after 1s:', timerText); // Should be "24:59" not "25:00"
   ```

2. Add assertions to verify state changes:
   ```javascript
   const tasksBefore = await page.locator('.task-item').count();
   await page.click('.task-add button');
   const tasksAfter = await page.locator('.task-item').count();
   if (tasksAfter !== tasksBefore + 1) {
     throw new Error('Task was not added');
   }
   ```

### Testing localStorage Persistence

If the app starts using localStorage:

```javascript
// Set some state
await page.click('.task-item input[type="checkbox"]');

// Reload page
await page.reload();

// Verify state persisted
const isChecked = await page.isChecked('.task-item input[type="checkbox"]');
console.log('Checkbox persisted:', isChecked);
```

---

## Notes for Future Agents

- **This is a prototype:** The app has no backend, no JavaScript behavior yet. You're testing layout and visual interactions.
- **Screenshots are the ground truth:** When verifying a UI change, compare before/after screenshots. The PNG files in `$CLAUDE_JOB_DIR/tmp/` are your test output.
- **The driver is your main tool:** Use `driver.mjs` to poke the app programmatically. Don't try to test by opening Chrome manually.
- **Extend smoke.mjs for real tests:** As JavaScript gets added, update the smoke test to verify actual behavior, not just clicks.
- **Port conflicts are common:** If tests fail mysteriously, check port 3000 first.

---

## Summary

- **Smoke test:** `cd .claude/skills/run-personal-dashboard && node smoke.mjs`
- **Screenshots:** `$CLAUDE_JOB_DIR/tmp/*.png`
- **Interactive driver:** `node driver.mjs <command>`
- **Manual testing:** `node server.mjs` then open `http://localhost:3000/`
- **No build required:** Static HTML/CSS app
- **Gotchas:** No JS behavior yet, port 3000 conflicts, Windows paths, static data only

# Personal-Dashboard

A vibecoded website designed as a personal productivity dashboard that brings tasks, calendar events, notes, progress, goals, and study sessions into one organized space. It provides an overview of daily activities, task progress, study time, projects, and streaks while also including a Pomodoro timer and quick notes section.

The website is currently in progress, with features and design elements still being developed and improved.

## Live Site

The live website is available for you to try and explore. You can check the current features, design, and functionality here:

https://kennethgaytano.github.io/Personal-Dashboard/

Current Status: Tasks (full CRUD, localStorage, due dates/priorities), Today's Tasks display (max 3 including completed), Pomodoro timer (start/pause/reset with Focus/Break modes + custom minute input), Notes and Quick Notes (full CRUD, color picker, edit/delete, shared store, toasts) are functioning. Calendar, Progress, and Goals sections are still under development.

## Project structure

- `index.html` — home page and deployed entry point.
- `pages/` — dashboard feature pages.
- `scripts/` — browser JavaScript for task data and home-page summaries.
- `styles/` — split stylesheets: `base.css` (tokens/reset), `layout.css` (sidebar and page scaffolding), `components.css` (buttons, forms, modal, toast), plus one file per page.
- `.claude/skills/run-personal-dashboard/` — local server and Playwright checks.

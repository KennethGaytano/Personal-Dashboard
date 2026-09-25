/**
 * Calendar Module
 * Renders a real month grid, wires Prev/Next, and marks today correctly.
 */

(function() {
  'use strict';

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Sample event days, keyed as "YYYY-MM-DD"
  const EVENTS = new Set([
    '2026-09-07',
    '2026-09-10',
    '2026-09-15',
    '2026-09-28',
    '2026-10-01',
    '2026-10-05'
  ]);

  // Visible month; defaults to the month containing today
  let viewYear;
  let viewMonth;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toKey(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  /**
   * Build the 6x7 grid for the visible month, including
   * leading days from the previous month and trailing days
   * from the next so every week is complete.
   */
  function buildDays(year, month) {
    const firstOfMonth = new Date(year, month, 1);
    const start = new Date(year, month, 1 - firstOfMonth.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === month,
        isToday: isSameDay(date, today),
        hasEvent: EVENTS.has(toKey(date.getFullYear(), date.getMonth(), date.getDate()))
      });
    }

    return days;
  }

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function render() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('monthLabel');
    if (!grid || !label) return;

    label.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

    const days = buildDays(viewYear, viewMonth);

    const headers = DAY_LABELS.map(day => `
      <div class="calendar-day-label" role="columnheader" aria-label="${day}">${day}</div>
    `).join('');

    const cells = days.map(day => {
      const classes = ['calendar-day'];
      if (!day.isCurrentMonth) classes.push('other-month');
      if (day.isToday) classes.push('today');
      if (day.hasEvent) classes.push('has-event');

      const dateKey = toKey(day.date.getFullYear(), day.date.getMonth(), day.dayNumber);
      const longDate = day.date.toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      });

      // The visible number is decorative; the button's accessible name
      // carries the full date, today state, and event presence.
      const state = [
        day.isToday ? 'today' : '',
        day.hasEvent ? 'has events' : ''
      ].filter(Boolean).join(', ');

      return `
        <button type="button" class="${classes.join(' ')}" data-date="${dateKey}"
          aria-label="${longDate}${state ? `, ${state}` : ''}">
          <span aria-hidden="true">${day.dayNumber}</span>
        </button>
      `;
    }).join('');

    grid.innerHTML = headers + cells;
  }

  function shiftMonth(delta) {
    viewMonth += delta;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    } else if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }
    render();
  }

  function selectDate(event) {
    const button = event.target.closest('.calendar-day');
    if (!button) return;

    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    // Basic visual selection; wire to real navigation later
    grid.querySelectorAll('.calendar-day.selected').forEach(el => {
      el.classList.remove('selected');
      el.removeAttribute('aria-pressed');
    });

    button.classList.add('selected');
    button.setAttribute('aria-pressed', 'true');
  }

  function init() {
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();

    const prev = document.getElementById('prevMonth');
    const next = document.getElementById('nextMonth');
    const grid = document.getElementById('calendarGrid');

    if (prev) prev.addEventListener('click', () => shiftMonth(-1));
    if (next) next.addEventListener('click', () => shiftMonth(1));
    if (grid) grid.addEventListener('click', selectDate);

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * Calendar Events Module
 * CRUD events in localStorage, renders selected-day list below grid.
 */
const STORAGE_KEY = 'dashboard_events';

let editingEventId = null;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading events:', e);
    return [];
  }
}

function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    return true;
  } catch (e) {
    console.error('Error saving events:', e);
    return false;
  }
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatEventDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function renderEventList(dateKey) {
  const container = document.getElementById('eventList');
  if (!container) return;
  const events = getEvents().filter(e => e.date === dateKey).sort((a,b) => a.time.localeCompare(b.time));
  if (events.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding:1rem;text-align:center;color:var(--text-muted);font-size:0.9rem;">No events for this day.</p>';
    return;
  }
  container.innerHTML = events.map(ev => `
    <div class="event-item" style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-weight:600;color:var(--text-primary);">${escapeHtml(ev.title)}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(ev.time || '')} ${ev.description ? '— ' + escapeHtml(ev.description) : ''}</div>
      </div>
      <div style="display:flex;gap:0.35rem;align-items:center;">
        <button type="button" class="btn-icon" onclick="startEditEvent('${escapeHtml(ev.id)}')" aria-label="Edit event ${escapeHtml(ev.title)}">✏️</button>
        <button type="button" class="btn-icon danger" onclick="deleteEvent('${escapeHtml(ev.id)}','${escapeHtml(dateKey)}')" aria-label="Delete event ${escapeHtml(ev.title)}">🗑️</button>
      </div>
    </div>
  `).join('');
}

window.getCalendarEventDates = function() {
  const events = getEvents();
  const set = new Set();
  events.forEach(e => { if (e.date) set.add(e.date); });
  return set;
};

window.deleteEvent = function(id, dateKey) {
  const events = getEvents().filter(e => e.id !== id);
  saveEvents(events);
  renderEventList(dateKey);
  // Refresh Upcoming list too
  renderUpcomingEvents();
  // Dot only; the list below the grid carries the detail.
  const btn = document.querySelector('#calendarGrid button.calendar-day[data-date="' + dateKey + '"]');
  if (btn) {
    const hasAny = getEvents().some(e => e.date === dateKey);
    if (hasAny) btn.classList.add('has-event');
    else btn.classList.remove('has-event');
  }
};

function startEditEvent(eventId) {
  const events = getEvents();
  const ev = events.find(e => e.id === eventId);
  if (!ev) return;
  editingEventId = eventId;
  const titleInput = document.getElementById('eventTitle');
  const timeInput = document.getElementById('eventTime');
  const descInput = document.getElementById('eventDesc');
  if (titleInput) titleInput.value = ev.title || '';
  if (timeInput) timeInput.value = ev.time || '';
  if (descInput) descInput.value = ev.description || '';
  const submitBtn = document.querySelector('#eventForm button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Update';
  document.getElementById('eventForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.startEditEvent = startEditEvent;

function addEvent(dateKey) {
  const titleInput = document.getElementById('eventTitle');
  const timeInput = document.getElementById('eventTime');
  const descInput = document.getElementById('eventDesc');
  if (!titleInput || !titleInput.value.trim()) return;
  const events = getEvents();
  events.push({
    id: generateId(),
    title: titleInput.value.trim(),
    date: dateKey,
    time: timeInput ? timeInput.value : '',
    description: descInput ? descInput.value.trim() : '',
    createdAt: new Date().toISOString()
  });
  saveEvents(events);
  titleInput.value = '';
  if (timeInput) timeInput.value = '';
  if (descInput) descInput.value = '';
  renderEventList(dateKey);
  renderUpcomingEvents();
  // Update dot on selected button (calendar-day, not .selected only)
  const btn = document.querySelector('#calendarGrid button.calendar-day[data-date="' + dateKey + '"]');
  if (btn) btn.classList.add('has-event');
}

function renderUpcomingEvents() {
  const container = document.getElementById('upcomingEventsList');
  if (!container) return;
  const now = new Date(); now.setHours(0,0,0,0);
  const events = getEvents()
    .filter(e => e.date && e.date >= now.toISOString().split('T')[0])
    .sort((a,b) => (a.date + ' ' + (a.time||'')).localeCompare(b.date + ' ' + (b.time||'')));
  if (events.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding:0.5rem;color:var(--text-muted);font-size:0.85rem;">No upcoming events.</p>';
    return;
  }
  container.innerHTML = events.map(ev => `
    <div class="task-item" style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <span class="nav-icon" aria-hidden="true">📌</span>
        <span class="task-text"><strong>${escapeHtml(ev.date)}</strong> — ${escapeHtml(ev.title)} ${ev.time ? ' @ ' + escapeHtml(ev.time) : ''}</span>
      </div>
      <button type="button" class="btn-icon danger" onclick="deleteEvent('${escapeHtml(ev.id)}','${escapeHtml(ev.date)}')" aria-label="Remove event ${escapeHtml(ev.title)}" style="margin-left:0.5rem;">🗑️</button>
    </div>
  `).join('');
}

function clearPastEvents() {
  const now = new Date(); now.setHours(0,0,0,0);
  const todayKey = now.toISOString().split('T')[0];
  const filtered = getEvents().filter(e => !e.date || e.date >= todayKey);
  saveEvents(filtered);
  renderUpcomingEvents();
  // Update dots
  const grid = document.getElementById('calendarGrid');
  if (grid) {
    grid.querySelectorAll('.calendar-day').forEach(btn => {
      const k = btn.getAttribute('data-date');
      if (!k) return;
      if (filtered.some(e => e.date === k)) btn.classList.add('has-event');
      else btn.classList.remove('has-event');
    });
  }
}

window.clearPastEvents = clearPastEvents;

function initEvents() {
  // Add form + list to calendar page if not present
  const gridSection = document.querySelector('.card');
  if (!gridSection) return;
  const section = gridSection.closest('section');
  if (!section) return;

  // Insert event form + list after grid card
  const existing = document.getElementById('eventPanel');
  if (existing) return;

  const panel = document.createElement('div');
  panel.id = 'eventPanel';
  panel.innerHTML = `
    <section style="margin-top:1.5rem;">
      <h2>Events for <span id="selectedDateLabel">selected day</span></h2>
      <div class="card">
        <form id="eventForm" class="event-form" style="display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap;">
          <div class="form-group" style="flex:1;min-width:140px;">
            <label for="eventTitle" class="form-label">Title <span class="required">*</span></label>
            <input type="text" id="eventTitle" placeholder="Meeting, deadline..." required aria-required="true" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-secondary);color:var(--text-primary);" />
          </div>
          <div class="form-group" style="min-width:100px;">
            <label for="eventTime" class="form-label">Time</label>
            <input type="time" id="eventTime" style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-secondary);color:var(--text-primary);" />
          </div>
          <div class="form-group" style="flex:1;min-width:160px;">
            <label for="eventDesc" class="form-label">Notes</label>
            <input type="text" id="eventDesc" placeholder="Details..." style="width:100%;padding:0.5rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-secondary);color:var(--text-primary);" />
          </div>
          <button type="submit" class="btn btn-primary">Add</button>
        </form>
        <div id="eventList"></div>
      </div>
    </section>
  `;
  section.parentNode.insertBefore(panel, section.nextSibling);

  document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.querySelector('#calendarGrid button.selected');
    const key = btn ? btn.getAttribute('data-date') : null;
    const titleInput = document.getElementById('eventTitle');
    const timeInput = document.getElementById('eventTime');
    const descInput = document.getElementById('eventDesc');
    const title = titleInput ? titleInput.value.trim() : '';
    if (!title) return;
    if (editingEventId) {
      const events = getEvents();
      const idx = events.findIndex(ev => ev.id === editingEventId);
      if (idx >= 0) {
        events[idx].title = title;
        events[idx].time = timeInput ? timeInput.value : '';
        events[idx].description = descInput ? descInput.value.trim() : '';
        events[idx].date = key || events[idx].date;
        saveEvents(events);
        editingEventId = null;
        const submitBtn = document.querySelector('#eventForm button[type="submit"]');
        if (submitBtn) submitBtn.textContent = 'Add';
      }
    } else {
      if (!key) return;
      const currentEvents = getEvents();
      currentEvents.push({
        id: generateId(),
        title: title,
        date: key,
        time: timeInput ? timeInput.value : '',
        description: descInput ? descInput.value.trim() : '',
        createdAt: new Date().toISOString()
      });
      saveEvents(currentEvents);
    }
    if (titleInput) titleInput.value = '';
    if (timeInput) timeInput.value = '';
    if (descInput) descInput.value = '';
    if (key) {
      renderEventList(key);
      document.getElementById('selectedDateLabel').textContent = formatEventDate(key);
    }
    renderUpcomingEvents();
    const btnSelected = document.querySelector('#calendarGrid button.selected[data-date]');
    if (btnSelected) btnSelected.classList.add('has-event');
  });

  // Hook into calendar day selection to show events
  const grid = document.getElementById('calendarGrid');
  if (grid) {
    grid.addEventListener('click', function(e) {
      const btn = e.target.closest('.calendar-day');
      if (!btn) return;
      const key = btn.getAttribute('data-date');
      if (!key) return;
      document.getElementById('selectedDateLabel').textContent = formatEventDate(key);
      renderEventList(key);
    });
  }

  // Populate upcoming events from storage on load
  renderUpcomingEvents();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEvents);
} else {
  initEvents();
}

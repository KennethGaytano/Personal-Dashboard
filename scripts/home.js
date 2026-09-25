/**
 * Home Page Task Sync
 * Displays actual tasks from localStorage on the home page
 */

(function() {
  const STORAGE_KEY = 'dashboard_tasks';

  /**
   * Get tasks from localStorage
   */
  function getTasks() {
    try {
      const tasks = localStorage.getItem(STORAGE_KEY);
      return tasks ? JSON.parse(tasks) : [];
    } catch (error) {
      console.error('Error loading tasks:', error);
      return [];
    }
  }

  /**
   * Update the task count in the overview stat card
   */
  function updateTaskCount() {
    const tasks = getTasks();
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const totalCount = tasks.length;

    // Target the Tasks card specifically, not whichever card renders first
    const taskCard = Array.from(document.querySelectorAll('.stat-card'))
      .find(card => {
        const heading = card.querySelector('h3');
        return heading && heading.textContent.trim() === 'Tasks';
      });

    if (taskCard) {
      const value = taskCard.querySelector('.stat-value');
      if (value) {
        value.textContent = `${completedCount}/${totalCount}`;
      }
    }
  }

  /**
   * Render today's tasks on the home page
   */
  function renderHomeTasks() {
    const tasks = getTasks();
    const container = document.querySelector('.task-list');

    if (!container) {
      return; // Not on home page
    }

    // Filter incomplete tasks (todo and in_progress)
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    // Show up to 3 incomplete tasks and 1 completed
    const displayTasks = [
      ...incompleteTasks.slice(0, 3),
      ...completedTasks.slice(0, 1)
    ];

    if (displayTasks.length === 0) {
      container.innerHTML = '<p class="empty-state">No tasks yet. <a href="pages/tasks.html">Create your first task</a></p>';
      return;
    }

    container.innerHTML = displayTasks.map(task => `
      <div class="task-item ${task.status === 'completed' ? 'completed' : ''}">
        <input
          type="checkbox"
          ${task.status === 'completed' ? 'checked' : ''}
          onchange="toggleHomeTask('${escapeHtml(task.id)}')"
          aria-label="Mark task ${escapeHtml(task.title)} as ${task.status === 'completed' ? 'incomplete' : 'complete'}"
        >
        <span class="task-text">${escapeHtml(task.title)}</span>
        ${task.priority ? `<span class="task-priority priority-${escapeHtml(task.priority)}">${escapeHtml(task.priority)}</span>` : ''}
      </div>
    `).join('');
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Toggle task status from home page
   */
  window.toggleHomeTask = function(taskId) {
    const tasks = getTasks();
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return;
    }

    // Toggle status
    task.status = task.status === 'completed' ? 'todo' : 'completed';
    task.updatedAt = new Date().toISOString();

    // Save back to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      // Re-render
      renderHomeTasks();
      updateTaskCount();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  /**
   * Greet the user according to the time of day
   */
  function setGreeting() {
    const heading = document.getElementById('greeting');
    if (!heading) return;

    const hour = new Date().getHours();
    let greeting;
    let icon;

    if (hour < 12) {
      greeting = 'Good morning!';
      icon = '☀️';
    } else if (hour < 18) {
      greeting = 'Good afternoon!';
      icon = '🌤️';
    } else {
      greeting = 'Good evening!';
      icon = '🌙';
    }

    heading.innerHTML = `${greeting} <span aria-hidden="true">${icon}</span>`;
  }

  /**
   * Initialize home page task display
   */
  function init() {
    setGreeting();
    renderHomeTasks();
    updateTaskCount();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

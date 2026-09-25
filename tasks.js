/**
 * Task Management Module
 * Handles CRUD operations, localStorage persistence, and UI updates
 */

// Task storage key
const STORAGE_KEY = 'dashboard_tasks';

// Task status enum
const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// Task priority enum
const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Current edit state
let editingTaskId = null;

/**
 * Generate unique ID for tasks
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Get all tasks from localStorage
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
 * Save tasks to localStorage
 */
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error('Error saving tasks:', error);
    showMessage('Failed to save tasks. Storage may be full.', 'error');
    return false;
  }
}

/**
 * Create a new task
 */
function createTask(taskData) {
  // Validate required fields
  if (!taskData.title || !taskData.title.trim()) {
    showMessage('Task title is required', 'error');
    return null;
  }

  const task = {
    id: generateId(),
    title: sanitizeInput(taskData.title.trim()),
    description: taskData.description ? sanitizeInput(taskData.description.trim()) : '',
    dueDate: taskData.dueDate || '',
    status: taskData.status || TaskStatus.TODO,
    priority: taskData.priority || TaskPriority.MEDIUM,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const tasks = getTasks();
  tasks.push(task);

  if (saveTasks(tasks)) {
    showMessage('Task added successfully', 'success');
    return task;
  }

  return null;
}

/**
 * Update an existing task
 */
function updateTask(taskId, updates) {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === taskId);

  if (index === -1) {
    showMessage('Task not found', 'error');
    return false;
  }

  // Validate title if being updated
  if (updates.title !== undefined && (!updates.title || !updates.title.trim())) {
    showMessage('Task title cannot be empty', 'error');
    return false;
  }

  // Sanitize string fields
  if (updates.title) updates.title = sanitizeInput(updates.title.trim());
  if (updates.description !== undefined) {
    updates.description = sanitizeInput(updates.description.trim());
  }

  tasks[index] = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  if (saveTasks(tasks)) {
    showMessage('Task updated successfully', 'success');
    return true;
  }

  return false;
}

/**
 * Delete a task
 */
function deleteTask(taskId) {
  const tasks = getTasks();
  const filteredTasks = tasks.filter(t => t.id !== taskId);

  if (tasks.length === filteredTasks.length) {
    showMessage('Task not found', 'error');
    return false;
  }

  if (saveTasks(filteredTasks)) {
    showMessage('Task deleted successfully', 'success');
    return true;
  }

  return false;
}

/**
 * Toggle task completion status
 */
function toggleTaskStatus(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return false;
  }

  const newStatus = task.status === TaskStatus.COMPLETED
    ? TaskStatus.TODO
    : TaskStatus.COMPLETED;

  return updateTask(taskId, { status: newStatus });
}

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Render all tasks
 */
function renderTasks() {
  const tasks = getTasks();

  // Group tasks by status
  const todoTasks = tasks.filter(t => t.status === TaskStatus.TODO);
  const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

  // Render each section
  renderTaskSection('todoList', todoTasks, 'No tasks to do');
  renderTaskSection('inProgressList', inProgressTasks, 'No tasks in progress');
  renderTaskSection('completedList', completedTasks, 'No completed tasks');
}

/**
 * Render a task section
 */
function renderTaskSection(containerId, tasks, emptyMessage) {
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  if (tasks.length === 0) {
    container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
    return;
  }

  container.innerHTML = tasks.map(task => `
    <div class="task-item ${task.status === TaskStatus.COMPLETED ? 'completed' : ''}" data-task-id="${task.id}">
      <input
        type="checkbox"
        ${task.status === TaskStatus.COMPLETED ? 'checked' : ''}
        onchange="handleToggleTask('${task.id}')"
        aria-label="Mark task as ${task.status === TaskStatus.COMPLETED ? 'incomplete' : 'complete'}"
      >
      <div class="task-content">
        <div class="task-header">
          <span class="task-text">${task.title}</span>
          ${task.priority ? `<span class="task-priority priority-${task.priority}">${task.priority}</span>` : ''}
        </div>
        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
        ${task.dueDate ? `<p class="task-due-date">Due: ${formatDate(task.dueDate)}</p>` : ''}
      </div>
      <div class="task-actions">
        <button
          class="btn-icon"
          onclick="startEditTask('${task.id}')"
          aria-label="Edit task"
          title="Edit"
        >✏️</button>
        <button
          class="btn-icon"
          onclick="confirmDeleteTask('${task.id}')"
          aria-label="Delete task"
          title="Delete"
        >🗑️</button>
      </div>
    </div>
  `).join('');
}

/**
 * Format date for display
 */
function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Reset time for comparison
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

/**
 * Handle form submission
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = {
    title: form.title.value,
    description: form.description.value,
    dueDate: form.dueDate.value,
    status: form.status.value,
    priority: form.priority.value
  };

  let success = false;

  if (editingTaskId) {
    success = updateTask(editingTaskId, formData);
    if (success) {
      cancelEdit();
    }
  } else {
    const task = createTask(formData);
    success = task !== null;
  }

  if (success) {
    form.reset();
    renderTasks();
  }
}

/**
 * Start editing a task
 */
function startEditTask(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    showMessage('Task not found', 'error');
    return;
  }

  editingTaskId = taskId;

  // Populate form
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskDueDate').value = task.dueDate || '';
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('taskPriority').value = task.priority;

  // Update form UI
  document.getElementById('formTitle').textContent = 'Edit Task';
  document.getElementById('submitBtn').textContent = 'Update Task';

  // Show cancel button
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.style.display = 'inline-flex';
  }

  // Scroll to form
  document.getElementById('taskForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Cancel editing
 */
function cancelEdit() {
  editingTaskId = null;

  // Reset form
  document.getElementById('taskForm').reset();
  document.getElementById('formTitle').textContent = 'Add a Task';
  document.getElementById('submitBtn').textContent = '+ Add Task';

  // Hide cancel button
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.style.display = 'none';
  }
}

/**
 * Handle checkbox toggle
 */
function handleToggleTask(taskId) {
  if (toggleTaskStatus(taskId)) {
    renderTasks();
  }
}

/**
 * Confirm task deletion
 */
function confirmDeleteTask(taskId) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    return;
  }

  // Show confirmation modal
  const modal = document.getElementById('confirmModal');
  const message = document.getElementById('confirmMessage');

  message.textContent = `Are you sure you want to delete "${task.title}"? This action cannot be undone.`;
  modal.style.display = 'flex';

  // Store taskId for confirmation
  modal.dataset.taskId = taskId;
}

// Expose functions globally for inline event handlers
window.handleToggleTask = handleToggleTask;
window.startEditTask = startEditTask;
window.confirmDeleteTask = confirmDeleteTask;

/**
 * Handle delete confirmation
 */
function handleConfirmDelete() {
  const modal = document.getElementById('confirmModal');
  const taskId = modal.dataset.taskId;

  if (taskId && deleteTask(taskId)) {
    // Cancel edit if deleting the task being edited
    if (editingTaskId === taskId) {
      cancelEdit();
    }
    renderTasks();
  }

  closeModal();
}

/**
 * Close modal
 */
function closeModal() {
  const modal = document.getElementById('confirmModal');
  modal.style.display = 'none';
  delete modal.dataset.taskId;
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
  const toast = document.getElementById('toast');

  if (!toast) {
    console.log(`${type.toUpperCase()}: ${message}`);
    return;
  }

  toast.textContent = message;
  toast.className = `toast toast-${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Initialize the task management system
 */
function initTaskManager() {
  // Render initial tasks
  renderTasks();

  // Set up form submission
  const form = document.getElementById('taskForm');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Set up cancel button
  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', cancelEdit);
    cancelBtn.style.display = 'none'; // Hidden by default
  }

  // Set up modal close handlers
  const modal = document.getElementById('confirmModal');
  if (modal) {
    const cancelModalBtn = document.getElementById('cancelModal');
    const confirmDeleteBtn = document.getElementById('confirmDelete');

    if (cancelModalBtn) {
      cancelModalBtn.addEventListener('click', closeModal);
    }

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    }

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  console.log('Task manager initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTaskManager);
} else {
  initTaskManager();
}

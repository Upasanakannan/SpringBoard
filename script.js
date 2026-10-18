/**
 * SprintBoard - Modern Project Management Application
 * Complete Vanilla JavaScript Implementation
 * 
 * Features:
 * - HTML5 Drag-and-drop task movements
 * - Dynamic LocalStorage data persistence
 * - Real-time dashboard statistics and progress bar
 * - Multi-criteria search and priority filtering
 * - Overdue deadline alerts and status badges
 * - Accessible modals for Task Creation, Editing, and Deletion
 * - Non-blocking Toast notification system
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONSTANTS & APPLICATION STATE
     ========================================================================== */

  const STORAGE_KEYS = {
    TASKS: 'sprintboard_tasks_v1',
    INITIALIZED: 'sprintboard_has_initialized_v1'
  };

  // Main task repository in memory
  let tasks = [];

  // Active filter and search state
  let currentSearchQuery = '';
  let currentPriorityFilter = 'all';

  // State for pending deletion
  let pendingDeleteTaskId = null;

  // Track currently dragged task id for drag-and-drop
  let draggedTaskId = null;

  /* ==========================================================================
     2. DOM ELEMENTS SELECTION
     ========================================================================== */

  // Topbar & Navigation
  const currentDateText = document.getElementById('currentDateText');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileSidebarClose = document.getElementById('mobileSidebarClose');
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const navTaskCount = document.getElementById('navTaskCount');

  // Statistics Elements
  const statTotal = document.getElementById('statTotal');
  const statInProgress = document.getElementById('statInProgress');
  const statCompleted = document.getElementById('statCompleted');
  const statProgressPercent = document.getElementById('statProgressPercent');
  const statProgressBar = document.getElementById('statProgressBar');
  const statProgressFraction = document.getElementById('statProgressFraction');

  // Column Count Badges & Dropzones
  const countTodo = document.getElementById('countTodo');
  const countInProgress = document.getElementById('countInProgress');
  const countDone = document.getElementById('countDone');
  const dropzoneTodo = document.getElementById('dropzoneTodo');
  const dropzoneInProgress = document.getElementById('dropzoneInProgress');
  const dropzoneDone = document.getElementById('dropzoneDone');

  // Filter & Search Elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const priorityFilter = document.getElementById('priorityFilter');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const filterStatusBanner = document.getElementById('filterStatusBanner');
  const filterStatusText = document.getElementById('filterStatusText');
  const bannerClearFilters = document.getElementById('bannerClearFilters');

  // Task Modal Elements
  const taskModalOverlay = document.getElementById('taskModalOverlay');
  const taskForm = document.getElementById('taskForm');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');
  const taskIdInput = document.getElementById('taskIdInput');
  const taskTitleInput = document.getElementById('taskTitle');
  const taskDescriptionInput = document.getElementById('taskDescription');
  const taskStatusSelect = document.getElementById('taskStatus');
  const taskPrioritySelect = document.getElementById('taskPriority');
  const taskDeadlineInput = document.getElementById('taskDeadline');
  const titleError = document.getElementById('titleError');
  const charCount = document.getElementById('charCount');

  // Buttons to open modal
  const topAddBtn = document.getElementById('topAddBtn');
  const openAddModalBtn = document.getElementById('openAddModalBtn');

  // Delete Confirmation Modal Elements
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteTaskTitle = document.getElementById('deleteTaskTitle');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  /* ==========================================================================
     3. UTILITY FUNCTIONS
     ========================================================================== */

  /**
   * Escape special HTML characters to prevent Cross-Site Scripting (XSS).
   * @param {string} str - Raw input string
   * @returns {string} Sanitized safe string
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format a Date into a friendly localized date string.
   * e.g., "Oct 24, 2026"
   * @param {string} dateString - "YYYY-MM-DD"
   * @returns {string} Formatted date string
   */
  function formatDisplayDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;

    // Use UTC date constructor to avoid timezone shifting
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Check if a given deadline date is overdue relative to today.
   * Completed tasks are not considered overdue.
   * @param {string} deadline - "YYYY-MM-DD"
   * @param {string} status - "todo" | "in-progress" | "done"
   * @returns {'overdue' | 'due-today' | 'upcoming' | 'none'}
   */
  function getDeadlineStatus(deadline, status) {
    if (!deadline || status === 'done') return 'none';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = deadline.split('-');
    if (parts.length !== 3) return 'none';

    const deadlineDate = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    deadlineDate.setHours(0, 0, 0, 0);

    const timeDiff = deadlineDate.getTime() - today.getTime();

    if (timeDiff < 0) {
      return 'overdue';
    } else if (timeDiff === 0) {
      return 'due-today';
    }
    return 'upcoming';
  }

  /**
   * Generates a date string in "YYYY-MM-DD" format offset by a number of days.
   * Used for generating sensible initial sample tasks.
   * @param {number} dayOffset - Negative for past, positive for future
   * @returns {string} Date formatted as YYYY-MM-DD
   */
  function getRelativeDateString(dayOffset) {
    const target = new Date();
    target.setDate(target.getDate() + dayOffset);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Display a non-blocking toast message in the bottom-right corner.
   * @param {string} message - Text to display
   * @param {'success' | 'danger' | 'info'} type - Toast styling variant
   */
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `
        <svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>`;
    } else if (type === 'danger') {
      iconSvg = `
        <svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`;
    } else {
      iconSvg = `
        <svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove toast after 3.2 seconds
    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3200);
  }

  /* ==========================================================================
     4. DATA PERSISTENCE & INITIALIZATION
     ========================================================================== */

  /**
   * Save current task array to browser localStorage.
   */
  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
      showToast('Storage quota exceeded. Unable to save changes.', 'danger');
    }
  }

  /**
   * Load tasks from localStorage or initialize with sample data on first visit.
   */
  function loadTasksFromStorage() {
    const hasInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (!hasInitialized) {
      // First visit: populate clean, realistic sample tasks showcasing all states
      tasks = [
        {
          id: 'task_' + Date.now() + '_1',
          title: 'Design UI Wireframes & Design System',
          description: 'Establish typography, purple brand color palette, and Kanban column layouts.',
          priority: 'medium',
          status: 'done',
          deadline: getRelativeDateString(-2),
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_2',
          title: 'Implement HTML5 Drag-and-Drop Interaction',
          description: 'Allow intuitive card dragging between To Do, In Progress, and Done columns with visual drop zones.',
          priority: 'high',
          status: 'in-progress',
          deadline: getRelativeDateString(2),
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_3',
          title: 'Setup LocalStorage Auto-Syncing',
          description: 'Persist task state immediately across additions, moves, edits, and deletions without any backend.',
          priority: 'medium',
          status: 'in-progress',
          deadline: getRelativeDateString(4),
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_4',
          title: 'Conduct Cross-Device & Mobile Review',
          description: 'Verify touch responsiveness, mobile sidebar drawer, and card layouts on smaller viewports.',
          priority: 'high',
          status: 'todo',
          deadline: getRelativeDateString(-1), // Intentionally overdue to showcase overdue highlight badge!
          createdAt: new Date().toISOString()
        },
        {
          id: 'task_' + Date.now() + '_5',
          title: 'Draft User Documentation & Guide',
          description: 'Create concise release notes explaining drag-and-drop shortcuts and search filtering.',
          priority: 'low',
          status: 'todo',
          deadline: getRelativeDateString(6),
          createdAt: new Date().toISOString()
        }
      ];

      // Mark initialized so future refreshes retain user edits even if all tasks are cleared
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      saveTasksToStorage();
    } else {
      // Subsequent visits: parse stored tasks safely
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (stored) {
        try {
          tasks = JSON.parse(stored) || [];
        } catch (e) {
          console.error('Error parsing stored tasks JSON:', e);
          tasks = [];
        }
      } else {
        tasks = [];
      }
    }
  }

  /* ==========================================================================
     5. DASHBOARD STATISTICS CALCULATION
     ========================================================================== */

  /**
   * Recalculates metrics and updates dashboard cards and progress bar.
   * Gracefully handles zero-task state without division-by-zero errors.
   */
  function updateDashboardStatistics() {
    const totalCount = tasks.length;
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const completedCount = tasks.filter(t => t.status === 'done').length;

    // Calculate percentage, guarding against division by zero
    const completionPercent = totalCount > 0 
      ? Math.round((completedCount / totalCount) * 100) 
      : 0;

    // Update DOM elements
    statTotal.textContent = totalCount;
    statInProgress.textContent = inProgressCount;
    statCompleted.textContent = completedCount;
    statProgressPercent.textContent = `${completionPercent}%`;
    statProgressBar.style.width = `${completionPercent}%`;
    statProgressFraction.textContent = `${completedCount} of ${totalCount} tasks completed`;

    // Sidebar task badge
    navTaskCount.textContent = totalCount;
  }

  /* ==========================================================================
     6. CARD RENDERING & KANBAN COLUMNS
     ========================================================================== */

  /**
   * Creates an empty state element for columns with no visible tasks.
   * @param {string} status - Column status
   * @param {boolean} isFiltered - Whether a search/priority filter is active
   * @returns {HTMLElement} Empty state container
   */
  function createEmptyStateElement(status, isFiltered) {
    const container = document.createElement('div');
    container.className = 'empty-state';

    let iconHtml = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="9" x2="15" y2="15"></line>
        <line x1="15" y1="9" x2="9" y2="15"></line>
      </svg>
    `;

    let title = 'No tasks here';
    let text = 'Drag tasks here or click + to add a card.';

    if (isFiltered) {
      title = 'No matches found';
      text = 'Try adjusting your search or priority filter.';
    } else if (status === 'done') {
      iconHtml = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
      title = 'No completed tasks';
      text = 'Finish tasks and drop them here!';
    } else if (status === 'in-progress') {
      iconHtml = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      `;
      title = 'Nothing in progress';
      text = 'Drag tasks here when you start working on them.';
    }

    container.innerHTML = `
      <div class="empty-state-icon">${iconHtml}</div>
      <div class="empty-state-title">${title}</div>
      <div class="empty-state-text">${text}</div>
    `;

    return container;
  }

  /**
   * Constructs a single task card DOM element with all event handlers.
   * @param {Object} task - Task data object
   * @returns {HTMLElement} Task card element
   */
  function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('draggable', 'true');
    card.dataset.id = task.id;
    card.dataset.status = task.status;

    // Determine Deadline Badge status
    const deadlineStatus = getDeadlineStatus(task.deadline, task.status);
    let deadlineBadgeHtml = '';

    if (task.deadline) {
      const formattedDate = formatDisplayDate(task.deadline);
      if (deadlineStatus === 'overdue') {
        deadlineBadgeHtml = `
          <span class="deadline-badge overdue" title="This deadline has passed!">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Overdue (${formattedDate})</span>
          </span>
        `;
      } else if (deadlineStatus === 'due-today') {
        deadlineBadgeHtml = `
          <span class="deadline-badge due-today" title="Task is due today!">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Due Today</span>
          </span>
        `;
      } else {
        deadlineBadgeHtml = `
          <span class="deadline-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${formattedDate}</span>
          </span>
        `;
      }
    }

    // Build Card inner HTML safely with escaped values
    card.innerHTML = `
      <div class="card-top-row">
        <span class="priority-badge priority-${escapeHtml(task.priority)}">
          <span class="priority-dot"></span>
          <span>${escapeHtml(task.priority)}</span>
        </span>
        <div class="card-actions">
          <button class="action-icon-btn edit-btn" title="Edit task" aria-label="Edit task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="action-icon-btn delete-btn" title="Delete task" aria-label="Delete task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <h3 class="card-title">${escapeHtml(task.title)}</h3>
      ${task.description ? `<p class="card-description">${escapeHtml(task.description)}</p>` : ''}

      <div class="card-footer">
        <div class="card-footer-left">
          ${deadlineBadgeHtml}
        </div>
        <div class="card-footer-right">
          <!-- Quick Status Changer Dropdown (supports mobile & accessibility without dragging) -->
          <select class="card-status-select" title="Change task status">
            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
          </select>
        </div>
      </div>
    `;

    // --- Card Event Listeners ---

    // 1. Drag & Drop: Drag Start
    card.addEventListener('dragstart', (e) => {
      draggedTaskId = task.id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
      
      // Add subtle styling class after slight delay so ghost image is clear
      setTimeout(() => {
        card.classList.add('is-dragging');
      }, 0);
    });

    // Drag End
    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      draggedTaskId = null;
      // Clear any remaining dropzone highlight
      clearDropzoneHighlights();
    });

    // 2. Action: Edit
    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(task.id);
    });

    // 3. Action: Delete
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteConfirmation(task.id);
    });

    // 4. Quick Status Changer Dropdown
    const statusSelect = card.querySelector('.card-status-select');
    statusSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      const newStatus = e.target.value;
      moveTaskToStatus(task.id, newStatus);
    });

    // Allow clicking the card itself to view/edit
    card.addEventListener('click', (e) => {
      // Avoid triggering when clicking buttons or selects
      if (e.target.closest('button') || e.target.closest('select')) return;
      openEditModal(task.id);
    });

    return card;
  }

  /**
   * Filter tasks by active search string and priority selection.
   * @returns {Array} Filtered task list
   */
  function getFilteredTasks() {
    const query = currentSearchQuery.trim().toLowerCase();
    const priority = currentPriorityFilter;

    return tasks.filter(task => {
      // 1. Search Query Filter (Title and Description)
      const matchesSearch = !query || 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query));

      // 2. Priority Filter
      const matchesPriority = priority === 'all' || task.priority === priority;

      return matchesSearch && matchesPriority;
    });
  }

  /**
   * Re-render all three Kanban columns and update statistics.
   */
  function renderBoard() {
    // Clear dropzone containers
    dropzoneTodo.innerHTML = '';
    dropzoneInProgress.innerHTML = '';
    dropzoneDone.innerHTML = '';

    const filtered = getFilteredTasks();
    const isFiltered = Boolean(currentSearchQuery.trim() || currentPriorityFilter !== 'all');

    // Separate tasks by column
    const todoTasks = filtered.filter(t => t.status === 'todo');
    const inProgressTasks = filtered.filter(t => t.status === 'in-progress');
    const doneTasks = filtered.filter(t => t.status === 'done');

    // Update column badge counters
    countTodo.textContent = todoTasks.length;
    countInProgress.textContent = inProgressTasks.length;
    countDone.textContent = doneTasks.length;

    // Render To Do Column
    if (todoTasks.length === 0) {
      dropzoneTodo.appendChild(createEmptyStateElement('todo', isFiltered));
    } else {
      todoTasks.forEach(task => {
        dropzoneTodo.appendChild(createTaskCardElement(task));
      });
    }

    // Render In Progress Column
    if (inProgressTasks.length === 0) {
      dropzoneInProgress.appendChild(createEmptyStateElement('in-progress', isFiltered));
    } else {
      inProgressTasks.forEach(task => {
        dropzoneInProgress.appendChild(createTaskCardElement(task));
      });
    }

    // Render Done Column
    if (doneTasks.length === 0) {
      dropzoneDone.appendChild(createEmptyStateElement('done', isFiltered));
    } else {
      doneTasks.forEach(task => {
        dropzoneDone.appendChild(createTaskCardElement(task));
      });
    }

    // Update Banner state
    updateFilterStatusBanner(filtered.length);

    // Refresh dashboard statistics
    updateDashboardStatistics();
  }

  /**
   * Updates the filter notification banner when search or priority filter is active.
   * @param {number} matchingCount - Number of tasks currently matching
   */
  function updateFilterStatusBanner(matchingCount) {
    const isFiltered = Boolean(currentSearchQuery.trim() || currentPriorityFilter !== 'all');

    if (isFiltered) {
      let filterDescriptions = [];
      if (currentSearchQuery.trim()) {
        filterDescriptions.push(`keyword "${currentSearchQuery.trim()}"`);
      }
      if (currentPriorityFilter !== 'all') {
        filterDescriptions.push(`priority "${currentPriorityFilter}"`);
      }

      filterStatusText.textContent = `Showing ${matchingCount} of ${tasks.length} tasks matching ${filterDescriptions.join(' and ')}`;
      filterStatusBanner.style.display = 'flex';
      resetFiltersBtn.style.display = 'inline-flex';
    } else {
      filterStatusBanner.style.display = 'none';
      resetFiltersBtn.style.display = 'none';
    }
  }

  /* ==========================================================================
     7. HTML5 DRAG-AND-DROP LOGIC
     ========================================================================== */

  const dropzones = [dropzoneTodo, dropzoneInProgress, dropzoneDone];

  function clearDropzoneHighlights() {
    dropzones.forEach(zone => zone.classList.remove('drag-over'));
  }

  /**
   * Setup drag and drop event listeners on each column dropzone.
   */
  dropzones.forEach(zone => {
    // Drag Over: Necessary to allow a drop
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });

    // Drag Enter
    zone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    // Drag Leave
    zone.addEventListener('dragleave', (e) => {
      // Only remove if leaving the dropzone boundary itself
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over');
      }
    });

    // Drop Event
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');

      const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
      const targetStatus = zone.dataset.status;

      if (!taskId || !targetStatus) return;

      moveTaskToStatus(taskId, targetStatus);
    });
  });

  /**
   * Moves a task to a target column status and triggers persistence.
   * @param {string} taskId - ID of the task to move
   * @param {'todo' | 'in-progress' | 'done'} newStatus - New status
   */
  function moveTaskToStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    if (task.status === newStatus) return; // No change

    const previousStatus = task.status;
    task.status = newStatus;

    saveTasksToStorage();
    renderBoard();

    // Friendly status labels for feedback toast
    const statusLabels = {
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'done': 'Done'
    };

    showToast(`Task moved to ${statusLabels[newStatus]}`, 'info');
  }

  /* ==========================================================================
     8. TASK CREATION & EDITING MODAL
     ========================================================================== */

  /**
   * Reset the task form and clear validation errors.
   */
  function resetTaskForm() {
    taskForm.reset();
    taskIdInput.value = '';
    titleError.classList.remove('active');
    taskTitleInput.classList.remove('has-error');
    charCount.textContent = '0';
    taskPrioritySelect.value = 'medium';
    taskStatusSelect.value = 'todo';
  }

  /**
   * Opens modal in "Create Task" mode.
   * @param {string} defaultStatus - Optional column to pre-select
   */
  function openCreateModal(defaultStatus = 'todo') {
    resetTaskForm();
    modalTitle.textContent = 'Create New Task';
    modalSubtitle.textContent = 'Fill in the details below to add a card to your board.';
    modalSubmitBtn.textContent = 'Create Task';
    taskStatusSelect.value = defaultStatus;

    taskModalOverlay.classList.add('active');
    taskModalOverlay.setAttribute('aria-hidden', 'false');

    // Auto-focus title input
    setTimeout(() => {
      taskTitleInput.focus();
    }, 100);
  }

  /**
   * Opens modal in "Edit Task" mode with fields pre-populated.
   * @param {string} taskId - Target task ID
   */
  function openEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    resetTaskForm();
    modalTitle.textContent = 'Edit Task';
    modalSubtitle.textContent = 'Update the task information and save changes.';
    modalSubmitBtn.textContent = 'Save Changes';

    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description || '';
    taskStatusSelect.value = task.status;
    taskPrioritySelect.value = task.priority;
    taskDeadlineInput.value = task.deadline || '';
    charCount.textContent = (task.description || '').length;

    taskModalOverlay.classList.add('active');
    taskModalOverlay.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      taskTitleInput.focus();
    }, 100);
  }

  /**
   * Closes the Task Create/Edit modal.
   */
  function closeTaskModal() {
    taskModalOverlay.classList.remove('active');
    taskModalOverlay.setAttribute('aria-hidden', 'true');
    resetTaskForm();
  }

  // Live validation on typing
  taskTitleInput.addEventListener('input', () => {
    if (taskTitleInput.value.trim().length > 0) {
      titleError.classList.remove('active');
      taskTitleInput.classList.remove('has-error');
    }
  });

  // Live character counter for description
  taskDescriptionInput.addEventListener('input', () => {
    charCount.textContent = taskDescriptionInput.value.length;
  });

  // Modal Open Buttons
  topAddBtn.addEventListener('click', () => openCreateModal('todo'));
  openAddModalBtn.addEventListener('click', () => openCreateModal('todo'));

  // Quick Add Buttons on Column Headers
  document.querySelectorAll('.column-quick-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const columnStatus = btn.dataset.status || 'todo';
      openCreateModal(columnStatus);
    });
  });

  // Modal Close & Cancel
  modalCloseBtn.addEventListener('click', closeTaskModal);
  modalCancelBtn.addEventListener('click', closeTaskModal);

  // Form Submit Handler (Handles both Create and Edit)
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const status = taskStatusSelect.value;
    const priority = taskPrioritySelect.value;
    const deadline = taskDeadlineInput.value;
    const existingId = taskIdInput.value;

    // Validate title presence
    if (!title) {
      titleError.classList.add('active');
      taskTitleInput.classList.add('has-error');
      taskTitleInput.focus();
      return;
    }

    if (existingId) {
      // --- UPDATE EXISTING TASK ---
      const index = tasks.findIndex(t => t.id === existingId);
      if (index !== -1) {
        tasks[index].title = title;
        tasks[index].description = description;
        tasks[index].status = status;
        tasks[index].priority = priority;
        tasks[index].deadline = deadline;
        tasks[index].updatedAt = new Date().toISOString();

        saveTasksToStorage();
        renderBoard();
        closeTaskModal();
        showToast('Task updated successfully', 'success');
      }
    } else {
      // --- CREATE NEW TASK ---
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: title,
        description: description,
        status: status,
        priority: priority,
        deadline: deadline,
        createdAt: new Date().toISOString()
      };

      tasks.unshift(newTask); // Add to beginning
      saveTasksToStorage();
      renderBoard();
      closeTaskModal();
      showToast('Task created successfully', 'success');
    }
  });

  /* ==========================================================================
     9. DELETE CONFIRMATION MODAL
     ========================================================================== */

  /**
   * Opens the confirmation dialog before deleting a task.
   * @param {string} taskId - Target task ID
   */
  function openDeleteConfirmation(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    pendingDeleteTaskId = taskId;
    deleteTaskTitle.textContent = `"${task.title}"`;
    deleteModalOverlay.classList.add('active');
    deleteModalOverlay.setAttribute('aria-hidden', 'false');
  }

  /**
   * Closes the delete confirmation modal.
   */
  function closeDeleteModal() {
    deleteModalOverlay.classList.remove('active');
    deleteModalOverlay.setAttribute('aria-hidden', 'true');
    pendingDeleteTaskId = null;
  }

  deleteCancelBtn.addEventListener('click', closeDeleteModal);

  deleteConfirmBtn.addEventListener('click', () => {
    if (!pendingDeleteTaskId) return;

    const taskIndex = tasks.findIndex(t => t.id === pendingDeleteTaskId);
    if (taskIndex !== -1) {
      const removed = tasks.splice(taskIndex, 1);
      saveTasksToStorage();
      renderBoard();
      closeDeleteModal();
      showToast(`Task deleted`, 'danger');
    }
  });

  /* ==========================================================================
     10. SEARCH & FILTERING INTERACTIONS
     ========================================================================== */

  // Search input live filtering
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    if (currentSearchQuery.length > 0) {
      clearSearchBtn.style.display = 'flex';
    } else {
      clearSearchBtn.style.display = 'none';
    }
    renderBoard();
  });

  // Clear search button
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    renderBoard();
  });

  // Priority select filter
  priorityFilter.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value;
    renderBoard();
  });

  // Reset Filters button
  function resetAllFilters() {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.style.display = 'none';
    priorityFilter.value = 'all';
    currentPriorityFilter = 'all';
    renderBoard();
  }

  resetFiltersBtn.addEventListener('click', resetAllFilters);
  bannerClearFilters.addEventListener('click', resetAllFilters);

  /* ==========================================================================
     11. ACCESSIBILITY & GLOBAL KEYBOARD EVENTS
     ========================================================================== */

  // Close modals on Escape key press
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (taskModalOverlay.classList.contains('active')) {
        closeTaskModal();
      }
      if (deleteModalOverlay.classList.contains('active')) {
        closeDeleteModal();
      }
      if (sidebar.classList.contains('mobile-open')) {
        closeMobileSidebar();
      }
    }
  });

  // Close modals on backdrop click
  taskModalOverlay.addEventListener('click', (e) => {
    if (e.target === taskModalOverlay) {
      closeTaskModal();
    }
  });

  deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === deleteModalOverlay) {
      closeDeleteModal();
    }
  });

  /* ==========================================================================
     12. MOBILE SIDEBAR DRAWER NAVIGATION
     ========================================================================== */

  function openMobileSidebar() {
    sidebar.classList.add('mobile-open');
    sidebarBackdrop.classList.add('active');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    sidebarBackdrop.classList.remove('active');
  }

  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', openMobileSidebar);
  }
  if (mobileSidebarClose) {
    mobileSidebarClose.addEventListener('click', closeMobileSidebar);
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  /* ==========================================================================
     13. DATE DISPLAY INITIALIZATION
     ========================================================================== */

  /**
   * Sets today's date formatted nicely in the topbar.
   */
  function initializeDateDisplay() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateText.textContent = today.toLocaleDateString('en-US', options);
  }

  /* ==========================================================================
     14. APPLICATION BOOTSTRAP
     ========================================================================== */

  function initApp() {
    initializeDateDisplay();
    loadTasksFromStorage();
    renderBoard();
    console.log('SprintBoard successfully initialized with', tasks.length, 'tasks.');
  }

  // Start application once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();

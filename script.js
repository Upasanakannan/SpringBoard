/**
 * SprintBoard - Modern Project Management Application
 * Complete Vanilla JavaScript Implementation
 * 
 * Features:
 * - Multi-view Single-Page App: Project Board, Roadmap, Analytics, and Settings
 * - Full Dark & Light Theme system with instant toggle and persistence
 * - Real-time HTML5 Drag-and-Drop Kanban Board
 * - Strategic Roadmap with Milestones CRUD & Chronological Task Timeline
 * - Real-Time Analytics Dashboard with semantic CSS charts & Project Health AI Insights
 * - LocalStorage persistence for Tasks, Milestones, and User Settings
 * - Accessible Modals, Toast Notifications, and Mobile Drawer Navigation
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONSTANTS & APPLICATION STATE
     ========================================================================== */

  const STORAGE_KEYS = {
    TASKS: 'sprintboard_tasks_v1',
    INITIALIZED: 'sprintboard_has_initialized_v1',
    SETTINGS: 'sprintboard_settings_v1',
    MILESTONES: 'sprintboard_milestones_v1'
  };

  // In-memory repositories
  let tasks = [];
  let milestones = [];
  let settings = {
    userName: 'Upasana Kannan',
    userRole: 'Product Lead',
    projectName: 'SprintBoard',
    theme: 'light',
    notifications: true,
    defaultPriority: 'medium'
  };

  // Active view & filter state
  let currentView = 'board'; // 'board' | 'roadmap' | 'analytics' | 'settings'
  let currentSearchQuery = '';
  let currentPriorityFilter = 'all';
  let currentTimelineFilter = 'all'; // 'all' | 'overdue' | 'in-progress' | 'upcoming' | 'done' | 'no-date'

  // Modal target tracking
  let pendingDeleteTaskId = null;
  let pendingDeleteMilestoneId = null;
  let draggedTaskId = null;

  /* ==========================================================================
     2. DOM ELEMENTS SELECTION
     ========================================================================== */

  // Navigation Links & Views
  const navBoard = document.getElementById('navBoard');
  const navRoadmap = document.getElementById('navRoadmap');
  const navAnalytics = document.getElementById('navAnalytics');
  const navSettings = document.getElementById('navSettings');

  const viewBoard = document.getElementById('viewBoard');
  const viewRoadmap = document.getElementById('viewRoadmap');
  const viewAnalytics = document.getElementById('viewAnalytics');
  const viewSettings = document.getElementById('viewSettings');

  // Sidebar Elements
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileSidebarClose = document.getElementById('mobileSidebarClose');
  const sidebarBrandName = document.getElementById('sidebarBrandName');
  const sidebarUserName = document.getElementById('sidebarUserName');
  const sidebarUserRole = document.getElementById('sidebarUserRole');
  const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
  const navTaskCount = document.getElementById('navTaskCount');

  // Topbar Elements
  const currentDateText = document.getElementById('currentDateText');
  const quickThemeToggle = document.getElementById('quickThemeToggle');
  const topAddBtn = document.getElementById('topAddBtn');

  // Board View Elements: Summary Metrics
  const statTotal = document.getElementById('statTotal');
  const statInProgress = document.getElementById('statInProgress');
  const statCompleted = document.getElementById('statCompleted');
  const statProgressPercent = document.getElementById('statProgressPercent');
  const statProgressBar = document.getElementById('statProgressBar');
  const statProgressFraction = document.getElementById('statProgressFraction');

  // Board View Elements: Column Badges & Dropzones
  const countTodo = document.getElementById('countTodo');
  const countInProgress = document.getElementById('countInProgress');
  const countDone = document.getElementById('countDone');
  const dropzoneTodo = document.getElementById('dropzoneTodo');
  const dropzoneInProgress = document.getElementById('dropzoneInProgress');
  const dropzoneDone = document.getElementById('dropzoneDone');

  // Board View Elements: Search & Filters
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const priorityFilter = document.getElementById('priorityFilter');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const filterStatusBanner = document.getElementById('filterStatusBanner');
  const filterStatusText = document.getElementById('filterStatusText');
  const bannerClearFilters = document.getElementById('bannerClearFilters');
  const openAddModalBtn = document.getElementById('openAddModalBtn');

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

  // Delete Task Modal Elements
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteTaskTitle = document.getElementById('deleteTaskTitle');
  const deleteCancelBtn = document.getElementById('deleteCancelBtn');
  const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

  // Roadmap Elements
  const openAddMilestoneBtn = document.getElementById('openAddMilestoneBtn');
  const roadmapMilestoneCount = document.getElementById('roadmapMilestoneCount');
  const roadmapScheduledTasksCount = document.getElementById('roadmapScheduledTasksCount');
  const roadmapCompletionRate = document.getElementById('roadmapCompletionRate');
  const roadmapProgressBar = document.getElementById('roadmapProgressBar');
  const milestonesGrid = document.getElementById('milestonesGrid');
  const timelineContainer = document.getElementById('timelineContainer');

  // Timeline Filter Counter Spans
  const tlFilterAllCount = document.getElementById('tlFilterAllCount');
  const tlFilterOverdueCount = document.getElementById('tlFilterOverdueCount');
  const tlFilterProgCount = document.getElementById('tlFilterProgCount');
  const tlFilterUpcomingCount = document.getElementById('tlFilterUpcomingCount');
  const tlFilterDoneCount = document.getElementById('tlFilterDoneCount');
  const tlFilterNoDateCount = document.getElementById('tlFilterNoDateCount');

  // Milestone Modal Elements
  const milestoneModalOverlay = document.getElementById('milestoneModalOverlay');
  const milestoneModalCloseBtn = document.getElementById('milestoneModalCloseBtn');
  const milestoneForm = document.getElementById('milestoneForm');
  const milestoneIdInput = document.getElementById('milestoneIdInput');
  const milestoneModalTitle = document.getElementById('milestoneModalTitle');
  const milestoneTitle = document.getElementById('milestoneTitle');
  const milestoneTargetDate = document.getElementById('milestoneTargetDate');
  const milestoneDesc = document.getElementById('milestoneDesc');
  const milestoneCancelBtn = document.getElementById('milestoneCancelBtn');
  const milestoneSubmitBtn = document.getElementById('milestoneSubmitBtn');
  const milestoneTitleError = document.getElementById('milestoneTitleError');
  const milestoneDateError = document.getElementById('milestoneDateError');

  // Delete Milestone Modal Elements
  const deleteMilestoneModalOverlay = document.getElementById('deleteMilestoneModalOverlay');
  const deleteMilestoneTitleText = document.getElementById('deleteMilestoneTitleText');
  const deleteMilestoneCancelBtn = document.getElementById('deleteMilestoneCancelBtn');
  const deleteMilestoneConfirmBtn = document.getElementById('deleteMilestoneConfirmBtn');

  // Analytics Elements
  const analyticsTotal = document.getElementById('analyticsTotal');
  const analyticsTotalSub = document.getElementById('analyticsTotalSub');
  const analyticsRate = document.getElementById('analyticsRate');
  const analyticsRateSub = document.getElementById('analyticsRateSub');
  const analyticsActiveLoad = document.getElementById('analyticsActiveLoad');
  const analyticsActiveLoadSub = document.getElementById('analyticsActiveLoadSub');
  const analyticsOverdue = document.getElementById('analyticsOverdue');
  const analyticsOverdueSub = document.getElementById('analyticsOverdueSub');

  const distTodoCount = document.getElementById('distTodoCount');
  const distTodoPct = document.getElementById('distTodoPct');
  const distTodoBar = document.getElementById('distTodoBar');
  const distProgCount = document.getElementById('distProgCount');
  const distProgPct = document.getElementById('distProgPct');
  const distProgBar = document.getElementById('distProgBar');
  const distDoneCount = document.getElementById('distDoneCount');
  const distDonePct = document.getElementById('distDonePct');
  const distDoneBar = document.getElementById('distDoneBar');

  const distHighCount = document.getElementById('distHighCount');
  const distHighPct = document.getElementById('distHighPct');
  const distHighBar = document.getElementById('distHighBar');
  const distMedCount = document.getElementById('distMedCount');
  const distMedPct = document.getElementById('distMedPct');
  const distMedBar = document.getElementById('distMedBar');
  const distLowCount = document.getElementById('distLowCount');
  const distLowPct = document.getElementById('distLowPct');
  const distLowBar = document.getElementById('distLowBar');

  const projectHealthBadge = document.getElementById('projectHealthBadge');
  const projectHealthSummary = document.getElementById('projectHealthSummary');
  const urgentItemsList = document.getElementById('urgentItemsList');
  const velocityLogContainer = document.getElementById('velocityLogContainer');

  // Settings Elements
  const settingsForm = document.getElementById('settingsForm');
  const settingUserName = document.getElementById('settingUserName');
  const settingUserRole = document.getElementById('settingUserRole');
  const settingProjectName = document.getElementById('settingProjectName');
  const settingThemeToggle = document.getElementById('settingThemeToggle');
  const settingNotificationsToggle = document.getElementById('settingNotificationsToggle');
  const settingDefaultPriority = document.getElementById('settingDefaultPriority');
  const resetSettingsBtn = document.getElementById('resetSettingsBtn');

  // Clear All Tasks Modal Elements
  const openClearAllModalBtn = document.getElementById('openClearAllModalBtn');
  const clearAllTasksModalOverlay = document.getElementById('clearAllTasksModalOverlay');
  const clearAllCancelBtn = document.getElementById('clearAllCancelBtn');
  const clearAllConfirmBtn = document.getElementById('clearAllConfirmBtn');

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
    return String(str)
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
   * Display a non-blocking toast message.
   * Respects user notification preference toggle stored in settings.
   * @param {string} message - Text to display
   * @param {'success' | 'danger' | 'info'} type - Toast styling variant
   */
  function showToast(message, type = 'success') {
    if (!settings.notifications && type === 'info') {
      return; // Suppress minor info toasts if user disabled notifications
    }

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
   * Save tasks array to browser localStorage.
   */
  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
      showToast('Storage quota exceeded. Unable to save tasks.', 'danger');
    }
  }

  /**
   * Save milestones array to browser localStorage.
   */
  function saveMilestonesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(milestones));
    } catch (e) {
      console.error('Failed to save milestones:', e);
      showToast('Storage quota exceeded. Unable to save milestones.', 'danger');
    }
  }

  /**
   * Save settings object to browser localStorage.
   */
  function saveSettingsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings:', e);
      showToast('Storage quota exceeded. Unable to save settings.', 'danger');
    }
  }

  /**
   * Load settings from localStorage or apply default values.
   */
  function loadSettingsFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        settings = Object.assign({}, settings, parsed);
      } catch (e) {
        console.error('Error parsing stored settings:', e);
      }
    }
    applySettingsToUI();
  }

  /**
   * Load milestones from localStorage or initialize with defaults.
   */
  function loadMilestonesFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEYS.MILESTONES);
    if (stored) {
      try {
        milestones = JSON.parse(stored) || [];
      } catch (e) {
        console.error('Error parsing stored milestones:', e);
        milestones = [];
      }
    } else {
      // First visit: Seed 2 realistic project milestones
      milestones = [
        {
          id: 'ms_' + Date.now() + '_1',
          title: 'Sprint 1: Core Board & Persistence',
          targetDate: getRelativeDateString(5),
          description: 'Deliver responsive Kanban columns, LocalStorage syncing, and HTML5 drag-and-drop interactions.',
          createdAt: new Date().toISOString()
        },
        {
          id: 'ms_' + Date.now() + '_2',
          title: 'Sprint 2: Analytics & Roadmap Release',
          targetDate: getRelativeDateString(14),
          description: 'Integrate live velocity metrics, theme customizer, and chronological timeline horizon.',
          createdAt: new Date().toISOString()
        }
      ];
      saveMilestonesToStorage();
    }
  }

  /**
   * Load tasks from localStorage or initialize sample tasks on first launch.
   */
  function loadTasksFromStorage() {
    const hasInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (!hasInitialized) {
      tasks = [
        {
          id: 'task_' + Date.now() + '_1',
          title: 'Design UI Wireframes & Design System',
          description: 'Establish typography, purple brand color palette, and Kanban column layouts.',
          priority: 'medium',
          status: 'done',
          deadline: getRelativeDateString(-2),
          createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 86400000).toISOString()
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
          deadline: getRelativeDateString(-1), // Overdue to demonstrate alert highlighting
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
        },
        {
          id: 'task_' + Date.now() + '_6',
          title: 'Conduct Team Backlog Grooming Session',
          description: 'Review upcoming priorities and allocate capacity without fixed due dates.',
          priority: 'low',
          status: 'todo',
          deadline: '', // Intentionally no deadline to test undated handling
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
      saveTasksToStorage();
    } else {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (stored) {
        try {
          tasks = JSON.parse(stored) || [];
        } catch (e) {
          console.error('Error parsing stored tasks:', e);
          tasks = [];
        }
      } else {
        tasks = [];
      }
    }
  }

  /* ==========================================================================
     5. VIEW SWITCHING & NAVIGATION ROUTER
     ========================================================================== */

  /**
   * Switch the active view container and update navigation styles.
   * @param {'board' | 'roadmap' | 'analytics' | 'settings'} viewName
   */
  function switchView(viewName) {
    currentView = viewName;

    // Update Sidebar link active states
    [navBoard, navRoadmap, navAnalytics, navSettings].forEach(nav => {
      if (nav) nav.classList.remove('active');
    });

    // Hide all view containers
    [viewBoard, viewRoadmap, viewAnalytics, viewSettings].forEach(view => {
      if (view) {
        view.classList.remove('active');
        view.style.display = 'none';
      }
    });

    if (viewName === 'board') {
      navBoard.classList.add('active');
      viewBoard.style.display = 'block';
      viewBoard.classList.add('active');
      renderBoard();
    } else if (viewName === 'roadmap') {
      navRoadmap.classList.add('active');
      viewRoadmap.style.display = 'block';
      viewRoadmap.classList.add('active');
      renderRoadmap();
    } else if (viewName === 'analytics') {
      navAnalytics.classList.add('active');
      viewAnalytics.style.display = 'block';
      viewAnalytics.classList.add('active');
      renderAnalytics();
    } else if (viewName === 'settings') {
      navSettings.classList.add('active');
      viewSettings.style.display = 'block';
      viewSettings.classList.add('active');
      populateSettingsForm();
    }

    // Close mobile drawer on navigation
    closeMobileSidebar();
  }

  // Sidebar Nav Event Listeners
  navBoard.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('board');
  });

  navRoadmap.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('roadmap');
  });

  navAnalytics.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('analytics');
  });

  navSettings.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('settings');
  });

  /* ==========================================================================
     6. THEME MANAGEMENT & SETTINGS
     ========================================================================== */

  /**
   * Applies the theme ('light' or 'dark') to document root and updates toggles.
   * @param {'light' | 'dark'} themeName
   */
  function applyTheme(themeName) {
    settings.theme = themeName;
    if (themeName === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (settingThemeToggle) settingThemeToggle.checked = true;
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (settingThemeToggle) settingThemeToggle.checked = false;
    }
  }

  /**
   * Applies settings values to the UI (sidebar names, project name, theme).
   */
  function applySettingsToUI() {
    applyTheme(settings.theme || 'light');

    if (sidebarUserName) sidebarUserName.textContent = settings.userName || 'Sprint Manager';
    if (sidebarUserRole) sidebarUserRole.textContent = settings.userRole || 'Product Lead';

    // Generate user initials
    if (sidebarUserAvatar) {
      const nameParts = (settings.userName || 'PM').trim().split(' ');
      const initials = nameParts.length >= 2 
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase() 
        : nameParts[0].substring(0, 2).toUpperCase();
      sidebarUserAvatar.textContent = initials;
    }

    // Update Project / Brand Name
    if (sidebarBrandName) {
      const pName = settings.projectName || 'SprintBoard';
      if (pName.toLowerCase().startsWith('sprint')) {
        const remainder = pName.substring(6);
        sidebarBrandName.innerHTML = `Sprint<span class="brand-highlight">${escapeHtml(remainder || 'Board')}</span>`;
      } else {
        sidebarBrandName.innerHTML = `<span class="brand-highlight">${escapeHtml(pName)}</span>`;
      }
      document.title = `${settings.projectName || 'SprintBoard'} - Project Management Board`;
    }
  }

  /**
   * Populates the settings form with current stored preferences.
   */
  function populateSettingsForm() {
    if (settingUserName) settingUserName.value = settings.userName;
    if (settingUserRole) settingUserRole.value = settings.userRole;
    if (settingProjectName) settingProjectName.value = settings.projectName;
    if (settingThemeToggle) settingThemeToggle.checked = settings.theme === 'dark';
    if (settingNotificationsToggle) settingNotificationsToggle.checked = settings.notifications;
    if (settingDefaultPriority) settingDefaultPriority.value = settings.defaultPriority || 'medium';
  }

  // Quick theme toggle button in Topbar
  if (quickThemeToggle) {
    quickThemeToggle.addEventListener('click', () => {
      const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      saveSettingsToStorage();
      showToast(`Switched to ${nextTheme} theme`, 'info');
    });
  }

  // Settings page theme toggle change handler
  if (settingThemeToggle) {
    settingThemeToggle.addEventListener('change', (e) => {
      const theme = e.target.checked ? 'dark' : 'light';
      applyTheme(theme);
    });
  }

  // Settings Form Submit Handler
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newUserName = settingUserName.value.trim() || 'Sprint Manager';
      const newUserRole = settingUserRole.value.trim() || 'Product Lead';
      const newProjectName = settingProjectName.value.trim() || 'SprintBoard';
      const newTheme = settingThemeToggle.checked ? 'dark' : 'light';
      const newNotifications = settingNotificationsToggle.checked;
      const newPriority = settingDefaultPriority.value;

      settings = {
        userName: newUserName,
        userRole: newUserRole,
        projectName: newProjectName,
        theme: newTheme,
        notifications: newNotifications,
        defaultPriority: newPriority
      };

      saveSettingsToStorage();
      applySettingsToUI();
      showToast('Settings saved successfully!', 'success');
    });
  }

  // Reset Settings to Defaults Button
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', () => {
      settings = {
        userName: 'Upasana Kannan',
        userRole: 'Product Lead',
        projectName: 'SprintBoard',
        theme: 'light',
        notifications: true,
        defaultPriority: 'medium'
      };

      saveSettingsToStorage();
      applySettingsToUI();
      populateSettingsForm();
      showToast('Settings reset to defaults', 'info');
    });
  }

  // Danger Zone: Clear All Tasks Modal Controls
  if (openClearAllModalBtn) {
    openClearAllModalBtn.addEventListener('click', () => {
      clearAllTasksModalOverlay.classList.add('active');
      clearAllTasksModalOverlay.setAttribute('aria-hidden', 'false');
    });
  }

  function closeClearAllModal() {
    clearAllTasksModalOverlay.classList.remove('active');
    clearAllTasksModalOverlay.setAttribute('aria-hidden', 'true');
  }

  if (clearAllCancelBtn) {
    clearAllCancelBtn.addEventListener('click', closeClearAllModal);
  }

  if (clearAllConfirmBtn) {
    clearAllConfirmBtn.addEventListener('click', () => {
      tasks = [];
      saveTasksToStorage();
      closeClearAllModal();
      renderBoard();
      renderRoadmap();
      renderAnalytics();
      showToast('All tasks have been cleared from the board', 'danger');
    });
  }

  /* ==========================================================================
     7. DASHBOARD METRICS CALCULATION (SHARED)
     ========================================================================== */

  function updateDashboardStatistics() {
    const totalCount = tasks.length;
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const completedCount = tasks.filter(t => t.status === 'done').length;

    const completionPercent = totalCount > 0 
      ? Math.round((completedCount / totalCount) * 100) 
      : 0;

    if (statTotal) statTotal.textContent = totalCount;
    if (statInProgress) statInProgress.textContent = inProgressCount;
    if (statCompleted) statCompleted.textContent = completedCount;
    if (statProgressPercent) statProgressPercent.textContent = `${completionPercent}%`;
    if (statProgressBar) statProgressBar.style.width = `${completionPercent}%`;
    if (statProgressFraction) statProgressFraction.textContent = `${completedCount} of ${totalCount} tasks completed`;

    if (navTaskCount) navTaskCount.textContent = totalCount;
  }

  /* ==========================================================================
     8. KANBAN BOARD CARD RENDERING
     ========================================================================== */

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

  function createTaskCardElement(task) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.setAttribute('draggable', 'true');
    card.dataset.id = task.id;
    card.dataset.status = task.status;

    const deadlineStatus = getDeadlineStatus(task.deadline, task.status);
    let deadlineBadgeHtml = '';

    if (task.deadline) {
      const formattedDate = formatDisplayDate(task.deadline);
      if (deadlineStatus === 'overdue') {
        deadlineBadgeHtml = `
          <span class="deadline-badge overdue" title="Deadline has passed!">
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
    } else {
      deadlineBadgeHtml = `<span class="deadline-badge no-date">No deadline</span>`;
    }

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
          <select class="card-status-select" title="Change task status">
            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Done</option>
          </select>
        </div>
      </div>
    `;

    // Drag Start
    card.addEventListener('dragstart', (e) => {
      draggedTaskId = task.id;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
      setTimeout(() => {
        card.classList.add('is-dragging');
      }, 0);
    });

    // Drag End
    card.addEventListener('dragend', () => {
      card.classList.remove('is-dragging');
      draggedTaskId = null;
      clearDropzoneHighlights();
    });

    // Edit Button
    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(task.id);
    });

    // Delete Button
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDeleteConfirmation(task.id);
    });

    // Quick Status Select
    const statusSelect = card.querySelector('.card-status-select');
    statusSelect.addEventListener('change', (e) => {
      e.stopPropagation();
      moveTaskToStatus(task.id, e.target.value);
    });

    // Click card to edit
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('select')) return;
      openEditModal(task.id);
    });

    return card;
  }

  function getFilteredTasks() {
    const query = currentSearchQuery.trim().toLowerCase();
    const priority = currentPriorityFilter;

    return tasks.filter(task => {
      const matchesSearch = !query || 
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query));

      const matchesPriority = priority === 'all' || task.priority === priority;
      return matchesSearch && matchesPriority;
    });
  }

  function renderBoard() {
    dropzoneTodo.innerHTML = '';
    dropzoneInProgress.innerHTML = '';
    dropzoneDone.innerHTML = '';

    const filtered = getFilteredTasks();
    const isFiltered = Boolean(currentSearchQuery.trim() || currentPriorityFilter !== 'all');

    const todoTasks = filtered.filter(t => t.status === 'todo');
    const inProgressTasks = filtered.filter(t => t.status === 'in-progress');
    const doneTasks = filtered.filter(t => t.status === 'done');

    countTodo.textContent = todoTasks.length;
    countInProgress.textContent = inProgressTasks.length;
    countDone.textContent = doneTasks.length;

    if (todoTasks.length === 0) {
      dropzoneTodo.appendChild(createEmptyStateElement('todo', isFiltered));
    } else {
      todoTasks.forEach(task => dropzoneTodo.appendChild(createTaskCardElement(task)));
    }

    if (inProgressTasks.length === 0) {
      dropzoneInProgress.appendChild(createEmptyStateElement('in-progress', isFiltered));
    } else {
      inProgressTasks.forEach(task => dropzoneInProgress.appendChild(createTaskCardElement(task)));
    }

    if (doneTasks.length === 0) {
      dropzoneDone.appendChild(createEmptyStateElement('done', isFiltered));
    } else {
      doneTasks.forEach(task => dropzoneDone.appendChild(createTaskCardElement(task)));
    }

    updateFilterStatusBanner(filtered.length);
    updateDashboardStatistics();
  }

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
     9. HTML5 DRAG-AND-DROP HANDLERS
     ========================================================================== */

  const dropzones = [dropzoneTodo, dropzoneInProgress, dropzoneDone];

  function clearDropzoneHighlights() {
    dropzones.forEach(zone => zone.classList.remove('drag-over'));
  }

  dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragenter', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', (e) => {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove('drag-over');
      }
    });

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
   * Move task to a status, record completedAt timestamp if done, save, and sync views.
   */
  function moveTaskToStatus(taskId, newStatus) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    if (task.status === newStatus) return;

    task.status = newStatus;
    if (newStatus === 'done') {
      task.completedAt = new Date().toISOString();
    }

    saveTasksToStorage();
    renderBoard();

    // Re-render other views if active
    if (currentView === 'roadmap') renderRoadmap();
    if (currentView === 'analytics') renderAnalytics();

    const statusLabels = {
      'todo': 'To Do',
      'in-progress': 'In Progress',
      'done': 'Done'
    };
    showToast(`Task moved to ${statusLabels[newStatus]}`, 'info');
  }

  /* ==========================================================================
     10. TASK CREATION & EDITING MODAL
     ========================================================================== */

  function resetTaskForm() {
    taskForm.reset();
    taskIdInput.value = '';
    titleError.classList.remove('active');
    taskTitleInput.classList.remove('has-error');
    charCount.textContent = '0';
    // Use default priority from user settings!
    taskPrioritySelect.value = settings.defaultPriority || 'medium';
    taskStatusSelect.value = 'todo';
  }

  function openCreateModal(defaultStatus = 'todo') {
    resetTaskForm();
    modalTitle.textContent = 'Create New Task';
    modalSubtitle.textContent = 'Fill in the details below to add a card to your board.';
    modalSubmitBtn.textContent = 'Create Task';
    taskStatusSelect.value = defaultStatus;

    taskModalOverlay.classList.add('active');
    taskModalOverlay.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      taskTitleInput.focus();
    }, 100);
  }

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

  function closeTaskModal() {
    taskModalOverlay.classList.remove('active');
    taskModalOverlay.setAttribute('aria-hidden', 'true');
    resetTaskForm();
  }

  taskTitleInput.addEventListener('input', () => {
    if (taskTitleInput.value.trim().length > 0) {
      titleError.classList.remove('active');
      taskTitleInput.classList.remove('has-error');
    }
  });

  taskDescriptionInput.addEventListener('input', () => {
    charCount.textContent = taskDescriptionInput.value.length;
  });

  topAddBtn.addEventListener('click', () => openCreateModal('todo'));
  openAddModalBtn.addEventListener('click', () => openCreateModal('todo'));

  document.querySelectorAll('.column-quick-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openCreateModal(btn.dataset.status || 'todo');
    });
  });

  modalCloseBtn.addEventListener('click', closeTaskModal);
  modalCancelBtn.addEventListener('click', closeTaskModal);

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const status = taskStatusSelect.value;
    const priority = taskPrioritySelect.value;
    const deadline = taskDeadlineInput.value;
    const existingId = taskIdInput.value;

    if (!title) {
      titleError.classList.add('active');
      taskTitleInput.classList.add('has-error');
      taskTitleInput.focus();
      return;
    }

    if (existingId) {
      const index = tasks.findIndex(t => t.id === existingId);
      if (index !== -1) {
        tasks[index].title = title;
        tasks[index].description = description;
        tasks[index].status = status;
        tasks[index].priority = priority;
        tasks[index].deadline = deadline;
        tasks[index].updatedAt = new Date().toISOString();
        if (status === 'done' && !tasks[index].completedAt) {
          tasks[index].completedAt = new Date().toISOString();
        }

        saveTasksToStorage();
        renderBoard();
        if (currentView === 'roadmap') renderRoadmap();
        if (currentView === 'analytics') renderAnalytics();
        closeTaskModal();
        showToast('Task updated successfully', 'success');
      }
    } else {
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title: title,
        description: description,
        status: status,
        priority: priority,
        deadline: deadline,
        createdAt: new Date().toISOString(),
        completedAt: status === 'done' ? new Date().toISOString() : null
      };

      tasks.unshift(newTask);
      saveTasksToStorage();
      renderBoard();
      if (currentView === 'roadmap') renderRoadmap();
      if (currentView === 'analytics') renderAnalytics();
      closeTaskModal();
      showToast('Task created successfully', 'success');
    }
  });

  /* ==========================================================================
     11. DELETE TASK MODAL
     ========================================================================== */

  function openDeleteConfirmation(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    pendingDeleteTaskId = taskId;
    deleteTaskTitle.textContent = `"${task.title}"`;
    deleteModalOverlay.classList.add('active');
    deleteModalOverlay.setAttribute('aria-hidden', 'false');
  }

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
      tasks.splice(taskIndex, 1);
      saveTasksToStorage();
      renderBoard();
      if (currentView === 'roadmap') renderRoadmap();
      if (currentView === 'analytics') renderAnalytics();
      closeDeleteModal();
      showToast('Task deleted', 'danger');
    }
  });

  /* ==========================================================================
     12. SEARCH & BOARD FILTER INTERACTIONS
     ========================================================================== */

  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    clearSearchBtn.style.display = currentSearchQuery.length > 0 ? 'flex' : 'none';
    renderBoard();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    renderBoard();
  });

  priorityFilter.addEventListener('change', (e) => {
    currentPriorityFilter = e.target.value;
    renderBoard();
  });

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
     13. ROADMAP VIEW: MILESTONES & CHRONOLOGICAL TIMELINE
     ========================================================================== */

  function renderRoadmap() {
    renderMilestones();
    renderTimeline();
    updateRoadmapSummary();
  }

  /**
   * Calculate roadmap summary metrics and update progress bars.
   */
  function updateRoadmapSummary() {
    const totalCount = tasks.length;
    const datedTasks = tasks.filter(t => Boolean(t.deadline)).length;
    const completedCount = tasks.filter(t => t.status === 'done').length;
    const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    if (roadmapMilestoneCount) roadmapMilestoneCount.textContent = milestones.length;
    if (roadmapScheduledTasksCount) roadmapScheduledTasksCount.textContent = datedTasks;
    if (roadmapCompletionRate) roadmapCompletionRate.textContent = `${rate}%`;
    if (roadmapProgressBar) roadmapProgressBar.style.width = `${rate}%`;
  }

  /**
   * Render Strategic Milestones Grid.
   */
  function renderMilestones() {
    milestonesGrid.innerHTML = '';

    if (milestones.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      emptyDiv.style.gridColumn = '1 / -1';
      emptyDiv.innerHTML = `
        <div class="empty-state-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <div class="empty-state-title">No Milestones Defined</div>
        <div class="empty-state-text">Create milestone targets to group deliverables and track sprint velocity.</div>
      `;
      milestonesGrid.appendChild(emptyDiv);
      return;
    }

    // Sort milestones by target date
    const sorted = [...milestones].sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''));

    sorted.forEach(ms => {
      const card = document.createElement('div');
      card.className = 'milestone-card';

      // Check date status
      const deadlineStatus = getDeadlineStatus(ms.targetDate, 'todo');
      let statusBadge = '';
      if (deadlineStatus === 'overdue') {
        statusBadge = `<span class="milestone-status-chip overdue">Overdue</span>`;
      } else if (deadlineStatus === 'due-today') {
        statusBadge = `<span class="milestone-status-chip upcoming">Due Today</span>`;
      } else {
        statusBadge = `<span class="milestone-status-chip upcoming">Upcoming</span>`;
      }

      card.innerHTML = `
        <div class="milestone-header">
          <h3 class="milestone-title">${escapeHtml(ms.title)}</h3>
          <div class="milestone-actions">
            <button class="action-icon-btn ms-edit-btn" title="Edit Milestone" aria-label="Edit Milestone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="action-icon-btn ms-delete-btn delete-btn" title="Delete Milestone" aria-label="Delete Milestone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>

        ${ms.description ? `<p class="milestone-desc">${escapeHtml(ms.description)}</p>` : ''}

        <div class="milestone-footer">
          <span class="milestone-date-chip">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>Target: ${formatDisplayDate(ms.targetDate)}</span>
          </span>
          ${statusBadge}
        </div>
      `;

      card.querySelector('.ms-edit-btn').addEventListener('click', () => openEditMilestoneModal(ms.id));
      card.querySelector('.ms-delete-btn').addEventListener('click', () => openDeleteMilestoneModal(ms.id));

      milestonesGrid.appendChild(card);
    });
  }

  /**
   * Milestone Modal Functions
   */
  function openCreateMilestoneModal() {
    milestoneForm.reset();
    milestoneIdInput.value = '';
    milestoneModalTitle.textContent = 'Create Milestone';
    milestoneSubmitBtn.textContent = 'Save Milestone';
    milestoneTitleError.classList.remove('active');
    milestoneDateError.classList.remove('active');

    milestoneModalOverlay.classList.add('active');
    milestoneModalOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => milestoneTitle.focus(), 100);
  }

  function openEditMilestoneModal(id) {
    const ms = milestones.find(m => m.id === id);
    if (!ms) return;

    milestoneForm.reset();
    milestoneIdInput.value = ms.id;
    milestoneModalTitle.textContent = 'Edit Milestone';
    milestoneSubmitBtn.textContent = 'Save Changes';
    milestoneTitleError.classList.remove('active');
    milestoneDateError.classList.remove('active');

    milestoneTitle.value = ms.title;
    milestoneTargetDate.value = ms.targetDate || '';
    milestoneDesc.value = ms.description || '';

    milestoneModalOverlay.classList.add('active');
    milestoneModalOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => milestoneTitle.focus(), 100);
  }

  function closeMilestoneModal() {
    milestoneModalOverlay.classList.remove('active');
    milestoneModalOverlay.setAttribute('aria-hidden', 'true');
    milestoneForm.reset();
  }

  if (openAddMilestoneBtn) {
    openAddMilestoneBtn.addEventListener('click', openCreateMilestoneModal);
  }
  if (milestoneModalCloseBtn) {
    milestoneModalCloseBtn.addEventListener('click', closeMilestoneModal);
  }
  if (milestoneCancelBtn) {
    milestoneCancelBtn.addEventListener('click', closeMilestoneModal);
  }

  if (milestoneForm) {
    milestoneForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = milestoneTitle.value.trim();
      const targetDate = milestoneTargetDate.value;
      const desc = milestoneDesc.value.trim();
      const id = milestoneIdInput.value;

      let hasError = false;
      if (!title) {
        milestoneTitleError.classList.add('active');
        hasError = true;
      } else {
        milestoneTitleError.classList.remove('active');
      }

      if (!targetDate) {
        milestoneDateError.classList.add('active');
        hasError = true;
      } else {
        milestoneDateError.classList.remove('active');
      }

      if (hasError) return;

      if (id) {
        const idx = milestones.findIndex(m => m.id === id);
        if (idx !== -1) {
          milestones[idx].title = title;
          milestones[idx].targetDate = targetDate;
          milestones[idx].description = desc;
          saveMilestonesToStorage();
          renderMilestones();
          updateRoadmapSummary();
          closeMilestoneModal();
          showToast('Milestone updated', 'success');
        }
      } else {
        const newMs = {
          id: 'ms_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
          title: title,
          targetDate: targetDate,
          description: desc,
          createdAt: new Date().toISOString()
        };
        milestones.push(newMs);
        saveMilestonesToStorage();
        renderMilestones();
        updateRoadmapSummary();
        closeMilestoneModal();
        showToast('Milestone created', 'success');
      }
    });
  }

  function openDeleteMilestoneModal(id) {
    const ms = milestones.find(m => m.id === id);
    if (!ms) return;

    pendingDeleteMilestoneId = id;
    deleteMilestoneTitleText.textContent = `"${ms.title}"`;
    deleteMilestoneModalOverlay.classList.add('active');
    deleteMilestoneModalOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeDeleteMilestoneModal() {
    deleteMilestoneModalOverlay.classList.remove('active');
    deleteMilestoneModalOverlay.setAttribute('aria-hidden', 'true');
    pendingDeleteMilestoneId = null;
  }

  if (deleteMilestoneCancelBtn) {
    deleteMilestoneCancelBtn.addEventListener('click', closeDeleteMilestoneModal);
  }
  if (deleteMilestoneConfirmBtn) {
    deleteMilestoneConfirmBtn.addEventListener('click', () => {
      if (!pendingDeleteMilestoneId) return;
      const idx = milestones.findIndex(m => m.id === pendingDeleteMilestoneId);
      if (idx !== -1) {
        milestones.splice(idx, 1);
        saveMilestonesToStorage();
        renderMilestones();
        updateRoadmapSummary();
        closeDeleteMilestoneModal();
        showToast('Milestone deleted', 'danger');
      }
    });
  }

  /**
   * Render Chronological Task Timeline.
   */
  function renderTimeline() {
    timelineContainer.innerHTML = '';

    // Update Filter counts
    const overdueTasks = tasks.filter(t => getDeadlineStatus(t.deadline, t.status) === 'overdue');
    const inProgTasks = tasks.filter(t => t.status === 'in-progress');
    const upcomingTasks = tasks.filter(t => t.status === 'todo' && t.deadline && getDeadlineStatus(t.deadline, t.status) !== 'overdue');
    const doneTasks = tasks.filter(t => t.status === 'done');
    const noDateTasks = tasks.filter(t => !t.deadline);

    if (tlFilterAllCount) tlFilterAllCount.textContent = tasks.length;
    if (tlFilterOverdueCount) tlFilterOverdueCount.textContent = overdueTasks.length;
    if (tlFilterProgCount) tlFilterProgCount.textContent = inProgTasks.length;
    if (tlFilterUpcomingCount) tlFilterUpcomingCount.textContent = upcomingTasks.length;
    if (tlFilterDoneCount) tlFilterDoneCount.textContent = doneTasks.length;
    if (tlFilterNoDateCount) tlFilterNoDateCount.textContent = noDateTasks.length;

    // Filter tasks according to selected tab
    let displayTasks = [];
    if (currentTimelineFilter === 'all') {
      displayTasks = [...tasks];
    } else if (currentTimelineFilter === 'overdue') {
      displayTasks = overdueTasks;
    } else if (currentTimelineFilter === 'in-progress') {
      displayTasks = inProgTasks;
    } else if (currentTimelineFilter === 'upcoming') {
      displayTasks = upcomingTasks;
    } else if (currentTimelineFilter === 'done') {
      displayTasks = doneTasks;
    } else if (currentTimelineFilter === 'no-date') {
      displayTasks = noDateTasks;
    }

    if (displayTasks.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'empty-state';
      emptyNotice.innerHTML = `
        <div class="empty-state-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
        </div>
        <div class="empty-state-title">No Timeline Deliverables</div>
        <div class="empty-state-text">No tasks found for the "${currentTimelineFilter}" filter category.</div>
      `;
      timelineContainer.appendChild(emptyNotice);
      return;
    }

    // Sort chronologically by deadline; tasks without deadline come at the end
    displayTasks.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });

    displayTasks.forEach(task => {
      const item = document.createElement('div');
      const dlStatus = getDeadlineStatus(task.deadline, task.status);

      item.className = `timeline-item ${dlStatus === 'overdue' ? 'overdue' : ''} ${task.status === 'done' ? 'done' : ''}`;

      let deadlineLabel = '';
      if (task.deadline) {
        const formatted = formatDisplayDate(task.deadline);
        if (dlStatus === 'overdue') {
          deadlineLabel = `<span class="deadline-badge overdue">Overdue: ${formatted}</span>`;
        } else if (dlStatus === 'due-today') {
          deadlineLabel = `<span class="deadline-badge due-today">Due Today</span>`;
        } else {
          deadlineLabel = `<span class="deadline-badge">${formatted}</span>`;
        }
      } else {
        deadlineLabel = `<span class="deadline-badge no-date">No deadline set</span>`;
      }

      item.innerHTML = `
        <div class="timeline-item-left">
          <div class="timeline-item-meta">
            ${deadlineLabel}
            <span class="priority-badge priority-${escapeHtml(task.priority)}">
              <span class="priority-dot"></span>
              <span>${escapeHtml(task.priority)}</span>
            </span>
          </div>
          <h4 class="timeline-item-title">${escapeHtml(task.title)}</h4>
          ${task.description ? `<p class="timeline-item-desc">${escapeHtml(task.description)}</p>` : ''}
        </div>
        <div class="timeline-item-right">
          <span class="status-chip status-${task.status}">
            ${task.status === 'todo' ? 'To Do' : task.status === 'in-progress' ? 'In Progress' : 'Done'}
          </span>
          <button class="action-icon-btn edit-btn" title="Edit Task" aria-label="Edit Task">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
        </div>
      `;

      item.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task.id));
      timelineContainer.appendChild(item);
    });
  }

  // Timeline Filter Pill Buttons
  document.querySelectorAll('.timeline-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.timeline-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentTimelineFilter = pill.dataset.timelineFilter || 'all';
      renderTimeline();
    });
  });

  /* ==========================================================================
     14. ANALYTICS VIEW: CHARTS & HEALTH INSIGHTS
     ========================================================================== */

  function renderAnalytics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProg = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    const overdue = tasks.filter(t => getDeadlineStatus(t.deadline, t.status) === 'overdue').length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 1. KPI Cards
    if (analyticsTotal) analyticsTotal.textContent = total;
    if (analyticsTotalSub) analyticsTotalSub.textContent = `Across To Do, Progress & Done`;

    if (analyticsRate) analyticsRate.textContent = `${rate}%`;
    if (analyticsRateSub) analyticsRateSub.textContent = `${completed} of ${total} tasks closed`;

    if (analyticsActiveLoad) analyticsActiveLoad.textContent = inProg + todo;
    if (analyticsActiveLoadSub) analyticsActiveLoadSub.textContent = `${inProg} in progress, ${todo} backlog`;

    if (analyticsOverdue) analyticsOverdue.textContent = overdue;
    if (analyticsOverdueSub) analyticsOverdueSub.textContent = overdue > 0 ? `Requires immediate action` : `No overdue items`;

    // 2. Stage Distribution Bars
    const todoPct = total > 0 ? Math.round((todo / total) * 100) : 0;
    const progPct = total > 0 ? Math.round((inProg / total) * 100) : 0;
    const donePct = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (distTodoCount) distTodoCount.textContent = todo;
    if (distTodoPct) distTodoPct.textContent = `${todoPct}%`;
    if (distTodoBar) distTodoBar.style.width = `${todoPct}%`;

    if (distProgCount) distProgCount.textContent = inProg;
    if (distProgPct) distProgPct.textContent = `${progPct}%`;
    if (distProgBar) distProgBar.style.width = `${progPct}%`;

    if (distDoneCount) distDoneCount.textContent = completed;
    if (distDonePct) distDonePct.textContent = `${donePct}%`;
    if (distDoneBar) distDoneBar.style.width = `${donePct}%`;

    // 3. Priority Concentration Bars
    const highCount = tasks.filter(t => t.priority === 'high').length;
    const medCount = tasks.filter(t => t.priority === 'medium').length;
    const lowCount = tasks.filter(t => t.priority === 'low').length;

    const highPct = total > 0 ? Math.round((highCount / total) * 100) : 0;
    const medPct = total > 0 ? Math.round((medCount / total) * 100) : 0;
    const lowPct = total > 0 ? Math.round((lowCount / total) * 100) : 0;

    if (distHighCount) distHighCount.textContent = highCount;
    if (distHighPct) distHighPct.textContent = `${highPct}%`;
    if (distHighBar) distHighBar.style.width = `${highPct}%`;

    if (distMedCount) distMedCount.textContent = medCount;
    if (distMedPct) distMedPct.textContent = `${medPct}%`;
    if (distMedBar) distMedBar.style.width = `${medPct}%`;

    if (distLowCount) distLowCount.textContent = lowCount;
    if (distLowPct) distLowPct.textContent = `${lowPct}%`;
    if (distLowBar) distLowBar.style.width = `${lowPct}%`;

    // 4. Project Health & Actionable Insights
    renderProjectHealth(total, completed, overdue, highCount);

    // 5. Completion Velocity Log
    renderVelocityLog();
  }

  function renderProjectHealth(total, completed, overdue, highCount) {
    if (total === 0) {
      projectHealthBadge.className = 'health-pill on-track';
      projectHealthBadge.textContent = 'Empty Board';
      projectHealthSummary.textContent = 'No tasks currently scheduled. Add tasks to calculate project velocity and health scores.';
      urgentItemsList.innerHTML = '';
      return;
    }

    if (overdue > 0) {
      projectHealthBadge.className = 'health-pill at-risk';
      projectHealthBadge.textContent = 'At Risk';
      projectHealthSummary.textContent = `Warning: ${overdue} task(s) are currently overdue. Prioritize clearing overdue milestones to get delivery back on track.`;
    } else if (completed / total >= 0.7) {
      projectHealthBadge.className = 'health-pill on-track';
      projectHealthBadge.textContent = 'On Track';
      projectHealthSummary.textContent = `Great progress! ${Math.round((completed / total) * 100)}% of tasks are completed with zero overdue deadlines. Delivery horizon is healthy.`;
    } else {
      projectHealthBadge.className = 'health-pill attention';
      projectHealthBadge.textContent = 'In Progress';
      projectHealthSummary.textContent = `Sprint execution is progressing steadily with ${tasks.filter(t => t.status === 'in-progress').length} active deliverable(s) underway.`;
    }

    // Top 3 urgent items
    urgentItemsList.innerHTML = '';
    const urgentTasks = tasks
      .filter(t => t.status !== 'done' && (getDeadlineStatus(t.deadline, t.status) === 'overdue' || t.priority === 'high'))
      .slice(0, 3);

    if (urgentTasks.length > 0) {
      urgentTasks.forEach(task => {
        const row = document.createElement('div');
        row.className = 'urgent-item-row';
        row.innerHTML = `
          <span class="urgent-item-title">${escapeHtml(task.title)}</span>
          <span class="priority-badge priority-${escapeHtml(task.priority)}">
            <span class="priority-dot"></span>
            <span>${escapeHtml(task.priority)}</span>
          </span>
        `;
        urgentItemsList.appendChild(row);
      });
    }
  }

  function renderVelocityLog() {
    velocityLogContainer.innerHTML = '';

    const completedTasks = tasks.filter(t => t.status === 'done');

    if (completedTasks.length === 0) {
      velocityLogContainer.innerHTML = `
        <div class="velocity-empty-notice">
          No completed tasks logged yet. As you drag task cards into the "Done" column, completion timestamps are recorded in real-time and tracked here.
        </div>
      `;
      return;
    }

    // Sort by completedAt descending
    completedTasks.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));

    completedTasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'velocity-item';

      let dateDisplay = 'Completed';
      if (task.completedAt) {
        const d = new Date(task.completedAt);
        dateDisplay = `Completed on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }

      item.innerHTML = `
        <span class="velocity-item-title">${escapeHtml(task.title)}</span>
        <span class="velocity-item-date">${dateDisplay}</span>
      `;
      velocityLogContainer.appendChild(item);
    });
  }

  /* ==========================================================================
     15. ACCESSIBILITY & GLOBAL KEYBOARD EVENTS
     ========================================================================== */

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (taskModalOverlay.classList.contains('active')) closeTaskModal();
      if (deleteModalOverlay.classList.contains('active')) closeDeleteModal();
      if (milestoneModalOverlay.classList.contains('active')) closeMilestoneModal();
      if (deleteMilestoneModalOverlay.classList.contains('active')) closeDeleteMilestoneModal();
      if (clearAllTasksModalOverlay.classList.contains('active')) closeClearAllModal();
      if (sidebar.classList.contains('mobile-open')) closeMobileSidebar();
    }
  });

  // Modal Backdrop Click Closers
  [taskModalOverlay, deleteModalOverlay, milestoneModalOverlay, deleteMilestoneModalOverlay, clearAllTasksModalOverlay].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
        }
      });
    }
  });

  /* ==========================================================================
     16. MOBILE SIDEBAR DRAWER
     ========================================================================== */

  function openMobileSidebar() {
    sidebar.classList.add('mobile-open');
    sidebarBackdrop.classList.add('active');
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
    sidebarBackdrop.classList.remove('active');
  }

  if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', openMobileSidebar);
  if (mobileSidebarClose) mobileSidebarClose.addEventListener('click', closeMobileSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

  /* ==========================================================================
     17. DATE INITIALIZATION
     ========================================================================== */

  function initializeDateDisplay() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateText.textContent = today.toLocaleDateString('en-US', options);
  }

  /* ==========================================================================
     18. APPLICATION BOOTSTRAP
     ========================================================================== */

  function initApp() {
    initializeDateDisplay();
    loadSettingsFromStorage();
    loadTasksFromStorage();
    loadMilestonesFromStorage();

    // Check if initial URL hash points to a specific view
    const hash = window.location.hash.replace('#', '');
    if (hash && ['board', 'roadmap', 'analytics', 'settings'].includes(hash)) {
      switchView(hash);
    } else {
      switchView('board');
    }

    console.log('SprintBoard successfully loaded with', tasks.length, 'tasks and', milestones.length, 'milestones.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();

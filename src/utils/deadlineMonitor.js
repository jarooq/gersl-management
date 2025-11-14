/**
 * Deadline Monitoring Utility
 * Monitors task deadlines and provides alerting functionality
 */

/**
 * Calculate days until or since a deadline
 * @param {string} deadline - Deadline date string (YYYY-MM-DD)
 * @returns {Object} Object with days count and status
 */
export const calculateDeadlineStatus = (deadline) => {
  if (!deadline) {
    return {
      status: 'no_deadline',
      days: null,
      message: 'No deadline set'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      days: Math.abs(diffDays),
      message: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`,
      severity: 'critical'
    };
  } else if (diffDays === 0) {
    return {
      status: 'due_today',
      days: 0,
      message: 'Due today',
      severity: 'high'
    };
  } else if (diffDays === 1) {
    return {
      status: 'due_tomorrow',
      days: 1,
      message: 'Due tomorrow',
      severity: 'high'
    };
  } else if (diffDays <= 3) {
    return {
      status: 'approaching',
      days: diffDays,
      message: `Due in ${diffDays} days`,
      severity: 'medium'
    };
  } else if (diffDays <= 7) {
    return {
      status: 'upcoming',
      days: diffDays,
      message: `Due in ${diffDays} days`,
      severity: 'low'
    };
  } else {
    return {
      status: 'on_track',
      days: diffDays,
      message: `${diffDays} days remaining`,
      severity: 'none'
    };
  }
};

/**
 * Categorize tasks by deadline status
 * @param {Array} tasks - Array of task objects
 * @returns {Object} Categorized tasks
 */
export const categorizeTasksByDeadline = (tasks) => {
  const categories = {
    overdue: [],
    dueToday: [],
    dueTomorrow: [],
    approaching: [], // 2-3 days
    upcoming: [], // 4-7 days
    onTrack: [], // > 7 days
    noDeadline: []
  };

  tasks.forEach(task => {
    if (!task.deadline) {
      categories.noDeadline.push(task);
      return;
    }

    // Skip completed and cancelled tasks
    if (task.status === 'Completed' || task.status === 'Cancelled') {
      return;
    }

    const deadlineStatus = calculateDeadlineStatus(task.deadline);

    switch (deadlineStatus.status) {
      case 'overdue':
        categories.overdue.push({ ...task, deadlineInfo: deadlineStatus });
        break;
      case 'due_today':
        categories.dueToday.push({ ...task, deadlineInfo: deadlineStatus });
        break;
      case 'due_tomorrow':
        categories.dueTomorrow.push({ ...task, deadlineInfo: deadlineStatus });
        break;
      case 'approaching':
        categories.approaching.push({ ...task, deadlineInfo: deadlineStatus });
        break;
      case 'upcoming':
        categories.upcoming.push({ ...task, deadlineInfo: deadlineStatus });
        break;
      case 'on_track':
        categories.onTrack.push({ ...task, deadlineInfo: deadlineStatus });
        break;
      default:
        categories.noDeadline.push(task);
    }
  });

  // Sort each category by deadline (soonest first)
  Object.keys(categories).forEach(key => {
    if (key !== 'noDeadline' && key !== 'onTrack') {
      categories[key].sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      });
    }
  });

  return categories;
};

/**
 * Get tasks requiring immediate attention
 * @param {Array} tasks - Array of task objects
 * @returns {Array} Tasks requiring attention
 */
export const getTasksRequiringAttention = (tasks) => {
  const categories = categorizeTasksByDeadline(tasks);

  return [
    ...categories.overdue,
    ...categories.dueToday,
    ...categories.dueTomorrow,
    ...categories.approaching
  ];
};

/**
 * Calculate notification priority for a task
 * @param {Object} task - Task object
 * @returns {Object} Notification priority info
 */
export const calculateNotificationPriority = (task) => {
  if (!task.deadline) {
    return {
      priority: 'none',
      level: 0,
      shouldNotify: false
    };
  }

  // Skip completed and cancelled tasks
  if (task.status === 'Completed' || task.status === 'Cancelled') {
    return {
      priority: 'none',
      level: 0,
      shouldNotify: false
    };
  }

  const deadlineStatus = calculateDeadlineStatus(task.deadline);

  const priorityMap = {
    'overdue': {
      priority: 'critical',
      level: 5,
      shouldNotify: true,
      notifyDaily: true,
      escalate: deadlineStatus.days > 3 // Escalate if overdue by more than 3 days
    },
    'due_today': {
      priority: 'urgent',
      level: 4,
      shouldNotify: true,
      notifyImmediately: true
    },
    'due_tomorrow': {
      priority: 'high',
      level: 3,
      shouldNotify: true,
      notifyOnce: true
    },
    'approaching': {
      priority: 'medium',
      level: 2,
      shouldNotify: true,
      notifyOnce: true
    },
    'upcoming': {
      priority: 'low',
      level: 1,
      shouldNotify: task.priority === 'Critical' || task.priority === 'High', // Only notify for high-priority tasks
      notifyOnce: true
    },
    'on_track': {
      priority: 'none',
      level: 0,
      shouldNotify: false
    }
  };

  return {
    ...priorityMap[deadlineStatus.status],
    deadlineStatus,
    taskPriority: task.priority
  };
};

/**
 * Generate notification message for a task
 * @param {Object} task - Task object
 * @param {Object} notificationInfo - Notification priority info
 * @returns {Object} Notification message object
 */
export const generateNotificationMessage = (task, notificationInfo) => {
  if (!notificationInfo.shouldNotify) {
    return null;
  }

  const { deadlineStatus } = notificationInfo;

  let title = '';
  let message = '';
  let actions = [];

  switch (deadlineStatus.status) {
    case 'overdue':
      title = `⚠️ Task Overdue: ${task.name || task.title}`;
      message = `This task is overdue by ${deadlineStatus.days} day${deadlineStatus.days !== 1 ? 's' : ''}. Please take immediate action.`;
      actions = ['View Task', 'Update Status', 'Reschedule'];
      break;

    case 'due_today':
      title = `🔔 Task Due Today: ${task.name || task.title}`;
      message = 'This task is due today. Please ensure it is completed on time.';
      actions = ['View Task', 'Mark Complete'];
      break;

    case 'due_tomorrow':
      title = `📅 Task Due Tomorrow: ${task.name || task.title}`;
      message = 'This task is due tomorrow. Please plan accordingly.';
      actions = ['View Task'];
      break;

    case 'approaching':
      title = `⏰ Upcoming Deadline: ${task.name || task.title}`;
      message = `This task is due in ${deadlineStatus.days} days.`;
      actions = ['View Task'];
      break;

    case 'upcoming':
      title = `📌 Reminder: ${task.name || task.title}`;
      message = `This task is due in ${deadlineStatus.days} days.`;
      actions = ['View Task'];
      break;

    default:
      return null;
  }

  return {
    id: `notification-${task.id}-${Date.now()}`,
    taskId: task.id,
    projectId: task.projectId,
    type: 'deadline_alert',
    priority: notificationInfo.priority,
    title,
    message,
    actions,
    createdAt: new Date().toISOString(),
    read: false,
    assignees: task.assignees || [],
    deadline: task.deadline,
    deadlineStatus
  };
};

/**
 * Get notification schedule for a task
 * @param {Object} task - Task object
 * @returns {Array} Array of scheduled notification times
 */
export const getNotificationSchedule = (task) => {
  if (!task.deadline || !task.notifyOnDelay) {
    return [];
  }

  const deadlineDate = new Date(task.deadline);
  const schedule = [];

  // 7 days before
  const sevenDaysBefore = new Date(deadlineDate);
  sevenDaysBefore.setDate(deadlineDate.getDate() - 7);
  schedule.push({
    date: sevenDaysBefore.toISOString().split('T')[0],
    type: 'upcoming',
    message: '7 days until deadline'
  });

  // 3 days before
  const threeDaysBefore = new Date(deadlineDate);
  threeDaysBefore.setDate(deadlineDate.getDate() - 3);
  schedule.push({
    date: threeDaysBefore.toISOString().split('T')[0],
    type: 'approaching',
    message: '3 days until deadline'
  });

  // 1 day before
  const oneDayBefore = new Date(deadlineDate);
  oneDayBefore.setDate(deadlineDate.getDate() - 1);
  schedule.push({
    date: oneDayBefore.toISOString().split('T')[0],
    type: 'due_tomorrow',
    message: 'Due tomorrow'
  });

  // On deadline day
  schedule.push({
    date: task.deadline,
    type: 'due_today',
    message: 'Due today'
  });

  // Filter out past notification dates
  const today = new Date().toISOString().split('T')[0];
  return schedule.filter(s => s.date >= today);
};

/**
 * Check if a task needs notification sent
 * @param {Object} task - Task object
 * @param {Array} sentNotifications - Array of already sent notification IDs
 * @returns {boolean} Whether notification should be sent
 */
export const shouldSendNotification = (task, sentNotifications = []) => {
  if (!task.deadline || !task.notifyOnDelay) {
    return false;
  }

  // Don't notify for completed or cancelled tasks
  if (task.status === 'Completed' || task.status === 'Cancelled') {
    return false;
  }

  const notificationInfo = calculateNotificationPriority(task);

  if (!notificationInfo.shouldNotify) {
    return false;
  }

  // Check if notification was already sent for this task today
  const today = new Date().toISOString().split('T')[0];
  const notificationKey = `${task.id}-${today}`;

  if (sentNotifications.includes(notificationKey)) {
    // For overdue tasks, send daily reminders
    if (notificationInfo.notifyDaily) {
      return true;
    }
    return false;
  }

  return true;
};

/**
 * Format deadline display
 * @param {string} deadline - Deadline date string
 * @returns {string} Formatted deadline display
 */
export const formatDeadlineDisplay = (deadline) => {
  if (!deadline) {
    return 'No deadline';
  }

  const deadlineStatus = calculateDeadlineStatus(deadline);
  const deadlineDate = new Date(deadline);
  const formattedDate = deadlineDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return `${formattedDate} (${deadlineStatus.message})`;
};

/**
 * Get deadline color class based on status
 * @param {string} deadline - Deadline date string
 * @returns {string} Color class name
 */
export const getDeadlineColorClass = (deadline) => {
  if (!deadline) {
    return 'text-gray-500';
  }

  const deadlineStatus = calculateDeadlineStatus(deadline);

  const colorMap = {
    'overdue': 'text-red-600 font-semibold',
    'due_today': 'text-red-500 font-semibold',
    'due_tomorrow': 'text-orange-600 font-medium',
    'approaching': 'text-orange-500',
    'upcoming': 'text-yellow-600',
    'on_track': 'text-green-600',
    'no_deadline': 'text-gray-500'
  };

  return colorMap[deadlineStatus.status] || 'text-gray-600';
};

export default {
  calculateDeadlineStatus,
  categorizeTasksByDeadline,
  getTasksRequiringAttention,
  calculateNotificationPriority,
  generateNotificationMessage,
  getNotificationSchedule,
  shouldSendNotification,
  formatDeadlineDisplay,
  getDeadlineColorClass
};

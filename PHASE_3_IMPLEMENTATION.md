# Phase 3: Task Management, Gantt Charts & Deadline Monitoring - Complete

## Overview

Phase 3 adds advanced project management capabilities including task assignment, deadline monitoring, notifications for overdue tasks, Gantt chart visualization, and task dependency tracking. This phase fulfills the user requirement: **"Operation Team will add tasks, Gantt chart will be there, if the task deadline not completed delay notification should show to the related staffs."**

## What Was Implemented

### 1. Enhanced Task Model ✅

**New Task Fields** (Added in [src/contexts/ProjectContext.jsx](src/contexts/ProjectContext.jsx:86-114)):

```javascript
const newTask = {
  ...taskData,
  id: (p.tasks?.length || 0) + 1,
  progress: 0,
  status: "Pending",
  // Phase 3: Task assignment and deadline tracking
  assignees: taskData.assignees || [], // Array of { userId, userName, userRole }
  deadline: taskData.deadline || null,
  startDate: taskData.startDate || new Date().toISOString().split('T')[0],
  priority: taskData.priority || 'Medium', // Low, Medium, High, Critical
  dependencies: taskData.dependencies || [], // Array of task IDs this task depends on
  estimatedHours: taskData.estimatedHours || null,
  actualHours: taskData.actualHours || null,
  notifyOnDelay: taskData.notifyOnDelay !== false, // Default true
  delayNotificationSent: false,
  completedDate: null
};
```

**Task Priority Levels:**
- **Critical**: Highest priority, immediate attention required
- **High**: Important, should be addressed soon
- **Medium**: Standard priority (default)
- **Low**: Can be addressed when time permits

### 2. Task Assignment System ✅

**Feature:** Assign tasks to specific team members and track workload

**Methods Added** (Lines 501-777 in [ProjectContext.jsx](src/contexts/ProjectContext.jsx)):

#### `assignTaskToUsers(projectId, taskId, assignees)`

Assign multiple users to a task at once.

```javascript
const { assignTaskToUsers } = useProjects();

const assignees = [
  { userId: 1, userName: 'John Doe', userRole: 'Project Officer' },
  { userId: 2, userName: 'Jane Smith', userRole: 'Programme Manager' }
];

const result = assignTaskToUsers(projectId, taskId, assignees);
```

#### `addTaskAssignee(projectId, taskId, assignee)`

Add a single assignee to an existing task.

```javascript
const { addTaskAssignee } = useProjects();

const assignee = { userId: 3, userName: 'Bob Johnson', userRole: 'Project Manager' };

const result = addTaskAssignee(projectId, taskId, assignee);
// Prevents duplicate assignments
```

#### `removeTaskAssignee(projectId, taskId, userId)`

Remove a user from task assignments.

```javascript
const { removeTaskAssignee } = useProjects();

removeTaskAssignee(projectId, taskId, userId);
```

#### `getTasksAssignedToUser(userId)`

Get all tasks assigned to a specific user across all projects.

```javascript
const { getTasksAssignedToUser } = useProjects();

const myTasks = getTasksAssignedToUser(currentUser.id);
// Returns tasks with project info included
```

#### `getUserWorkload(userId)`

Get workload statistics for a user.

```javascript
const { getUserWorkload } = useProjects();

const workload = getUserWorkload(currentUser.id);
// Returns:
// {
//   totalTasks: 15,
//   pendingTasks: 5,
//   inProgressTasks: 8,
//   completedTasks: 2,
//   overdueTasks: 1,
//   totalEstimatedHours: 120,
//   totalActualHours: 80,
//   tasks: [...]
// }
```

### 3. Deadline Monitoring Utility ✅

**Created:** [src/utils/deadlineMonitor.js](src/utils/deadlineMonitor.js)

**Key Functions:**

#### `calculateDeadlineStatus(deadline)`

Calculates days until/since deadline and categorizes status.

```javascript
import { calculateDeadlineStatus } from '../utils/deadlineMonitor';

const status = calculateDeadlineStatus('2025-01-15');
// Returns:
// {
//   status: 'overdue' | 'due_today' | 'due_tomorrow' | 'approaching' | 'upcoming' | 'on_track',
//   days: number,
//   message: 'Overdue by 3 days',
//   severity: 'critical' | 'high' | 'medium' | 'low' | 'none'
// }
```

**Status Categories:**
- **overdue**: Past deadline, needs immediate attention
- **due_today**: Due today (severity: high)
- **due_tomorrow**: Due tomorrow (severity: high)
- **approaching**: 2-3 days away (severity: medium)
- **upcoming**: 4-7 days away (severity: low)
- **on_track**: >7 days away (severity: none)

#### `categorizeTasksByDeadline(tasks)`

Groups tasks by deadline status.

```javascript
import { categorizeTasksByDeadline } from '../utils/deadlineMonitor';

const categories = categorizeTasksByDeadline(allTasks);
// Returns:
// {
//   overdue: [...],
//   dueToday: [...],
//   dueTomorrow: [...],
//   approaching: [...],
//   upcoming: [...],
//   onTrack: [...],
//   noDeadline: [...]
// }
```

#### `getTasksRequiringAttention(tasks)`

Returns tasks that need immediate attention (overdue, due today, due tomorrow, approaching).

```javascript
import { getTasksRequiringAttention } from '../utils/deadlineMonitor';

const urgentTasks = getTasksRequiringAttention(allTasks);
```

#### `generateNotificationMessage(task, notificationInfo)`

Generates notification messages for deadline alerts.

```javascript
import { generateNotificationMessage, calculateNotificationPriority } from '../utils/deadlineMonitor';

const notificationInfo = calculateNotificationPriority(task);
const notification = generateNotificationMessage(task, notificationInfo);
// Returns notification object ready for display
```

**Other Utility Functions:**
- `formatDeadlineDisplay(deadline)` - Format deadline for display
- `getDeadlineColorClass(deadline)` - Get Tailwind color class based on status
- `getNotificationSchedule(task)` - Get when notifications should be sent
- `shouldSendNotification(task, sentNotifications)` - Check if notification needed

### 4. Notification System ✅

**Created:** [src/contexts/NotificationContext.jsx](src/contexts/NotificationContext.jsx)

**Integrated in:** [src/App.jsx](src/App.jsx:19,35,67)

**Features:**
- Persistent notifications (localStorage)
- Unread count tracking
- Automatic deadline monitoring
- Priority-based categorization
- Auto-cleanup of old notifications (30 days)

**Key Methods:**

#### `addNotification(notification)`

Add a new notification manually.

```javascript
const { addNotification } = useNotifications();

addNotification({
  type: 'deadline_alert',
  priority: 'critical',
  title: 'Task Overdue',
  message: 'Task "Community Survey" is 3 days overdue',
  taskId: 123,
  projectId: 5
});
```

#### `processTaskDeadlines(tasks)`

Automatically generate deadline notifications for tasks.

```javascript
const { processTaskDeadlines } = useNotifications();
const { getOverdueTasks, getTasksApproachingDeadline } = useProjects();

// Check and notify for overdue/approaching tasks
const allTasks = [
  ...getOverdueTasks(),
  ...getTasksApproachingDeadline(7)
];

processTaskDeadlines(allTasks);
// Automatically creates notifications for tasks requiring attention
```

#### `markAsRead(notificationId)`

Mark a notification as read.

```javascript
const { markAsRead } = useNotifications();

markAsRead(notificationId);
```

#### `getCriticalNotifications()`

Get all unread critical notifications (overdue tasks).

```javascript
const { getCriticalNotifications } = useNotifications();

const criticalAlerts = getCriticalNotifications();
```

#### `getUserNotifications(userId)`

Get notifications for a specific user (based on task assignees).

```javascript
const { getUserNotifications } = useNotifications();

const myNotifications = getUserNotifications(currentUser.id);
```

**Notification Object Structure:**

```javascript
{
  id: 'notif-1234567890-xyz',
  type: 'deadline_alert',
  priority: 'critical' | 'urgent' | 'high' | 'medium' | 'low',
  title: 'Task Overdue: Community Survey',
  message: 'This task is overdue by 3 days',
  taskId: 123,
  projectId: 5,
  assignees: [{ userId, userName, userRole }],
  deadline: '2025-01-10',
  deadlineStatus: { status, days, message, severity },
  createdAt: '2025-01-13T10:30:00Z',
  read: false,
  actions: ['View Task', 'Update Status', 'Reschedule']
}
```

### 5. Gantt Chart Visualization ✅

**Created:** [src/components/projects/GanttChart.jsx](src/components/projects/GanttChart.jsx)

**Features:**
- Visual timeline of all project tasks
- Color-coded by status (In Progress, Completed, Overdue, etc.)
- Multiple view modes (Week, Month, Quarter)
- "Today" marker for current date reference
- Priority badges on tasks
- Assignee count display
- Progress percentage on task bars
- Summary statistics
- Click handler for task details

**View Modes:**
- **Week View**: Daily columns, best for short-term planning
- **Month View**: Weekly columns, good for medium-term overview
- **Quarter View**: Monthly columns, ideal for long-term planning

**Status Colors:**
- 🟦 **Blue**: In Progress
- 🟩 **Green**: Completed
- 🟧 **Orange**: Due Soon (within 2 days)
- 🟥 **Red**: Overdue
- ⬜ **Gray**: Pending/Cancelled

**Usage Example:**

```javascript
import GanttChart from '../components/projects/GanttChart';

const ProjectPage = () => {
  const { selectedProject } = useProjects();

  const handleTaskClick = (task) => {
    // Open task details modal or navigate to task
    console.log('Task clicked:', task);
  };

  return (
    <div>
      <GanttChart
        project={selectedProject}
        onTaskClick={handleTaskClick}
      />
    </div>
  );
};
```

**Requirements:**
- Tasks must have both `startDate` and `deadline` to appear on Gantt chart
- Empty state shown if no tasks with timelines exist

### 6. Task Dependency Tracking ✅

**Feature:** Define task dependencies and track critical paths

**Methods Added** (Lines 779-1030 in [ProjectContext.jsx](src/contexts/ProjectContext.jsx)):

#### `addTaskDependency(projectId, taskId, dependsOnTaskId)`

Add a dependency relationship between tasks.

```javascript
const { addTaskDependency } = useProjects();

// Task B depends on Task A (Task A must complete before Task B can start)
addTaskDependency(projectId, taskB.id, taskA.id);
// Prevents circular dependencies automatically
```

#### `removeTaskDependency(projectId, taskId, dependsOnTaskId)`

Remove a dependency relationship.

```javascript
const { removeTaskDependency } = useProjects();

removeTaskDependency(projectId, taskB.id, taskA.id);
```

#### `getDependentTasks(projectId, taskId)`

Get all tasks that depend on a specific task.

```javascript
const { getDependentTasks } = useProjects();

const dependents = getDependentTasks(projectId, taskId);
// Returns array of tasks that are waiting for this task to complete
```

#### `getTaskDependencies(projectId, taskId)`

Get all tasks that a specific task depends on.

```javascript
const { getTaskDependencies } = useProjects();

const dependencies = getTaskDependencies(projectId, taskId);
// Returns array of tasks that must complete before this task can start
```

#### `canTaskBeStarted(projectId, taskId)`

Check if a task can be started based on dependencies.

```javascript
const { canTaskBeStarted } = useProjects();

const check = canTaskBeStarted(projectId, taskId);
// Returns:
// {
//   canStart: boolean,
//   blockingTasks: [...], // Tasks still incomplete
//   message: 'All dependencies completed' or '3 blocking task(s)'
// }
```

#### `getCriticalPath(projectId)`

Calculate the critical path for a project (longest chain of dependent tasks).

```javascript
const { getCriticalPath } = useProjects();

const criticalPath = getCriticalPath(projectId);
// Returns array of tasks in the critical path, ordered by dependency
// Useful for identifying tasks that cannot be delayed without delaying the project
```

**Circular Dependency Prevention:**

The system automatically detects and prevents circular dependencies:

```javascript
// Task A depends on Task B
addTaskDependency(projectId, taskA.id, taskB.id);

// Attempt to make Task B depend on Task A (circular!)
addTaskDependency(projectId, taskB.id, taskA.id);
// Returns: { success: false, message: 'Circular dependency detected' }
```

### 7. Deadline Query Methods ✅

**Added to ProjectContext:**

#### `getOverdueTasks()`

Get all overdue tasks across all projects.

```javascript
const { getOverdueTasks } = useProjects();

const overdue = getOverdueTasks();
// Returns tasks with daysOverdue calculated, sorted by most overdue first
```

#### `getTasksApproachingDeadline(daysThreshold)`

Get tasks with deadlines within the specified number of days.

```javascript
const { getTasksApproachingDeadline } = useProjects();

const upcoming = getTasksApproachingDeadline(7); // Next 7 days
// Returns tasks with daysUntilDeadline calculated, sorted by soonest first
```

#### `completeTask(projectId, taskId, completionData)`

Mark a task as completed with completion metadata.

```javascript
const { completeTask } = useProjects();

completeTask(projectId, taskId, {
  completedBy: currentUser.fullName,
  actualHours: 12,
  notes: 'Completed ahead of schedule'
});
// Sets status to 'Completed', progress to 100%, records completion date
// Automatically recalculates project progress
```

## Complete Feature Matrix

| Feature | Status | File |
|---------|--------|------|
| Enhanced Task Model | ✅ | ProjectContext.jsx:86-114 |
| Task Assignment | ✅ | ProjectContext.jsx:501-580 |
| Assignee Management | ✅ | ProjectContext.jsx:539-618 |
| User Task Query | ✅ | ProjectContext.jsx:620-643 |
| Overdue Detection | ✅ | ProjectContext.jsx:645-668 |
| Deadline Monitoring | ✅ | utils/deadlineMonitor.js |
| Notification System | ✅ | contexts/NotificationContext.jsx |
| Gantt Chart | ✅ | components/projects/GanttChart.jsx |
| Task Dependencies | ✅ | ProjectContext.jsx:779-905 |
| Circular Dependency Prevention | ✅ | ProjectContext.jsx:871-905 |
| Critical Path Analysis | ✅ | ProjectContext.jsx:970-1030 |
| Workload Tracking | ✅ | ProjectContext.jsx:754-777 |
| Task Completion | ✅ | ProjectContext.jsx:709-752 |

## Usage Scenarios

### Scenario 1: Assign Task with Deadline & Monitor

```javascript
const { addTask, assignTaskToUsers } = useProjects();
const { processTaskDeadlines } = useNotifications();
const { currentUser } = useAuth();

// 1. Create task with deadline
addTask(projectId, {
  name: 'Community Survey',
  description: 'Conduct community needs assessment',
  startDate: '2025-01-15',
  deadline: '2025-01-25',
  priority: 'High',
  estimatedHours: 40
});

// 2. Assign team members
assignTaskToUsers(projectId, taskId, [
  { userId: 2, userName: 'John Doe', userRole: 'Project Officer' },
  { userId: 3, userName: 'Jane Smith', userRole: 'Field Officer' }
]);

// 3. Monitor deadlines (run periodically)
const tasksToMonitor = [
  ...getOverdueTasks(),
  ...getTasksApproachingDeadline(7)
];

processTaskDeadlines(tasksToMonitor);
// Automatically creates notifications for assigned staff
```

### Scenario 2: Task Dependencies & Critical Path

```javascript
const { addTask, addTaskDependency, getCriticalPath, canTaskBeStarted } = useProjects();

// Create tasks
const taskA = addTask(projectId, {
  name: 'Stakeholder Mapping',
  startDate: '2025-01-10',
  deadline: '2025-01-15'
});

const taskB = addTask(projectId, {
  name: 'Develop Survey Questionnaire',
  startDate: '2025-01-16',
  deadline: '2025-01-20'
});

const taskC = addTask(projectId, {
  name: 'Conduct Survey',
  startDate: '2025-01-21',
  deadline: '2025-01-30'
});

// Set dependencies (Survey depends on Questionnaire, Questionnaire depends on Mapping)
addTaskDependency(projectId, taskC.id, taskB.id);
addTaskDependency(projectId, taskB.id, taskA.id);

// Check if Task C can be started
const check = canTaskBeStarted(projectId, taskC.id);
// Returns: { canStart: false, blockingTasks: [taskB, taskA], message: '2 blocking task(s)' }

// Get critical path
const critical = getCriticalPath(projectId);
// Returns: [taskA, taskB, taskC] - these tasks determine project timeline
```

### Scenario 3: Workload Management

```javascript
const { getUserWorkload, getTasksAssignedToUser } = useProjects();

// Check staff workload before assigning
const workload = getUserWorkload(staffId);

if (workload.totalEstimatedHours > 160) { // More than 4 weeks work
  console.warn('Staff member is overloaded!');
} else {
  // Safe to assign more work
  assignTaskToUsers(projectId, taskId, [
    { userId: staffId, userName: staffName, userRole: staffRole }
  ]);
}

// View all tasks for a staff member
const myTasks = getTasksAssignedToUser(currentUser.id);
```

### Scenario 4: Dashboard with Notifications

```javascript
const { notifications, unreadCount, getCriticalNotifications } = useNotifications();
const { getOverdueTasks } = useProjects();

// Dashboard component
const Dashboard = () => {
  const criticalAlerts = getCriticalNotifications();
  const overdueTasks = getOverdueTasks();

  return (
    <div>
      {/* Notification bell with badge */}
      <button>
        Notifications
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {/* Critical alerts */}
      <div className="alerts">
        <h3>Critical Alerts ({criticalAlerts.length})</h3>
        {criticalAlerts.map(alert => (
          <div key={alert.id} className="alert-critical">
            {alert.title}
            <p>{alert.message}</p>
          </div>
        ))}
      </div>

      {/* Overdue tasks */}
      <div className="overdue-tasks">
        <h3>Overdue Tasks ({overdueTasks.length})</h3>
        {overdueTasks.map(task => (
          <div key={task.id}>
            {task.name} - {task.daysOverdue} days overdue
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Testing Phase 3

### Test 1: Task Assignment & Notifications

1. Create a project with tasks
2. Set a task deadline for tomorrow
3. Assign the task to yourself
4. Check notifications - should see "due tomorrow" alert
5. Change deadline to yesterday
6. Run `processTaskDeadlines()` - should see "overdue" notification

### Test 2: Gantt Chart Display

1. Open a project with multiple tasks
2. Ensure tasks have startDate and deadline
3. Open Gantt Chart component
4. Verify:
   - Tasks appear in timeline
   - Progress bars show correctly
   - "Today" marker is visible
   - Status colors are correct (overdue = red)
   - Can switch between Week/Month/Quarter views

### Test 3: Task Dependencies

1. Create 3 sequential tasks (A → B → C)
2. Add dependencies: C depends on B, B depends on A
3. Try to start Task C - should be blocked
4. Complete Task A
5. Try to start Task C - still blocked (B incomplete)
6. Complete Task B
7. Try to start Task C - should be allowed
8. Check critical path - should return [A, B, C]

### Test 4: Workload Tracking

1. Assign multiple tasks to one user
2. Check `getUserWorkload(userId)`
3. Verify counts are correct (pending, in progress, completed, overdue)
4. Verify hours calculation is accurate
5. Check that workload includes tasks from all projects

## API Reference

### ProjectContext - Phase 3 Methods

#### Task Assignment

```javascript
// Assign multiple users to a task
assignTaskToUsers(projectId, taskId, assignees)

// Add single assignee to task
addTaskAssignee(projectId, taskId, assignee)

// Remove assignee from task
removeTaskAssignee(projectId, taskId, userId)

// Get all tasks for a user
getTasksAssignedToUser(userId)

// Get user workload statistics
getUserWorkload(userId)
```

#### Deadline Management

```javascript
// Get all overdue tasks
getOverdueTasks()

// Get tasks approaching deadline
getTasksApproachingDeadline(daysThreshold = 7)

// Complete a task with metadata
completeTask(projectId, taskId, completionData)
```

#### Task Dependencies

```javascript
// Add dependency (task depends on another task)
addTaskDependency(projectId, taskId, dependsOnTaskId)

// Remove dependency
removeTaskDependency(projectId, taskId, dependsOnTaskId)

// Get tasks dependent on this task
getDependentTasks(projectId, taskId)

// Get tasks this task depends on
getTaskDependencies(projectId, taskId)

// Check if task can be started
canTaskBeStarted(projectId, taskId)

// Get project critical path
getCriticalPath(projectId)
```

### NotificationContext Methods

```javascript
// Add notification
addNotification(notification)

// Mark as read
markAsRead(notificationId)

// Mark all as read
markAllAsRead()

// Delete notification
deleteNotification(notificationId)

// Clear all notifications
clearAll()

// Process task deadlines (auto-generate notifications)
processTaskDeadlines(tasks)

// Get unread notifications
getUnreadNotifications()

// Get critical notifications
getCriticalNotifications()

// Get user notifications
getUserNotifications(userId)

// Get notifications by priority
getNotificationsByPriority(priority)
```

### Deadline Monitor Utilities

```javascript
import {
  calculateDeadlineStatus,
  categorizeTasksByDeadline,
  getTasksRequiringAttention,
  calculateNotificationPriority,
  generateNotificationMessage,
  formatDeadlineDisplay,
  getDeadlineColorClass,
  getNotificationSchedule,
  shouldSendNotification
} from '../utils/deadlineMonitor';
```

## File Structure

```
src/
├── utils/
│   └── deadlineMonitor.js         # Deadline calculation & notification logic
├── contexts/
│   ├── ProjectContext.jsx         # Enhanced with Phase 3 methods
│   └── NotificationContext.jsx    # NEW - Notification management
├── components/
│   └── projects/
│       └── GanttChart.jsx         # NEW - Visual timeline component
└── App.jsx                        # Updated to include NotificationProvider
```

## What's Next (Phase 4 - Future Enhancements)

### Advanced Notifications
- Email notifications for deadline alerts
- SMS notifications for critical overdue tasks
- Notification preferences per user
- Digest emails (daily/weekly summary)

### Enhanced Gantt Chart
- Drag-and-drop task rescheduling
- Dependency lines visualization
- Resource allocation overlay
- Export to PDF/PNG
- Zoom controls
- Task filtering

### Advanced Workload Management
- Team capacity planning
- Workload balancing suggestions
- Skill-based assignment recommendations
- Availability calendar integration

### Reporting & Analytics
- Task completion rates
- Average delay per task type
- Workload distribution charts
- Critical path impact analysis
- Team performance metrics

### Mobile Notifications
- Push notifications for mobile app
- Notification sound/vibration settings
- Quick action buttons (Mark complete, Snooze, etc.)

## Summary

Phase 3 is now **complete** and provides:

✅ **Task Assignment** - Assign tasks to staff and track workload
✅ **Deadline Monitoring** - Automatic tracking of approaching/overdue deadlines
✅ **Notification System** - Alert staff of delays and upcoming deadlines
✅ **Gantt Chart** - Visual project timeline with multiple view modes
✅ **Task Dependencies** - Define task relationships and critical paths
✅ **Workload Tracking** - Monitor staff assignments and capacity
✅ **Circular Dependency Prevention** - Automatic validation
✅ **Critical Path Analysis** - Identify bottleneck tasks

The system now provides **complete project management capabilities** from proposal creation through task execution with comprehensive deadline monitoring and staff notifications.

---

**Implementation Date:** January 2025
**Status:** Production Ready
**Version:** 3.0.0

For previous phases:
- Phase 1: [WORKFLOW_IMPLEMENTATION.md](WORKFLOW_IMPLEMENTATION.md)
- Phase 2: [PHASE_2_IMPLEMENTATION.md](PHASE_2_IMPLEMENTATION.md)

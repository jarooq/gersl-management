// ============================================
// NEW MODELS TO ADD TO server/src/models/index.js
// Add these after the existing model definitions (around line 6-7, after imports)
// ============================================

// Import new models
import Approval from './Approval.js';
import Task from './Task.js';
import Notification from './Notification.js';

// ============================================
// RELATIONSHIPS TO ADD (add these in the relationships section, around line 3000+)
// ============================================

// APPROVAL RELATIONSHIPS
Approval.belongsTo(User, { as: 'initiator', foreignKey: 'initiatedBy' });

// TASK RELATIONSHIPS
Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assignedTo' });
Task.belongsTo(User, { as: 'assigner', foreignKey: 'assignedBy' });
Task.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });

// Reverse relationships
Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assignedTo' });

// NOTIFICATION RELATIONSHIPS
Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

// Reverse relationship
User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });

// ============================================
// ADD TO EXPORT STATEMENT (around line 3711+)
// Add these to the existing export { } block
// ============================================

/*
Add to export {
  ...existing exports,
  Approval,
  Task,
  Notification,
  sequelize
};
*/

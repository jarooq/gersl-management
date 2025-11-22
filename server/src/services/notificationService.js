import sequelize from '../config/database.js';

/**
 * Notification Service
 * Helper functions for creating and managing notifications
 */

/**
 * Create a mention notification when user is @mentioned in a comment
 * @param {Object} params - Notification parameters
 * @param {number} params.mentionedUserId - ID of user being mentioned
 * @param {number} params.mentioningUserId - ID of user who mentioned them
 * @param {string} params.mentioningUserName - Name of user who mentioned them
 * @param {number} params.taskId - ID of the task
 * @param {string} params.taskName - Name of the task
 * @param {number} params.commentId - ID of the comment
 */
export const createMentionNotification = async ({
  mentionedUserId,
  mentioningUserId,
  mentioningUserName,
  taskId,
  taskName,
  commentId
}) => {
  try {
    // Don't create notification if user mentions themselves
    if (mentionedUserId === mentioningUserId) {
      return null;
    }

    await sequelize.query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_entity_type,
        related_entity_id,
        priority,
        category,
        action_url,
        action_label,
        created_at
      ) VALUES (
        :userId,
        :type,
        :title,
        :message,
        :entityType,
        :entityId,
        :priority,
        :category,
        :actionUrl,
        :actionLabel,
        NOW()
      )`,
      {
        replacements: {
          userId: mentionedUserId,
          type: 'mention',
          title: 'You were mentioned in a comment',
          message: `${mentioningUserName} mentioned you in a comment on task "${taskName}"`,
          entityType: 'task_comment',
          entityId: commentId,
          priority: 'Medium',
          category: 'mention',
          actionUrl: `/admin/operations/tasks?task=${taskId}`,
          actionLabel: 'View Task'
        },
        type: sequelize.QueryTypes.INSERT
      }
    );

    return true;
  } catch (error) {
    console.error('Error creating mention notification:', error);
    return false;
  }
};

/**
 * Create a task assignment notification
 * @param {Object} params - Notification parameters
 * @param {number} params.assignedUserId - ID of user assigned to task
 * @param {number} params.assigningUserId - ID of user who assigned the task
 * @param {string} params.assigningUserName - Name of user who assigned the task
 * @param {number} params.taskId - ID of the task
 * @param {string} params.taskName - Name of the task
 * @param {string} params.taskPriority - Priority of the task
 */
export const createTaskAssignmentNotification = async ({
  assignedUserId,
  assigningUserId,
  assigningUserName,
  taskId,
  taskName,
  taskPriority
}) => {
  try {
    // Don't create notification if user assigns task to themselves
    if (assignedUserId === assigningUserId) {
      return null;
    }

    const priority = taskPriority === 'Urgent' || taskPriority === 'High' ? 'High' : 'Medium';

    await sequelize.query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_entity_type,
        related_entity_id,
        priority,
        category,
        action_url,
        action_label,
        created_at
      ) VALUES (
        :userId,
        :type,
        :title,
        :message,
        :entityType,
        :entityId,
        :priority,
        :category,
        :actionUrl,
        :actionLabel,
        NOW()
      )`,
      {
        replacements: {
          userId: assignedUserId,
          type: 'task_assigned',
          title: 'New task assigned to you',
          message: `${assigningUserName} assigned you to task "${taskName}"`,
          entityType: 'task',
          entityId: taskId,
          priority,
          category: 'assignment',
          actionUrl: `/admin/operations/tasks?task=${taskId}`,
          actionLabel: 'View Task'
        },
        type: sequelize.QueryTypes.INSERT
      }
    );

    return true;
  } catch (error) {
    console.error('Error creating task assignment notification:', error);
    return false;
  }
};

/**
 * Create a comment notification (when someone comments on a task you're assigned to)
 * @param {Object} params - Notification parameters
 * @param {number} params.taskAssigneeId - ID of user assigned to the task
 * @param {number} params.commenterId - ID of user who commented
 * @param {string} params.commenterName - Name of user who commented
 * @param {number} params.taskId - ID of the task
 * @param {string} params.taskName - Name of the task
 * @param {number} params.commentId - ID of the comment
 */
export const createCommentNotification = async ({
  taskAssigneeId,
  commenterId,
  commenterName,
  taskId,
  taskName,
  commentId
}) => {
  try {
    // Don't create notification if commenter is the assignee
    if (taskAssigneeId === commenterId) {
      return null;
    }

    await sequelize.query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_entity_type,
        related_entity_id,
        priority,
        category,
        action_url,
        action_label,
        created_at
      ) VALUES (
        :userId,
        :type,
        :title,
        :message,
        :entityType,
        :entityId,
        :priority,
        :category,
        :actionUrl,
        :actionLabel,
        NOW()
      )`,
      {
        replacements: {
          userId: taskAssigneeId,
          type: 'task_comment',
          title: 'New comment on your task',
          message: `${commenterName} commented on your task "${taskName}"`,
          entityType: 'task_comment',
          entityId: commentId,
          priority: 'Low',
          category: 'comment',
          actionUrl: `/admin/operations/tasks?task=${taskId}`,
          actionLabel: 'View Task'
        },
        type: sequelize.QueryTypes.INSERT
      }
    );

    return true;
  } catch (error) {
    console.error('Error creating comment notification:', error);
    return false;
  }
};

/**
 * Get unread notifications count for a user
 * @param {number} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  try {
    const [result] = await sequelize.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = :userId AND read = false`,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    return parseInt(result.count) || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID (for security check)
 * @returns {Promise<boolean>} Success status
 */
export const markAsRead = async (notificationId, userId) => {
  try {
    await sequelize.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE id = :notificationId AND user_id = :userId`,
      {
        replacements: { notificationId, userId },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const markAllAsRead = async (userId) => {
  try {
    await sequelize.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE user_id = :userId AND read = false`,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

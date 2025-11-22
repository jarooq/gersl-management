import { Task, User } from '../models/index.js';
import sequelize from '../config/database.js';
import { createMentionNotification, createCommentNotification } from '../services/notificationService.js';

/**
 * Extract @mentions from comment content
 * @param {string} content - Comment text
 * @returns {Array} Array of mentioned usernames
 */
const extractMentions = (content) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Get all comments for a task
 * GET /api/tasks/:taskId/comments
 */
export const getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Query comments directly from database
    const comments = await sequelize.query(
      `SELECT
        tc.id,
        tc.task_id as "taskId",
        tc.user_id as "userId",
        tc.content,
        tc.mentioned_users as "mentionedUsers",
        tc.is_edited as "isEdited",
        tc.created_at as "createdAt",
        tc.updated_at as "updatedAt",
        u.full_name as "userName",
        u.email as "userEmail",
        u.role as "userRole"
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = :taskId
       ORDER BY tc.created_at ASC`,
      {
        replacements: { taskId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching task comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

/**
 * Create new comment on task
 * POST /api/tasks/:taskId/comments
 */
export const createTaskComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Extract mentions from content
    const mentionedUsernames = extractMentions(content);
    let mentionedUserIds = [];

    if (mentionedUsernames.length > 0) {
      // Find user IDs for mentioned usernames
      const mentionedUsers = await User.findAll({
        where: {
          fullName: mentionedUsernames
        },
        attributes: ['id', 'fullName']
      });

      mentionedUserIds = mentionedUsers.map(u => u.id);
    }

    // Insert comment directly
    const [comment] = await sequelize.query(
      `INSERT INTO task_comments (task_id, user_id, content, mentioned_users, created_at, updated_at)
       VALUES (:taskId, :userId, :content, :mentionedUsers, NOW(), NOW())
       RETURNING id, task_id as "taskId", user_id as "userId", content, mentioned_users as "mentionedUsers",
                 is_edited as "isEdited", created_at as "createdAt", updated_at as "updatedAt"`,
      {
        replacements: {
          taskId,
          userId: req.user.id,
          content: content.trim(),
          mentionedUsers: JSON.stringify(mentionedUserIds)
        },
        type: sequelize.QueryTypes.INSERT
      }
    );

    // Fetch comment with user details
    const [fullComment] = await sequelize.query(
      `SELECT
        tc.id,
        tc.task_id as "taskId",
        tc.user_id as "userId",
        tc.content,
        tc.mentioned_users as "mentionedUsers",
        tc.is_edited as "isEdited",
        tc.created_at as "createdAt",
        tc.updated_at as "updatedAt",
        u.full_name as "userName",
        u.email as "userEmail",
        u.role as "userRole"
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.id = :commentId`,
      {
        replacements: { commentId: comment[0].id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    // Create notifications for mentioned users
    if (mentionedUserIds.length > 0) {
      const commenterName = req.user.fullName || req.user.email;

      for (const mentionedUserId of mentionedUserIds) {
        await createMentionNotification({
          mentionedUserId,
          mentioningUserId: req.user.id,
          mentioningUserName: commenterName,
          taskId: task.id,
          taskName: task.taskName,
          commentId: comment[0].id
        });
      }
    }

    // Create notification for task assignee (if different from commenter)
    if (task.assignedTo && task.assignedTo !== req.user.id) {
      const commenterName = req.user.fullName || req.user.email;

      await createCommentNotification({
        taskAssigneeId: task.assignedTo,
        commenterId: req.user.id,
        commenterName,
        taskId: task.id,
        taskName: task.taskName,
        commentId: comment[0].id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      comment: fullComment
    });
  } catch (error) {
    console.error('Error creating task comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

/**
 * Update comment
 * PUT /api/tasks/:taskId/comments/:commentId
 */
export const updateTaskComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Check if comment exists and belongs to user
    const [existingComment] = await sequelize.query(
      `SELECT * FROM task_comments WHERE id = :commentId AND task_id = :taskId`,
      {
        replacements: { commentId, taskId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Verify user owns this comment
    if (existingComment.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    // Extract mentions from updated content
    const mentionedUsernames = extractMentions(content);
    let mentionedUserIds = [];

    if (mentionedUsernames.length > 0) {
      const mentionedUsers = await User.findAll({
        where: {
          fullName: mentionedUsernames
        },
        attributes: ['id', 'fullName']
      });

      mentionedUserIds = mentionedUsers.map(u => u.id);
    }

    // Update comment
    await sequelize.query(
      `UPDATE task_comments
       SET content = :content,
           mentioned_users = :mentionedUsers,
           is_edited = true,
           updated_at = NOW()
       WHERE id = :commentId`,
      {
        replacements: {
          commentId,
          content: content.trim(),
          mentionedUsers: JSON.stringify(mentionedUserIds)
        },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    // Fetch updated comment with user details
    const [updatedComment] = await sequelize.query(
      `SELECT
        tc.id,
        tc.task_id as "taskId",
        tc.user_id as "userId",
        tc.content,
        tc.mentioned_users as "mentionedUsers",
        tc.is_edited as "isEdited",
        tc.created_at as "createdAt",
        tc.updated_at as "updatedAt",
        u.full_name as "userName",
        u.email as "userEmail",
        u.role as "userRole"
       FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.id = :commentId`,
      {
        replacements: { commentId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error updating task comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

/**
 * Delete comment
 * DELETE /api/tasks/:taskId/comments/:commentId
 */
export const deleteTaskComment = async (req, res) => {
  try {
    const { taskId, commentId } = req.params;

    // Check if comment exists
    const [existingComment] = await sequelize.query(
      `SELECT * FROM task_comments WHERE id = :commentId AND task_id = :taskId`,
      {
        replacements: { commentId, taskId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Verify user owns this comment or is admin
    if (existingComment.user_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    // Delete comment
    await sequelize.query(
      `DELETE FROM task_comments WHERE id = :commentId`,
      {
        replacements: { commentId },
        type: sequelize.QueryTypes.DELETE
      }
    );

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

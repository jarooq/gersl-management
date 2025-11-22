import { Notification, User } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Get all notifications for current user
 * GET /api/notifications?read=false&limit=50
 */
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { read, limit = 50, offset = 0 } = req.query;

    const where = { userId };

    // Filter by read status
    if (read !== undefined) {
      where.read = read === 'true';
    }

    const notifications = await Notification.findAll({
      where,
      order: [['created_at', 'DESC']], // Use snake_case column name
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Count unread notifications
    const unreadCount = await Notification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

/**
 * Get unread notifications for current user
 * GET /api/notifications/unread
 */
export const getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.findAll({
      where: {
        userId,
        read: false
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notifications',
      error: error.message
    });
  }
};

/**
 * Get single notification by ID
 * GET /api/notifications/:id
 */
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        userId // Ensure user can only access their own notifications
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update notification
    await notification.update({
      read: true,
      readAt: new Date()
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications for this user
    const [updatedCount] = await Notification.update(
      {
        read: true,
        readAt: new Date()
      },
      {
        where: {
          userId,
          read: false
        }
      }
    );

    res.json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      count: updatedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

/**
 * Delete all read notifications for current user
 * DELETE /api/notifications/read
 */
export const deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const deletedCount = await Notification.destroy({
      where: {
        userId,
        read: true
      }
    });

    res.json({
      success: true,
      message: `${deletedCount} read notifications deleted`,
      count: deletedCount
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete read notifications',
      error: error.message
    });
  }
};

/**
 * Create notification (internal use - for system to create notifications)
 * POST /api/notifications
 */
export const createNotification = async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      priority,
      category,
      actionUrl,
      actionLabel,
      deliveryMethod
    } = req.body;

    // Validate required fields
    if (!userId || !type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, type, title'
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create notification
    const notification = await Notification.create({
      userId,
      type,
      title,
      message: message || '',
      relatedEntityType: relatedEntityType || null,
      relatedEntityId: relatedEntityId || null,
      priority: priority || 'Medium',
      category: category || null,
      read: false,
      actionUrl: actionUrl || null,
      actionLabel: actionLabel || null,
      deliveryMethod: deliveryMethod || 'in_app',
      deliveredAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

/**
 * Create bulk notifications (for sending to multiple users)
 * POST /api/notifications/bulk
 */
export const createBulkNotifications = async (req, res) => {
  try {
    const {
      userIds,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      priority,
      actionUrl
    } = req.body;

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !type || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userIds (array), type, title'
      });
    }

    // Create notifications for all users
    const notifications = await Promise.all(
      userIds.map(userId =>
        Notification.create({
          userId,
          type,
          title,
          message: message || '',
          relatedEntityType: relatedEntityType || null,
          relatedEntityId: relatedEntityId || null,
          priority: priority || 'Medium',
          read: false,
          actionUrl: actionUrl || null,
          deliveryMethod: 'in_app',
          deliveredAt: new Date()
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `${notifications.length} notifications created successfully`,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bulk notifications',
      error: error.message
    });
  }
};

import express from 'express';
import { verifyToken, authorize } from '../middleware/auth.middleware.js';
import {
  getUserNotifications,
  getUnreadNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification,
  createBulkNotifications
} from '../controllers/notification.controller.js';

const router = express.Router();

// Get unread notifications (must be before /:id route)
router.get('/unread', verifyToken, getUnreadNotifications);

// Mark all as read (must be before /:id route)
router.put('/read-all', verifyToken, markAllAsRead);

// Delete all read notifications (must be before /:id route)
router.delete('/read', verifyToken, deleteAllRead);

// Create bulk notifications — senior-tier only. 'Manager' was a ghost role.
router.post('/bulk', verifyToken, authorize('Admin', 'CEO', 'HR Manager', 'Programme Manager'), createBulkNotifications);

// Get all notifications for current user
router.get('/', verifyToken, getUserNotifications);

// Get single notification by ID
router.get('/:id', verifyToken, getNotificationById);

// Create notification — senior-tier only. 'Manager' was a ghost role.
router.post('/', verifyToken, authorize('Admin', 'CEO', 'HR Manager', 'Programme Manager'), createNotification);

// Mark notification as read
router.put('/:id/read', verifyToken, markAsRead);

// Delete notification
router.delete('/:id', verifyToken, deleteNotification);

export default router;

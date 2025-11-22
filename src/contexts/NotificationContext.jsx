import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch user notifications from database
   */
  const fetchNotifications = useCallback(async (filters = {}) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);
      const result = await notificationService.fetchUserNotifications(filters);

      if (result.success) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unreadCount || 0);
        return { success: true, data: result };
      }

      throw new Error(result.message || 'Failed to fetch notifications');
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Fetch unread notifications
   */
  const fetchUnreadNotifications = useCallback(async () => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);
      const result = await notificationService.fetchUnreadNotifications();

      if (result.success) {
        return { success: true, data: result.notifications || [] };
      }

      throw new Error(result.message || 'Failed to fetch unread notifications');
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Add a new notification
   */
  const addNotification = useCallback(async (notificationData) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.createNotification({
        userId: currentUser.id,
        ...notificationData
      });

      if (result.success) {
        // Add to local state
        setNotifications(prev => [result.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        console.log(`🔔 Notification added: ${result.notification.title}`);
        return { success: true, notification: result.notification };
      }

      throw new Error(result.message || 'Failed to create notification');
    } catch (err) {
      console.error('Error adding notification:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.markAsRead(notificationId);

      if (result.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return { success: true };
      }

      throw new Error(result.message || 'Failed to mark as read');
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.markAllAsRead();

      if (result.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        return { success: true };
      }

      throw new Error(result.message || 'Failed to mark all as read');
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.deleteNotification(notificationId);

      if (result.success) {
        // Update local state
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId);
          const filtered = prev.filter(n => n.id !== notificationId);

          if (notification && !notification.read) {
            setUnreadCount(count => Math.max(0, count - 1));
          }

          return filtered;
        });

        return { success: true };
      }

      throw new Error(result.message || 'Failed to delete notification');
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete all read notifications
   */
  const deleteAllRead = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.deleteAllRead();

      if (result.success) {
        // Update local state - remove all read notifications
        setNotifications(prev => prev.filter(n => !n.read));
        return { success: true };
      }

      throw new Error(result.message || 'Failed to delete read notifications');
    } catch (err) {
      console.error('Error deleting read notifications:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get unread notifications (from local state)
   */
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  /**
   * Get notifications by priority
   */
  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  /**
   * Get critical notifications (high priority unread)
   */
  const getCriticalNotifications = useCallback(() => {
    return notifications.filter(n =>
      (n.priority === 'High' || n.priority === 'Critical') && !n.read
    );
  }, [notifications]);

  /**
   * Auto-fetch notifications on mount and when user changes
   */
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

  /**
   * Poll for new notifications every 30 seconds
   */
  useEffect(() => {
    if (!currentUser) return;

    const pollInterval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(pollInterval);
  }, [currentUser, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    fetchNotifications,
    fetchUnreadNotifications,
    // Getters
    getUnreadNotifications,
    getNotificationsByPriority,
    getCriticalNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

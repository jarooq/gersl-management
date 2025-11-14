import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  generateNotificationMessage,
  calculateNotificationPriority,
  shouldSendNotification
} from '../utils/deadlineMonitor';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [sentNotificationKeys, setSentNotificationKeys] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load from localStorage
  useEffect(() => {
    const storedNotifications = localStorage.getItem('gersl_notifications');
    const storedKeys = localStorage.getItem('gersl_sent_notification_keys');

    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }

    if (storedKeys) {
      try {
        setSentNotificationKeys(JSON.parse(storedKeys));
      } catch (error) {
        console.error('Error loading notification keys:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gersl_notifications', JSON.stringify(notifications));
    localStorage.setItem('gersl_sent_notification_keys', JSON.stringify(sentNotificationKeys));
  }, [notifications, sentNotificationKeys]);

  /**
   * Add a new notification
   * @param {Object} notification - Notification object
   * @returns {string} Notification ID
   */
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    console.log(`🔔 Notification added: ${newNotification.title}`);

    return newNotification.id;
  }, []);

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   */
  const deleteNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const filtered = prev.filter(n => n.id !== notificationId);

      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }

      return filtered;
    });
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setSentNotificationKeys([]);
  }, []);

  /**
   * Clear old notifications (older than specified days)
   * @param {number} daysOld - Number of days (default 30)
   */
  const clearOldNotifications = useCallback((daysOld = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffISO = cutoffDate.toISOString();

    setNotifications(prev => {
      const filtered = prev.filter(n => n.createdAt >= cutoffISO);
      const removedUnread = prev.filter(n => n.createdAt < cutoffISO && !n.read).length;

      if (removedUnread > 0) {
        setUnreadCount(count => Math.max(0, count - removedUnread));
      }

      return filtered;
    });

    console.log(`🗑️ Cleared notifications older than ${daysOld} days`);
  }, []);

  /**
   * Process tasks and generate deadline notifications
   * @param {Array} tasks - Array of tasks to check
   */
  const processTaskDeadlines = useCallback((tasks) => {
    const today = new Date().toISOString().split('T')[0];
    let newNotificationsCount = 0;

    tasks.forEach(task => {
      // Check if notification should be sent
      if (!shouldSendNotification(task, sentNotificationKeys)) {
        return;
      }

      const notificationInfo = calculateNotificationPriority(task);
      const notificationMessage = generateNotificationMessage(task, notificationInfo);

      if (notificationMessage) {
        addNotification(notificationMessage);

        // Mark as sent
        const notificationKey = `${task.id}-${today}`;
        setSentNotificationKeys(prev => [...prev, notificationKey]);

        newNotificationsCount++;
      }
    });

    if (newNotificationsCount > 0) {
      console.log(`🔔 Generated ${newNotificationsCount} new deadline notifications`);
    }

    return newNotificationsCount;
  }, [sentNotificationKeys, addNotification]);

  /**
   * Get unread notifications
   * @returns {Array} Unread notifications
   */
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  /**
   * Get notifications by priority
   * @param {string} priority - Priority level
   * @returns {Array} Filtered notifications
   */
  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  /**
   * Get notifications for a specific user
   * @param {number} userId - User ID
   * @returns {Array} User's notifications
   */
  const getUserNotifications = useCallback((userId) => {
    return notifications.filter(n =>
      n.assignees?.some(a => a.userId === userId)
    );
  }, [notifications]);

  /**
   * Get critical notifications (overdue tasks)
   * @returns {Array} Critical notifications
   */
  const getCriticalNotifications = useCallback(() => {
    return notifications.filter(n =>
      n.priority === 'critical' && !n.read
    );
  }, [notifications]);

  /**
   * Clean up old sent notification keys (older than 7 days)
   */
  const cleanupSentKeys = useCallback(() => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split('T')[0];

    setSentNotificationKeys(prev =>
      prev.filter(key => {
        const [, date] = key.split('-');
        return date >= cutoff;
      })
    );
  }, []);

  // Auto-cleanup old notifications and keys periodically
  useEffect(() => {
    // Run cleanup on mount
    clearOldNotifications(30);
    cleanupSentKeys();

    // Set up periodic cleanup (once per day)
    const cleanupInterval = setInterval(() => {
      clearOldNotifications(30);
      cleanupSentKeys();
    }, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(cleanupInterval);
  }, [clearOldNotifications, cleanupSentKeys]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    clearOldNotifications,
    processTaskDeadlines,
    getUnreadNotifications,
    getNotificationsByPriority,
    getUserNotifications,
    getCriticalNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

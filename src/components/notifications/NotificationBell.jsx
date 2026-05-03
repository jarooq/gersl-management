import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../../services/api';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.Notification.getAll({ limit: 10 });
      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (id, actionUrl) => {
    try {
      await api.Notification.markAsRead(id);
      await fetchNotifications();

      if (actionUrl) {
        navigate(actionUrl);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.Notification.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Delete notification
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.Notification.delete(id);
      await fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Get notification icon color
  const getNotificationColor = (type) => {
    const colors = {
      mention: 'bg-blue-100 text-blue-600',
      task_assigned: 'bg-green-100 text-green-600',
      task_comment: 'bg-purple-100 text-purple-600',
      default: 'bg-ink-100 text-ink-600'
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lift border border-ink-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-ink-200">
            <h3 className="text-lg font-semibold text-ink-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <CheckCheck size={16} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-ink-100 rounded"
              >
                <X size={18} className="text-ink-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-ink-500">
                <Bell size={48} className="mx-auto mb-2 text-ink-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-ink-50 cursor-pointer transition-colors group ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleMarkAsRead(notification.id, notification.actionUrl)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                        <Bell size={18} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium text-ink-900 ${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-ink-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-ink-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>

                          {/* Actions */}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="ml-2 p-1 hover:bg-ink-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} className="text-ink-500" />
                          </button>
                        </div>

                        {!notification.read && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              New
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-ink-200 text-center">
              <button
                onClick={() => {
                  navigate('/admin/notifications');
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

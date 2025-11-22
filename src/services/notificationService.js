// ============================================
// API SERVICE LAYER - Notifications
// ============================================
// Centralized API communication for notifications

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:3001/api' : '/api');
const API_TIMEOUT = 30000;

class APIError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.errors = errors;
  }
}

const fetchWithTimeout = (url, options = {}, timeout = API_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJSON = contentType && contentType.includes('application/json');

  let data;
  if (isJSON) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = data?.message || 'An error occurred';
    const errors = data?.errors || null;

    console.error('❌ Notifications API Error:', {
      url: response.url,
      status: response.status,
      message,
      errors
    });

    throw new APIError(message, response.status, errors);
  }

  return data;
};

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get authentication token from localStorage
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly cookies
  };

  const response = await fetchWithTimeout(url, config);
  return await handleResponse(response);
};

/**
 * Notification API Service
 * Handles all HTTP requests related to notifications
 */

// Get user notifications
export const fetchUserNotifications = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.read !== undefined) params.append('read', filters.read);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
  return await request(endpoint);
};

// Get unread notifications
export const fetchUnreadNotifications = async () => {
  return await request('/notifications/unread');
};

// Get single notification by ID
export const fetchNotificationById = async (id) => {
  return await request(`/notifications/${id}`);
};

// Create new notification
export const createNotification = async (notificationData) => {
  return await request('/notifications', {
    method: 'POST',
    body: JSON.stringify(notificationData)
  });
};

// Create bulk notifications
export const createBulkNotifications = async (userIds, notificationData) => {
  return await request('/notifications/bulk', {
    method: 'POST',
    body: JSON.stringify({
      userIds,
      ...notificationData
    })
  });
};

// Mark notification as read
export const markAsRead = async (id) => {
  return await request(`/notifications/${id}/read`, {
    method: 'PUT'
  });
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  return await request('/notifications/read-all', {
    method: 'PUT'
  });
};

// Delete notification
export const deleteNotification = async (id) => {
  return await request(`/notifications/${id}`, {
    method: 'DELETE'
  });
};

// Delete all read notifications
export const deleteAllRead = async () => {
  return await request('/notifications/read', {
    method: 'DELETE'
  });
};

export default {
  fetchUserNotifications,
  fetchUnreadNotifications,
  fetchNotificationById,
  createNotification,
  createBulkNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead
};

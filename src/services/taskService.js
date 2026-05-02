// ============================================
// API SERVICE LAYER - Tasks
// ============================================
// Centralized API communication for project tasks

import { API_BASE_URL } from '../config/apiBase';
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

    console.error('❌ Tasks API Error:', {
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
 * Task API Service
 * Handles all HTTP requests related to project tasks
 */

// Get all tasks with optional filters
export const fetchTasks = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.projectId) params.append('projectId', filters.projectId);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
  return await request(endpoint);
};

// Get tasks assigned to current user
export const fetchMyTasks = async () => {
  return await request('/tasks/my-tasks');
};

// Get single task by ID
export const fetchTaskById = async (id) => {
  return await request(`/tasks/${id}`);
};

// Create new task
export const createTask = async (taskData) => {
  return await request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
};

// Update task
export const updateTask = async (id, taskData) => {
  return await request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData)
  });
};

// Delete task
export const deleteTask = async (id) => {
  return await request(`/tasks/${id}`, {
    method: 'DELETE'
  });
};

// Assign task to user
export const assignTask = async (id, assignmentData) => {
  return await request(`/tasks/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify(assignmentData)
  });
};

// Update task status
export const updateTaskStatus = async (id, status) => {
  return await request(`/tasks/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
};

// Update task progress
export const updateTaskProgress = async (id, progress) => {
  return await request(`/tasks/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progress })
  });
};

// Budget request endpoints
export const requestBudget = async (id, budgetRequestedAmount, budgetRequestNotes) => {
  return await request(`/tasks/${id}/budget-request`, {
    method: 'POST',
    body: JSON.stringify({ budgetRequestedAmount, budgetRequestNotes })
  });
};

export const approveBudget = async (id, budgetAllocated, budgetApprovalNotes) => {
  return await request(`/tasks/${id}/budget-approve`, {
    method: 'PUT',
    body: JSON.stringify({ budgetAllocated, budgetApprovalNotes })
  });
};

export const rejectBudget = async (id, budgetRejectionNotes) => {
  return await request(`/tasks/${id}/budget-reject`, {
    method: 'PUT',
    body: JSON.stringify({ budgetRejectionNotes })
  });
};

// Media team endpoints
export const assignMediaTeam = async (id, mediaTeamAssigned, mediaCoverageType, mediaCoverageRequired = true) => {
  return await request(`/tasks/${id}/media-team`, {
    method: 'PUT',
    body: JSON.stringify({ mediaTeamAssigned, mediaCoverageType, mediaCoverageRequired })
  });
};

export const updateMediaCoverageStatus = async (id, mediaCoverageStatus, mediaCoverageNotes) => {
  return await request(`/tasks/${id}/media-status`, {
    method: 'PUT',
    body: JSON.stringify({ mediaCoverageStatus, mediaCoverageNotes })
  });
};

export default {
  fetchTasks,
  fetchMyTasks,
  fetchTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  updateTaskProgress,
  requestBudget,
  approveBudget,
  rejectBudget,
  assignMediaTeam,
  updateMediaCoverageStatus
};

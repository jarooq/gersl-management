// ============================================
// API SERVICE LAYER - Task Beneficiaries
// ============================================
// Centralized API communication for task beneficiary management

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

    console.error('❌ Task Beneficiaries API Error:', {
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
 * Task Beneficiary API Service
 * Handles all HTTP requests related to task beneficiaries
 */

// Get beneficiaries for a specific task
export const getTaskBeneficiaries = async (taskId, filters = {}) => {
  const params = new URLSearchParams();

  if (filters.selectionStatus) params.append('selectionStatus', filters.selectionStatus);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = queryString
    ? `/tasks/${taskId}/beneficiaries?${queryString}`
    : `/tasks/${taskId}/beneficiaries`;

  return await request(endpoint);
};

// Add single beneficiary to task
export const addBeneficiaryToTask = async (taskId, beneficiaryData) => {
  return await request(`/tasks/${taskId}/beneficiaries`, {
    method: 'POST',
    body: JSON.stringify(beneficiaryData)
  });
};

// Add multiple beneficiaries to task (bulk)
export const addBeneficiariesToTaskBulk = async (taskId, beneficiaryIds, selectionData = {}) => {
  return await request(`/tasks/${taskId}/beneficiaries/bulk`, {
    method: 'POST',
    body: JSON.stringify({
      beneficiaryIds,
      ...selectionData
    })
  });
};

// Update beneficiary selection status
export const updateSelectionStatus = async (taskBeneficiaryId, selectionStatus, selectionNotes = null) => {
  return await request(`/task-beneficiaries/${taskBeneficiaryId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ selectionStatus, selectionNotes })
  });
};

// Mark beneficiary as received
export const markAsReceived = async (taskBeneficiaryId, receivedData) => {
  return await request(`/task-beneficiaries/${taskBeneficiaryId}/receive`, {
    method: 'PUT',
    body: JSON.stringify(receivedData)
  });
};

// Mark beneficiary attendance
export const markAttendance = async (taskBeneficiaryId, attendanceData) => {
  return await request(`/task-beneficiaries/${taskBeneficiaryId}/attendance`, {
    method: 'PUT',
    body: JSON.stringify(attendanceData)
  });
};

// Remove beneficiary from task
export const removeBeneficiaryFromTask = async (taskBeneficiaryId) => {
  return await request(`/task-beneficiaries/${taskBeneficiaryId}`, {
    method: 'DELETE'
  });
};

// Get task history for a specific beneficiary
export const getBeneficiaryTaskHistory = async (beneficiaryId) => {
  return await request(`/beneficiaries/${beneficiaryId}/task-history`);
};

export default {
  getTaskBeneficiaries,
  addBeneficiaryToTask,
  addBeneficiariesToTaskBulk,
  updateSelectionStatus,
  markAsReceived,
  markAttendance,
  removeBeneficiaryFromTask,
  getBeneficiaryTaskHistory
};

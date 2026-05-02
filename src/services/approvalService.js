// ============================================
// API SERVICE LAYER - Approvals
// ============================================
// Centralized API communication for approval workflows

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

    console.error('❌ Approvals API Error:', {
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
 * Approval API Service
 * Handles all HTTP requests related to approval workflows
 */

// Get all approvals with optional filters
export const fetchApprovals = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.entityType) params.append('entityType', filters.entityType);
  if (filters.entityId) params.append('entityId', filters.entityId);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = queryString ? `/approvals?${queryString}` : '/approvals';
  return await request(endpoint);
};

// Get single approval by ID
export const fetchApprovalById = async (id) => {
  return await request(`/approvals/${id}`);
};

// Create new approval
export const createApproval = async (approvalData) => {
  return await request('/approvals', {
    method: 'POST',
    body: JSON.stringify(approvalData)
  });
};

// Approve an approval workflow step
export const approveApproval = async (id, comment = '', reviewerRole = '') => {
  return await request(`/approvals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comment, reviewerRole })
  });
};

// Reject an approval workflow
export const rejectApproval = async (id, reason = '', reviewerRole = '') => {
  return await request(`/approvals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason, reviewerRole })
  });
};

// Get pending approvals for current user
export const fetchPendingApprovals = async () => {
  return await request('/approvals/pending');
};

// Get approval statistics
export const fetchApprovalStats = async () => {
  return await request('/approvals/stats/overview');
};

export default {
  fetchApprovals,
  fetchApprovalById,
  createApproval,
  approveApproval,
  rejectApproval,
  fetchPendingApprovals,
  fetchApprovalStats
};

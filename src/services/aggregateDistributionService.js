// ============================================
// API SERVICE LAYER - Aggregate Distributions
// ============================================
// Centralized API communication for aggregate distribution management

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

    console.error('❌ Aggregate Distributions API Error:', {
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
 * Aggregate Distribution API Service
 * Handles all HTTP requests related to aggregate distributions
 */

// Get aggregate distribution for a specific task
export const getAggregateDistributionByTask = async (taskId) => {
  return await request(`/tasks/${taskId}/aggregate-distribution`);
};

// Create aggregate distribution for task
export const createAggregateDistribution = async (taskId, distributionData) => {
  return await request(`/tasks/${taskId}/aggregate-distribution`, {
    method: 'POST',
    body: JSON.stringify(distributionData)
  });
};

// Get all aggregate distributions with filters
export const getAllAggregateDistributions = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.projectId) params.append('projectId', filters.projectId);
  if (filters.verified !== undefined) params.append('verified', filters.verified);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = queryString
    ? `/aggregate-distributions?${queryString}`
    : '/aggregate-distributions';

  return await request(endpoint);
};

// Update aggregate distribution
export const updateAggregateDistribution = async (id, distributionData) => {
  return await request(`/aggregate-distributions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(distributionData)
  });
};

// Verify aggregate distribution
export const verifyAggregateDistribution = async (id, verificationNotes = null) => {
  return await request(`/aggregate-distributions/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify({ verificationNotes })
  });
};

// Delete aggregate distribution
export const deleteAggregateDistribution = async (id) => {
  return await request(`/aggregate-distributions/${id}`, {
    method: 'DELETE'
  });
};

export default {
  getAggregateDistributionByTask,
  createAggregateDistribution,
  getAllAggregateDistributions,
  updateAggregateDistribution,
  verifyAggregateDistribution,
  deleteAggregateDistribution
};

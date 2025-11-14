// ============================================
// API SERVICE LAYER - Proposals
// ============================================
// Centralized API communication for proposals

const API_BASE_URL = 'http://localhost:3001/api';
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

    console.error('❌ Proposals API Error:', {
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

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly cookies
  };

  const response = await fetchWithTimeout(url, config);
  return await handleResponse(response);
};

/**
 * Proposal API Service
 * Handles all HTTP requests related to proposals
 */

// Get all proposals with optional filters
export const fetchProposals = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.donor) params.append('donor', filters.donor);
  if (filters.programmeArea) params.append('programmeArea', filters.programmeArea);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const endpoint = queryString ? `/proposals?${queryString}` : '/proposals';
  return await request(endpoint);
};

// Get single proposal by ID
export const fetchProposalById = async (id) => {
  return await request(`/proposals/${id}`);
};

// Create new proposal
export const createProposal = async (proposalData) => {
  return await request('/proposals', {
    method: 'POST',
    body: JSON.stringify(proposalData)
  });
};

// Update proposal
export const updateProposal = async (id, proposalData) => {
  return await request(`/proposals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(proposalData)
  });
};

// Delete proposal
export const deleteProposal = async (id) => {
  return await request(`/proposals/${id}`, {
    method: 'DELETE'
  });
};

// Update proposal status
export const updateProposalStatus = async (id, status) => {
  return await request(`/proposals/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
};

// Link proposal to project
export const linkProposalToProject = async (id, projectId, projectCode) => {
  return await request(`/proposals/${id}/link-project`, {
    method: 'PATCH',
    body: JSON.stringify({ projectId, projectCode })
  });
};

// Get proposal statistics
export const fetchProposalStats = async () => {
  return await request('/proposals/stats');
};

export default {
  fetchProposals,
  fetchProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  updateProposalStatus,
  linkProposalToProject,
  fetchProposalStats
};

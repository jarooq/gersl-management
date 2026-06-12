// ============================================
// API SERVICE LAYER - Projects
// ============================================
// Centralized API communication for projects

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
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    throw new APIError(
      errorData.message || errorData.error || 'An error occurred',
      response.status,
      errorData.errors
    );
  }

  const data = await response.json();
  return data;
};

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Fetch all projects
 */
export const fetchProjects = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);

    const url = `${API_BASE_URL}/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await handleResponse(response);

    return {
      success: true,
      data: data.projects || data.data || data || []
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      success: false,
      data: [],
      error: error.message
    };
  }
};

/**
 * Fetch single project by ID
 */
export const fetchProjectById = async (id) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/projects/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await handleResponse(response);

    return {
      success: true,
      data: data.project || data.data || data
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create new project
 */
export const createProject = async (projectData) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData)
    });

    const data = await handleResponse(response);

    return {
      success: true,
      data: data.project || data.data || data
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw new APIError(error.message, error.status, error.errors);
  }
};

/**
 * Update project
 */
export const updateProject = async (id, projectData) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(projectData)
    });

    const data = await handleResponse(response);

    return {
      success: true,
      data: data.project || data.data || data
    };
  } catch (error) {
    console.error('Error updating project:', error);
    throw new APIError(error.message, error.status, error.errors);
  }
};

/**
 * Delete project
 */
export const deleteProject = async (id) => {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    const data = await handleResponse(response);

    return {
      success: true,
      data: data.message || 'Project deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new APIError(error.message, error.status, error.errors);
  }
};

export default {
  fetchProjects,
  fetchProjectById,
  createProject,
  updateProject,
  deleteProject
};

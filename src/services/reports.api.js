/**
 * Reports API Service
 * Handles all API calls related to AI-generated reports
 */

import { API_BASE_URL } from '../config/apiBase';

/**
 * Fetch all reports with optional filters
 * @param {Object} params - Query parameters (page, limit, search, reportType, generationStatus)
 * @returns {Promise<Object>} Reports data with pagination
 */
export const fetchReports = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.reportType) queryParams.append('reportType', params.reportType);
  if (params.generationStatus) queryParams.append('generationStatus', params.generationStatus);

  const response = await fetch(`${API_BASE_URL}/reports?${queryParams}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Fetch a single report by ID
 * @param {number} reportId - Report ID
 * @returns {Promise<Object>} Report data
 */
export const fetchReportById = async (reportId) => {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch report');
  }

  const result = await response.json();
  return result.data.report;
};

/**
 * Create a new AI-generated report
 * @param {Object} reportData - Report data including sections
 * @returns {Promise<Object>} Created report
 */
export const createReport = async (reportData) => {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(reportData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create report');
  }

  const result = await response.json();
  return result.data.report;
};

/**
 * Update an existing report
 * @param {number} reportId - Report ID
 * @param {Object} updates - Report updates
 * @returns {Promise<Object>} Updated report
 */
export const updateReport = async (reportId, updates) => {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update report');
  }

  const result = await response.json();
  return result.data.report;
};

/**
 * Delete a report
 * @param {number} reportId - Report ID
 * @returns {Promise<void>}
 */
export const deleteReport = async (reportId) => {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete report');
  }
};

/**
 * Update a specific section in a report
 * @param {number} reportId - Report ID
 * @param {string} sectionId - Section ID
 * @param {string} content - New content
 * @returns {Promise<Object>} Updated report
 */
export const updateReportSection = async (reportId, sectionId, content) => {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/section`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sectionId, content })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update section');
  }

  const result = await response.json();
  return result.data.report;
};

/**
 * Fetch reports for a specific project
 * @param {number} projectId - Project ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise<Object>} Reports data with pagination
 */
export const fetchReportsByProject = async (projectId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const response = await fetch(`${API_BASE_URL}/reports/project/${projectId}?${queryParams}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project reports');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Fetch reports for a specific proposal
 * @param {number} proposalId - Proposal ID
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise<Object>} Reports data with pagination
 */
export const fetchReportsByProposal = async (proposalId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const response = await fetch(`${API_BASE_URL}/reports/proposal/${proposalId}?${queryParams}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch proposal reports');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Fetch reports by type
 * @param {string} reportType - Report type
 * @param {Object} params - Query parameters (page, limit)
 * @returns {Promise<Object>} Reports data with pagination
 */
export const fetchReportsByType = async (reportType, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);

  const response = await fetch(`${API_BASE_URL}/reports/type/${reportType}?${queryParams}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch reports by type');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Share a report with specific users
 * @param {number} reportId - Report ID
 * @param {Object} shareData - { userIds: Array<number>, isPublic: boolean }
 * @returns {Promise<Object>} Updated report
 */
export const shareReport = async (reportId, shareData) => {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/share`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(shareData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to share report');
  }

  const result = await response.json();
  return result.data.report;
};

/**
 * Export a report
 * @param {number} reportId - Report ID
 * @param {string} format - Export format (json, pdf, docx, etc.)
 * @returns {Promise<Object>} Report data for export
 */
export const exportReport = async (reportId, format = 'json') => {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/export?format=${format}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to export report');
  }

  const result = await response.json();
  return result.data.report;
};

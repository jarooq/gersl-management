// ============================================
// API SERVICE LAYER
// ============================================
// Centralized API communication with backend

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000;

// Log API URL for debugging (development only)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('📝 Environment:', import.meta.env.MODE);
  console.log('📝 VITE_API_URL:', import.meta.env.VITE_API_URL);
}

// ============================================
// TOKEN MANAGEMENT (DEPRECATED - Now using httpOnly cookies)
// ============================================
// NOTE: Tokens are now stored in httpOnly cookies for security.
// This TokenManager is kept for backward compatibility only.
// To fully remove localStorage tokens, users should logout and login again.

export const TokenManager = {
  getAccessToken: () => null, // Tokens now in httpOnly cookies
  getRefreshToken: () => null, // Tokens now in httpOnly cookies
  setTokens: (accessToken, refreshToken) => {
    // No-op: Tokens are set via httpOnly cookies by the backend
    console.warn('⚠️ TokenManager.setTokens is deprecated. Tokens are now managed via httpOnly cookies.');
  },
  clearTokens: () => {
    // Clear localStorage for backward compatibility
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  }
};

// ============================================
// HTTP CLIENT
// ============================================

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

    // Only log errors that aren't expected 404s for disabled features
    if (!(response.status === 404 && response.url.includes('orphan-needs'))) {
      console.error('❌ API Error:', {
        url: response.url,
        status: response.status,
        message,
        errors
      });
    }

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
    credentials: 'include', // Include httpOnly cookies in requests
  };

  try {
    const response = await fetchWithTimeout(url, config);
    return await handleResponse(response);
  } catch (error) {
    // Handle token expiration
    if (error.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      // Try to refresh token (only if not already on login/refresh endpoints)
      try {
        await AuthAPI.refreshToken();
        // Retry original request
        const retryResponse = await fetchWithTimeout(url, config);
        return await handleResponse(retryResponse);
      } catch (refreshError) {
        // Refresh failed, logout
        TokenManager.clearTokens();
        window.location.href = '/login';
        throw refreshError;
      }
    }
    throw error;
  }
};

// ============================================
// AUTHENTICATION API
// ============================================

export const AuthAPI = {
  login: async (credentials) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Tokens are now set via httpOnly cookies by the backend
    // Clear any old localStorage tokens for migration
    TokenManager.clearTokens();
    return data.data;
  },

  register: async (userData) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    // Tokens are now set via httpOnly cookies by the backend
    // Clear any old localStorage tokens for migration
    TokenManager.clearTokens();
    return data.data;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      // Clear any old localStorage tokens
      TokenManager.clearTokens();
    }
  },

  refreshToken: async () => {
    // Refresh token is now read from httpOnly cookie by the backend
    const data = await request('/auth/refresh', {
      method: 'POST',
    });
    // Tokens are refreshed in httpOnly cookies by the backend
    return data.data;
  },

  getCurrentUser: async () => {
    const data = await request('/auth/me');
    return data.data.user;
  },

  updateProfile: async (profileData) => {
    const data = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return data.data.user;
  },

  changePassword: async (passwordData) => {
    const data = await request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
    return data;
  },
};

// ============================================
// ORPHAN API
// ============================================

export const OrphanAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/orphans?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/orphans/${id}`);
    return data.data.orphan;
  },

  create: async (orphanData) => {
    const data = await request('/orphans', {
      method: 'POST',
      body: JSON.stringify(orphanData),
    });
    return data.data.orphan;
  },

  update: async (id, orphanData) => {
    const data = await request(`/orphans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orphanData),
    });
    return data.data.orphan;
  },

  delete: async (id) => {
    await request(`/orphans/${id}`, { method: 'DELETE' });
  },

  approve: async (id, approvalStatus, remarks) => {
    const data = await request(`/orphans/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus, remarks }),
    });
    return data.data.orphan;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/orphans/stats?${queryString}`);
    return data.data;
  },

  getByCoordinator: async (coordinatorId) => {
    const data = await request(`/orphans/coordinator/${coordinatorId}`);
    return data.data.orphans;
  },

  bulkImport: async (orphansData) => {
    const data = await request('/orphans/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ orphans: orphansData }),
    });
    return data.data;
  },
};

// ============================================
// PROJECT API
// ============================================

export const ProjectAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/projects?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/projects/${id}`);
    return data.data.project;
  },

  create: async (projectData) => {
    const data = await request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return data.data.project;
  },

  update: async (id, projectData) => {
    const data = await request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
    return data.data.project;
  },

  delete: async (id) => {
    await request(`/projects/${id}`, { method: 'DELETE' });
  },

  updateProgress: async (id, progress, beneficiaries) => {
    const data = await request(`/projects/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress, beneficiaries }),
    });
    return data.data.project;
  },

  getExpenses: async (id) => {
    const data = await request(`/projects/${id}/expenses`);
    return data.data;
  },

  getIndicators: async (id) => {
    const data = await request(`/projects/${id}/indicators`);
    return data.data.indicators;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/projects/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// FINANCE API
// ============================================

export const FinanceAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/finance?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/finance/${id}`);
    return data.data.expense;
  },

  create: async (expenseData) => {
    const data = await request('/finance', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    return data.data.expense;
  },

  update: async (id, expenseData) => {
    const data = await request(`/finance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    });
    return data.data.expense;
  },

  delete: async (id) => {
    await request(`/finance/${id}`, { method: 'DELETE' });
  },

  approve: async (id, status, remarks) => {
    const data = await request(`/finance/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ status, remarks }),
    });
    return data.data.expense;
  },

  markAsPaid: async (id, paymentMethod) => {
    const data = await request(`/finance/${id}/paid`, {
      method: 'PUT',
      body: JSON.stringify({ paymentMethod }),
    });
    return data.data.expense;
  },

  getPending: async () => {
    const data = await request('/finance/pending');
    return data.data.expenses;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/finance/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// USERS API
// ============================================

export const UsersAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/users?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/users/${id}`);
    return data.data;
  },

  create: async (userData) => {
    const data = await request(`/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data.data;
  },

  update: async (id, userData) => {
    const data = await request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return data.data;
  },

  delete: async (id) => {
    await request(`/users/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// HR API
// ============================================

export const HRAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/hr?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/hr/${id}`);
    return data.data.staff;
  },

  create: async (staffData) => {
    const data = await request('/hr', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
    return data.data.staff;
  },

  update: async (id, staffData) => {
    const data = await request(`/hr/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staffData),
    });
    return data.data.staff;
  },

  delete: async (id) => {
    await request(`/hr/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/hr/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// CBO API
// ============================================

export const CBOAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/cbo/${id}`);
    return data.data.cboPartner;
  },

  create: async (cboData) => {
    const data = await request('/cbo', {
      method: 'POST',
      body: JSON.stringify(cboData),
    });
    return data.data.cboPartner;
  },

  update: async (id, cboData) => {
    const data = await request(`/cbo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cboData),
    });
    return data.data.cboPartner;
  },

  delete: async (id) => {
    await request(`/cbo/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// PARTNER API
// ============================================

export const PartnerAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/partners?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/partners/${id}`);
    return data.data.partner;
  },

  create: async (partnerData) => {
    const data = await request('/partners', {
      method: 'POST',
      body: JSON.stringify(partnerData),
    });
    return data.data.partner;
  },

  update: async (id, partnerData) => {
    const data = await request(`/partners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(partnerData),
    });
    return data.data.partner;
  },

  delete: async (id) => {
    await request(`/partners/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/partners/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// MEAL API
// ============================================

export const MEALAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/meal?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/meal/${id}`);
    return data.data.indicator;
  },

  create: async (indicatorData) => {
    const data = await request('/meal', {
      method: 'POST',
      body: JSON.stringify(indicatorData),
    });
    return data.data.indicator;
  },

  update: async (id, indicatorData) => {
    const data = await request(`/meal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(indicatorData),
    });
    return data.data.indicator;
  },

  delete: async (id) => {
    await request(`/meal/${id}`, { method: 'DELETE' });
  },

  updateProgress: async (id, current, status) => {
    const data = await request(`/meal/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ current, status }),
    });
    return data.data.indicator;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/meal/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// VISIT LOG API
// ============================================

export const VisitLogAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/visit-logs?${queryString}`);
    return data.data;
  },

  getByOrphan: async (orphanId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/visit-logs/orphan/${orphanId}?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/visit-logs/${id}`);
    return data.data;
  },

  create: async (visitLogData) => {
    const data = await request('/visit-logs', {
      method: 'POST',
      body: JSON.stringify(visitLogData),
    });
    return data.data;
  },

  update: async (id, visitLogData) => {
    const data = await request(`/visit-logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(visitLogData),
    });
    return data.data;
  },

  delete: async (id) => {
    await request(`/visit-logs/${id}`, { method: 'DELETE' });
  },

  getByDateRange: async (orphanId, startDate, endDate) => {
    const params = new URLSearchParams({ startDate, endDate }).toString();
    const data = await request(`/visit-logs/range/${orphanId}?${params}`);
    return data.data;
  },
};

// ============================================
// ORPHAN REPORT API
// ============================================

export const OrphanReportAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/orphan-reports?${queryString}`);
    return data.data;
  },

  getByOrphan: async (orphanId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/orphan-reports/orphan/${orphanId}?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/orphan-reports/${id}`);
    return data.data;
  },

  create: async (reportData) => {
    const data = await request('/orphan-reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
    return data.data;
  },

  update: async (id, reportData) => {
    const data = await request(`/orphan-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
    return data.data;
  },

  delete: async (id) => {
    await request(`/orphan-reports/${id}`, { method: 'DELETE' });
  },

  generateReport: async (id) => {
    const data = await request(`/orphan-reports/${id}/generate`, {
      method: 'POST',
    });
    return data.data;
  },

  downloadPDF: async (id) => {
    const data = await request(`/orphan-reports/${id}/pdf`);
    return data.data;
  },
};

// ============================================
// ORPHAN NEED API
// ============================================

export const OrphanNeedAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/orphan-needs?${queryString}`);
    return data;
  },

  getById: async (id) => {
    const data = await request(`/orphan-needs/${id}`);
    return data.data;
  },

  getSummary: async () => {
    const data = await request('/orphan-needs/summary');
    return data.data;
  },

  create: async (needData) => {
    const data = await request('/orphan-needs', {
      method: 'POST',
      body: JSON.stringify(needData),
    });
    return data.data;
  },

  update: async (id, needData) => {
    const data = await request(`/orphan-needs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(needData),
    });
    return data.data;
  },

  approve: async (id, approved) => {
    const data = await request(`/orphan-needs/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approved }),
    });
    return data.data;
  },

  delete: async (id) => {
    await request(`/orphan-needs/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// UPLOAD API
// ============================================

export const UploadAPI = {
  uploadOrphanDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const data = await request('/upload/orphan', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    return data.data;
  },

  uploadOrphanDocuments: async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const data = await request('/upload/orphan/multiple', {
      method: 'POST',
      body: formData,
      headers: {},
    });
    return data.data.files;
  },

  uploadProjectDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const data = await request('/upload/project', {
      method: 'POST',
      body: formData,
      headers: {},
    });
    return data.data;
  },

  uploadProjectDocuments: async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const data = await request('/upload/project/multiple', {
      method: 'POST',
      body: formData,
      headers: {},
    });
    return data.data.files;
  },

  uploadFinanceDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const data = await request('/upload/finance', {
      method: 'POST',
      body: formData,
      headers: {},
    });
    return data.data;
  },

  uploadProfileImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const data = await request('/upload/profile', {
      method: 'POST',
      body: formData,
      headers: {},
    });
    return data.data;
  },

  deleteFile: async (filepath) => {
    await request('/upload', {
      method: 'DELETE',
      body: JSON.stringify({ filepath }),
    });
  },
};

// ============================================
// APPROVAL API
// ============================================

export const ApprovalAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/approvals?${queryString}`);
    return data.data || data;
  },

  approve: async (id, action, remarks = '') => {
    const data = await request(`/approvals/${id}/${action}`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
    return data.data || data;
  },
};

// ============================================
// HEALTH CHECK
// ============================================

export const BeneficiaryAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/beneficiaries?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/beneficiaries/${id}`);
    return data.data;
  },

  checkDuplicate: async (nic) => {
    const data = await request(`/beneficiaries/check-duplicate?nic=${nic}`);
    return data.data;
  },

  create: async (beneficiaryData) => {
    const data = await request('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(beneficiaryData),
    });
    return data.data.beneficiary;
  },

  update: async (id, beneficiaryData) => {
    const data = await request(`/beneficiaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(beneficiaryData),
    });
    return data.data.beneficiary;
  },

  delete: async (id) => {
    await request(`/beneficiaries/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/beneficiaries/stats?${queryString}`);
    return data.data;
  },

  getDistricts: async () => {
    const data = await request('/beneficiaries/districts');
    return data.data.districts;
  },

  getDivisions: async (district) => {
    const data = await request(`/beneficiaries/divisions?district=${district}`);
    return data.data.divisions;
  },

  getGNDivisions: async (dsDivision) => {
    const data = await request(`/beneficiaries/gn-divisions?ds_division=${dsDivision}`);
    return data.data.gn_divisions;
  },

  bulkImport: async (beneficiariesData) => {
    const data = await request('/beneficiaries/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ beneficiaries: beneficiariesData }),
    });
    return data.data;
  },
};

// ============================================
// BENEFICIARY SUPPORT API
// ============================================

export const BeneficiarySupportAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/beneficiary-support?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/beneficiary-support/${id}`);
    return data.data.support;
  },

  getBeneficiaryHistory: async (beneficiaryId) => {
    const data = await request(`/beneficiary-support/beneficiary/${beneficiaryId}`);
    return data.data;
  },

  create: async (supportData) => {
    const data = await request('/beneficiary-support', {
      method: 'POST',
      body: JSON.stringify(supportData),
    });
    return data.data.support;
  },

  update: async (id, supportData) => {
    const data = await request(`/beneficiary-support/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supportData),
    });
    return data.data.support;
  },

  delete: async (id) => {
    await request(`/beneficiary-support/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/beneficiary-support/stats?${queryString}`);
    return data.data;
  },

  generateReport: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/beneficiary-support/report?${queryString}`);
    return data.data;
  },
};

// ============================================
// HEALTH CHECK API
// ============================================

export const HealthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return await response.json();
  },
};

// ============================================
// AI PROPOSAL ASSISTANT API
// ============================================

export const AIAPI = {
  checkStatus: async () => {
    return await request('/ai/status');
  },

  generateProposal: async (idea) => {
    return await request('/ai/generate-proposal', {
      method: 'POST',
      body: JSON.stringify({ idea }),
    });
  },
};

// ============================================
// PROPOSAL API
// ============================================

export const ProposalAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/proposals?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/proposals/${id}`);
    return data.data.proposal;
  },

  create: async (proposalData) => {
    const data = await request('/proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData),
    });
    return data.data.proposal;
  },

  update: async (id, proposalData) => {
    const data = await request(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proposalData),
    });
    return data.data.proposal;
  },

  delete: async (id) => {
    await request(`/proposals/${id}`, { method: 'DELETE' });
  },

  updateStatus: async (id, status, comments = '') => {
    const data = await request(`/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comments }),
    });
    return data.data.proposal;
  },

  linkProject: async (id, projectId) => {
    const data = await request(`/proposals/${id}/link-project`, {
      method: 'PATCH',
      body: JSON.stringify({ projectId }),
    });
    return data.data.proposal;
  },
};

// ============================================
// EXPORT DEFAULT API OBJECT
// ============================================

const API = {
  Auth: AuthAPI,
  Users: UsersAPI,
  Orphan: OrphanAPI,
  OrphanNeed: OrphanNeedAPI,
  VisitLog: VisitLogAPI,
  OrphanReport: OrphanReportAPI,
  Project: ProjectAPI,
  Finance: FinanceAPI,
  HR: HRAPI,
  CBO: CBOAPI,
  Partner: PartnerAPI,
  MEAL: MEALAPI,
  Upload: UploadAPI,
  Approval: ApprovalAPI,
  Health: HealthAPI,
  Beneficiary: BeneficiaryAPI,
  BeneficiarySupport: BeneficiarySupportAPI,
  AI: AIAPI,
  Proposal: ProposalAPI,
  TokenManager,
};

export default API;

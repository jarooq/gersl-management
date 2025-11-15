// ============================================
// API SERVICE LAYER
// ============================================
// Centralized API communication with backend

// Use environment variable for API URL, fallback to relative path for production
// In production (Vercel), relative /api goes through our serverless proxy
// In development, use localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'development' ? 'http://localhost:3001/api' : '/api');
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
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken, refreshToken) => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
  clearTokens: () => {
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

  // Add Authorization header if token exists
  const token = TokenManager.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
      // Only try to refresh if we have a refresh token
      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          await AuthAPI.refreshToken();
          // Retry original request with new token
          const newToken = TokenManager.getAccessToken();
          if (newToken) {
            config.headers['Authorization'] = `Bearer ${newToken}`;
          }
          const retryResponse = await fetchWithTimeout(url, config);
          return await handleResponse(retryResponse);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          TokenManager.clearTokens();
          window.location.href = '/login';
          throw refreshError;
        }
      } else {
        // No refresh token available, just clear and throw
        TokenManager.clearTokens();
        throw error;
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
    // Store tokens in localStorage - tokens are at root level of response
    if (data.accessToken && data.refreshToken) {
      TokenManager.setTokens(data.accessToken, data.refreshToken);
    }
    return data;
  },

  register: async (userData) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    // Note: register response doesn't include tokens at root level, they're in cookies only
    // User data is in data.data
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
// HR ONBOARDING API
// ============================================

export const HROnboardingAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/hr/onboarding?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/hr/onboarding/${id}`);
    return data.data.record;
  },

  getByStaff: async (staffId) => {
    const data = await request(`/hr/onboarding/staff/${staffId}`);
    return data.data.records;
  },

  create: async (recordData) => {
    const data = await request('/hr/onboarding', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
    return data.data.record;
  },

  update: async (id, recordData) => {
    const data = await request(`/hr/onboarding/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
    return data.data.record;
  },

  updateProgress: async (id, progress) => {
    const data = await request(`/hr/onboarding/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
    return data.data.record;
  },

  delete: async (id) => {
    await request(`/hr/onboarding/${id}`, { method: 'DELETE' });
  },

  getStats: async () => {
    const data = await request('/hr/onboarding/stats');
    return data.data;
  },
};

// ============================================
// HR APPRAISAL API
// ============================================

export const HRAppraisalAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/hr/appraisal?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/hr/appraisal/${id}`);
    return data.data.record;
  },

  getByStaff: async (staffId) => {
    const data = await request(`/hr/appraisal/staff/${staffId}`);
    return data.data.records;
  },

  create: async (recordData) => {
    const data = await request('/hr/appraisal', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
    return data.data.record;
  },

  update: async (id, recordData) => {
    const data = await request(`/hr/appraisal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
    return data.data.record;
  },

  submit: async (id) => {
    const data = await request(`/hr/appraisal/${id}/submit`, {
      method: 'PUT',
    });
    return data.data.record;
  },

  acknowledge: async (id, employeeComments) => {
    const data = await request(`/hr/appraisal/${id}/acknowledge`, {
      method: 'PUT',
      body: JSON.stringify({ employeeComments }),
    });
    return data.data.record;
  },

  delete: async (id) => {
    await request(`/hr/appraisal/${id}`, { method: 'DELETE' });
  },

  getStats: async () => {
    const data = await request('/hr/appraisal/stats');
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

  // Contribution operations
  getContributions: async (partnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/partners/${partnerId}/contributions?${queryString}`);
    return data.data;
  },

  createContribution: async (partnerId, contributionData) => {
    const data = await request(`/partners/${partnerId}/contributions`, {
      method: 'POST',
      body: JSON.stringify(contributionData),
    });
    return data.data.contribution;
  },

  updateContribution: async (id, contributionData) => {
    const data = await request(`/partners/contributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contributionData),
    });
    return data.data.contribution;
  },

  deleteContribution: async (id) => {
    await request(`/partners/contributions/${id}`, { method: 'DELETE' });
  },

  // Communication operations
  getCommunications: async (partnerId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/partners/${partnerId}/communications?${queryString}`);
    return data.data;
  },

  createCommunication: async (partnerId, communicationData) => {
    const data = await request(`/partners/${partnerId}/communications`, {
      method: 'POST',
      body: JSON.stringify(communicationData),
    });
    return data.data.communication;
  },

  updateCommunication: async (id, communicationData) => {
    const data = await request(`/partners/communications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(communicationData),
    });
    return data.data.communication;
  },

  deleteCommunication: async (id) => {
    await request(`/partners/communications/${id}`, { method: 'DELETE' });
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
// CAMPAIGN API
// ============================================

export const CampaignAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/campaigns?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/campaigns/${id}`);
    return data.data.campaign;
  },

  create: async (campaignData) => {
    const data = await request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
    return data.data.campaign;
  },

  update: async (id, campaignData) => {
    const data = await request(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campaignData),
    });
    return data.data.campaign;
  },

  delete: async (id) => {
    await request(`/campaigns/${id}`, { method: 'DELETE' });
  },

  approve: async (id, approvalStatus, remarks = '') => {
    const data = await request(`/campaigns/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus, remarks }),
    });
    return data.data.campaign;
  },

  getStats: async () => {
    const data = await request('/campaigns/stats');
    return data.data;
  },
};

// ============================================
// DONATION API
// ============================================

export const DonationAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/donations?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/donations/${id}`);
    return data.data.donation;
  },

  create: async (donationData) => {
    const data = await request('/donations', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
    return data.data.donation;
  },

  update: async (id, donationData) => {
    const data = await request(`/donations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(donationData),
    });
    return data.data.donation;
  },

  delete: async (id) => {
    await request(`/donations/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/donations/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// INVOICE API
// ============================================

export const InvoiceAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/invoices?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/invoices/${id}`);
    return data.data.invoice;
  },

  create: async (invoiceData) => {
    const data = await request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
    return data.data.invoice;
  },

  update: async (id, invoiceData) => {
    const data = await request(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData),
    });
    return data.data.invoice;
  },

  delete: async (id) => {
    await request(`/invoices/${id}`, { method: 'DELETE' });
  },

  markAsPaid: async (id, paymentData) => {
    const data = await request(`/invoices/${id}/paid`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
    return data.data.invoice;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/invoices/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// BILL API
// ============================================

export const BillAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/bills?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/bills/${id}`);
    return data.data.bill;
  },

  create: async (billData) => {
    const data = await request('/bills', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
    return data.data.bill;
  },

  update: async (id, billData) => {
    const data = await request(`/bills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(billData),
    });
    return data.data.bill;
  },

  delete: async (id) => {
    await request(`/bills/${id}`, { method: 'DELETE' });
  },

  markAsPaid: async (id, paymentData) => {
    const data = await request(`/bills/${id}/paid`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
    return data.data.bill;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/bills/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// PURCHASE ORDER API
// ============================================

export const PurchaseOrderAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/purchase-orders?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/purchase-orders/${id}`);
    return data.data.purchaseOrder;
  },

  create: async (poData) => {
    const data = await request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(poData),
    });
    return data.data.purchaseOrder;
  },

  update: async (id, poData) => {
    const data = await request(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(poData),
    });
    return data.data.purchaseOrder;
  },

  delete: async (id) => {
    await request(`/purchase-orders/${id}`, { method: 'DELETE' });
  },

  approve: async (id, approvalStatus, remarks = '') => {
    const data = await request(`/purchase-orders/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus, remarks }),
    });
    return data.data.purchaseOrder;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/purchase-orders/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// CHART OF ACCOUNTS API
// ============================================

export const ChartOfAccountsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/chart-of-accounts?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/chart-of-accounts/${id}`);
    return data.data.account;
  },

  create: async (accountData) => {
    const data = await request('/chart-of-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
    return data.data.account;
  },

  update: async (id, accountData) => {
    const data = await request(`/chart-of-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });
    return data.data.account;
  },

  delete: async (id) => {
    await request(`/chart-of-accounts/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// JOURNAL ENTRY API
// ============================================

export const JournalEntryAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/journal-entries?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/journal-entries/${id}`);
    return data.data.entry;
  },

  create: async (entryData) => {
    const data = await request('/journal-entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return data.data.entry;
  },

  update: async (id, entryData) => {
    const data = await request(`/journal-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
    return data.data.entry;
  },

  delete: async (id) => {
    await request(`/journal-entries/${id}`, { method: 'DELETE' });
  },

  post: async (id) => {
    const data = await request(`/journal-entries/${id}/post`, {
      method: 'PUT',
    });
    return data.data.entry;
  },
};

// ============================================
// BANK ACCOUNT API
// ============================================

export const BankAccountAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/bank-accounts?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/bank-accounts/${id}`);
    return data.data.account;
  },

  create: async (accountData) => {
    const data = await request('/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
    return data.data.account;
  },

  update: async (id, accountData) => {
    const data = await request(`/bank-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountData),
    });
    return data.data.account;
  },

  delete: async (id) => {
    await request(`/bank-accounts/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// BANK TRANSACTION API
// ============================================

export const BankTransactionAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/bank-transactions?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/bank-transactions/${id}`);
    return data.data.transaction;
  },

  create: async (transactionData) => {
    const data = await request('/bank-transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
    return data.data.transaction;
  },

  update: async (id, transactionData) => {
    const data = await request(`/bank-transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
    return data.data.transaction;
  },

  delete: async (id) => {
    await request(`/bank-transactions/${id}`, { method: 'DELETE' });
  },

  reconcile: async (id, reconciled = true) => {
    const data = await request(`/bank-transactions/${id}/reconcile`, {
      method: 'PUT',
      body: JSON.stringify({ reconciled }),
    });
    return data.data.transaction;
  },
};

// ============================================
// BUDGET API
// ============================================

export const BudgetAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/budgets?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/budgets/${id}`);
    return data.data.budget;
  },

  create: async (budgetData) => {
    const data = await request('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
    return data.data.budget;
  },

  update: async (id, budgetData) => {
    const data = await request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
    return data.data.budget;
  },

  delete: async (id) => {
    await request(`/budgets/${id}`, { method: 'DELETE' });
  },

  approve: async (id, approvalStatus, remarks = '') => {
    const data = await request(`/budgets/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus, remarks }),
    });
    return data.data.budget;
  },
};

// ============================================
// PAYROLL API
// ============================================

export const PayrollAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/payroll?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/payroll/${id}`);
    return data.data.payroll;
  },

  create: async (payrollData) => {
    const data = await request('/payroll', {
      method: 'POST',
      body: JSON.stringify(payrollData),
    });
    return data.data.payroll;
  },

  update: async (id, payrollData) => {
    const data = await request(`/payroll/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payrollData),
    });
    return data.data.payroll;
  },

  delete: async (id) => {
    await request(`/payroll/${id}`, { method: 'DELETE' });
  },

  process: async (id) => {
    const data = await request(`/payroll/${id}/process`, {
      method: 'PUT',
    });
    return data.data.payroll;
  },
};

// ============================================
// GRANT RECEIVABLE API
// ============================================

export const GrantReceivableAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/grant-receivables?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/grant-receivables/${id}`);
    return data.data.grant;
  },

  create: async (grantData) => {
    const data = await request('/grant-receivables', {
      method: 'POST',
      body: JSON.stringify(grantData),
    });
    return data.data.grant;
  },

  update: async (id, grantData) => {
    const data = await request(`/grant-receivables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grantData),
    });
    return data.data.grant;
  },

  delete: async (id) => {
    await request(`/grant-receivables/${id}`, { method: 'DELETE' });
  },

  recordReceipt: async (id, receiptData) => {
    const data = await request(`/grant-receivables/${id}/receipt`, {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
    return data.data.grant;
  },
};

// ============================================
// FIXED ASSET API
// ============================================

export const FixedAssetAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/fixed-assets?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/fixed-assets/${id}`);
    return data.data.asset;
  },

  create: async (assetData) => {
    const data = await request('/fixed-assets', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
    return data.data.asset;
  },

  update: async (id, assetData) => {
    const data = await request(`/fixed-assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData),
    });
    return data.data.asset;
  },

  delete: async (id) => {
    await request(`/fixed-assets/${id}`, { method: 'DELETE' });
  },

  depreciate: async (id, depreciationData) => {
    const data = await request(`/fixed-assets/${id}/depreciate`, {
      method: 'POST',
      body: JSON.stringify(depreciationData),
    });
    return data.data.asset;
  },

  dispose: async (id, disposalData) => {
    const data = await request(`/fixed-assets/${id}/dispose`, {
      method: 'PUT',
      body: JSON.stringify(disposalData),
    });
    return data.data.asset;
  },
};

// ============================================
// JOB POSTING API
// ============================================

export const JobPostingAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/job-postings?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/job-postings/${id}`);
    return data.data.jobPosting;
  },

  create: async (jobData) => {
    const data = await request('/job-postings', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
    return data.data.jobPosting;
  },

  update: async (id, jobData) => {
    const data = await request(`/job-postings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
    return data.data.jobPosting;
  },

  delete: async (id) => {
    await request(`/job-postings/${id}`, { method: 'DELETE' });
  },

  apply: async (id, applicationData) => {
    const data = await request(`/job-postings/${id}/apply`, {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
    return data.data.application;
  },
};

// ============================================
// VENDOR CALL API
// ============================================

export const VendorCallAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/vendor-calls?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/vendor-calls/${id}`);
    return data.data.vendorCall;
  },

  create: async (callData) => {
    const data = await request('/vendor-calls', {
      method: 'POST',
      body: JSON.stringify(callData),
    });
    return data.data.vendorCall;
  },

  update: async (id, callData) => {
    const data = await request(`/vendor-calls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(callData),
    });
    return data.data.vendorCall;
  },

  delete: async (id) => {
    await request(`/vendor-calls/${id}`, { method: 'DELETE' });
  },

  submit: async (id, submissionData) => {
    const data = await request(`/vendor-calls/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
    return data.data.submission;
  },
};

// ============================================
// SOCIAL MEDIA API
// ============================================

export const SocialMediaAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/social-media?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/social-media/${id}`);
    return data.data.post;
  },

  create: async (postData) => {
    const data = await request('/social-media', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
    return data.data.post;
  },

  update: async (id, postData) => {
    const data = await request(`/social-media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
    return data.data.post;
  },

  delete: async (id) => {
    await request(`/social-media/${id}`, { method: 'DELETE' });
  },

  publish: async (id) => {
    const data = await request(`/social-media/${id}/publish`, {
      method: 'PUT',
    });
    return data.data.post;
  },

  getEngagement: async (postId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/social-media/${postId}/engagement?${queryString}`);
    return data.data;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/social-media/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// COMPLIANCE API
// ============================================

export const ComplianceAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/compliance/${id}`);
    return data.data.document;
  },

  create: async (documentData) => {
    const data = await request('/compliance', {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
    return data.data.document;
  },

  update: async (id, documentData) => {
    const data = await request(`/compliance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(documentData),
    });
    return data.data.document;
  },

  delete: async (id) => {
    await request(`/compliance/${id}`, { method: 'DELETE' });
  },

  submit: async (id) => {
    const data = await request(`/compliance/${id}/submit`, {
      method: 'PUT',
    });
    return data.data.document;
  },

  approve: async (id, approvalStatus, remarks = '') => {
    const data = await request(`/compliance/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus, remarks }),
    });
    return data.data.document;
  },
};

// ============================================
// ATTENDANCE API
// ============================================

export const AttendanceAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/attendance?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/attendance/${id}`);
    return data.data.attendance;
  },

  create: async (attendanceData) => {
    const data = await request('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
    return data.data.attendance;
  },

  update: async (id, attendanceData) => {
    const data = await request(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    });
    return data.data.attendance;
  },

  delete: async (id) => {
    await request(`/attendance/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/attendance/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// LEAVE REQUEST API
// ============================================

export const LeaveRequestAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/leave-requests?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/leave-requests/${id}`);
    return data.data.leaveRequest;
  },

  create: async (leaveData) => {
    const data = await request('/leave-requests', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
    return data.data.leaveRequest;
  },

  update: async (id, leaveData) => {
    const data = await request(`/leave-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    });
    return data.data.leaveRequest;
  },

  delete: async (id) => {
    await request(`/leave-requests/${id}`, { method: 'DELETE' });
  },

  approve: async (id, approvalStatus, remarks = '') => {
    const data = await request(`/leave-requests/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ approvalStatus, remarks }),
    });
    return data.data.leaveRequest;
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
  // New Finance APIs
  Campaign: CampaignAPI,
  Donation: DonationAPI,
  Invoice: InvoiceAPI,
  Bill: BillAPI,
  PurchaseOrder: PurchaseOrderAPI,
  ChartOfAccounts: ChartOfAccountsAPI,
  JournalEntry: JournalEntryAPI,
  BankAccount: BankAccountAPI,
  BankTransaction: BankTransactionAPI,
  Budget: BudgetAPI,
  Payroll: PayrollAPI,
  GrantReceivable: GrantReceivableAPI,
  FixedAsset: FixedAssetAPI,
  // Public/Campaign APIs
  JobPosting: JobPostingAPI,
  VendorCall: VendorCallAPI,
  SocialMedia: SocialMediaAPI,
  Compliance: ComplianceAPI,
  Attendance: AttendanceAPI,
  LeaveRequest: LeaveRequestAPI,
  TokenManager,
};

export default API;

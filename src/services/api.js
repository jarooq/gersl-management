// ============================================
// API SERVICE LAYER
// ============================================
// Centralized API communication with backend

// Use environment variable for API URL, fallback to relative path for production
// In production (Vercel), relative /api goes through our serverless proxy
// In development, use localhost
import { API_BASE_URL, API_ORIGIN } from '../config/apiBase';
const API_TIMEOUT = 30000;

// One-time DEV log — easier to see in the network panel than a logged-once
// flag in module scope. Set window.__DEBUG_API__ in console to opt back in.
if (import.meta.env.DEV && typeof window !== 'undefined' && window.__DEBUG_API__) {
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

    console.error('❌ API Error:', {
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

  // Build headers object - skip Content-Type if body is FormData (browser will set it)
  const headers = {
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
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
    // Support both FormData (for file uploads) and JSON objects
    const data = await request('/orphans', {
      method: 'POST',
      body: orphanData instanceof FormData ? orphanData : JSON.stringify(orphanData),
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

  getBudgetActual: async (id, params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    const data = await request(`/projects/${id}/budget-actual${qs ? `?${qs}` : ''}`);
    return data.data;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/projects/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// PROJECT TEAM MANAGEMENT API
// ============================================

export const ProjectTeamAPI = {
  getTeamMembers: async (projectId, includeInactive = false) => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const data = await request(`/projects/${projectId}/team${params}`);
    return data;
  },

  getAvailableStaff: async (projectId, department = null) => {
    const params = department ? `?department=${encodeURIComponent(department)}` : '';
    const data = await request(`/projects/${projectId}/team/available${params}`);
    return data;
  },

  addTeamMember: async (projectId, memberData) => {
    const data = await request(`/projects/${projectId}/team`, {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
    return data;
  },

  updateTeamMember: async (teamMemberId, updates) => {
    const data = await request(`/team-members/${teamMemberId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data;
  },

  removeTeamMember: async (teamMemberId) => {
    const data = await request(`/team-members/${teamMemberId}`, {
      method: 'DELETE',
    });
    return data;
  },
};

// ============================================
// TASK API
// ============================================

export const TaskAPI = {
  getAll: async (filters = {}) => {
    const queryString = new URLSearchParams(filters).toString();
    const data = await request(`/tasks?${queryString}`);
    return data;
  },

  getById: async (id) => {
    const data = await request(`/tasks/${id}`);
    return data;
  },

  create: async (taskData) => {
    const data = await request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return data;
  },

  update: async (id, updates) => {
    const data = await request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data;
  },

  delete: async (id) => {
    const data = await request(`/tasks/${id}`, {
      method: 'DELETE',
    });
    return data;
  },

  updateStatus: async (id, status) => {
    const data = await request(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return data;
  },

  updateProgress: async (id, progress) => {
    const data = await request(`/tasks/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
    return data;
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

  process: async (id) => {
    const data = await request(`/payroll/${id}/process`, {
      method: 'PUT',
    });
    return data.data.payroll;
  },

  delete: async (id) => {
    await request(`/payroll/${id}`, { method: 'DELETE' });
  },
};

// ============================================
// CBO VOLUNTEER API
// ============================================

export const CBOVolunteerAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/volunteers?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/cbo/volunteers/${id}`);
    return data.data.volunteer;
  },

  getByCBO: async (cboPartnerId) => {
    const data = await request(`/cbo/volunteers/cbo/${cboPartnerId}`);
    return data.data.volunteers;
  },

  create: async (volunteerData) => {
    const data = await request('/cbo/volunteers', {
      method: 'POST',
      body: JSON.stringify(volunteerData),
    });
    return data.data.volunteer;
  },

  update: async (id, volunteerData) => {
    const data = await request(`/cbo/volunteers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(volunteerData),
    });
    return data.data.volunteer;
  },

  delete: async (id) => {
    await request(`/cbo/volunteers/${id}`, { method: 'DELETE' });
  },

  search: async (query) => {
    const data = await request(`/cbo/volunteers/search?query=${encodeURIComponent(query)}`);
    return data.data.volunteers;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/volunteers/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// CBO ACTIVITY API
// ============================================

export const CBOActivityAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/activities?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/cbo/activities/${id}`);
    return data.data.activity;
  },

  getByCBO: async (cboPartnerId) => {
    const data = await request(`/cbo/activities/cbo/${cboPartnerId}`);
    return data.data.activities;
  },

  create: async (activityData) => {
    const data = await request('/cbo/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
    return data.data.activity;
  },

  update: async (id, activityData) => {
    const data = await request(`/cbo/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    });
    return data.data.activity;
  },

  delete: async (id) => {
    await request(`/cbo/activities/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/activities/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// CBO DUE DILIGENCE API
// ============================================

export const CBODueDiligenceAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/due-diligence?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/cbo/due-diligence/${id}`);
    return data.data.assessment;
  },

  getByCBO: async (cboPartnerId) => {
    const data = await request(`/cbo/due-diligence/cbo/${cboPartnerId}`);
    return data.data.assessments;
  },

  create: async (assessmentData) => {
    const data = await request('/cbo/due-diligence', {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
    return data.data.assessment;
  },

  update: async (id, assessmentData) => {
    const data = await request(`/cbo/due-diligence/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assessmentData),
    });
    return data.data.assessment;
  },

  submit: async (id) => {
    const data = await request(`/cbo/due-diligence/${id}/submit`, {
      method: 'PUT',
    });
    return data.data.assessment;
  },

  approve: async (id) => {
    const data = await request(`/cbo/due-diligence/${id}/approve`, {
      method: 'PUT',
    });
    return data.data.assessment;
  },

  reject: async (id) => {
    const data = await request(`/cbo/due-diligence/${id}/reject`, {
      method: 'PUT',
    });
    return data.data.assessment;
  },

  delete: async (id) => {
    await request(`/cbo/due-diligence/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/due-diligence/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// CBO PROPOSAL API
// ============================================

export const CBOProposalAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/proposals?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/cbo/proposals/${id}`);
    return data.data.proposal;
  },

  getByCBO: async (cboPartnerId) => {
    const data = await request(`/cbo/proposals/cbo/${cboPartnerId}`);
    return data.data.proposals;
  },

  create: async (proposalData) => {
    const data = await request('/cbo/proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData),
    });
    return data.data.proposal;
  },

  update: async (id, proposalData) => {
    const data = await request(`/cbo/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(proposalData),
    });
    return data.data.proposal;
  },

  // Fundraising workflow
  fundraisingApprove: async (id, score, comments, reviewer) => {
    const data = await request(`/cbo/proposals/${id}/fundraising/approve`, {
      method: 'PUT',
      body: JSON.stringify({ score, comments, reviewer }),
    });
    return data.data.proposal;
  },

  fundraisingReject: async (id, score, comments, reviewer) => {
    const data = await request(`/cbo/proposals/${id}/fundraising/reject`, {
      method: 'PUT',
      body: JSON.stringify({ score, comments, reviewer }),
    });
    return data.data.proposal;
  },

  // CEO workflow
  ceoApprove: async (id, comments, approver, approvedBudget) => {
    const data = await request(`/cbo/proposals/${id}/ceo/approve`, {
      method: 'PUT',
      body: JSON.stringify({ comments, approver, approvedBudget }),
    });
    return data.data.proposal;
  },

  ceoReject: async (id, comments, approver) => {
    const data = await request(`/cbo/proposals/${id}/ceo/reject`, {
      method: 'PUT',
      body: JSON.stringify({ comments, approver }),
    });
    return data.data.proposal;
  },

  // Donor workflow
  donorApprove: async (id, donorName, approvedBudget) => {
    const data = await request(`/cbo/proposals/${id}/donor/approve`, {
      method: 'PUT',
      body: JSON.stringify({ donorName, approvedBudget }),
    });
    return data.data.proposal;
  },

  donorReject: async (id, donorName) => {
    const data = await request(`/cbo/proposals/${id}/donor/reject`, {
      method: 'PUT',
      body: JSON.stringify({ donorName }),
    });
    return data.data.proposal;
  },

  delete: async (id) => {
    await request(`/cbo/proposals/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/proposals/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// CBO PROJECT API
// ============================================

export const CBOProjectAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/projects?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/cbo/projects/${id}`);
    return data.data.project;
  },

  getByCBO: async (cboPartnerId) => {
    const data = await request(`/cbo/projects/cbo/${cboPartnerId}`);
    return data.data.projects;
  },

  create: async (projectData) => {
    const data = await request('/cbo/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return data.data.project;
  },

  update: async (id, projectData) => {
    const data = await request(`/cbo/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
    return data.data.project;
  },

  updateProgress: async (id, spent, progress, actualBeneficiaries) => {
    const data = await request(`/cbo/projects/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ spent, progress, actualBeneficiaries }),
    });
    return data.data.project;
  },

  // Issue management
  addIssue: async (id, issue) => {
    const data = await request(`/cbo/projects/${id}/issues`, {
      method: 'POST',
      body: JSON.stringify({ issue }),
    });
    return data.data.project;
  },

  updateIssue: async (id, issueId, updates) => {
    const data = await request(`/cbo/projects/${id}/issues/${issueId}`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
    return data.data.project;
  },

  // CFM Feedback
  addCFMFeedback: async (id, feedback) => {
    const data = await request(`/cbo/projects/${id}/cfm-feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
    return data.data.project;
  },

  updateCFMFeedback: async (id, feedbackId, updates) => {
    const data = await request(`/cbo/projects/${id}/cfm-feedback/${feedbackId}`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
    return data.data.project;
  },

  delete: async (id) => {
    await request(`/cbo/projects/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/cbo/projects/stats?${queryString}`);
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

  // Comprehensive financial rollup — orders, invoices, expenses, bills,
  // contributions, and a headline summary (committed/received/spent/net).
  getFinancials: async (partnerId) => {
    const data = await request(`/partners/${partnerId}/financials`);
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
// EVALUATION API
// ============================================

export const EvaluationAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/meal/evaluations?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/meal/evaluations/${id}`);
    return data.data.evaluation;
  },

  create: async (evaluationData) => {
    const data = await request('/meal/evaluations', {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
    return data.data.evaluation;
  },

  update: async (id, evaluationData) => {
    const data = await request(`/meal/evaluations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(evaluationData),
    });
    return data.data.evaluation;
  },

  delete: async (id) => {
    await request(`/meal/evaluations/${id}`, { method: 'DELETE' });
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/meal/evaluations/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// LEARNING EVENT API
// ============================================

export const LearningEventAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/meal/learning-events?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/meal/learning-events/${id}`);
    return data.data.learningEvent;
  },

  create: async (learningEventData) => {
    const data = await request('/meal/learning-events', {
      method: 'POST',
      body: JSON.stringify(learningEventData),
    });
    return data.data.learningEvent;
  },

  update: async (id, learningEventData) => {
    const data = await request(`/meal/learning-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(learningEventData),
    });
    return data.data.learningEvent;
  },

  delete: async (id) => {
    await request(`/meal/learning-events/${id}`, { method: 'DELETE' });
  },

  addParticipant: async (id, participant) => {
    const data = await request(`/meal/learning-events/${id}/participants`, {
      method: 'POST',
      body: JSON.stringify({ participant }),
    });
    return data.data.learningEvent;
  },

  getStats: async () => {
    const data = await request('/meal/learning-events/stats');
    return data.data;
  },
};

// ============================================
// COMPLAINT API
// ============================================

export const ComplaintAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/meal/complaints?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/meal/complaints/${id}`);
    return data.data.complaint;
  },

  create: async (complaintData) => {
    const data = await request('/meal/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
    return data.data.complaint;
  },

  update: async (id, complaintData) => {
    const data = await request(`/meal/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(complaintData),
    });
    return data.data.complaint;
  },

  delete: async (id) => {
    await request(`/meal/complaints/${id}`, { method: 'DELETE' });
  },

  assign: async (id, assignedTo) => {
    const data = await request(`/meal/complaints/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ assignedTo }),
    });
    return data.data.complaint;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/meal/complaints/stats?${queryString}`);
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

// OrphanReportAPI + its UI (ReportsTab, OrphanReportWizard) were removed:
// the `/orphan-reports/*` backend route was never mounted and the
// GeneratedOrphanReport model was dropped in Phase B. Every call from the
// Reports tab on an orphan detail page 404'd silently.

// ============================================
// ORPHAN NEED API — backend route currently disabled (no server-side controller).
// Methods degrade safely so consumer pages render without throwing.
// ============================================

const ORPHAN_NEED_DISABLED = { disabled: true, reason: 'orphan-needs backend route not deployed' };

export const OrphanNeedAPI = {
  getAll:    async () => ({ data: [], pagination: { total: 0 }, ...ORPHAN_NEED_DISABLED }),
  getById:   async () => null,
  getSummary:async () => ({ totalNeeds: 0, byCategory: [], ...ORPHAN_NEED_DISABLED }),
  create:    async () => { throw new Error('Orphan needs feature is currently disabled'); },
  update:    async () => { throw new Error('Orphan needs feature is currently disabled'); },
  approve:   async () => { throw new Error('Orphan needs feature is currently disabled'); },
  delete:    async () => { throw new Error('Orphan needs feature is currently disabled'); },
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

  uploadCampaignImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const data = await request('/upload/campaign', {
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
// CAMPAIGN PACKAGE API
// ============================================
export const CampaignPackageAPI = {
  // Get all packages for a campaign (authenticated)
  getAll: async (campaignId) => {
    const data = await request(`/campaigns/${campaignId}/packages`);
    return data.data.packages;
  },

  // Get active packages for a campaign (public)
  getActive: async (campaignId) => {
    const data = await request(`/campaigns/${campaignId}/packages/active`);
    return data.data.packages;
  },

  // Get single package
  getById: async (id) => {
    const data = await request(`/campaigns/packages/${id}`);
    return data.data.package;
  },

  // Create package
  create: async (campaignId, packageData) => {
    const data = await request(`/campaigns/${campaignId}/packages`, {
      method: 'POST',
      body: JSON.stringify(packageData),
    });
    return data.data.package;
  },

  // Update package
  update: async (id, packageData) => {
    const data = await request(`/campaigns/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(packageData),
    });
    return data.data.package;
  },

  // Delete package
  delete: async (id) => {
    await request(`/campaigns/packages/${id}`, { method: 'DELETE' });
  },

  // Reorder packages
  reorder: async (campaignId, packageIds) => {
    const data = await request(`/campaigns/${campaignId}/packages/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ packageIds }),
    });
    return data.data.packages;
  },

  // Toggle package status
  toggleStatus: async (id) => {
    const data = await request(`/campaigns/packages/${id}/toggle`, {
      method: 'PATCH',
    });
    return data.data.package;
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

  // Record a receipt against an invoice. Captures the receipt-date exchange
  // rate and realised forex gain/loss. Returns { invoice, receipt }.
  recordPayment: async (id, paymentData) => {
    const data = await request(`/invoices/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return data.data;
  },

  getReceipts: async (id) => {
    const data = await request(`/invoices/${id}/receipts`);
    return data.data;
  },

  getForexReport: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/invoices/forex-report?${queryString}`);
    return data.data;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/invoices/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// EXCHANGE RATE API — Sampath Bank O/D Buying rates
// ============================================

export const ExchangeRateAPI = {
  // Latest cached snapshot for every currency.
  getRates: async () => {
    const data = await request('/exchange-rates');
    return data.data;
  },

  // Resolve the O/D Buying rate for one currency on one date.
  // Returns { currency, rate, rateDate, source, stale }.
  resolveRate: async (currency, date) => {
    const params = new URLSearchParams({ currency });
    if (date) params.set('date', date);
    const data = await request(`/exchange-rates/rate?${params.toString()}`);
    return data.data;
  },

  getHistory: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/exchange-rates/history?${queryString}`);
    return data.data;
  },

  // Trigger a live Sampath Bank fetch (Admin/Manager).
  refresh: async () => {
    const data = await request('/exchange-rates/refresh', { method: 'POST' });
    return data.data;
  },

  // Manual rate entry / override (Admin/Manager).
  saveManual: async (rate) => {
    const data = await request('/exchange-rates', {
      method: 'POST',
      body: JSON.stringify(rate),
    });
    return data.data.rate;
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
  // Net weekly hours (45h target, 1h auto lunch). Org-wide endpoint is
  // HR/manager-only; single-user endpoint is the requester's own week
  // by default or another user's when ?userId= is supplied.
  weeklyHours: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/attendance/punches/weekly${qs ? `?${qs}` : ''}`);
    return data.data;
  },
  weeklyHoursAll: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/attendance/punches/weekly/all${qs ? `?${qs}` : ''}`);
    return data.data;
  },

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

  // Mobile punches surfaced for HR. params: { from, to, limit }
  listAllPunches: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/attendance/punches/all?${queryString}`);
    return data.data?.punches || [];
  },
};

// ============================================
// ATTENDANCE CORRECTIONS + REGISTER REPORTS
// ============================================
export const AttendanceCorrectionAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/attendance/corrections${qs ? `?${qs}` : ''}`);
  },
  get: (id) => request(`/attendance/corrections/${id}`),
  request: (data) =>
    request('/attendance/corrections', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id) =>
    request(`/attendance/corrections/${id}/approve`, { method: 'PATCH' }),
  reject: (id, reason) =>
    request(`/attendance/corrections/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  cancel: (id) =>
    request(`/attendance/corrections/${id}/cancel`, { method: 'PATCH' }),

  attendanceRegisterUrl: (params = {}) => {
    const qs = new URLSearchParams({ ...params, format: 'csv' }).toString();
    return `${API_BASE_URL}/attendance/reports/attendance?${qs}`;
  },
  movementRegisterUrl: (params = {}) => {
    const qs = new URLSearchParams({ ...params, format: 'csv' }).toString();
    return `${API_BASE_URL}/attendance/reports/movements?${qs}`;
  }
};

// ============================================
// LEAVE REQUEST API
// ============================================

export const LeaveRequestAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/attendance/leave/requests?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/attendance/leave/requests/${id}`);
    return data.data.leaveRequest;
  },

  create: async (leaveData) => {
    const data = await request('/attendance/leave/requests', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
    return data.data.leaveRequest;
  },

  update: async (id, leaveData) => {
    const data = await request(`/attendance/leave/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leaveData),
    });
    return data.data.leaveRequest;
  },

  delete: async (id) => {
    await request(`/attendance/leave/requests/${id}`, { method: 'DELETE' });
  },

  // Backend handler is PUT /attendance/leave/requests/:id which takes
  // { status, rejectionReason }. The old `/approve` suffix + `approvalStatus`
  // shape didn't exist server-side → clicking Approve/Reject on the HR page
  // just 404'd silently in the browser console.
  approve: async (id, status, rejectionReason = '') => {
    const data = await request(`/attendance/leave/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionReason }),
    });
    return data.data.leaveRequest;
  },
};

// ============================================
// EXPORT DEFAULT API OBJECT
// ============================================

// ============================================
// ROLES API
// ============================================

const RolesAPI = {
  getAll: async () => {
    const data = await request('/roles');
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/roles/${id}`);
    return data.data;
  },

  create: async (roleData) => {
    const data = await request('/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
    return data.data;
  },

  update: async (id, roleData) => {
    const data = await request(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
    return data;
  },

  delete: async (id) => {
    const data = await request(`/roles/${id}`, {
      method: 'DELETE',
    });
    return data;
  },

  assignPermissions: async (id, permission_ids) => {
    const data = await request(`/roles/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permission_ids }),
    });
    return data;
  },

  getAllPermissions: async () => {
    const data = await request('/roles/permissions/all');
    return data.data;
  },

  getStats: async () => {
    const data = await request('/roles/stats');
    return data.data;
  },
};

// ============================================
// DEPARTMENTS API (System Settings)
// ============================================
const DepartmentsAPI = {
  getAll: async (includeInactive = false) => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const data = await request(`/settings/departments${params}`);
    return data;
  },

  getById: async (id) => {
    const data = await request(`/settings/departments/${id}`);
    return data;
  },

  create: async (departmentData) => {
    const data = await request('/settings/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    });
    return data;
  },

  update: async (id, departmentData) => {
    const data = await request(`/settings/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    });
    return data;
  },

  delete: async (id) => {
    const data = await request(`/settings/departments/${id}`, {
      method: 'DELETE',
    });
    return data;
  },

  hardDelete: async (id) => {
    const data = await request(`/settings/departments/${id}/hard`, {
      method: 'DELETE',
    });
    return data;
  },

  reorder: async (departmentIds) => {
    const data = await request('/settings/departments/reorder', {
      method: 'PUT',
      body: JSON.stringify({ departmentIds }),
    });
    return data;
  },
};

// ============================================
// POSITIONS API (System Settings)
// ============================================
const PositionsAPI = {
  getAll: async (includeInactive = false) => {
    const params = includeInactive ? '?includeInactive=true' : '';
    const data = await request(`/settings/positions${params}`);
    return data;
  },

  getById: async (id) => {
    const data = await request(`/settings/positions/${id}`);
    return data;
  },

  create: async (positionData) => {
    const data = await request('/settings/positions', {
      method: 'POST',
      body: JSON.stringify(positionData),
    });
    return data;
  },

  update: async (id, positionData) => {
    const data = await request(`/settings/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(positionData),
    });
    return data;
  },

  delete: async (id) => {
    const data = await request(`/settings/positions/${id}`, {
      method: 'DELETE',
    });
    return data;
  },

  hardDelete: async (id) => {
    const data = await request(`/settings/positions/${id}/hard`, {
      method: 'DELETE',
    });
    return data;
  },

  reorder: async (positionIds) => {
    const data = await request('/settings/positions/reorder', {
      method: 'PUT',
      body: JSON.stringify({ positionIds }),
    });
    return data;
  },
};

// ============================================
// NOTIFICATION API
// ============================================
const NotificationAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    const data = await request(endpoint);
    return data;
  },

  getUnread: async () => {
    const data = await request('/notifications/unread');
    return data;
  },

  getById: async (id) => {
    const data = await request(`/notifications/${id}`);
    return data;
  },

  markAsRead: async (id) => {
    const data = await request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
    return data;
  },

  markAllAsRead: async () => {
    const data = await request('/notifications/read-all', {
      method: 'PUT',
    });
    return data;
  },

  delete: async (id) => {
    const data = await request(`/notifications/${id}`, {
      method: 'DELETE',
    });
    return data;
  },

  deleteAllRead: async () => {
    const data = await request('/notifications/read', {
      method: 'DELETE',
    });
    return data;
  },

  create: async (notificationData) => {
    const data = await request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
    return data;
  },

  createBulk: async (notifications) => {
    const data = await request('/notifications/bulk', {
      method: 'POST',
      body: JSON.stringify({ notifications }),
    });
    return data;
  },
};

// ============================================
// PROCUREMENT API
// ============================================
export const ProcurementAPI = {
  getAllRequisitions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/requisitions${qs ? `?${qs}` : ''}`);
  },
  getUnassigned: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/requisitions/unassigned${qs ? `?${qs}` : ''}`);
  },
  getMyQueue: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/requisitions/my-queue${qs ? `?${qs}` : ''}`);
  },
  getRequisition: (id) => request(`/procurement/requisitions/${id}`),
  createRequisition: (data) =>
    request('/procurement/requisitions', { method: 'POST', body: JSON.stringify(data) }),
  updateRequisition: (id, data) =>
    request(`/procurement/requisitions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assignRequisition: (id, payload) =>
    request(`/procurement/requisitions/${id}/assign`, { method: 'PATCH', body: JSON.stringify(payload) }),
  unassignRequisition: (id) =>
    request(`/procurement/requisitions/${id}/unassign`, { method: 'PATCH' }),
  setMethod: (id, procurementMethod) =>
    request(`/procurement/requisitions/${id}/method`, {
      method: 'PATCH',
      body: JSON.stringify({ procurementMethod })
    }),
  approveRequisition: (id, notes) =>
    request(`/procurement/requisitions/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ notes })
    }),
  deleteRequisition: (id) =>
    request(`/procurement/requisitions/${id}`, { method: 'DELETE' }),
  // Helper: load procurement officers/managers for the assign modal
  listProcurementOfficers: () => request('/procurement/officers'),

  // ============================================
  // RFQ
  // ============================================
  listRFQs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/rfqs${qs ? `?${qs}` : ''}`);
  },
  getRFQ: (id) => request(`/procurement/rfqs/${id}`),
  createRFQ: (data) =>
    request('/procurement/rfqs', { method: 'POST', body: JSON.stringify(data) }),
  inviteVendors: (rfqId, vendorIds) =>
    request(`/procurement/rfqs/${rfqId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ vendorIds })
    }),
  sendRFQ: (rfqId) =>
    request(`/procurement/rfqs/${rfqId}/send`, { method: 'POST' }),
  closeRFQ: (rfqId) =>
    request(`/procurement/rfqs/${rfqId}/close`, { method: 'PATCH' }),
  cancelRFQ: (rfqId, reason) =>
    request(`/procurement/rfqs/${rfqId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    }),

  // ============================================
  // Quotations
  // ============================================
  listQuotationsForRFQ: (rfqId) =>
    request(`/procurement/rfqs/${rfqId}/quotations`),
  createQuotation: (rfqId, data) =>
    request(`/procurement/rfqs/${rfqId}/quotations`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateQuotation: (id, data) =>
    request(`/procurement/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuotation: (id) =>
    request(`/procurement/quotations/${id}`, { method: 'DELETE' }),

  // ============================================
  // Bid Analysis
  // ============================================
  listBidAnalyses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/bid-analyses${qs ? `?${qs}` : ''}`);
  },
  getBidAnalysis: (id) => request(`/procurement/bid-analyses/${id}`),
  createBidAnalysis: (data) =>
    request('/procurement/bid-analyses', { method: 'POST', body: JSON.stringify(data) }),
  updateBidAnalysis: (id, data) =>
    request(`/procurement/bid-analyses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  submitBidAnalysis: (id) =>
    request(`/procurement/bid-analyses/${id}/submit`, { method: 'PATCH' }),
  approveBidAnalysis: (id) =>
    request(`/procurement/bid-analyses/${id}/approve`, { method: 'PATCH' }),
  rejectBidAnalysis: (id, reason) =>
    request(`/procurement/bid-analyses/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    }),

  // ============================================
  // Workflow-aware Purchase Orders (procurement chain)
  // ============================================
  listPOs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/pos${qs ? `?${qs}` : ''}`);
  },
  getPO: (id) => request(`/procurement/pos/${id}`),
  draftPOFromBidAnalysis: (data) =>
    request('/procurement/pos', { method: 'POST', body: JSON.stringify(data) }),
  updatePO: (id, data) =>
    request(`/procurement/pos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  submitPO:      (id) => request(`/procurement/pos/${id}/submit`,      { method: 'PATCH' }),
  approvePO:     (id, notes) =>
    request(`/procurement/pos/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
  rejectPO:      (id, reason) =>
    request(`/procurement/pos/${id}/reject`,  { method: 'PATCH', body: JSON.stringify({ reason }) }),
  issuePO:       (id) => request(`/procurement/pos/${id}/issue`,       { method: 'POST'  }),
  acknowledgePO: (id) => request(`/procurement/pos/${id}/acknowledge`, { method: 'PATCH' }),
  cancelPO:      (id, reason) =>
    request(`/procurement/pos/${id}/cancel`,  { method: 'PATCH', body: JSON.stringify({ reason }) }),
  // Returns text/html — needs raw fetch helper
  poPreviewUrl:  (id) => `${API_BASE_URL}/procurement/pos/${id}/preview`,

  // ============================================
  // Goods Receipt Notes
  // ============================================
  listGRNsForPO: (poId) => request(`/procurement/pos/${poId}/grns`),
  createGRN:     (poId, data) =>
    request(`/procurement/pos/${poId}/grns`, { method: 'POST', body: JSON.stringify(data) }),
  getGRN:        (id) => request(`/procurement/grns/${id}`),
  verifyGRN:     (id) => request(`/procurement/grns/${id}/verify`, { method: 'PATCH' }),
  rejectGRN:     (id, reason) =>
    request(`/procurement/grns/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  // ============================================
  // Three-way match
  // ============================================
  listMatches: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/three-way-matches${qs ? `?${qs}` : ''}`);
  },
  createMatch:  (data) =>
    request('/procurement/three-way-matches', { method: 'POST', body: JSON.stringify(data) }),
  resolveMatch: (id, payload) =>
    request(`/procurement/three-way-matches/${id}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  checkPaymentEligibility: (poId, invoiceId) => {
    const qs = new URLSearchParams({ poId, invoiceId }).toString();
    return request(`/procurement/three-way-matches/eligibility?${qs}`);
  },

  // ============================================
  // Vendor master (workflow-aware)
  // ============================================
  listVendorMaster: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/vendor-master${qs ? `?${qs}` : ''}`);
  },
  getVendorMaster: (id) => request(`/procurement/vendor-master/${id}`),
  createVendorMaster: (data) =>
    request('/procurement/vendor-master', { method: 'POST', body: JSON.stringify(data) }),
  updateVendorMaster: (id, data) =>
    request(`/procurement/vendor-master/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVendorMaster: (id) =>
    request(`/procurement/vendor-master/${id}`, { method: 'DELETE' }),
  setVendorDueDiligence: (id, payload) =>
    request(`/procurement/vendor-master/${id}/due-diligence`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  blacklistVendor: (id, reason) =>
    request(`/procurement/vendor-master/${id}/blacklist`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    }),
  unblacklistVendor: (id) =>
    request(`/procurement/vendor-master/${id}/unblacklist`, { method: 'PATCH' }),

  // ============================================
  // Procurement thresholds
  // ============================================
  listThresholds: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/thresholds${qs ? `?${qs}` : ''}`);
  },
  createThreshold: (data) =>
    request('/procurement/thresholds', { method: 'POST', body: JSON.stringify(data) }),
  updateThreshold: (id, data) =>
    request(`/procurement/thresholds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteThreshold: (id) =>
    request(`/procurement/thresholds/${id}`, { method: 'DELETE' }),
  resolveThreshold: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/thresholds/resolve${qs ? `?${qs}` : ''}`);
  },

  // ============================================
  // Dashboard
  // ============================================
  getProcurementDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/procurement/dashboard${qs ? `?${qs}` : ''}`);
  }
};

// ============================================
// CASH MODULE API
// ============================================
export const CashAPI = {
  listAccounts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cash/accounts${qs ? `?${qs}` : ''}`);
  },
  getAccount: (id) => request(`/cash/accounts/${id}`),
  createAccount: (data) =>
    request('/cash/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id, data) =>
    request(`/cash/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateAccount: (id) =>
    request(`/cash/accounts/${id}/deactivate`, { method: 'PATCH' }),
  reactivateAccount: (id) =>
    request(`/cash/accounts/${id}/reactivate`, { method: 'PATCH' }),
  getSummary: () => request('/cash/accounts/summary'),

  // Transactions
  listTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cash/transactions${qs ? `?${qs}` : ''}`);
  },
  getTransaction: (id) => request(`/cash/transactions/${id}`),
  recordTransaction: (data) =>
    request('/cash/transactions', { method: 'POST', body: JSON.stringify(data) }),
  /**
   * Disburse an approved Expense or SalaryAdvance from a cash account.
   * One call instead of "record cash payment + manually flip status".
   * @param sourceType  'Expense' | 'SalaryAdvance'
   * @param sourceId    id of the row in that table
   * @param cashAccountId  which cash account the payment comes out of
   * @param opts        { payeeName?, description? }
   */
  disburseFromSource: (sourceType, sourceId, cashAccountId, opts = {}) =>
    request('/cash/transactions/disburse', {
      method: 'POST',
      body: JSON.stringify({ sourceType, sourceId, cashAccountId, ...opts }),
    }),
  /**
   * Disburse a whole payroll batch from a single cash account.
   * Atomic — all-or-nothing. Each row gets its own voucher number.
   * @param payrollIds    array of Payroll.id values to pay out
   * @param cashAccountId the account to debit
   * @param opts          { description? }
   */
  disbursePayroll: (payrollIds, cashAccountId, opts = {}) =>
    request('/cash/transactions/disburse-payroll', {
      method: 'POST',
      body: JSON.stringify({ payrollIds, cashAccountId, ...opts }),
    }),
  /**
   * Bulk-post receipts to a single cash account (donor batch, fundraiser).
   * Atomic — if any row is invalid, none post. Each row gets its own voucher.
   * @param cashAccountId  the account to credit
   * @param rows           [{ amount, payeeName?, description?, occurredAt? }, ...]
   */
  bulkReceipts: (cashAccountId, rows) =>
    request('/cash/transactions/bulk-receipts', {
      method: 'POST',
      body: JSON.stringify({ cashAccountId, rows }),
    }),
  /**
   * Org-wide cash activity summary for a date range. Used by the
   * "Activity" section on CashAccountsPage for monthly board reports.
   * Returns receipts/payments/net per account + per reference type.
   */
  getActivitySummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cash/activity-summary${qs ? `?${qs}` : ''}`);
  },
  transferCash: (data) =>
    request('/cash/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }),
  approveTransaction: (id) =>
    request(`/cash/transactions/${id}/approve`, { method: 'PATCH' }),
  rejectTransaction: (id, reason) =>
    request(`/cash/transactions/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  reverseTransaction: (id, reason) =>
    request(`/cash/transactions/${id}/reverse`, { method: 'POST',  body: JSON.stringify({ reason }) }),

  // Cash counts
  listCounts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cash/counts${qs ? `?${qs}` : ''}`);
  },
  getCount: (id) => request(`/cash/counts/${id}`),
  startCount: (data) =>
    request('/cash/counts', { method: 'POST', body: JSON.stringify(data) }),
  submitCount: (id, data) =>
    request(`/cash/counts/${id}/submit`, { method: 'PATCH', body: JSON.stringify(data) }),
  approveCount: (id) =>
    request(`/cash/counts/${id}/approve`, { method: 'PATCH' }),
  disputeCount: (id, reason) =>
    request(`/cash/counts/${id}/dispute`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  cancelCount: (id) =>
    request(`/cash/counts/${id}`, { method: 'DELETE' }),

  // Petty cash replenishments
  listReplenishments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/cash/replenishments${qs ? `?${qs}` : ''}`);
  },
  getReplenishment: (id) => request(`/cash/replenishments/${id}`),
  requestReplenishment: (data) =>
    request('/cash/replenishments', { method: 'POST', body: JSON.stringify(data) }),
  approveReplenishment: (id, data = {}) =>
    request(`/cash/replenishments/${id}/approve`, { method: 'PATCH', body: JSON.stringify(data) }),
  rejectReplenishment: (id, reason) =>
    request(`/cash/replenishments/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  disburseReplenishment: (id) =>
    request(`/cash/replenishments/${id}/disburse`, { method: 'POST' }),
  cancelReplenishment: (id) =>
    request(`/cash/replenishments/${id}/cancel`, { method: 'PATCH' }),

  // Cash book report (json — html/csv use the URL helper below)
  getCashBookReport: (accountId, params = {}) => {
    const qs = new URLSearchParams({ ...params, format: 'json' }).toString();
    return request(`/cash/accounts/${accountId}/cash-book?${qs}`);
  },
  cashBookReportUrl: (accountId, format, params = {}) => {
    const qs = new URLSearchParams({ ...params, format }).toString();
    return `${API_BASE_URL}/cash/accounts/${accountId}/cash-book?${qs}`;
  }
};

// ============================================
// MOVEMENT REGISTER + VEHICLES
// ============================================
export const MovementAPI = {
  // Vehicles
  listVehicles: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/vehicles${qs ? `?${qs}` : ''}`);
  },
  createVehicle: (data) =>
    request('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) =>
    request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateVehicle: (id) =>
    request(`/vehicles/${id}/deactivate`, { method: 'PATCH' }),

  // Movements
  listMovements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/movements${qs ? `?${qs}` : ''}`);
  },
  getMovement: (id) => request(`/movements/${id}`),
  createMovement: (data) =>
    request('/movements', { method: 'POST', body: JSON.stringify(data) }),
  approveMovement: (id) =>
    request(`/movements/${id}/approve`, { method: 'PATCH' }),
  rejectMovement: (id, reason) =>
    request(`/movements/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  depart: (id) =>
    request(`/movements/${id}/depart`, { method: 'PATCH' }),
  arrive: (id) =>
    request(`/movements/${id}/arrive`, { method: 'PATCH' }),
  returnMovement: (id, distanceKm) =>
    request(`/movements/${id}/return`, { method: 'PATCH', body: JSON.stringify({ distanceKm }) }),
  cancelMovement: (id, reason) =>
    request(`/movements/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  // Anti-abuse / deviation review
  analyzeMovement: (id) =>
    request(`/movements/${id}/analyze`, { method: 'POST' }),
  reviewMovement: (id, reviewStatus, notes) =>
    request(`/movements/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ reviewStatus, notes })
    }),
  gpsTrack: (id) =>
    request(`/movements/${id}/gps-track`),

  // Fuel rates
  listFuelRates: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/fuel-rates${qs ? `?${qs}` : ''}`);
  },
  createFuelRate: (data) =>
    request('/fuel-rates', { method: 'POST', body: JSON.stringify(data) }),
  updateFuelRate: (id, data) =>
    request(`/fuel-rates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFuelRate: (id) =>
    request(`/fuel-rates/${id}`, { method: 'DELETE' }),

  // Fuel claims
  listFuelClaims: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/fuel-claims${qs ? `?${qs}` : ''}`);
  },
  getFuelClaim: (id) => request(`/fuel-claims/${id}`),
  deriveFuelClaim: (data) =>
    request('/fuel-claims', { method: 'POST', body: JSON.stringify(data) }),
  duplicateCheck: (id) =>
    request(`/fuel-claims/${id}/duplicate-check`),
  submitFuelClaim: (id) =>
    request(`/fuel-claims/${id}/submit`, { method: 'PATCH' }),
  approveFuelClaim: (id) =>
    request(`/fuel-claims/${id}/approve`, { method: 'PATCH' }),
  rejectFuelClaim: (id, reason) =>
    request(`/fuel-claims/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  mergeFuelClaim: (id, primaryClaimId, sharePct) =>
    request(`/fuel-claims/${id}/merge`, { method: 'PATCH', body: JSON.stringify({ primaryClaimId, sharePct }) }),
  reviewFuelFlags: (id, notes) =>
    request(`/fuel-claims/${id}/review-flags`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
  cancelFuelClaim: (id) =>
    request(`/fuel-claims/${id}/cancel`, { method: 'PATCH' })
};

// ============================================
// PROJECT BENEFICIARY API — QR-code distribution enrolments
// ============================================

export const ProjectBeneficiaryAPI = {
  // List enrolled beneficiaries for a project.
  list: async (projectId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/projects/${projectId}/beneficiaries${queryString ? `?${queryString}` : ''}`);
    return data.data;
  },

  // Enrol existing beneficiaries onto a project.
  enrol: async (projectId, beneficiaryIds) => {
    const data = await request(`/projects/${projectId}/beneficiaries`, {
      method: 'POST',
      body: JSON.stringify({ beneficiaryIds }),
    });
    return data.data;
  },

  // Replace a lost QR — returns the enrolment row with a fresh qrToken.
  regenerateToken: async (id) => {
    const data = await request(`/project-beneficiaries/${id}/regenerate-token`, {
      method: 'POST',
    });
    return data.data;
  },

  // Soft-remove an enrolment.
  withdraw: async (id) => {
    const data = await request(`/project-beneficiaries/${id}/withdraw`, {
      method: 'PATCH',
    });
    return data.data;
  },

  // Distribution progress rollup: enrolments + events + scan totals.
  // Powers the DistributionProgressCard.
  stats: async (projectId) => {
    const data = await request(`/projects/${projectId}/distribution-stats`);
    return data.data;
  },
};

// ============================================
// DISTRIBUTION EVENT API — QR-scan distribution events
// ============================================

export const DistributionEventAPI = {
  list: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/distribution-events${queryString ? `?${queryString}` : ''}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/distribution-events/${id}`);
    return data.data;
  },

  create: async (body) => {
    const data = await request('/distribution-events', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return data.data;
  },

  update: async (id, body) => {
    const data = await request(`/distribution-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return data.data;
  },

  close: async (id) => {
    const data = await request(`/distribution-events/${id}/close`, {
      method: 'PATCH',
    });
    return data.data;
  },

  getScans: async (id) => {
    const data = await request(`/distribution-events/${id}/scans`);
    return data.data;
  },
};

const API = {
  Auth: AuthAPI,
  Users: UsersAPI,
  Roles: RolesAPI,
  Departments: DepartmentsAPI,
  Positions: PositionsAPI,
  Orphan: OrphanAPI,
  OrphanNeed: OrphanNeedAPI,
  VisitLog: VisitLogAPI,
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
  Notification: NotificationAPI,
  // New Finance APIs
  Procurement: ProcurementAPI,
  Cash: CashAPI,
  Movement: MovementAPI,
  Campaign: CampaignAPI,
  CampaignPackage: CampaignPackageAPI,
  Donation: DonationAPI,
  Invoice: InvoiceAPI,
  ExchangeRate: ExchangeRateAPI,
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
  // QR-code beneficiary distribution
  ProjectBeneficiary: ProjectBeneficiaryAPI,
  DistributionEvent: DistributionEventAPI,
  TokenManager,
};

// ============================================
// GENERIC HTTP HELPERS
// Axios-style {get,post,put,delete} on the default API export so callers
// that need an endpoint without a dedicated sub-API can still hit it.
// The raw response body is exposed under `.data` to mirror axios.
// ============================================
const buildBody = (payload) =>
  payload instanceof FormData ? payload : (payload != null ? JSON.stringify(payload) : undefined);

API.get = async (endpoint) => ({ data: await request(endpoint) });
API.post = async (endpoint, payload, options = {}) => ({
  data: await request(endpoint, { ...options, method: 'POST', body: buildBody(payload) }),
});
API.put = async (endpoint, payload, options = {}) => ({
  data: await request(endpoint, { ...options, method: 'PUT', body: buildBody(payload) }),
});
API.delete = async (endpoint, options = {}) => ({
  data: await request(endpoint, { ...options, method: 'DELETE' }),
});

// ============================================
// SAFEGUARDING POLICY API
// ============================================

export const SafeguardingPolicyAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/policies?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/compliance/policies/${id}`);
    return data.data.policy;
  },

  create: async (policyData) => {
    const data = await request('/compliance/policies', {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
    return data.data.policy;
  },

  update: async (id, policyData) => {
    const data = await request(`/compliance/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    });
    return data.data.policy;
  },

  delete: async (id) => {
    await request(`/compliance/policies/${id}`, {
      method: 'DELETE',
    });
  },

  acknowledge: async (id, userId, userName) => {
    const data = await request(`/compliance/policies/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    });
    return data.data.policy;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/policies/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// SAFEGUARDING INCIDENT API
// ============================================

export const SafeguardingIncidentAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/incidents?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/compliance/incidents/${id}`);
    return data.data.incident;
  },

  create: async (incidentData) => {
    const data = await request('/compliance/incidents', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
    return data.data.incident;
  },

  update: async (id, incidentData) => {
    const data = await request(`/compliance/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });
    return data.data.incident;
  },

  delete: async (id) => {
    await request(`/compliance/incidents/${id}`, {
      method: 'DELETE',
    });
  },

  assign: async (id, assignedTo) => {
    const data = await request(`/compliance/incidents/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ assignedTo }),
    });
    return data.data.incident;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/incidents/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// BACKGROUND CHECK API
// ============================================

export const BackgroundCheckAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/background-checks?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/compliance/background-checks/${id}`);
    return data.data.backgroundCheck;
  },

  create: async (checkData) => {
    const data = await request('/compliance/background-checks', {
      method: 'POST',
      body: JSON.stringify(checkData),
    });
    return data.data.backgroundCheck;
  },

  update: async (id, checkData) => {
    const data = await request(`/compliance/background-checks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(checkData),
    });
    return data.data.backgroundCheck;
  },

  delete: async (id) => {
    await request(`/compliance/background-checks/${id}`, {
      method: 'DELETE',
    });
  },

  getExpiring: async (days = 30) => {
    const data = await request(`/compliance/background-checks/expiring?days=${days}`);
    return data.data.checks;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/background-checks/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// COMPLIANCE TRAINING API
// ============================================

export const ComplianceTrainingAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/training?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/compliance/training/${id}`);
    return data.data.training;
  },

  create: async (trainingData) => {
    const data = await request('/compliance/training', {
      method: 'POST',
      body: JSON.stringify(trainingData),
    });
    return data.data.training;
  },

  update: async (id, trainingData) => {
    const data = await request(`/compliance/training/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trainingData),
    });
    return data.data.training;
  },

  delete: async (id) => {
    await request(`/compliance/training/${id}`, {
      method: 'DELETE',
    });
  },

  addAttendee: async (id, attendee) => {
    const data = await request(`/compliance/training/${id}/attendees`, {
      method: 'POST',
      body: JSON.stringify({ attendee }),
    });
    return data.data.training;
  },

  markAttendance: async (id, staffId, attended) => {
    const data = await request(`/compliance/training/${id}/attendance`, {
      method: 'PUT',
      body: JSON.stringify({ staffId, attended }),
    });
    return data.data.training;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/training/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// DATA PROTECTION API
// ============================================

export const DataProtectionAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/data-protection?${queryString}`);
    return data.data;
  },

  getById: async (id) => {
    const data = await request(`/compliance/data-protection/${id}`);
    return data.data.record;
  },

  create: async (recordData) => {
    const data = await request('/compliance/data-protection', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
    return data.data.record;
  },

  update: async (id, recordData) => {
    const data = await request(`/compliance/data-protection/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recordData),
    });
    return data.data.record;
  },

  delete: async (id) => {
    await request(`/compliance/data-protection/${id}`, {
      method: 'DELETE',
    });
  },

  getConsentRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/data-protection/consent?${queryString}`);
    return data.data.records;
  },

  getDataAccessRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/data-protection/data-access-requests?${queryString}`);
    return data.data;
  },

  getDataBreaches: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/data-protection/data-breaches?${queryString}`);
    return data.data.breaches;
  },

  getAuditRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/data-protection/audits?${queryString}`);
    return data.data;
  },

  getStats: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/compliance/data-protection/stats?${queryString}`);
    return data.data;
  },
};

// ============================================
// ASSET REGISTER API (HR / Operations equipment register)
// ============================================
export const AssetAPI = {
  list: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/assets${qs ? `?${qs}` : ''}`);
    return data.data || [];
  },
  stats: async () => {
    const data = await request('/assets/stats');
    return data.data || {};
  },
  create: async (payload) => {
    const data = await request('/assets', { method: 'POST', body: JSON.stringify(payload) });
    return data.data;
  },
  update: async (id, payload) => {
    const data = await request(`/assets/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.data;
  },
  assign: async (id, payload) => {
    const data = await request(`/assets/${id}/assign`, { method: 'PATCH', body: JSON.stringify(payload) });
    return data.data;
  },
  returnAsset: async (id) => {
    const data = await request(`/assets/${id}/return`, { method: 'PATCH' });
    return data.data;
  },
  remove: async (id) => {
    await request(`/assets/${id}`, { method: 'DELETE' });
  },
};
API.Asset = AssetAPI;

// ============================================
// VEHICLE + ACCOMMODATION REQUEST APIs
// ============================================
export const VehicleRequestAPI = {
  list:   async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/vehicle-requests${qs ? `?${qs}` : ''}`);
    return data.data || [];
  },
  stats:  async () => (await request('/vehicle-requests/stats')).data || {},
  create: async (payload) => (await request('/vehicle-requests', { method: 'POST', body: JSON.stringify(payload) })).data,
  decide: async (id, action, notes) =>
    (await request(`/vehicle-requests/${id}/${action}`, { method: 'PATCH', body: JSON.stringify({ notes: notes || null }) })).data,
};
export const AccommodationRequestAPI = {
  list:   async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/accommodation-requests${qs ? `?${qs}` : ''}`);
    return data.data || [];
  },
  stats:  async () => (await request('/accommodation-requests/stats')).data || {},
  create: async (payload) => (await request('/accommodation-requests', { method: 'POST', body: JSON.stringify(payload) })).data,
  decide: async (id, action, notes) =>
    (await request(`/accommodation-requests/${id}/${action}`, { method: 'PATCH', body: JSON.stringify({ notes: notes || null }) })).data,
};
API.VehicleRequest = VehicleRequestAPI;
API.AccommodationRequest = AccommodationRequestAPI;

// ============================================
// EXPENSE CLAIMS API (mobile-submitted via /me/expenses)
// ============================================
export const ExpenseAPI = {
  // HR / Finance: list every claim across all users
  listAdmin: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/me/expenses/admin?${qs}`);
    return data.data || [];
  },
  approve: async (id, notes) => {
    const data = await request(`/me/expenses/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: notes || null }),
    });
    return data.data;
  },
  reject: async (id, notes) => {
    const data = await request(`/me/expenses/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: notes || null }),
    });
    return data.data;
  },
};
API.Expense = ExpenseAPI;

// ============================================
// SALARY ADVANCE API (mobile-submitted via /salary-advances)
// ============================================
export const SalaryAdvanceAPI = {
  list: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/salary-advances?${qs}`);
    return data.data || [];
  },
  approve: async (id, notes) => {
    const data = await request(`/salary-advances/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: notes || null }),
    });
    return data.data;
  },
  reject: async (id, notes) => {
    const data = await request(`/salary-advances/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: notes || null }),
    });
    return data.data;
  },
  cancel: async (id) => {
    const data = await request(`/salary-advances/${id}/cancel`, { method: 'PATCH' });
    return data.data;
  },
};
API.SalaryAdvance = SalaryAdvanceAPI;

// ============================================
// FIELD VISITS API (mobile-submitted via /visits — generic Visit model,
// distinct from /visit-logs which is the orphan visit log)
// ============================================
export const FieldVisitAPI = {
  list: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const data = await request(`/visits?${qs}`);
    return data.data || data.visits || [];
  },
  getById: async (id) => {
    const data = await request(`/visits/${id}`);
    return data.data || data.visit;
  },
};
API.FieldVisit = FieldVisitAPI;

// ============================================
// HR CONTRACT MANAGEMENT API
// ============================================

API.HRContract = {
  // ===== EMPLOYMENT AGREEMENTS =====
  createAgreement: async (agreementData) => {
    const data = await request('/hr/contracts/agreements', {
      method: 'POST',
      body: JSON.stringify(agreementData),
    });
    return data.data;
  },

  getAllAgreements: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/hr/contracts/agreements?${queryString}`);
    return data.data;
  },

  getAgreementById: async (id) => {
    const data = await request(`/hr/contracts/agreements/${id}`);
    return data.data.agreement;
  },

  signAgreement: async (id, signData) => {
    const data = await request(`/hr/contracts/agreements/${id}/sign`, {
      method: 'PUT',
      body: JSON.stringify(signData),
    });
    return data.data.agreement;
  },

  deleteAgreement: async (id) => {
    const data = await request(`/hr/contracts/agreements/${id}`, {
      method: 'DELETE',
    });
    return data;
  },

  // ===== CONTRACT RENEWALS =====
  getExpiringContracts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/hr/contracts/renewals/expiring?${queryString}`);
    return data.data;
  },

  createRenewal: async (renewalData) => {
    const data = await request('/hr/contracts/renewals', {
      method: 'POST',
      body: JSON.stringify(renewalData),
    });
    return data.data;
  },

  approveRenewal: async (id, approvalData) => {
    const data = await request(`/hr/contracts/renewals/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(approvalData),
    });
    return data.data.renewal;
  },

  // ===== TERMINATIONS =====
  getAllTerminations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/hr/contracts/terminations?${queryString}`);
    return data.data;
  },

  createTermination: async (terminationData) => {
    const data = await request('/hr/contracts/terminations', {
      method: 'POST',
      body: JSON.stringify(terminationData),
    });
    return data.data;
  },

  approveTermination: async (id, approvalData) => {
    const data = await request(`/hr/contracts/terminations/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(approvalData),
    });
    return data.data.termination;
  },

  // ===== RESIGNATIONS =====
  getAllResignations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const data = await request(`/hr/contracts/resignations?${queryString}`);
    return data.data;
  },

  submitResignation: async (resignationData) => {
    const data = await request('/hr/contracts/resignations', {
      method: 'POST',
      body: JSON.stringify(resignationData),
    });
    return data.data;
  },

  acceptResignation: async (id, acceptanceData) => {
    const data = await request(`/hr/contracts/resignations/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify(acceptanceData),
    });
    return data.data.resignation;
  },

  // ===== JOB DESCRIPTION GENERATOR =====
  generateJobDescription: async (jobDetails) => {
    const data = await request('/hr/contracts/job-description/generate', {
      method: 'POST',
      body: JSON.stringify(jobDetails),
    });
    return data.data;
  },

  // ===== INTEGRATED STAFF CREATION =====
  createStaffWithAgreement: async (staffData) => {
    const data = await request('/hr/contracts/staff/create-with-agreement', {
      method: 'POST',
      body: JSON.stringify(staffData),
    });
    return data.data;
  },

  // ===== EMPLOYEE SELF-SERVICE =====
  getMyHRData: async () => {
    const data = await request('/hr/contracts/my-data');
    return data.data;
  }
};

// ===== COORDINATORS API =====
API.Coordinators = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/coordinators?${queryString}` : '/coordinators';
    const data = await request(endpoint);
    return data;
  },

  getById: async (id) => {
    const data = await request(`/coordinators/${id}`);
    return data;
  },

  getStats: async (id, period = 'monthly') => {
    const data = await request(`/coordinators/${id}/stats?period=${period}`);
    return data;
  },

  getAssignedOrphans: async (id) => {
    const data = await request(`/coordinators/${id}/orphans`);
    return data;
  },

  assignOrphan: async (coordinatorId, orphanId) => {
    const data = await request(`/coordinators/${coordinatorId}/assign-orphan`, {
      method: 'POST',
      body: JSON.stringify({ orphanId }),
    });
    return data;
  },

  unassignOrphan: async (coordinatorId, orphanId) => {
    const data = await request(`/coordinators/${coordinatorId}/orphans/${orphanId}`, {
      method: 'DELETE',
    });
    return data;
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert a relative image URL to an absolute URL pointing to the backend server
 * @param {string} imageUrl - The image URL from the database (relative or absolute)
 * @returns {string} - Absolute URL to the image
 */
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '';

  // Debug logging
  if (import.meta.env.DEV) {
    console.log('🖼️ getImageUrl called with:', imageUrl);
  }

  // If already an absolute URL pointing at our API origin, strip it for relative serving
  if (API_ORIGIN && imageUrl.startsWith(API_ORIGIN + '/')) {
    imageUrl = imageUrl.slice(API_ORIGIN.length);
    if (import.meta.env.DEV) {
      console.log('🔄 Stripped API origin, now relative:', imageUrl);
    }
  } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // External URL, return as-is
    if (import.meta.env.DEV) {
      console.log('✅ External absolute URL, returning as-is');
    }
    return imageUrl;
  }

  // If it's a relative URL starting with /uploads, return as-is (Vite proxy handles it)
  if (imageUrl.startsWith('/uploads')) {
    if (import.meta.env.DEV) {
      console.log('✅ Relative /uploads URL, using Vite proxy:', imageUrl);
    }
    return imageUrl;
  }

  // If it doesn't start with /, add it
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  const baseUrl = API_BASE_URL.replace('/api', '');
  const result = `${baseUrl}${path}`;
  if (import.meta.env.DEV) {
    console.log('🔄 Adding base URL:', result);
  }
  return result;
};

// ============================================
// WASH MODULE API
// ============================================
const qs = (params) =>
  Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

export const WashAPI = {
  // Org-wide summary tile.
  getSummary: () => request('/wash/summary').then(r => r.data),

  // Orders
  listOrders:    (params = {}) => request(`/wash/orders?${qs(params)}`).then(r => r.data),
  getOrder:      (id)          => request(`/wash/orders/${id}`).then(r => r.data),
  createOrder:   (body)        => request('/wash/orders', { method: 'POST', body: JSON.stringify(body) }).then(r => r.data),
  updateOrder:   (id, patch)   => request(`/wash/orders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then(r => r.data),
  cancelOrder:   (id)          => request(`/wash/orders/${id}`, { method: 'DELETE' }).then(r => r.data),
  bulkAddItems:  (orderId, items) =>
    request(`/wash/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify({ items }) }).then(r => r.data),

  // Items
  listItems:        (params = {}) => request(`/wash/items?${qs(params)}`).then(r => r.data),
  getItem:          (id)          => request(`/wash/items/${id}`).then(r => r.data),
  updateItem:       (id, patch)   => request(`/wash/items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then(r => r.data),
  transitionStage:  (id, body)    => request(`/wash/items/${id}/stage`, { method: 'PATCH', body: JSON.stringify(body) }).then(r => r.data),
  listMyItems:      ()            => request('/wash/items/mine').then(r => r.data),

  // Stage updates
  listStageUpdates: (id)        => request(`/wash/items/${id}/stage-updates`).then(r => r.data),
  addStageUpdate:   (id, body)  => request(`/wash/items/${id}/stage-updates`, { method: 'POST', body: JSON.stringify(body) }).then(r => r.data),

  // Finance integration
  generateInvoice:  (orderId)        => request(`/wash/orders/${orderId}/generate-invoice`, { method: 'POST' }).then(r => r.data),
  reconcile:        (orderId)        => request(`/wash/orders/${orderId}/reconcile`, { method: 'PATCH' }).then(r => r.data),

  // Reports
  itemReportUrl:    (itemId)         => `${API_BASE_URL}/wash/items/${itemId}/report`,
  donorReportUrl:   (orderId)        => `${API_BASE_URL}/wash/orders/${orderId}/donor-report`,
  emailDonorReport: (orderId)        => request(`/wash/orders/${orderId}/email-donor-report`, { method: 'POST' }).then(r => r.data),
};

// ============================================
// IGP MODULE API
// ============================================
// ============================================
// MAP API — unified pin feed across all programme entities
// ============================================
export const MapAPI = {
  getPins: (params = {}) => request(`/map/pins?${qs(params)}`).then(r => r.data),
};

export const IgpAPI = {
  getSummary: () => request('/igp/summary').then(r => r.data),

  listOrders:    (params = {}) => request(`/igp/orders?${qs(params)}`).then(r => r.data),
  getOrder:      (id)          => request(`/igp/orders/${id}`).then(r => r.data),
  createOrder:   (body)        => request('/igp/orders', { method: 'POST', body: JSON.stringify(body) }).then(r => r.data),
  updateOrder:   (id, patch)   => request(`/igp/orders/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then(r => r.data),
  cancelOrder:   (id)          => request(`/igp/orders/${id}`, { method: 'DELETE' }).then(r => r.data),
  bulkAddItems:  (orderId, items) =>
    request(`/igp/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify({ items }) }).then(r => r.data),

  listItems:        (params = {}) => request(`/igp/items?${qs(params)}`).then(r => r.data),
  getItem:          (id)          => request(`/igp/items/${id}`).then(r => r.data),
  updateItem:       (id, patch)   => request(`/igp/items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }).then(r => r.data),
  transitionStage:  (id, body)    => request(`/igp/items/${id}/stage`, { method: 'PATCH', body: JSON.stringify(body) }).then(r => r.data),
  recordFollowUp:   (id, body)    => request(`/igp/items/${id}/follow-up`, { method: 'POST', body: JSON.stringify(body) }).then(r => r.data),
  listMyItems:      ()            => request('/igp/items/mine').then(r => r.data),

  listStageUpdates: (id)        => request(`/igp/items/${id}/stage-updates`).then(r => r.data),
  addStageUpdate:   (id, body)  => request(`/igp/items/${id}/stage-updates`, { method: 'POST', body: JSON.stringify(body) }).then(r => r.data),

  // Finance integration
  generateInvoice:  (orderId)        => request(`/igp/orders/${orderId}/generate-invoice`, { method: 'POST' }).then(r => r.data),
  reconcile:        (orderId)        => request(`/igp/orders/${orderId}/reconcile`, { method: 'PATCH' }).then(r => r.data),

  // Reports
  itemReportUrl:    (itemId)         => `${API_BASE_URL}/igp/items/${itemId}/report`,
  donorReportUrl:   (orderId)        => `${API_BASE_URL}/igp/orders/${orderId}/donor-report`,
  emailDonorReport: (orderId)        => request(`/igp/orders/${orderId}/email-donor-report`, { method: 'POST' }).then(r => r.data),
};

// ============================================
// PROPOSAL CONVERSION (to WASH/IGP order)
// ============================================
export const ProposalConversionAPI = {
  convertToOrder: (proposalId, body) =>
    request(`/proposals/${proposalId}/convert-to-order`, { method: 'POST', body: JSON.stringify(body) }).then(r => r.data),
};

// ============================================
// GLOBAL SEARCH (Cmd+K)
// ============================================
// Backed by /api/search — returns records across beneficiaries, partners,
// projects, orphans, staff. Not a full-text index; iLike with a hard
// per-entity cap. Debounced by the caller (CommandPalette) so we don't
// hammer the server as the user types.
export const SearchAPI = {
  global: (q) => request(`/search?q=${encodeURIComponent(q)}`),
};

export default API;

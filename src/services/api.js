// ============================================
// API SERVICE LAYER
// ============================================
// Centralized API communication with backend

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;

// Log API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('📝 Environment Variables:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL
  });
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

export const TokenManager = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
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
    throw new APIError(message, response.status, errors);
  }

  return data;
};

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = TokenManager.getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetchWithTimeout(url, config);
    return await handleResponse(response);
  } catch (error) {
    // Handle token expiration
    if (error.status === 401 && accessToken) {
      // Try to refresh token
      try {
        await AuthAPI.refreshToken();
        // Retry original request
        const newToken = TokenManager.getAccessToken();
        config.headers.Authorization = `Bearer ${newToken}`;
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
    TokenManager.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  register: async (userData) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    TokenManager.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      TokenManager.clearTokens();
    }
  },

  refreshToken: async () => {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const data = await request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    TokenManager.setTokens(data.data.accessToken, data.data.refreshToken);
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
// HEALTH CHECK
// ============================================

export const HealthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return await response.json();
  },
};

// ============================================
// EXPORT DEFAULT API OBJECT
// ============================================

const API = {
  Auth: AuthAPI,
  Orphan: OrphanAPI,
  Project: ProjectAPI,
  Finance: FinanceAPI,
  HR: HRAPI,
  CBO: CBOAPI,
  Partner: PartnerAPI,
  MEAL: MEALAPI,
  Upload: UploadAPI,
  Health: HealthAPI,
  TokenManager,
};

export default API;

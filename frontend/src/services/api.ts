import axios from 'axios';

// ============================================
// CASESTACK API SERVICE - FULLY INTEGRATED
// WITH DEVICE SESSION MANAGEMENT
// ============================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and device session issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Check if it's a device session issue
      if (error.response?.data?.reason) {
        const reason = error.response.data.reason;
        if (reason === 'Session expired' || reason === 'Session invalid') {
          alert('Your session has expired. Please login again.');
        }
      }
      
      window.location.href = '/login';
    } else if (error.response?.status === 403 && error.response?.data?.error === 'Device limit exceeded') {
      // Device limit exceeded - show device management
      const data = error.response.data;
      alert(`${data.message}\n\nYou can manage your devices in Account Settings.`);
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION
// ============================================

export const authAPI = {
  register: async (data) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  logoutAll: async () => {
    try {
      await api.post('/api/auth/logout-all');
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // NEW: Device session management
  getSessions: async () => {
    const response = await api.get('/api/auth/sessions');
    return response.data;
  },

  removeSession: async (sessionId) => {
    const response = await api.delete(`/api/auth/sessions/${sessionId}`);
    return response.data;
  },
};

// ============================================
// CASES
// ============================================

export const casesAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/api/cases', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/cases/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/cases', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/cases/${id}`, data);
    return response.data;
  },

  submit: async (id) => {
    const response = await api.post(`/api/cases/${id}/submit`);
    return response.data;
  },

  review: async (id, approved, comments) => {
    const response = await api.post(`/api/cases/${id}/review`, {
      approved,
      comments,
    });
    return response.data;
  },

  finalize: async (id, finalComments) => {
    const response = await api.post(`/api/cases/${id}/finalize`, {
      finalComments,
    });
    return response.data;
  },
};

// ============================================
// FILE BUNDLES
// ============================================

export const bundlesAPI = {
  getByCaseId: async (caseId) => {
    const response = await api.get(`/api/bundles/case/${caseId}`);
    return response.data;
  },

  create: async (caseId, bundleName) => {
    const response = await api.post(`/api/bundles/case/${caseId}`, {
      bundleName,
    });
    return response.data;
  },

  uploadFiles: async (bundleId, files, onProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(
      `/api/bundles/${bundleId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );
    return response.data;
  },

  downloadFile: async (fileId, fileName) => {
    const response = await api.get(`/api/bundles/file/${fileId}/download`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  downloadBundle: async (bundleId, bundleName) => {
    const response = await api.get(`/api/bundles/${bundleId}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${bundleName}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportCase: async (caseId, caseNumber) => {
    const response = await api.get(`/api/bundles/case/${caseId}/download-all`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${caseNumber}-EXPORT.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// ============================================
// SEARCH
// ============================================

export const searchAPI = {
  basic: async (query) => {
    const response = await api.get('/api/search', { params: { q: query } });
    return response.data;
  },

  advanced: async (filters) => {
    const response = await api.get('/api/search/advanced', { params: filters });
    return response.data;
  },

  suggestions: async (query) => {
    const response = await api.get('/api/search/suggestions', {
      params: { q: query },
    });
    return response.data;
  },

  filters: async () => {
    const response = await api.get('/api/search/filters');
    return response.data;
  },

  recent: async () => {
    const response = await api.get('/api/search/recent');
    return response.data;
  },
};

// ============================================
// CLIENTS
// ============================================

export const clientsAPI = {
  getAll: async () => {
    const response = await api.get('/api/clients');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/clients', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/clients/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/clients/${id}`);
    return response.data;
  },
};

// ============================================
// USERS
// ============================================

export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/api/users');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/api/users', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },

  deactivate: async (id) => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },
};

// ============================================
// AUDIT LOGS
// ============================================

export const auditAPI = {
  getAll: async (filters = {}) => {
    const response = await api.get('/api/audit', { params: filters });
    return response.data;
  },

  export: async (filters = {}) => {
    const response = await api.get('/api/audit/export', {
      params: filters,
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'audit-logs.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// ============================================
// FIRM SETTINGS
// ============================================

export const settingsAPI = {
  get: async () => {
    const response = await api.get('/api/settings');
    return response.data;
  },

  update: async (data) => {
    const response = await api.put('/api/settings', data);
    return response.data;
  },

  getBilling: async () => {
    const response = await api.get('/api/settings/billing');
    return response.data;
  },
};

// ============================================
// HEALTH & MONITORING
// ============================================

export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  detailed: async () => {
    const response = await api.get('/health/detailed');
    return response.data;
  },

  metrics: async () => {
    const response = await api.get('/metrics');
    return response.data;
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status) => {
  const colors = {
    DRAFT: 'gray',
    UNDER_REVIEW: 'blue',
    FINALIZED: 'green',
  };
  return colors[status] || 'gray';
};

export const getRoleColor = (role) => {
  const colors = {
    STAFF: 'gray',
    MANAGER: 'blue',
    PARTNER: 'purple',
    ADMIN: 'red',
  };
  return colors[role] || 'gray';
};

export default api;

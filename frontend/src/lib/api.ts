import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Get API URL from environment or use default
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If running in development and no env var, use localhost
  if (!envUrl && import.meta.env.DEV) {
    return 'http://localhost:5000/api';
  }
  
  // If env var exists, ensure it has /api suffix
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  
  // Production fallback - use relative path
  return '/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and retries
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    }
    
    // Handle network errors with retry
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      // Retry logic - max 3 retries
      if (!originalRequest._retry) {
        originalRequest._retry = 0;
      }
      
      if (originalRequest._retry < 3) {
        originalRequest._retry += 1;
        console.log(`[API Retry] Attempt ${originalRequest._retry}/3 for ${originalRequest.url}`);
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * originalRequest._retry));
        
        return api(originalRequest);
      }
      
      // After 3 retries, show user-friendly error
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
        originalError: error
      });
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Don't logout on login/register endpoints
      if (!originalRequest.url?.includes('/auth/login') && !originalRequest.url?.includes('/auth/register')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject({
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        originalError: error
      });
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject({
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND',
        originalError: error
      });
    }
    
    // Handle 500 Server Error
    if (error.response?.status === 500) {
      return Promise.reject({
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        originalError: error
      });
    }
    
    // Handle timeout
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timeout. Please try again.',
        code: 'TIMEOUT',
        originalError: error
      });
    }
    
    // Return original error for other cases
    return Promise.reject(error);
  }
);

// Helper function to check API health
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${getApiUrl().replace('/api', '')}/health`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('[API Health Check Failed]', error);
    return false;
  }
};

// Export API instance
export default api;

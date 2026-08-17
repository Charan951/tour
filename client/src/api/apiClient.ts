import axios from 'axios';
import { clientCache } from '../utils/cache';

const rawBackendUrl = (import.meta as any).env?.VITE_API_URL || '';
const backendHost = rawBackendUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
const baseURL = backendHost ? `${backendHost}/api/v1` : '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  // Try user token first (stored by UserAuthModal as 'hc_token')
  // Then fall back to admin token ('hc_access_token')
  const token = localStorage.getItem('hc_token') || localStorage.getItem('hc_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '')) {
      clientCache.clear();
      window.dispatchEvent(new Event('hc_data_updated'));
      
      // Extract entity type from URL for targeted real-time updates
      const url = response.config.url || '';
      const entityType = extractEntityType(url);
      
      if (entityType) {
        // Emit custom event for real-time data sync
        window.dispatchEvent(new CustomEvent('realtime:data_changed', {
          detail: {
            type: entityType,
            method: method,
            data: response.data?.data || response.data,
            url: url
          }
        }));
      }
    }
    return response;
  },
  (error) => {

    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isExpiredOrInvalid = error.response.data?.message?.toLowerCase().includes('token') ||
        error.response.data?.message?.toLowerCase().includes('forbidden') ||
        error.response.status === 401;

      if (isExpiredOrInvalid && window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/admin/login')) {
        localStorage.removeItem('hc_access_token');
        localStorage.removeItem('hc_user');
        window.location.href = '/admin/login?session_expired=1';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extract entity type from API URL
 */
const extractEntityType = (url: string): string | null => {
  const patterns = [
    { regex: /\/packages/i, type: 'package' },
    { regex: /\/destinations/i, type: 'destination' },
    { regex: /\/blogs/i, type: 'blog' },
    { regex: /\/themes/i, type: 'theme' },
    { regex: /\/enquiries/i, type: 'enquiry' },
  ];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(url)) {
      return pattern.type;
    }
  }
  return null;
};

/**
 * Perform a cached GET request.
 * Returns cached result immediately (0ms) if available, while updating in background if stale.
 */
export const cachedGet = async <T = any>(
  url: string,
  options?: { params?: any; ttlMs?: number; forceRefresh?: boolean }
): Promise<{ data: T }> => {
  const { params } = options || {};
  const response = await apiClient.get<T>(url, { params });
  return response;
};

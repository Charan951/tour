import axios from 'axios';

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
  const token = localStorage.getItem('hc_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response,
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

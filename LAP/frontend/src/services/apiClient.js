import axios from 'axios';
import { tokenManager } from './tokenManager.js';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Request-ID'] = crypto.randomUUID?.() ?? String(Date.now());
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry && !original?.skipAuthRefresh && !original?.url?.includes('/auth/refresh')) {
      original._retry = true;
      refreshPromise ??= apiClient.post('/auth/refresh').finally(() => {
        refreshPromise = null;
      });
      try {
        const refreshed = await refreshPromise;
        tokenManager.setAccessToken(refreshed.data.accessToken);
        original.headers.Authorization = `Bearer ${refreshed.data.accessToken}`;
        return apiClient(original);
      } catch {
        tokenManager.clear();
        window.location.assign('/login');
      }
    }
    return Promise.reject(error.response?.data ?? { message: error.message });
  }
);

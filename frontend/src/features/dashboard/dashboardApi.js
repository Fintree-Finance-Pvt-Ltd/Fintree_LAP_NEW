import { apiClient } from '../../services/apiClient.js';

export const dashboardApi = {
  summary: () => apiClient.get('/applications?limit=5')
};

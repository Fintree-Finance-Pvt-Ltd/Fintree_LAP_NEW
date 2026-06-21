import { apiClient } from '../../services/apiClient.js';

export const authApi = {
  login: (payload) => apiClient.post('/auth/login', payload),
  logout: () => apiClient.post('/auth/logout'),
  profile: () => apiClient.get('/auth/profile'),
  getSpokes: () => apiClient.get('/auth/spokes')
};




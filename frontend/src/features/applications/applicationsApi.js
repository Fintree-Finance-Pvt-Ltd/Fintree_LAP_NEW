import { apiClient } from '../../services/apiClient.js';

export const applicationsApi = {
  list: () => apiClient.get('/applications'),
  create: (payload) => apiClient.post('/applications', payload),
  get: (id) => apiClient.get(`/applications/${id}`),
  update: (id, payload) => apiClient.patch(`/applications/${id}`, payload),
  createVisit: (id, payload) => apiClient.post(`/applications/${id}/visits`, payload),
  visits: (id) => apiClient.get(`/applications/${id}/visits`),
  uploadDocument: (id, formData) => apiClient.post(`/applications/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  documents: (id) => apiClient.get(`/applications/${id}/documents`),
  transition: (id, payload) => apiClient.post(`/applications/${id}/transitions`, payload),
  workflowHistory: (id) => apiClient.get(`/applications/${id}/workflow-history`),
    // Fetch only applications approved by Legal
 legalApproved: (params = {}) =>
  apiClient.get('/applications/legal-approved', {
    params,
  }),
};

import { apiClient } from "../../services/apiClient.js";

export const valuationApi = {
  cases: () =>
    apiClient.get("/valuation/cases"),

  getApplication: (applicationId) =>
    apiClient.get(`/valuation/${applicationId}`),

  getAssessment: (applicationId) =>
    apiClient.get(`/valuation/${applicationId}/assessment`),

  saveDraft: (applicationId, payload = {}) =>
    apiClient.post(`/valuation/${applicationId}/save-draft`, payload),

  raiseQuery: (applicationId, payload = {}) =>
    apiClient.post(`/valuation/${applicationId}/raise-query`, payload),

  markNegative: (applicationId, payload = {}) =>
    apiClient.post(`/valuation/${applicationId}/mark-negative`, payload),

  approveToLegal: (applicationId, payload = {}) =>
    apiClient.post(`/valuation/${applicationId}/approve`, payload),
};
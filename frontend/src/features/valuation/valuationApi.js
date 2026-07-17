import { apiClient } from "../../services/apiClient.js";

export const valuationApi = {
  cases: () => apiClient.get("/valuation/cases"),

  getApplication: (applicationId) =>
    apiClient.get(`/valuation/${applicationId}`),

  raiseQuery: (applicationId, payload = {}) =>
    apiClient.post(`/valuation/${applicationId}/raise-query`, payload),

  markNegative: (applicationId, payload = {}) =>
    apiClient.post(`/valuation/${applicationId}/mark-negative`, payload),

  approveToLegal: (applicationId, payload = {}) =>
    apiClient.post(`/valuation/${applicationId}/approve`, payload),
};
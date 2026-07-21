// src/features/legal/legalApi.js

import { apiClient } from "../../services/apiClient.js";

export const legalApi = {
  cases: () =>
    apiClient.get("/legal/cases"),

  getApplication: (applicationId) =>
    apiClient.get(`/legal/${applicationId}`),

  getAssessment: (applicationId) =>
    apiClient.get(`/legal/${applicationId}/assessment`),

  saveDraft: (applicationId, payload = {}) =>
    apiClient.post(`/legal/${applicationId}/save-draft`, payload),

  raiseQuery: (applicationId, payload = {}) =>
    apiClient.post(`/legal/${applicationId}/raise-query`, payload),

  markNegative: (applicationId, payload = {}) =>
    apiClient.post(`/legal/${applicationId}/mark-negative`, payload),

  approveToOpsMaker: (applicationId, payload = {}) =>
    apiClient.post(`/legal/${applicationId}/approve-to-ops-maker`, payload),
};
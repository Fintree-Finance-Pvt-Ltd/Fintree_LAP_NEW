import { apiClient } from "../../services/apiClient.js";

export const creditApi = {
  applications: (params = {}) =>
    apiClient.get("/applications", { params }),

  searchApplications: (searchTerm) =>
    apiClient.get("/applications/search", {
      params: {
        q: searchTerm,
      },
    }),

  getApplication: (applicationId) =>
    apiClient.get(`/applications/${applicationId}`),

  getKycVerificationStatus: (applicationId) =>
    apiClient.get(`/kyc/status/${applicationId}`),

  submitToCredit: (applicationId, payload = {}) =>
    apiClient.post(`/applications/${applicationId}/submit-to-credit`, payload),

  workflowHistory: (applicationId) =>
    apiClient.get(`/applications/${applicationId}/workflow-history`),

  workflowStatus: (applicationId) =>
    apiClient.get(`/applications/${applicationId}/workflow`),

  makerCases: () =>
    apiClient.get("/credit/maker/cases"),

  checkerCases: () =>
    apiClient.get("/credit/checker/cases"),

  getCreditApplication: (applicationId) =>
    apiClient.get(`/credit/${applicationId}`),

  getCreditAssessment: (applicationId) =>
    apiClient.get(`/credit/${applicationId}/assessment`),

  cmSaveDraft: (applicationId, payload = {}) =>
    apiClient.post(`/credit/${applicationId}/cm/save-draft`, payload),

  cmRecommendToCreditMaker: (applicationId, payload = {}) =>
    apiClient.post(`/credit/${applicationId}/cm/recommend`, payload),

  creditMakerSaveDraft: (applicationId, payload = {}) =>
    apiClient.post(`/credit/${applicationId}/maker/save-draft`, payload),

  creditMakerRaiseQuery: (applicationId, payload = {}) =>
    apiClient.post(`/credit/${applicationId}/maker/raise-query`, payload),

  creditMakerSubmitToChecker: (applicationId, payload = {}) =>
    apiClient.post(`/credit/${applicationId}/maker/submit-to-checker`, payload),

  creditCheckerApprove: (applicationId, payload = {}) =>
    apiClient.post(`/credit/${applicationId}/checker/approve`, payload),

  creditCheckerReturnToMaker: (applicationId, payload = {}) =>
    apiClient.post(`/credit/${applicationId}/checker/return-to-maker`, payload),

  creditCheckerReject: (applicationId, payload = {}) =>
    apiClient.post(`/credit/${applicationId}/checker/reject`, payload),
};

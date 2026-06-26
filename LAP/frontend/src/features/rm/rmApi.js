import { apiClient } from "../../services/apiClient.js";

export const rmApi = {
  // =========================
  // DASHBOARD
  // =========================
  dashboard: () => apiClient.get("/rm/dashboard"),

  // =========================
  // APPLICATIONS
  // =========================
  applications: (params = {}) =>
    apiClient.get("/applications", { params }),

  searchApplications: (searchTerm) =>
    apiClient.get("/applications/search", {
      params: {
        q: searchTerm,
      },
    }),

  createApplication: (payload) =>
    apiClient.post("/applications", payload),

  saveDraft: (payload) =>
    apiClient.post("/applications/draft", payload),

  submitDraft: (applicationId, payload) =>
    apiClient.post("/applications/submit-draft", {
      ...payload,
      applicationId,
    }),

  submitApplication: (payload) =>
    apiClient.post("/applications/submit", payload),

  getApplication: (applicationId) =>
    apiClient.get(`/applications/${applicationId}`),

  updateApplication: (applicationId, payload) =>
    apiClient.patch(`/applications/${applicationId}`, payload),

  replaceApplication: (applicationId, payload) =>
    apiClient.put(`/applications/${applicationId}`, payload),

  deleteApplication: (applicationId) =>
    apiClient.delete(`/applications/${applicationId}`),

  // =========================
  // OTP
  // =========================
  sendMobileOtp: (payload) =>
    apiClient.post("/auth/send-mobile-otp", payload),

  verifyMobileOtp: (payload) =>
    apiClient.post("/auth/verify-mobile-otp", payload),

  // =========================
  // CUSTOMER PROFILE
  // =========================
  createCustomerProfile: (payload) =>
    apiClient.post("/customer-profiles", payload),

  getCustomerProfile: (applicationId) =>
    apiClient.get(`/customer-profiles/${applicationId}`),

  updateCustomerProfile: (applicationId, payload) =>
    apiClient.put(
      `/customer-profiles/${applicationId}`,
      payload,
    ),

  // =========================
  // CONTACT PERSONS
  // =========================
  createContactPerson: (payload) =>
    apiClient.post("/contact-persons", payload),

  getContactPersons: (applicationId) =>
    apiClient.get(`/contact-persons/${applicationId}`),

  updateContactPerson: (id, payload) =>
    apiClient.put(`/contact-persons/${id}`, payload),

  deleteContactPerson: (id) =>
    apiClient.delete(`/contact-persons/${id}`),

  // =========================
  // CO-APPLICANTS
  // =========================
  createCoApplicant: (payload) =>
    apiClient.post("/co-applicants", payload),

  getCoApplicants: (applicationId) =>
    apiClient.get(`/co-applicants/${applicationId}`),

  updateCoApplicant: (id, payload) =>
    apiClient.put(`/co-applicants/${id}`, payload),

  deleteCoApplicant: (id) =>
    apiClient.delete(`/co-applicants/${id}`),

  // =========================
  // FIELD VISITS
  // =========================

  getFieldVisits: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/field-visits`,
    ),

  /**
   * The backend no longer has saveDraft().
   *
   * This endpoint must:
   * 1. Create/update the three visit records.
   * 2. Save checklist and location data.
   * 3. Validate all required visits/documents.
   * 4. Mark the visits COMPLETED.
   */
  completeFieldVisits: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/field-visits/complete`,
      payload,
    ),

  getFieldVisitStatus: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/field-visits/status`,
    ),

  getFieldVisitHistory: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/field-visits/history`,
    ),

  getFieldVisitDocuments: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/field-visits/documents`,
    ),

  /**
   * Do not manually set multipart Content-Type.
   * Axios/browser will add the correct multipart boundary.
   */
  uploadFieldVisitDocument: (applicationId, formData) =>
    apiClient.post(
      `/applications/${applicationId}/field-visits/documents`,
      formData,
    ),

  deleteFieldVisitDocument: (
    applicationId,
    documentId,
  ) =>
    apiClient.delete(
      `/applications/${applicationId}/field-visits/documents/${documentId}`,
    ),

  // =========================
  // DOCUMENTS
  // =========================
  documents: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/documents`,
    ),

  uploadDocument: (applicationId, formData) =>
    apiClient.post(
      `/applications/${applicationId}/documents`,
      formData,
    ),

  // =========================
  // WORKFLOW TRANSITIONS
  // =========================
  submitToBm: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/transitions`,
      payload,
    ),

  transitionApplication: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/transitions`,
      payload,
    ),

  workflowHistory: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/workflow-history`,
    ),

  workflowStatus: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/workflow`,
    ),

  recordWorkflowStep: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/workflow`,
      payload,
    ),
};
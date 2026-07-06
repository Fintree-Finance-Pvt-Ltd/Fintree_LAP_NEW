import axios from "axios";

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

  // for RM Lead create this is call
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

  verifyPan: (payload) =>
    apiClient.post("/pan/verify", payload),

  panOcr: (payload) =>
    axios.post("https://sandbox.fintreelms.com/ocr/v1/pan", payload, {
      headers: {
        "X-api-key":
          import.meta.env?.VITE_X_API_KEY ||
          import.meta.env?.REACT_APP_X_API_KEY ||
          "Fintree@2026",
      },
    }),

  // =========================
  // OTP
  // =========================
  sendOtp: (payload) => apiClient.post("/otp/send-otp", payload),

  verifyOtp: (payload) => apiClient.post("/otp/verify-otp", payload),

  verifyOtpAndCreate(data) {
    return apiClient.post("/otp/verify-and-create", data);
  },

  // Existing mobile OTP APIs
  sendMobileOtp: (payload) =>
    apiClient.post("/otp/mobile/send", payload),

  verifyMobileOtp: (payload) =>
    apiClient.post("/otp/mobile/verify", payload),

  // New email OTP APIs
  sendEmailOtp: (payload) =>
    apiClient.post("/otp/email/send", payload),

  verifyEmailOtp: (payload) =>
    apiClient.post("/otp/email/verify", payload),

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
    apiClient.get(`/applications/${applicationId}/field-visits`),

  completeFieldVisits: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/field-visits/complete`,
      payload,
    ),

  saveFieldVisit: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/field-visits/save`,
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

  viewFieldVisitDocument: (applicationId, documentId) =>
    apiClient.get(
      `/applications/${applicationId}/field-visits/documents/${documentId}/file`,
      {
        responseType: "blob",
      },
    ),

  uploadFieldVisitDocument: (applicationId, formData) =>
    apiClient.post(
      `/applications/${applicationId}/field-visits/documents`,
      formData,
    ),

  deleteFieldVisitDocument: (applicationId, documentId) =>
    apiClient.delete(
      `/applications/${applicationId}/field-visits/documents/${documentId}`,
    ),

  // =========================
  // DOCUMENTS
  // =========================
  documents: (applicationId) =>
    apiClient.get(`/applications/${applicationId}/documents`),

  uploadDocument: (formData) =>
    apiClient.post("/documents/upload", formData),

  getDocuments: (applicationId) =>
    apiClient.get(`/documents/${applicationId}`),

  deleteDocument: (documentId) =>
    apiClient.delete(`/documents/${documentId}`),

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
    apiClient.get(`/applications/${applicationId}/workflow`),

  recordWorkflowStep: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/workflow`,
      payload,
    ),

  saveGeoLocation: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/geo-location`,
      payload,
    ),

  getGeoLocations: (applicationId) =>
    apiClient.get(`/applications/${applicationId}/geo-locations`),

  reverseGeocode: (latitude, longitude) =>
    apiClient.get(
      "/applications/geo/reverse-geocode",
      {
        params: {
          lat: latitude,
          lng: longitude,
        },
      },
    ),
};


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
      params: { q: searchTerm },
    }),

  createApplication: (payload) =>
    apiClient.post("/applications", payload),

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
      payload
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
  visits: (applicationId) =>
    apiClient.get(`/applications/${applicationId}/visits`),

  addVisit: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/visits`,
      payload
    ),

  // =========================
  // DOCUMENTS
  // =========================
  documents: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/documents`
    ),

  uploadDocument: (applicationId, formData) =>
    apiClient.post(
      `/applications/${applicationId}/documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ),

  // =========================
  // WORKFLOW TRANSITIONS
  // =========================
  submitToBm: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/transitions`,
      payload
    ),

  transitionApplication: (applicationId, payload) =>
    apiClient.post(
      `/applications/${applicationId}/transitions`,
      payload
    ),

  workflowHistory: (applicationId) =>
    apiClient.get(
      `/applications/${applicationId}/workflow-history`
    ),
};
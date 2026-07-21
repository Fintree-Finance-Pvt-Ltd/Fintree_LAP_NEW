import axios from "axios";
import { apiClient } from "../../services/apiClient.js";

const SANDBOX_URL =
  import.meta.env.VITE_SANDBOX_URL || "https://sandbox.fintreelms.com";

const X_API_KEY =
  import.meta.env.VITE_X_API_KEY || "Fintree@2026";

const sandboxClient = axios.create({
  baseURL: SANDBOX_URL,
  timeout: 30000,
  withCredentials: false,
});

sandboxClient.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  config.headers["x-api-key"] = X_API_KEY;
  config.headers["X-Request-ID"] =
    globalThis.crypto?.randomUUID?.() || String(Date.now());

  if (
    typeof FormData !== "undefined" &&
    config.data instanceof FormData
  ) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }

  return config;
});

sandboxClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const responseData = error?.response?.data;

    return Promise.reject({
      success: false,
      status: error?.response?.status,
      errorCode: responseData?.errorCode,
      message:
        responseData?.message ||
        error?.message ||
        "Sandbox request failed",
      errors: responseData?.errors || [],
      requestId: responseData?.requestId,
    });
  },
);


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


// For Gst Verify
  verifyPan: (payload) =>apiClient.post("/pan/verify", payload),

// For Gst Verify

verifyGst: (payload) =>
  apiClient.post("/gst/verify", {
    gstNumber: String(payload?.gstNumber || "").trim().toUpperCase(),
    applicationId: Number(payload?.applicationId),
  }),

// For Ocr
  panOcr: (payload) =>
    sandboxClient.post("/ocr/v1/pan", payload),


// For Aadhaar KYC
  initAadhaarKyc: (payload) =>
  apiClient.post("/aadhaar/init", payload),

  getAadhaarKycStatus: (applicationId) =>
  apiClient.get(`/aadhaar/status/${applicationId}`),
  
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
  // Atomic synchronization workflow for multi-card UI layouts
  saveCoApplicantsBulk: (applicationId, coApplicantsArray) =>
    apiClient.post("/co-applicants/save-CoApplicants", {
      applicationId: Number(applicationId),
      coApplicants: coApplicantsArray,
    }),

  // Updated to match backend mapping: /co-applicants/application/:applicationId
  getCoApplicants: (applicationId) =>
    apiClient.get(`/co-applicants/application/${applicationId}`),

  // Fallback endpoints for single row executions if needed
  createCoApplicant: (payload) =>
    apiClient.post("/co-applicants", payload),

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
    apiClient.get(`/documents/application/${applicationId}/all`),

  getDocuments: (applicationId) =>
    apiClient.get(`/documents/application/${applicationId}/all`),

  getCustomerPhoto: (applicationId) =>
    apiClient.get(`/documents/application/${applicationId}/customer-photo`),

  uploadDocument: (formData) =>
    apiClient.post("/documents/upload", formData),

  deleteDocument: (documentId) =>
    apiClient.delete(`/documents/${documentId}`),
  
  // =========================
  // WORKFLOW TRANSITIONS
  // =========================


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



verifyCoApplicantPan: (coApplicantId, payload) =>
  apiClient.post(`/co-applicants/${coApplicantId}/pan/verify`, payload),

sendCoApplicantMobileOtp: (coApplicantId, payload) =>
  apiClient.post(`/co-applicants/${coApplicantId}/mobile/send-otp`, payload),

verifyCoApplicantMobileOtp: (coApplicantId, payload) =>
  apiClient.post(`/co-applicants/${coApplicantId}/mobile/verify-otp`, payload),

sendCoApplicantEmailOtp: (coApplicantId, payload) =>
  apiClient.post(`/co-applicants/${coApplicantId}/email/send-otp`, payload),

verifyCoApplicantEmailOtp: (coApplicantId, payload) =>
  apiClient.post(`/co-applicants/${coApplicantId}/email/verify-otp`, payload),

initCoApplicantAadhaar: (coApplicantId, payload = {}) =>
  apiClient.post(`/co-applicants/${coApplicantId}/aadhaar/init`, payload),

getCoApplicantAadhaarStatus: (coApplicantId) =>
  apiClient.get(`/co-applicants/${coApplicantId}/aadhaar/status`),



// =========================
// CHARGES & RECEIPTS
// =========================

// Customer/application dropdown list for charges page
getChargeReceiptApplications: (params = {}) =>
  apiClient.get("/applications", {
    params: {
      page: 1,
      limit: 100,
      ...params,
    },
  }),

// Create one manual charge
createChargeReceipt: (payload) =>
  apiClient.post("/charges-receipts", payload),

// Create default charge schedule for selected application
createDefaultChargeSchedule: (applicationId) =>
  apiClient.post(
    `/charges-receipts/application/${applicationId}/default`,
  ),

// Get complete charge schedule by application id
getChargeSchedule: (applicationId) =>
  apiClient.get(
    `/charges-receipts/application/${applicationId}`,
  ),

// Schedule actions
submitChargeSchedule: (applicationId) =>
  apiClient.patch(
    `/charges-receipts/application/${applicationId}/submit-schedule`,
  ),

approveChargeSchedule: (applicationId) =>
  apiClient.patch(
    `/charges-receipts/application/${applicationId}/approve-schedule`,
  ),

rejectChargeSchedule: (applicationId) =>
  apiClient.patch(
    `/charges-receipts/application/${applicationId}/reject-schedule`,
  ),

// Update single charge row
updateChargeReceipt: (chargeId, payload) =>
  apiClient.patch(
    `/charges-receipts/${chargeId}`,
    payload,
  ),

// Mark charge paid manually
markChargePaid: (chargeId, payload) =>
  apiClient.patch(
    `/charges-receipts/${chargeId}/mark-paid`,
    payload,
  ),

// Waiver
waiveChargeReceipt: (chargeId, payload) =>
  apiClient.patch(
    `/charges-receipts/${chargeId}/waive`,
    payload,
  ),

// Refund
refundChargeReceipt: (chargeId, payload) =>
  apiClient.patch(
    `/charges-receipts/${chargeId}/refund`,
    payload,
  ),

// Delete charge
deleteChargeReceipt: (chargeId) =>
  apiClient.delete(
    `/charges-receipts/${chargeId}`,
  ),


  createEasebuzzPaymentLink: (applicationId) =>
  apiClient.post(
    `/charges-receipts/application/${applicationId}/payment-link`,
  ),
  
submitToBm: (applicationId) =>
  apiClient.post(`/applications/${applicationId}/submit-to-bm`),

submitToCm: (applicationId) =>
  apiClient.post(`/applications/${applicationId}/submit-to-cm`),
  
  createLapPaymentLink: (applicationId, payload) =>
  apiClient.post(
    `/applications/${applicationId}/easebuzz/create-link`,
    payload,
  ),


};


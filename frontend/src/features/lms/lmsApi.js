import { apiClient } from "../../services/apiClient.js";

export const lmsApi = {
   dashboard: () => apiClient.get("/lms/dashboard"),

  loanAccounts: (params = {}) =>
    apiClient.get("/lms/loan-accounts", { params }),

  disbursements: (params = {}) =>
    apiClient.get("/lms/disbursements", { params }),

  repayments: (params = {}) =>
    apiClient.get("/lms/repayments", { params }),

  utrUploads: (params = {}) =>
    apiClient.get("/lms/utr-uploads", { params }),

  uploadUtr: (payload) =>
    apiClient.post("/lms/utr-upload", payload),

  nach: (params = {}) =>
    apiClient.get("/lms/nach", { params }),

  soa: (params = {}) =>
    apiClient.get("/lms/soa", { params }),

  collections: (params = {}) =>
    apiClient.get("/lms/collections", { params }),

  reports: (params = {}) =>
    apiClient.get("/lms/reports", { params }),
};
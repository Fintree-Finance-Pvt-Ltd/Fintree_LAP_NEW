import { apiClient } from "../../services/apiClient.js";

export const claimsApi = {
  /**
   * Apply / Submit new claim
   */
  applyClaim: (payload) => apiClient.post("/claims/apply", payload),

  /**
   * Upload receipt file (Images, PDF)
   */
  uploadReceipt: (formData) =>
    apiClient.post("/claims/upload-receipt", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /**
   * Get logged-in user's claims
   */
  getMyClaims: (params = {}) => apiClient.get("/claims/my-claims", { params }),

  /**
   * Get KPI statistics
   */
  getStats: (params = {}) => apiClient.get("/claims/stats", { params }),

  /**
   * Admin: Get all employee claims
   */
  getAllClaims: (params = {}) => apiClient.get("/claims/admin/all", { params }),

  /**
   * Admin: Approve claim
   */
  approveClaim: (id, payload = {}) =>
    apiClient.post(`/claims/admin/${id}/approve`, payload),

  /**
   * Admin: Reject claim
   */
  rejectClaim: (id, payload) =>
    apiClient.post(`/claims/admin/${id}/reject`, payload),

  /**
   * Admin: Bulk approve claims
   */
  bulkApproveClaims: (payload) =>
    apiClient.post("/claims/admin/bulk-approve", payload),

  /**
   * Admin: Bulk reject claims
   */
  bulkRejectClaims: (payload) =>
    apiClient.post("/claims/admin/bulk-reject", payload),

  /**
   * Admin: Update payment disbursement status
   */
  updatePaymentStatus: (id, payload) =>
    apiClient.post(`/claims/admin/${id}/payment-status`, payload),

  /**
   * User: Cancel a pending claim
   */
  cancelClaim: (id) => apiClient.post(`/claims/${id}/cancel`),

  /**
   * Delete claim
   */
  deleteClaim: (id) => apiClient.delete(`/claims/${id}`),

  /**
   * Get claim details by ID
   */
  getClaimById: (id) => apiClient.get(`/claims/${id}`),
};


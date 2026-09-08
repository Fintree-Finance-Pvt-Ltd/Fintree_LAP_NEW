import { apiClient } from "../../services/apiClient.js";

export const leavesApi = {
  // Apply for leave
  apply: (payload) =>
    apiClient.post("/leaves/apply", payload, {
      skipToast: false,
    }),

  // Get logged in user's leave history
  getMyLeaves: (params = {}) =>
    apiClient.get("/leaves/my-leaves", { params }),

  // User cancels own pending leave
  cancel: (id) =>
    apiClient.post(`/leaves/${id}/cancel`, {}, {
      skipToast: false,
    }),

  // Get approved leaves for Attendance Calendar
  getCalendarLeaves: (params = {}) =>
    apiClient.get("/leaves/calendar-leaves", { params }),

  // Get leave statistics
  getStats: (params = {}) =>
    apiClient.get("/leaves/stats", { params }),

  // Admin: view all leaves across organization
  getAllLeaves: (params = {}) =>
    apiClient.get("/leaves/admin/all", { params }),

  // Admin: approve leave request
  approve: (id, payload = {}) =>
    apiClient.post(`/leaves/admin/${id}/approve`, payload, {
      skipToast: false,
    }),

  // Admin: reject leave request
  reject: (id, payload) =>
    apiClient.post(`/leaves/admin/${id}/reject`, payload, {
      skipToast: false,
    }),
};

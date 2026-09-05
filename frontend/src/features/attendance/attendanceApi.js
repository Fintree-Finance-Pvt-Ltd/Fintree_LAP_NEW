import { apiClient } from "../../services/apiClient.js";

export const attendanceApi = {
  getTodayStatus: () => apiClient.get("/attendance/today-status"),

  startWork: (payload) =>
    apiClient.post("/attendance/start-work", payload, {
      skipToast: false,
    }),

  endWork: (payload) =>
    apiClient.post("/attendance/end-work", payload, {
      skipToast: false,
    }),

  trackLocation: (payload) =>
    apiClient.post("/attendance/track-location", payload, {
      skipToast: true,
    }),

  getRoute: (attendanceId) =>
    apiClient.get(`/attendance/route/${attendanceId}`),

  getMyHistory: (limit = 60) =>
    apiClient.get(`/attendance/my-history?limit=${limit}`),

  getAll: (params = {}) =>
    apiClient.get("/attendance/all", { params }),
};



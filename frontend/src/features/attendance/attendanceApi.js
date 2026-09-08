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

  getMyHistory: (options = 100) => {
    if (typeof options === "number") {
      return apiClient.get(`/attendance/my-history?limit=${options}`);
    }
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit);
    if (options?.month) params.append("month", options.month);
    return apiClient.get(`/attendance/my-history?${params.toString()}`);
  },

  getAll: (params = {}) =>
    apiClient.get("/attendance/all", { params }),

  getTodaysMap: (params = {}) =>
    apiClient.get("/attendance/todays-map", { params }),
};



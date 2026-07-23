import { apiClient } from "../../services/apiClient.js";

export const hubApi = {
  async getHubs(params = {}) {
    return await apiClient.get("/hub", {
      params,
    });
  },

  async getHubById(hubId) {
    return await apiClient.get(
      `/hub/${hubId}`,
    );
  },

  async createHub(payload) {
    return await apiClient.post(
      "/hub",
      payload,
    );
  },

  async updateHub(hubId, payload) {
    return await apiClient.patch(
      `/hub/${hubId}`,
      payload,
    );
  },
};
import { apiClient } from "../../services/apiClient.js";

export const spokesApi = {
  getSpokes(params = {}) {
    return apiClient.get("/spokes", {
      params,
    });
  },

  getSpokeById(spokeId) {
    return apiClient.get(`/spokes/${spokeId}`);
  },

  createSpoke(payload) {
    return apiClient.post("/spokes", payload);
  },

  updateSpoke(spokeId, payload) {
    return apiClient.patch(
      `/spokes/${spokeId}`,
      payload,
    );
  },
};
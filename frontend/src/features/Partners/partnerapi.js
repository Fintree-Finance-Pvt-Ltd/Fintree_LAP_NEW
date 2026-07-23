import { apiClient } from "../../services/apiClient.js";

export const partnerApi = {
  getPartners: (params = {}) =>
    apiClient.get("/partners", {
      params,
    }),

  getPartner: (partnerId) =>
    apiClient.get(`/partners/${partnerId}`),

  createPartner: (payload) =>
    apiClient.post("/partners", payload),

  updatePartner: (partnerId, payload) =>
    apiClient.patch(`/partners/${partnerId}`, payload),

  updatePartnerStatus: (partnerId, status) =>
    apiClient.patch(`/partners/${partnerId}/status`, {
      status,
    }),
};

export default partnerApi;
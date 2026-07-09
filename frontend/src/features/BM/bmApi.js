
import { apiClient } from "../../services/apiClient.js";

export const bmApi = {
  getQueue: (config = {}) =>
    apiClient.get(
      "/bm-reviews/queue",
      config,
    ),

  getApproved: (config = {}) =>
    apiClient.get(
      "/bm-reviews/approved",
      config,
    ),


  getChargesApproved: (config = {}) =>
    apiClient.get(
      "/bm-reviews/charges-approved",
      config,
    ),

  getByApplicationId: (
    applicationId,
    config = {},
  ) =>
    apiClient.get(
      `/bm-reviews/application/${applicationId}`,
      config,
    ),

  approveCharge: (chargeId) =>
    apiClient.post(`/bm-reviews/approve-charge/${chargeId}`),
};
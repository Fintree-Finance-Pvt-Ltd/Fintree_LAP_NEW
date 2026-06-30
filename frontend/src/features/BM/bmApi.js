
import { apiClient } from "../../services/apiClient.js";

export const bmReviewApi = {
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
    
  getByApplicationId: (
    applicationId,
    config = {},
  ) =>
    apiClient.get(
      `/bm-reviews/application/${applicationId}`,
      config,
    ),
};
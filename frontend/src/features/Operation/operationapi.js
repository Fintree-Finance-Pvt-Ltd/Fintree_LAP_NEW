import { apiClient } from "../../services/apiClient.js";

export const operationApi = {
  // Existing operation APIs...
 getOpsQueue: (config = {}) =>
    apiClient.get(
      "/operations/queue",
      config,
    ),


  getCheckerCase: (applicationId) =>
    apiClient.get(`/operations/checker/${applicationId}`),


    approveCheckerCase: (applicationId, payload) =>
    apiClient.post(
      `/operations/checker/${applicationId}/approve`,
      payload,
    ),

  returnCheckerCase: (applicationId, payload) =>
    apiClient.post(
      `/operations/checker/${applicationId}/return`,
      payload,
    ),
};
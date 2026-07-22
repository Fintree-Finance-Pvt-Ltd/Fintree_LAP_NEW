import { apiClient } from "../../services/apiClient.js";

export const operationApi = {
  // Existing operation APIs...
 getOpsQueue: (config = {}) =>
    apiClient.get(
      "/operations/queue",
      config,
    ),

     getOpsMakerCase: (applicationId) =>
    apiClient.get(`/operations/maker/${applicationId}`),


      getOpsheadCase: (applicationId) =>
    apiClient.get(`/operations/head/${applicationId}`),


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
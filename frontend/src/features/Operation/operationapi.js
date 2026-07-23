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


 getHeadCase: (applicationId) =>
    apiClient.get(`/operations/head/${applicationId}`),


  getMakerCase: (applicationId) =>
    apiClient.get(`/operations/head/${applicationId}`),



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

    approveByOpsMaker: (applicationId, payload = {}) =>
    apiClient.patch(
      `/operations/maker/${applicationId}/approve`,
      payload,
    ),

    approveByOpsHead: (applicationId, payload = {}) =>
    apiClient.patch(
      `/operations/head/${applicationId}/approve`,
      payload,
    ),


    approveByOpsChecker: (applicationId, payload = {}) =>
    apiClient.patch(
      `/operations/checker/${applicationId}/approve`,
      payload,
    ),

      getApplicationDocuments: (applicationId) =>
    apiClient.get(
      // `/documents/application/${applicationId}`,
          `/applications/${applicationId}/documents`,

    ),
};
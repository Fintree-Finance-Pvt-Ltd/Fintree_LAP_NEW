import {
  apiClient,
} from "../../services/apiClient.js";

export const administrationApi = {
  /*
   * GET /api/hubs/administration
   */
  getHubAdministration: (
    config = {},
  ) =>
    apiClient.get(
      "/hubs/administration",
      config,
    ),

  /*
   * GET /api/spokes/administration
   */
  getSpokeAdministration: (
    config = {},
  ) =>
    apiClient.get(
      "/spokes/administration",
      config,
    ),
};
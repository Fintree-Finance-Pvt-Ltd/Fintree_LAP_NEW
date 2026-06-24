import { apiClient } from "../../services/apiClient.js";

export const usersApi = {
  getAccessList: (config = {}) =>
    apiClient.get(
      "/users/access-list",
      config,
    ),
};
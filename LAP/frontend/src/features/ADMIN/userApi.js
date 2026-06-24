import { apiClient } from "../../services/apiClient.js";

export const usersApi = {
  getAccessList: (config = {}) =>
    apiClient.get(
      "/users/access-list",
      config,
    ),

    createUser: (payload) =>
    apiClient.post("/users", payload),

};
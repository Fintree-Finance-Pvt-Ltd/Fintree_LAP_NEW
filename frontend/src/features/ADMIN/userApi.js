import { apiClient } from "../../services/apiClient.js";

export const usersApi = {
  getAllUsers: (config = {}) =>
    apiClient.get(
      "/users",
      config,
    ),

     getAccessList: (config = {}) =>
    apiClient.get(
      "/users/access-list",
      config,
    ),

    //for roles
    getRoles: (config = {}) =>
    apiClient.get("/roles", config),
    
    createUser: (payload) =>
    apiClient.post("/users", payload),

};
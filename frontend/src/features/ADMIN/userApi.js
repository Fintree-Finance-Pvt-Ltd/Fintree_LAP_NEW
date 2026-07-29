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

   // get users role access 
  getUsersRoleAccess: (
    config = {},
  ) =>
    apiClient.get(
      "/users/role-access",
      config,
    ),

  //for roles
  getRoles: (config = {}) =>
    apiClient.get("/roles", config),

  createUser: (payload) =>
    apiClient.post("/users", payload),

  // Permissions
  getPermissions: (config = {}) =>
    apiClient.get(
      "/permissions",
      config,
    ),

  getRolePermissions: (
    roleId,
    config = {},
  ) =>
    apiClient.get(
      `/roles/${roleId}/permissions`,
      config,
    ),

  updateRolePermissions: (
    roleId,
    permissionIds,
  ) =>
    apiClient.put(
      `/roles/${roleId}/permissions`,
      {
        permissionIds,
      },
    ),
};
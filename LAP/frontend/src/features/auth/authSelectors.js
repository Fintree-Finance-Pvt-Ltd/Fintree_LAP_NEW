export const selectUser = (state) => state.auth.user;
export const selectPermissions = (state) => state.auth.permissions;
export const selectIsAuthenticated = (state) => Boolean(state.auth.accessToken);

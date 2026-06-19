import { createSlice } from '@reduxjs/toolkit';
import { tokenManager } from '../../services/tokenManager.js';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    roles: [],
    permissions: []
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.roles = user?.roles ?? [];
      state.permissions = user?.permissions ?? [];
      tokenManager.setAccessToken(accessToken);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.roles = [];
      state.permissions = [];
      tokenManager.clear();
    }
  }
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

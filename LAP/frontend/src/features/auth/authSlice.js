import { createSlice } from '@reduxjs/toolkit';
import { tokenManager } from '../../services/tokenManager.js';

function loadStoredAuth() {
  try {
    const stored = JSON.parse(window.localStorage.getItem('loginDetails') || 'null');
    if (stored?.accessToken) tokenManager.setAccessToken(stored.accessToken);
    return stored;
  } catch {
    return null;
  }
}

const storedAuth = typeof window === 'undefined' ? null : loadStoredAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedAuth?.user ?? null,
    accessToken: storedAuth?.accessToken ?? null,
    roles: storedAuth?.user?.roles ?? [],
    permissions: storedAuth?.user?.permissions ?? []
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.roles = user?.roles ?? [];
      state.permissions = user?.permissions ?? [];
      tokenManager.setAccessToken(accessToken);
      window.localStorage.setItem('loginDetails', JSON.stringify(action.payload));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.roles = [];
      state.permissions = [];
      tokenManager.clear();
      window.localStorage.removeItem('loginDetails');
      window.localStorage.removeItem('user');
      window.sessionStorage.removeItem('user');
    }
  }
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

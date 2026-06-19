import { configureStore, createSlice } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    snackbar: null,
    selectedHub: null,
    selectedSpoke: null
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSnackbar: (state, action) => {
      state.snackbar = action.payload;
    },
    setHubSpoke: (state, action) => {
      state.selectedHub = action.payload.hub;
      state.selectedSpoke = action.payload.spoke;
    }
  }
});

export const { toggleSidebar, setSnackbar, setHubSpoke } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiSlice.reducer
  }
});

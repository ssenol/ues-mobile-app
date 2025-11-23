import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  accessToken: null,
  currentUser: null,
  refreshToken: null,
  isAuthenticated: false,
  tokenAcquiredAt: null, // Token alınma zamanı (timestamp)
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.token;
      state.currentUser = action.payload.user;
      state.refreshToken = action.payload.user?.refresh_token;
      state.isAuthenticated = !!action.payload.token;
      state.tokenAcquiredAt = action.payload.tokenAcquiredAt || Date.now();
    },
    updateToken: (state, action) => {
      state.accessToken = action.payload.token;
      state.tokenAcquiredAt = Date.now();
    },
    logout: (state) => {
      state.accessToken = null;
      state.currentUser = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.tokenAcquiredAt = null;
    },
  },
});

export const { setCredentials, logout, updateToken } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRefreshToken = (state) => state.auth.refreshToken;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export default authSlice.reducer;

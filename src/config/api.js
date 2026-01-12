import axios from "axios";
import { store } from "../store/index";
import { logout, setCredentials } from "../store/slices/authSlice";

const BASE_URL = "https://quizmaker-api.onrender.com/api/v0.0.1";

const api = axios.create({
  timeout: 20000,
});

export const API_ENDPOINTS = {
  auth: {
    login: `${BASE_URL}/auth/login`,
    refresh: `${BASE_URL}/auth/refresh-mobile-app-access-token`,
  },
  assignment: {
    getAssignedSpeechTasks: `${BASE_URL}/student/get-assigned-speech-tasks`,
  },
  student: {
    generateExerciseToken: `${BASE_URL}/student/generate-exercise-auth-token`,
    submitSpeechTask: `${BASE_URL}/student/submit-speech-task`,
    getCompletedExercises: `${BASE_URL}/student/get-student-completed-exercises`,
    getSolvedExerciseDetail: `${BASE_URL}/student/get-solved-exercise-detail`,
  },
  speechScenario: {
    chatResponse: `${BASE_URL}/question/speech-on-scenario-chat-response`,
  },
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const state = store.getState().auth;
    const { accessToken, tokenAcquiredAt, refreshToken } = state;

    if (config.url.includes('/auth/login') || config.url.includes('/auth/refresh')) {
      return config;
    }

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (accessToken && tokenAcquiredAt && now - tokenAcquiredAt > twentyFourHours) {
      if (refreshToken) {
        try {
          const response = await axios.post(API_ENDPOINTS.auth.refresh, { refreshToken });
          const { accessToken: newAccessToken, user: newUser } = response.data.data;
          
          store.dispatch(setCredentials({
            token: newAccessToken,
            user: { ...state.currentUser, ...newUser },
            refreshToken: refreshToken,
            tokenAcquiredAt: Date.now(),
          }));

          config.headers.Authorization = `Bearer ${newAccessToken}`;
          return config;
        } catch (e) {
          store.dispatch(logout());
          return Promise.reject(e);
        }
      }
      store.dispatch(logout());
      return Promise.reject(new Error("No refresh token"));
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken } = store.getState().auth;

      if (refreshToken) {
        try {
          const response = await axios.post(API_ENDPOINTS.auth.refresh, { refreshToken });
          const { accessToken: newAccessToken, user: newUser } = response.data.data;
          
          store.dispatch(setCredentials({
            token: newAccessToken,
            user: { ...store.getState().auth.currentUser, ...newUser },
            refreshToken: refreshToken,
            tokenAcquiredAt: Date.now(),
          }));

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          store.dispatch(logout());
          return Promise.reject(refreshError);
        }
      }
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from "axios";

const BASE_URL =
  "https://test-dot-uesquizmaker-api.ey.r.appspot.com/api/v0.0.1";

const api = axios.create({
  timeout: 20000,
});

export const API_ENDPOINTS = {
  auth: {
    login: `${BASE_URL}/auth/mobile-app-login`,
    logout: `${BASE_URL}/auth/mobile-app-logout`,
    refresh: `${BASE_URL}/auth/refresh-mobile-app-access-token`,
  },
  speech: {
    evaluateMobileTask: `${BASE_URL}/question/evaluate-speech-mobile-task`,
  },
  quiz: {
    fetchTasks: `${BASE_URL}/quiz/get-speech-quizzes-to-mobile-app`,
    saveSpeechResult: `${BASE_URL}/quiz/save-speech-task-result`,
  },
  writing: {
    fetchWriting: `${BASE_URL}/quiz/get-writing-quizzes-to-mobile-app`,
  },
};

export default api;

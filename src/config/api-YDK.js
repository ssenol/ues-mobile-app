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
    evaluation: `${BASE_URL}/question/evaluate-speech-pronunciation`,
    topicScore: `${BASE_URL}/quiz/get-speech-question-topic-related-score`,
    evaluationByAI: `${BASE_URL}/question/get-speech-assessment-result-evaluation-by-ai`,
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

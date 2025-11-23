import axios from "axios";

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
};

export default api;

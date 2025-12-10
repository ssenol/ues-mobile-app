import api, { API_ENDPOINTS } from '../config/api';

export const fetchSpeechTasks = async (params) => {
  const response = await api.post(
    API_ENDPOINTS.assignment.fetchTasks,
    params,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const saveSpeechResult = async (formData) => {
  const response = await api.post(API_ENDPOINTS.assignment.saveSpeechResult, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const evaluateSpeechMobileTask = async (rawParams) => {
  const {
    assignedTaskId,
    uesId,
    speechTaskId,
    audioFile,
    stage,
    username,
    speechDuration
  } = rawParams || {};

  const formData = new FormData();
  formData.append('assignedTaskId', assignedTaskId);
  formData.append('uesId', uesId);
  formData.append('speechTaskId', speechTaskId);
  formData.append('audioFile', {
    uri: audioFile,
    name: audioFile.split('/').pop(),
    type: 'audio/m4a',
  });
  formData.append('stage', stage);
  formData.append('username', username);
  formData.append('speechDuration', speechDuration);

  const response = await api.post(
    API_ENDPOINTS.speak.evaluateMobileTask,
    formData
  );
  return response.data;
};

export const fetchAssignedSpeechTasks = async (params) => {
  const response = await api.post(
    API_ENDPOINTS.assignment.getAssignedSpeechTasks,
    params,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

// Generate Exercise Token
export const generateExerciseToken = async (params) => {
  const response = await api.post(
    API_ENDPOINTS.student.generateExerciseToken,
    params,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

// Submit Speech Task
export const submitSpeechTask = async (audioUri, duration, exerciseToken) => {
  const formData = new FormData();
  formData.append('durationAsSeconds', Math.round(duration));
  formData.append('file', {
    uri: audioUri,
    name: audioUri.split('/').pop() || 'recording.m4a',
    type: 'audio/m4a',
  });

  const response = await api.post(
    API_ENDPOINTS.student.submitSpeechTask,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${exerciseToken}`, // This one is special, it uses a temporary exercise token
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

// Get Completed Exercises
export const getCompletedExercises = async (params) => {
  const response = await api.post(
    API_ENDPOINTS.student.getCompletedExercises,
    params,
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

// Get Solved Exercise Detail
export const getSolvedExerciseDetail = async (reportId) => {
  const response = await api.post(
    API_ENDPOINTS.student.getSolvedExerciseDetail,
    { reportId },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

// Generate temporary file URL
export const generateFileUrl = async (fileUrl) => {
  const response = await api.post(
    'https://quizmaker-api.onrender.com/api/v0.0.1/storage/generate-file-url',
    { fileUrl },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export default {
  fetchSpeechTasks,
  saveSpeechResult,
  evaluateSpeechMobileTask,
  fetchAssignedSpeechTasks,
  generateExerciseToken,
  submitSpeechTask,
  getCompletedExercises,
  getSolvedExerciseDetail,
  generateFileUrl,
};
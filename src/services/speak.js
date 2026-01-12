import api, { API_ENDPOINTS } from '../config/api';
import store from '../store';
import {
  selectCachedAssignments,
  selectIsCacheValid,
  selectTotalAssignments,
  selectCompletedAssignments,
  setCachedAssignments,
  CACHE_DURATION_MS,
} from '../store/slices/assignmentSlice';
import { parseAssignedTasksResponse, transformTaskToAssignment } from '../utils/assignmentTransform';

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

/**
 * Cache mekanizmalı assignment çekme fonksiyonu
 * @param {Object} params - API parametreleri
 * @param {boolean} forceRefresh - true ise cache'i bypass eder ve API'den yeni data çeker
 * @param {number} cacheDuration - Cache süresi (ms), varsayılan 6 saat
 * @returns {Object} - { assignments, totalAssignments, completedAssignments, fromCache }
 */
export const fetchAssignedSpeechTasksWithCache = async (
  params,
  forceRefresh = false,
  cacheDuration = CACHE_DURATION_MS
) => {
  const state = store.getState();
  
  // Cache geçerli mi kontrol et (forceRefresh false ise)
  if (!forceRefresh && selectIsCacheValid(state, cacheDuration)) {
    // Cache'den döndür
    const cachedAssignments = selectCachedAssignments(state);
    const totalAssignments = selectTotalAssignments(state);
    const completedAssignments = selectCompletedAssignments(state);
    
    return {
      assignments: cachedAssignments,
      totalAssignments,
      completedAssignments,
      fromCache: true,
    };
  }
  
  // Cache geçersiz veya forceRefresh true - API'den çek
  const response = await fetchAssignedSpeechTasks(params);
  const {
    success,
    tasks,
    totals: { totalAssigned, completedAssignments: completedCount },
  } = parseAssignedTasksResponse(response);
  
  let transformedAssignments = [];
  if (success && Array.isArray(tasks) && tasks.length > 0) {
    transformedAssignments = tasks.map(transformTaskToAssignment).filter(Boolean);
  }
  
  // Store'a kaydet
  store.dispatch(setCachedAssignments({
    assignments: transformedAssignments,
    totalAssignments: totalAssigned,
    completedAssignments: completedCount,
  }));
  
  return {
    assignments: transformedAssignments,
    totalAssignments: totalAssigned,
    completedAssignments: completedCount,
    fromCache: false,
  };
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
  fetchAssignedSpeechTasksWithCache,
  generateExerciseToken,
  submitSpeechTask,
  getCompletedExercises,
  getSolvedExerciseDetail,
  generateFileUrl,
};
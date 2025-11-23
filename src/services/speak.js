import * as SecureStore from 'expo-secure-store';
import api, { API_ENDPOINTS } from '../config/api';

export const fetchSpeechTasks = async (params) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await api.post(
    API_ENDPOINTS.assignment.fetchTasks,
    params,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

export const saveSpeechResult = async (formData) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await api.post(API_ENDPOINTS.assignment.saveSpeechResult, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const evaluateSpeechMobileTask = async (rawParams) => {
  // console.log('[speak.js] evaluateSpeechMobileTask - RAW INCOMING PARAMS:', rawParams);
  const {
    assignedTaskId,
    uesId,
    speechTaskId,
    audioFile,
    stage,
    username,
    speechDuration
  } = rawParams || {}; // Add fallback for safety, though rawParams should exist
  // console.log('[speak.js] evaluateSpeechMobileTask - audioFileUri (after destructuring):', audioFileUri);
  // console.log('[speak.js] evaluateSpeechMobileTask - all params (after destructuring):', { assignedTaskId, uesId, speechTaskId, audioFileUri, stage, username, speechDuration });
  const token = await SecureStore.getItemAsync('accessToken');
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
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const fetchAssignedSpeechTasks = async (params) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    
    const response = await api.post(
      API_ENDPOINTS.assignment.getAssignedSpeechTasks,
      params,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate Exercise Token
export const generateExerciseToken = async (params) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    
    const response = await api.post(
      API_ENDPOINTS.student.generateExerciseToken,
      params,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Submit Speech Task
export const submitSpeechTask = async (audioUri, duration, exerciseToken) => {
  try {
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
          'Authorization': `Bearer ${exerciseToken}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get Completed Exercises
export const getCompletedExercises = async (params) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    
    const response = await api.post(
      API_ENDPOINTS.student.getCompletedExercises,
      params,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get Solved Exercise Detail
export const getSolvedExerciseDetail = async (reportId) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    
    const response = await api.post(
      API_ENDPOINTS.student.getSolvedExerciseDetail,
      { reportId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate temporary file URL
export const generateFileUrl = async (fileUrl) => {
  try {
    const token = await SecureStore.getItemAsync('accessToken');
    const response = await api.post(
      'https://quizmaker-api.onrender.com/api/v0.0.1/storage/generate-file-url',
      { fileUrl },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
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
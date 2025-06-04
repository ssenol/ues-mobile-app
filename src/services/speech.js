import api, { API_ENDPOINTS } from '../config/api';
import * as SecureStore from 'expo-secure-store';

export const fetchSpeechTasks = async (params) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await api.post(
    API_ENDPOINTS.quiz.fetchTasks,
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

export const evaluateSpeech = async (formData) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await api.post(API_ENDPOINTS.speech.evaluation, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getSpeechQuestionTopicRelatedScore = async (payload) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await api.post(API_ENDPOINTS.speech.topicScore, payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const getSpeechAssessmentResultEvaluationByAI = async (payload) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await api.post(API_ENDPOINTS.speech.evaluationByAI, payload, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const saveSpeechResult = async (formData) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const response = await api.post(API_ENDPOINTS.quiz.saveSpeechResult, formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const evaluateSpeechMobileTask = async ({
  assignedTaskId,
  uesId,
  speechTaskId,
  audioFileUri,
  stage,
  username,
  speechDuration
}) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const formData = new FormData();
  formData.append('assignedTaskId', assignedTaskId);
  formData.append('uesId', uesId);
  formData.append('speechTaskId', speechTaskId);
  formData.append('audioFile', {
    uri: audioFileUri,
    name: audioFileUri.split('/').pop(),
    type: 'audio/wav',
  });
  formData.append('stage', stage);
  formData.append('username', username);
  formData.append('speechDuration', speechDuration);

  const response = await api.post(
    API_ENDPOINTS.speech.evaluateMobileTask,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export default {
  fetchSpeechTasks,
  evaluateSpeech,
  getSpeechQuestionTopicRelatedScore,
  getSpeechAssessmentResultEvaluationByAI,
  saveSpeechResult,
  evaluateSpeechMobileTask,
};
import * as FileSystem from 'expo-file-system/legacy';
import api, { API_ENDPOINTS } from '../config/api';
import { store } from '../store';
import {
  selectCachedAssignments,
  selectIsCacheValid,
  selectTotalAssignments,
  selectCompletedAssignments,
  setCachedAssignments,
  CACHE_DURATION_MS,
} from '../store/slices/assignmentSlice';
import {
  AssignedTasksResponse,
  parseAssignedTasksResponse,
  transformTaskToAssignment,
} from '../utils/assignmentTransform';
import type { ApiResponse } from '../types/api';
import type { Assignment } from '../types/assignment';

export type { Assignment };

export interface AssignmentsResult {
  assignments: Assignment[];
  totalAssignments: number;
  completedAssignments: number;
  fromCache: boolean;
}

type RequestParams = Record<string, unknown>;

// React Native FormData dosya parçası (DOM tiplerinde karşılığı yok)
interface RNFormDataFile {
  uri: string;
  name: string;
  type: string;
}

const appendFile = (formData: FormData, field: string, file: RNFormDataFile) => {
  formData.append(field, file as unknown as Blob);
};

const jsonHeaders = { headers: { 'Content-Type': 'application/json' } };

export const fetchAssignedSpeechTasks = async (params: RequestParams): Promise<AssignedTasksResponse> => {
  const response = await api.post<AssignedTasksResponse>(
    API_ENDPOINTS.assignment.getAssignedSpeechTasks,
    params,
    jsonHeaders
  );
  return response.data;
};

/**
 * Cache mekanizmalı assignment çekme fonksiyonu
 * @param params - API parametreleri
 * @param forceRefresh - true ise cache'i bypass eder ve API'den yeni data çeker
 * @param cacheDuration - Cache süresi (ms), varsayılan CACHE_DURATION_MS
 */
export const fetchAssignedSpeechTasksWithCache = async (
  params: RequestParams,
  forceRefresh = false,
  cacheDuration: number = CACHE_DURATION_MS
): Promise<AssignmentsResult> => {
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
  
  let transformedAssignments: Assignment[] = [];
  if (success && Array.isArray(tasks) && tasks.length > 0) {
    transformedAssignments = tasks
      .map(transformTaskToAssignment)
      .filter((a): a is Assignment => Boolean(a));
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
export const generateExerciseToken = async (params: RequestParams): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.student.generateExerciseToken,
    params,
    jsonHeaders
  );
  return response.data;
};

// Submit Speech Task
export const submitSpeechTask = async (
  audioUri: string,
  duration: number,
  exerciseToken: string
): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('durationAsSeconds', String(Math.round(duration)));
  appendFile(formData, 'file', {
    uri: audioUri,
    name: audioUri.split('/').pop() || 'recording.m4a',
    type: 'audio/m4a',
  });

  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.student.submitSpeechTask,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${exerciseToken}`, // This one is special, it uses a temporary exercise token
        'Content-Type': 'multipart/form-data',
      },
      skipAuthInterceptor: true, // Prevent interceptor from overwriting the exercise token
    }
  );
  return response.data;
};

// Get Completed Exercises
export const getCompletedExercises = async (params: RequestParams): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.student.getCompletedExercises,
    params,
    jsonHeaders
  );
  return response.data;
};

// Get Solved Exercise Detail
export const getSolvedExerciseDetail = async (reportId: string): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.student.getSolvedExerciseDetail,
    { reportId },
    jsonHeaders
  );
  return response.data;
};

// Generate temporary file URL
export const generateFileUrl = async (fileUrl: string): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.storage.generateFileUrl,
    { fileUrl },
    jsonHeaders
  );
  return response.data;
};

// Delete Solved Task
export const deleteSolvedTask = async (taskId: string, studentIds: string[]): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.student.deleteSolvedTask,
    { taskId, studentIds },
    jsonHeaders
  );
  return response.data;
};

// My Progress sekmesi için özet istatistikler (KPI, skor trendi, kriter ortalamaları vb.)
export const getSelfAnalytics = async (userId: string, type = 'speaking'): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>(
    API_ENDPOINTS.student.getSelfAnalytics,
    { userId, type },
    jsonHeaders
  );
  return response.data;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Bir kelimenin doğru telaffuzunu TTS ile üretir, local dosyaya yazar ve oynatılabilir URI döner
export const getWordTts = async (word: string, speed = 'slow', voice = 'nova'): Promise<string> => {
  const response = await api.post<ArrayBuffer>(
    API_ENDPOINTS.question.wordTts,
    { input: word, speed, voice },
    { responseType: 'arraybuffer' }
  );

  const base64 = arrayBufferToBase64(response.data);
  const fileUri = `${FileSystem.documentDirectory}word_tts_${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });
  return fileUri;
};

export default {
  fetchAssignedSpeechTasks,
  fetchAssignedSpeechTasksWithCache,
  generateExerciseToken,
  submitSpeechTask,
  getCompletedExercises,
  getSolvedExerciseDetail,
  generateFileUrl,
  deleteSolvedTask,
  getWordTts,
  getSelfAnalytics,
};

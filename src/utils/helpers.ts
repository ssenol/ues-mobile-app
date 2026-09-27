import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

const BIOMETRIC_KEY = "biometric_auth_enabled";
export const BIOMETRIC_PROMPT_SHOWN_KEY = "biometric_prompt_shown";

export async function getBiometricEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem(BIOMETRIC_KEY);
  return enabled === "true";
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_KEY, String(enabled));
}

export async function getMicrophoneEnabled(): Promise<boolean> {
  const { status } = await getRecordingPermissionsAsync();
  return status === "granted";
}

export async function requestMicrophonePermission(): Promise<boolean> {
  const { status } = await requestRecordingPermissionsAsync();
  return status === "granted";
}

export interface ImageUrlOptions {
  width?: number;
  quality?: number;
  format?: string;
}

export function getOptimizedImageUrl<T>(originalUrl: T, options: ImageUrlOptions = {}): T | string {
  if (!originalUrl || typeof originalUrl !== 'string') {
    return originalUrl;
  }

  const baseStorageUrl = 'https://storage.googleapis.com/uesquizmaker-api.appspot.com';
  
  if (!originalUrl.startsWith(baseStorageUrl)) {
    return originalUrl;
  }

  const imagePath = originalUrl.replace(baseStorageUrl, '');
  
  const {
    width = 200,
    quality = 85,
    format = 'png',
  } = options;

  const imageServiceBaseUrl = 'https://quizmaker-api.onrender.com/api/v0.0.1/image/serve';
  const apiKey = 'I443S4F1R453J4ST6DF3JA4RIC4RE2LKSTS56';
  
  return `${imageServiceBaseUrl}${imagePath}?w=${width}&q=${quality}&f=${format}&key=${apiKey}`;
}

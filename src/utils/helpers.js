import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import * as SecureStore from 'expo-secure-store';

export const BIOMETRIC_KEY = "biometric_auth_enabled";
export const MICROPHONE_KEY = "microphone_permission_enabled";
export const USER_CREDENTIALS_KEY = "user_credentials";
export const BIOMETRIC_PROMPT_SHOWN_KEY = "biometric_prompt_shown";

export async function getBiometricEnabled() {
  const enabled = await AsyncStorage.getItem(BIOMETRIC_KEY);
  return enabled === "true" || enabled === true;
}

export async function setBiometricEnabled(enabled) {
  await AsyncStorage.setItem(BIOMETRIC_KEY, String(enabled));
}

export async function getMicrophoneEnabled() {
  const { status } = await getRecordingPermissionsAsync();
  return status === "granted";
}

export async function requestMicrophonePermission() {
  const { status } = await requestRecordingPermissionsAsync();
  return status === "granted";
}

// HTML ve özel karakter temizleyici yardımcı fonksiyon
export function cleanHtmlAndBreaks(str) {
  if (!str) return "";
  return str
    .replace(/&nbsp;/g, " ") // &nbsp; karakterlerini boşluğa çevir
    .replace(/<br\s*\/?>(\r|\n)?/gi, " ") // <br>, <br/>, <br /> ve hemen ardından gelen satır sonlarını sil
    .replace(/[\r\n]/g, " ") // Kalan \r ve \n karakterlerini boşluğa çevir
    .replace(/<[^>]+>/g, "") // Diğer tüm html taglerini sil
    .replace(/\s+/g, " ") // Birden fazla boşluğu tek boşluğa indir
    .trim();
}

// Tüm uygulama verilerini tamamen temizler. Hiçbir anahtar saklanmaz.
export async function clearAllAppData() {
  try {
    // AsyncStorage'ı temizle
    await AsyncStorage.clear();
    
    // SecureStore'daki tüm anahtarları temizle
    // SecureStore.clear() yok, bu yüzden bilinen anahtarları tek tek silelim
    try {
      await SecureStore.deleteItemAsync('accessToken');
    } catch (e) {
      // Anahtar yoksa hata vermez, devam et
    }
    
    // Diğer olası SecureStore anahtarlarını da temizle
    const possibleKeys = ['refreshToken', 'userCredentials', 'biometricToken'];
    for (const key of possibleKeys) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        // Anahtar yoksa hata vermez, devam et
      }
    }
  } catch (error) {
    console.error('clearAllAppData error:', error);
    // Hata olsa bile AsyncStorage.clear() çalışmış olabilir, devam et
  }
}

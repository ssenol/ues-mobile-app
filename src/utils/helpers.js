import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as Permissions from "expo-permissions";
import { Audio } from 'expo-av';

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
  const { status } = await Audio.getPermissionsAsync();
  return status === "granted";
}

export async function requestMicrophonePermission() {
  const { status } = await Audio.requestPermissionsAsync();
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
  await AsyncStorage.clear();
}

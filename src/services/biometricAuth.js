import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';
const USER_CREDENTIALS_KEY = 'user_credentials';

class BiometricAuthService {
  // Cihazın biyometrik kimlik doğrulamayı destekleyip desteklemediğini kontrol eder
  async isBiometricAvailable() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return {
        available: false,
        error: 'Bu cihaz biyometrik kimlik doğrulamayı desteklemiyor.'
      };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return {
        available: false,
        error: 'Cihazınızda kayıtlı biyometrik veri bulunmuyor.'
      };
    }

    return { available: true, error: null };
  }

  // Cihaz tipine göre uygun biyometrik kimlik doğrulama yöntemini döndürür
  async getBiometricType() {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    if (Platform.OS === 'ios') {
      // FaceID için
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      // TouchID için
      else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Touch ID';
      }
    } else if (Platform.OS === 'android') {
      // Android için daha açıklayıcı tip
      if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) &&
        !types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ) {
        return 'Parmak İzi';
      }
      if (
        types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) &&
        !types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
      ) {
        return 'Yüz Tanıma';
      }
      if (
        types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT) &&
        types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ) {
        // Her ikisi de destekleniyorsa genel ifade
        return 'Biyometrik Kimlik Doğrulama';
      }
    }
    
    return 'Biyometrik Kimlik Doğrulama';
  }

  // Kimlik bilgilerini yerel depolamaya kaydeder
  async saveCredentials(username, password) {
    const credentials = JSON.stringify({ username, password });
    await AsyncStorage.setItem(USER_CREDENTIALS_KEY, credentials);
  }

  // Biyometrik kimlik doğrulama tercihini kaydeder
  async setBiometricEnabled(enabled) {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
  }

  // Biyometrik kimlik doğrulama tercihini kontrol eder
  async isBiometricEnabled() {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === 'true' || JSON.parse(value || 'false');
  }

  // Kimlik bilgilerini yerel depolamadan alır
  async getCredentials() {
    const credentials = await AsyncStorage.getItem(USER_CREDENTIALS_KEY);
    if (credentials) {
      return JSON.parse(credentials);
    }
    return null;
  }

  // Biyometrik kimlik doğrulama işlemini gerçekleştirir
  async authenticate() {
    const biometricType = await this.getBiometricType();
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `${biometricType} ile Giriş Yap`,
      cancelLabel: 'İptal',
      disableDeviceFallback: false,
    });

    if (result.success) {
      const credentials = await this.getCredentials();
      return credentials;
    }
    
    return null;
  }
}

export default new BiometricAuthService();

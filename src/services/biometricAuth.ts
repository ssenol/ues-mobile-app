import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';

// Kimlik bilgileri SecureStore'da (iOS Keychain / Android Keystore) tutulur. Eski sürümler aynı
// anahtarlarla AsyncStorage'a düz metin yazıyordu; bunlar ensureCredentialStorageReady ile taşınır.
// Biyometrik giriş için saklanan bilgiler
const USER_CREDENTIALS_KEY = 'user_credentials';
// Son başarılı girişin bilgileri; biyometrik giriş sonradan Profil'den açılınca kullanılır
const LAST_LOGIN_CREDENTIALS_KEY = 'last_login_credentials';
const CREDENTIAL_KEYS = [USER_CREDENTIALS_KEY, LAST_LOGIN_CREDENTIALS_KEY];

// AsyncStorage'da tutulan kurulum işareti. iOS Keychain uygulama silinince temizlenmediği için,
// işaret yoksa (ilk açılış / yeniden kurulum) Keychain'de önceki kurulumdan kalan bilgiler silinir.
const SECURE_STORAGE_READY_KEY = 'secure_credentials_ready';

let storageReadyPromise: Promise<void> | null = null;

async function migrateCredentialStorage(): Promise<void> {
  try {
    const isReady = await AsyncStorage.getItem(SECURE_STORAGE_READY_KEY);

    if (!isReady) {
      const legacyEntries = (await AsyncStorage.multiGet(CREDENTIAL_KEYS)).filter(([, value]) => !!value);

      if (legacyEntries.length === 0) {
        // Temiz kurulum veya yeniden kurulum: önceki kurulumdan Keychain'de kalanı sil
        for (const key of CREDENTIAL_KEYS) {
          await SecureStore.deleteItemAsync(key);
        }
      } else {
        // Eski sürümden güncelleme: düz metin kayıtları SecureStore'a kopyala
        for (const [key, value] of legacyEntries) {
          await SecureStore.setItemAsync(key, value as string);
        }
      }

      // İşaret, düz metin kayıtlar silinmeden ÖNCE yazılır: aradaki bir kesinti bir sonraki açılışı
      // "temiz kurulum" sanıp SecureStore'a kopyalanmış kayıtları sildirmesin
      await AsyncStorage.setItem(SECURE_STORAGE_READY_KEY, 'true');
    }

    // Düz metin kayıtları kaldır; her açılışta çalışır, yarıda kalan bir taşımadan artakalanı da temizler
    await AsyncStorage.multiRemove(CREDENTIAL_KEYS);
  } catch (error) {
    // Başarısız adım bir sonraki açılışta tekrar denenir
    console.error('Kimlik bilgisi depolama taşıma hatası:', error);
  }
}

// Uygulama açılışında bir kez çağrılır; kimlik bilgisi okuyan/yazan her metot da bunu bekler
export function ensureCredentialStorageReady(): Promise<void> {
  if (!storageReadyPromise) {
    storageReadyPromise = migrateCredentialStorage();
  }
  return storageReadyPromise;
}

async function readCredentials(key: string): Promise<StoredCredentials | null> {
  await ensureCredentialStorageReady();
  const value = await SecureStore.getItemAsync(key);
  return value ? (JSON.parse(value) as StoredCredentials) : null;
}

async function writeCredentials(key: string, username: string, password: string): Promise<void> {
  await ensureCredentialStorageReady();
  await SecureStore.setItemAsync(key, JSON.stringify({ username, password }));
}

export interface BiometricAvailability {
  available: boolean;
  error: string | null;
}

export interface StoredCredentials {
  username: string;
  password: string;
}

class BiometricAuthService {
  // Cihazın biyometrik kimlik doğrulamayı destekleyip desteklemediğini kontrol eder
  async isBiometricAvailable(): Promise<BiometricAvailability> {
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
  async getBiometricType(): Promise<string> {
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

  // Biyometrik giriş için kimlik bilgilerini SecureStore'a kaydeder
  async saveCredentials(username: string, password: string): Promise<void> {
    await writeCredentials(USER_CREDENTIALS_KEY, username, password);
  }

  // Son başarılı girişin bilgilerini SecureStore'a kaydeder (Profil'den biyometrik açılınca kullanılır)
  async saveLastLoginCredentials(username: string, password: string): Promise<void> {
    await writeCredentials(LAST_LOGIN_CREDENTIALS_KEY, username, password);
  }

  async getLastLoginCredentials(): Promise<StoredCredentials | null> {
    return readCredentials(LAST_LOGIN_CREDENTIALS_KEY);
  }

  // Saklanan tüm kimlik bilgilerini siler (uygulama ayarlarını sıfırlama). AsyncStorage.clear()'dan SONRA
  // çağrılmalı: kurulum işaretini yeniden yazar, yoksa sonraki açılış bu oturumda kaydedilenleri siler
  async clearStoredCredentials(): Promise<void> {
    await ensureCredentialStorageReady();
    for (const key of CREDENTIAL_KEYS) {
      await SecureStore.deleteItemAsync(key);
    }
    await AsyncStorage.setItem(SECURE_STORAGE_READY_KEY, 'true');
  }

  // SSO linkiyle giriş yapan öğrenci, kayıtlı kimlik bilgilerinin sahibi değilse kayıtlar silinir ve
  // biyometrik kapatılır: yoksa çıkıştan sonra Face ID önceki öğrencinin hesabını açardı (Profil'den
  // biyometrik açmak da son girişin bilgilerini kullanıyor). Aynı öğrenciyse (ya da kayıt yoksa) dokunulmaz.
  async clearCredentialsIfOtherUser(username: string | undefined): Promise<void> {
    const stored = await Promise.all(CREDENTIAL_KEYS.map(readCredentials));
    const owners = stored.filter((c): c is StoredCredentials => !!c).map((c) => c.username.trim().toLowerCase());
    if (owners.length === 0) return;
    if (username && owners.every((owner) => owner === username.trim().toLowerCase())) return;
    await this.clearStoredCredentials();
    await this.setBiometricEnabled(false);
  }

  // Biyometrik kimlik doğrulama tercihini kaydeder
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
  }

  // Biyometrik kimlik doğrulama tercihini kontrol eder
  async isBiometricEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return value === 'true' || JSON.parse(value || 'false');
  }

  // Biyometrik giriş için saklanan kimlik bilgilerini SecureStore'dan alır
  async getCredentials(): Promise<StoredCredentials | null> {
    return readCredentials(USER_CREDENTIALS_KEY);
  }

  // Biyometrik kimlik doğrulama işlemini gerçekleştirir
  async authenticate(): Promise<StoredCredentials | null> {
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

import Constants from 'expo-constants';

// Geliştirici araçları (Profil'de "Reset App Settings", Completed'da görev silme) yalnızca
// Metro'ya bağlı debug build'de veya APP_VARIANT=development ile alınan dev build'de görünür.
// Store'a giden production build'de ikisi de false olduğu için gizlenir.
export const IS_DEV_MODE: boolean =
  __DEV__ || Constants.expoConfig?.extra?.appVariant === 'development';

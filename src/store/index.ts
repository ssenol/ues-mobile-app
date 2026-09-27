import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, PersistConfig } from 'redux-persist';
import authReducer, { AuthState } from './slices/authSlice';
import assignmentReducer, { AssignmentState } from './slices/assignmentSlice';
import settingsReducer, { SettingsState } from './slices/settingsSlice';
import secureAuthStorage from './secureAuthStorage';

// Token'lar SecureStore'da, kalan alanlar AsyncStorage'da (bkz. secureAuthStorage.ts)
const authPersistConfig: PersistConfig<AuthState> = {
  key: 'auth',
  storage: secureAuthStorage,
  whitelist: ['accessToken', 'currentUser', 'refreshToken', 'isAuthenticated', 'tokenAcquiredAt']
};

const assignmentPersistConfig: PersistConfig<AssignmentState> = {
  key: 'assignment',
  storage: AsyncStorage,
  whitelist: ['cachedAssignments', 'cacheTimestamp', 'totalAssignments', 'completedAssignments']
};

const settingsPersistConfig: PersistConfig<SettingsState> = {
  key: 'settings',
  storage: AsyncStorage,
  whitelist: ['ttsSpeed']
};

const rootReducer = {
  auth: persistReducer(authPersistConfig, authReducer),
  assignment: persistReducer(assignmentPersistConfig, assignmentReducer),
  settings: persistReducer(settingsPersistConfig, settingsReducer)
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

// Kaldırılan speakSlice'ın eski sürümlerden kalan persist kaydı (redux-persist bilinmeyen anahtarı kendisi silmez)
AsyncStorage.removeItem('persist:speak').catch(() => {});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
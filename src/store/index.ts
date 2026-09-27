import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore, PersistConfig } from 'redux-persist';
import authReducer, { AuthState } from './slices/authSlice';
import speakReducer, { SpeakState } from './slices/speakSlice';
import assignmentReducer, { AssignmentState } from './slices/assignmentSlice';
import settingsReducer, { SettingsState } from './slices/settingsSlice';

const authPersistConfig: PersistConfig<AuthState> = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['accessToken', 'currentUser', 'refreshToken', 'isAuthenticated', 'tokenAcquiredAt']
};

const speakPersistConfig: PersistConfig<SpeakState> = {
  key: 'speak',
  storage: AsyncStorage,
  whitelist: ['speakResults', 'currentAssignment']
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
  speak: persistReducer(speakPersistConfig, speakReducer),
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
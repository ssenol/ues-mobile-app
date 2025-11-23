import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import authReducer from './slices/authSlice';
import speakReducer from './slices/speakSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['accessToken', 'currentUser', 'refreshToken', 'isAuthenticated', 'tokenAcquiredAt']
};

const speakPersistConfig = {
  key: 'speak',
  storage: AsyncStorage,
  whitelist: ['speakResults', 'currentAssignment']
};

const rootReducer = {
  auth: persistReducer(authPersistConfig, authReducer),
  speak: persistReducer(speakPersistConfig, speakReducer)
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
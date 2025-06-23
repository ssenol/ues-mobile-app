import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import speakReducer from './slices/speakSlice';
import writingReducer from './slices/writingSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['accessToken', 'currentUser', 'refreshToken', 'isAuthenticated']
};

const speakPersistConfig = {
  key: 'speak',
  storage: AsyncStorage,
  whitelist: ['speakResults', 'currentQuiz']
};

const writingPersistConfig = {
  key: 'writing',
  storage: AsyncStorage,
  whitelist: ['assignedQuizzes', 'totalCount']
};

const rootReducer = {
  auth: persistReducer(authPersistConfig, authReducer),
  speak: persistReducer(speakPersistConfig, speakReducer),
  writing: persistReducer(writingPersistConfig, writingReducer)
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
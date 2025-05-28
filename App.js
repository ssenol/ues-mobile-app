import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/index';
import AppContent from './src/AppContent';

// Debug için
// if (__DEV__) {
//   console.log('Initial state:', store.getState());
//   console.log('User:', store.getState().auth.user);
//   console.log('Auth state:', store.getState().auth.isAuthenticated);
//   console.log('Token var mı:', !!store.getState().auth.accessToken);
// }

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import authService, { NotStudentError } from '../services/auth';
import { subscribeDeepLinkToken } from '../services/deepLinkToken';
import BiometricAuthService from '../services/biometricAuth';
import { setCredentials } from '../store/slices/authSlice';
import { clearAssignmentState } from '../store/slices/assignmentSlice';
import { useAppDispatch } from '../store/hooks';
import { useTheme } from '../theme/ThemeContext';

// Web'den SSO token'ıyla gelindiğinde girişi yapar. PersistGate içinde render edilmeli: rehydrate
// sonradan gelirse eski oturum yeni oturumun üzerine yazılırdı.
// Açık bir oturum varsa yalnızca giriş başarılı olunca linkle gelen öğrenciye geçilir; hata olursa
// mevcut oturum olduğu gibi kalır.
export default function DeepLinkLoginHandler() {
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    return subscribeDeepLinkToken(async (ssoToken) => {
      setIsLoggingIn(true);
      try {
        const response = await authService.loginWithSsoToken(ssoToken);
        // Önceki kullanıcının görev cache'i yeni öğrenciye görünmesin
        dispatch(clearAssignmentState());
        dispatch(
          setCredentials({
            token: response.token,
            user: response.user,
            refreshToken: response.refreshToken,
            tokenAcquiredAt: Date.now(),
          })
        );
        // Başka öğrenciye geçildiyse önceki öğrencinin Face ID kaydı kalmasın
        await BiometricAuthService.clearCredentialsIfOtherUser(response.user?.username);
      } catch (error) {
        Alert.alert(
          'Error',
          error instanceof NotStudentError
            ? error.message
            : 'Automatic sign-in failed. Please open the app again from your school platform or sign in manually.'
        );
      } finally {
        setIsLoggingIn(false);
      }
    });
  }, [dispatch]);

  if (!isLoggingIn) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="auto">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
});

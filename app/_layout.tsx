import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from '@/src/theme/ThemeContext';
import { persistor, store } from '@/src/store';

// Splash screen'i font yüklenene kadar göster
// Native splash o view controller için henüz kayıtlı değilse (dev client'ın kendi splash
// döngüsüyle çakışma) reddedebilir — bu zararsız, sadece unhandled rejection'ı önlüyoruz
SplashScreen.preventAutoHideAsync().catch(() => {});

// Android'de manifest portre kilitli (telefonlar açılışta yan dönmesin diye). Tablette kilit açılır:
// Android'in büyük ekran tanımı en kısa kenarın 600dp ve üzeri olması. Cihaz sınıfı sabit olduğu için
// pencere değil ekran boyutu kullanılır. iOS'ta gerek yok, iPad yönleri Info.plist'ten gelir.
const ANDROID_TABLET_MIN_WIDTH_DP = 600;
if (Platform.OS === 'android') {
  const { width, height } = Dimensions.get('screen');
  if (Math.min(width, height) >= ANDROID_TABLET_MIN_WIDTH_DP) {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT).catch(() => {});
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Font'lar yüklendikten sonra splash screen'i gizle
      setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.error('SplashScreen hide error:', error);
        }
      }, 300);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <SafeAreaProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </SafeAreaProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

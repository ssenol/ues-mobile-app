import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { Slot } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { ActivityIndicator, Dimensions, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import ThemedIcon from './src/components/ThemedIcon';
import { ThemedText } from './src/components/ThemedText';
import { useTheme } from './src/theme/ThemeContext';

// Splash screen kapanmadan font yüklemesini bekleyelim
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function lockOrientation() {
      try {
        // Portrait moduna kilitle
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } catch (error) {
        console.error('Orientation lock error:', error);
      }
    }

    // Orientation değişikliklerini dinle ve her zaman portrait'e geri döndür
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      const currentOrientation = event.orientationInfo.orientation;
      // Eğer landscape moduna geçildiyse, portrait'e geri döndür
      if (
        currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        currentOrientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      ) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    });

    lockOrientation();

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      // Kısa bir gecikme ile splash screen'i kapat
      const timer = setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
          setIsReady(true);
        } catch (error) {
          console.error('SplashScreen hide error:', error);
          setIsReady(true);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded || !isReady) {
    return null;
  }

  // PersistGate loading component
  const PersistGateLoading = () => {
    return null; // Splash screen zaten gösteriliyor
  };

  return <Slot />;
}
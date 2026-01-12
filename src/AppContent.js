import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import AppNavigator from './navigation/AppNavigator';
import { useTheme } from './theme/ThemeContext';
import { ThemedText } from './components/ThemedText';
import ThemedIcon from './components/ThemedIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AppContent() {
  const { colors, fonts, shadows } = useTheme();
  const [isConnected, setIsConnected] = useState(true);
  const [isNetInfoReady, setIsNetInfoReady] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const user = useSelector((state) => state.auth.user);

  const { height: windowHeight } = Dimensions.get('window');
  const topBottomGap = windowHeight * 0.175;
  const insets = useSafeAreaInsets();
  const retryButtonPaddingBottom = insets.bottom > 0 ? insets.bottom : 36;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        offlineContainer: {
          flex: 1,
          backgroundColor: '#fff',
          position: 'relative',
        },
        backgroundImage: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 284,
          width: '100%',
          zIndex: 0,
        },
        cardWrapper: {
          flex: 1,
          marginHorizontal: 16,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1,
        },
        logo: {
          marginBottom: 48,
          alignSelf: 'center',
        },
        card: {
          backgroundColor: colors.white,
          borderRadius: 12,
          paddingVertical: topBottomGap,
          alignItems: 'center',
          gap: 16,
          ...shadows.dark,
          width: '100%',
        },
        cardTitle: {
          fontSize: 22,
          lineHeight: 30,
          color: '#3A3A3A',
        },
        cardSubtitle: {
          fontSize: 14,
          lineHeight: 22,
          color: '#727272',
          textAlign: 'center',
        },
        stickyButtonContainer: {
          paddingHorizontal: 24,
          paddingBottom: retryButtonPaddingBottom,
          backgroundColor: 'transparent',
          zIndex: 2,
        },
        retryButton: {
          backgroundColor: colors.primary,
          paddingVertical: 12,
          borderRadius: 32,
          alignItems: 'center',
        },
        retryButtonText: {
          color: colors.white,
          fontSize: 16,
          fontFamily: fonts.bold,
        },
      }),
    [colors, fonts, shadows, retryButtonPaddingBottom]
  );

  // Debug için ayrı useEffect
  useEffect(() => {
    // console.log('İnternet Bağlantısı:', isConnected);
    // console.log('Kullanıcı Durumu:', user);
  }, [isConnected, user]);

  // NetInfo listener için ayrı useEffect
  useEffect(() => {
    // Timeout ile NetInfo'nun çok uzun sürmesini engelle
    const timeout = setTimeout(() => {
      setIsNetInfoReady(true);
    }, 1000); // 1 saniye sonra hazır kabul et

    // İlk bağlantı durumunu kontrol et
    NetInfo.fetch()
      .then((state) => {
        setIsConnected(state.isConnected);
        setIsNetInfoReady(true);
        clearTimeout(timeout);
      })
      .catch((error) => {
        console.error('NetInfo fetch error:', error);
        setIsNetInfoReady(true);
        clearTimeout(timeout);
      });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      setIsNetInfoReady(true);
      clearTimeout(timeout);
      // console.log('Bağlantı Durumu Değişti:', state.isConnected);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []); // Boş dependency array ile sadece component mount olduğunda çalışır

  // NetInfo hazır olana kadar bekle (max 1 saniye)
  if (!isNetInfoReady) {
    return null;
  }

  const handleRetry = () => {
    setIsRetrying(true);
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
      setIsRetrying(false);
    });
  };

  if (!isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Image
          pointerEvents="none"
          source={require('../assets/images/screenHeader.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        <View style={styles.cardWrapper}>
          <ThemedIcon
            iconName="myeduquiz"
            style={styles.logo}
            width={181}
            height={31}
            tintColor="#fff"
          />
          <View style={styles.card}>
            <ThemedIcon iconName="wifi" size={72} tintColor={colors.primary} />
            <ThemedText weight="semiBold" style={styles.cardTitle}>
              No Connection
            </ThemedText>
            <ThemedText style={styles.cardSubtitle}>
              Please check your internet connection {'\n'} and try again.
            </ThemedText>
          </View>
        </View>

        <View style={styles.stickyButtonContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleRetry}
            style={styles.retryButton}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <ThemedText weight="bold" style={styles.retryButtonText}>
                Try Again
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <AppNavigator />;
}

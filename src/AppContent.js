import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import AppNavigator from './navigation/AppNavigator';
import { useTheme } from './theme/ThemeContext';

export default function AppContent() {
  const { colors } = useTheme();
  const [isConnected, setIsConnected] = useState(true);
  const [isNetInfoReady, setIsNetInfoReady] = useState(false);
  const user = useSelector((state) => state.auth.user);

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

  if (!isConnected) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.primary, fontSize: 16, textAlign: 'center' }}>
          İnternet bağlantısı bulunamadı.{'\n'}{'\n'}
          Lütfen bağlantınızı kontrol edin.
        </Text>
      </View>
    );
  }

  return <AppNavigator />;
}

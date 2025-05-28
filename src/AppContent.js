import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import AppNavigator from './navigation/AppNavigator';
import colors from './styles/colors';

export default function AppContent() {
  const [isConnected, setIsConnected] = useState(true);
  const user = useSelector((state) => state.auth.user);

  // Debug için ayrı useEffect
  useEffect(() => {
    // console.log('İnternet Bağlantısı:', isConnected);
    // console.log('Kullanıcı Durumu:', user);
  }, [isConnected, user]);

  // NetInfo listener için ayrı useEffect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      // console.log('Bağlantı Durumu Değişti:', state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []); // Boş dependency array ile sadece component mount olduğunda çalışır

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

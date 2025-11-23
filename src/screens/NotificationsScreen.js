import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  View
} from "react-native";
import NotificationModal from "../components/NotificationModal";

export default function NotificationsScreen({ navigation }) {
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);

  // Ekrana her focus olduğunda modal'ı aç
  useFocusEffect(
    useCallback(() => {
      setNotificationModalVisible(true);
      return () => {
        // Cleanup - ekrandan çıkarken modal'ı kapat
        setNotificationModalVisible(false);
      };
    }, [])
  );

  const handleClose = () => {
    setNotificationModalVisible(false);
    // Modal kapandığında HomeScreen'e dön
    navigation.navigate('HomeScreen');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F3F4FF',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      
      <NotificationModal
        visible={notificationModalVisible}
        onClose={handleClose}
      />
    </View>
  );
}

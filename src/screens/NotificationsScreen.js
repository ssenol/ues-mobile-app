import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import NotificationModal from "../components/NotificationModal";

export default function NotificationsScreen() {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
      return () => {};
    }, [])
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <NotificationModal
        mode="screen"
      />
    </View>
  );
}

import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import NotificationModal from "../components/NotificationModal";

export default function NotificationsScreen() {
  const [resetScrollSignal, setResetScrollSignal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
      setResetScrollSignal((prev) => prev + 1);
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
        resetScrollSignal={resetScrollSignal}
      />
    </View>
  );
}

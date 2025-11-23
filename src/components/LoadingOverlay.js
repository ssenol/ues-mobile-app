import React from 'react';
// import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { Image, Modal, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';

export default function LoadingOverlay({ visible, message }) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* <ActivityIndicator size="large" color="#fff" /> */}
          <Image
            source={require('../../assets/images/loading.gif')}
            style={styles.loadingGif}
            resizeMode="contain"
          />
          {message && (
            <ThemedText style={styles.message}>{message}</ThemedText>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(58, 78, 240, 0.7)', // Şeffaf mavi arka plan
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  loadingGif: {
    width: 115,
    height: 80,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
});


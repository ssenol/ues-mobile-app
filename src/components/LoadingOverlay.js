import React, { useRef, useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { ThemedText } from './ThemedText';

export default function LoadingOverlay({ visible, message }) {
  const animationRef = useRef(null);

  useEffect(() => {
    if (visible && animationRef.current) {
      animationRef.current.play();
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LottieView
            ref={animationRef}
            source={require('../../assets/animations/Logo_Animation.json')}
            autoPlay
            loop
            style={styles.lottieAnimation}
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
  lottieAnimation: {
    width: 60,
    height: 60,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
});


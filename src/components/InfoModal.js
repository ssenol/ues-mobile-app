import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function InfoModal({ 
  visible = false, 
  onClose = () => {}, 
  title = '',
  children,
  height = SCREEN_HEIGHT * 0.85,
  primaryButton = null,
  secondaryButton = null,
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

  // PanResponder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Grant the responder
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0 && !isClosing.current) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isClosing.current) return;
        
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // If swiped down more than 100px or fast swipe, close modal
          isClosing.current = true;
          onClose();
          
          // Reset animation after a short delay
          setTimeout(() => {
            translateY.setValue(0);
            isClosing.current = false;
          }, 300);
        } else {
          // Otherwise, bounce back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  const styles = StyleSheet.create({
    modalContent: {
      height: height,
      backgroundColor: '#fff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      flexDirection: 'column',
      overflow: 'hidden',
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: '#E5E5E5',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4FF',
    },
    headerTitle: {
      fontSize: 18,
      lineHeight: 24,
      color: '#3A3A3A',
      textAlign: 'center',
      marginTop: 16,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: '#fff',
    },
    buttonContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
      backgroundColor: '#fff',
      gap: 12,
    },
    primaryButton: {
      paddingVertical: 16,
      backgroundColor: '#3E4EF0',
      borderRadius: 32,
      alignItems: 'center',
    },
    primaryButtonText: {
      fontSize: 16,
      lineHeight: 22,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    secondaryButton: {
      paddingVertical: 16,
      backgroundColor: 'transparent',
      borderRadius: 16,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      lineHeight: 22,
      color: '#3E4EF0',
      fontWeight: '600',
    },
  });

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={{ margin: 0, justifyContent: 'flex-end' }}
      backdropColor="#3E4EF0"
      backdropOpacity={0.85}
      useNativeDriverForBackdrop
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <Animated.View 
        style={[
          styles.modalContent,
          {
            transform: [{ translateY: translateY }]
          }
        ]}
      >
        <View style={{ paddingTop: 0 }} {...panResponder.panHandlers}>
          <View style={styles.handleBar} />
        </View>
        
        {title && (
          <View style={styles.headerContainer} {...panResponder.panHandlers}>
            <ThemedText weight="bold" style={styles.headerTitle}>
              {title}
            </ThemedText>
          </View>
        )}
        
        <View style={styles.contentContainer}>
          {children}
        </View>
        
        {(primaryButton || secondaryButton) && (
          <View style={styles.buttonContainer}>
            {primaryButton && (
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={primaryButton.onPress}
                activeOpacity={0.8}
              >
                <ThemedText weight="bold" style={styles.primaryButtonText}>
                  {primaryButton.text}
                </ThemedText>
              </TouchableOpacity>
            )}
            
            {secondaryButton && (
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={secondaryButton.onPress}
                activeOpacity={0.7}
              >
                <ThemedText weight="semibold" style={styles.secondaryButtonText}>
                  {secondaryButton.text}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

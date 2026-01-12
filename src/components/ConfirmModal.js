import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import ThemedIcon from './ThemedIcon';
import { ThemedText } from './ThemedText';

export default function ConfirmModal({ 
  visible = false, 
  onClose = () => {},
  onConfirm = null,
  iconName = "logout",
  title = "Confirm",
  description = "Are you sure?",
  confirmText = "Yes, I want",
  cancelText = "No, Thanks",
  confirmButtonColor = "#3E4EF0",
  singleButton = false,
}) {
  const styles = StyleSheet.create({
    modal: {
      margin: 0,
      justifyContent: 'flex-end',
      alignItems: 'stretch',
    },
    modalContent: {
      backgroundColor: '#fff',
      alignItems: 'center',
      borderRadius: 12,
      padding: 24,
      marginHorizontal: 16,
      marginBottom: 36,
    },
    iconContainer: {
      backgroundColor: '#F3F4FF',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      lineHeight: 26,
      color: '#3A3A3A',
      textAlign: 'center',
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: '#3A3A3A',
      textAlign: 'center',
      marginBottom: 32,
    },
    confirmButton: {
      borderRadius: 32,
      paddingVertical: 12,
      paddingHorizontal: 32,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginBottom: singleButton ? 0 : 24,
    },
    confirmText: {
      fontSize: 16,
      lineHeight: 24,
      color: '#fff',
    },
    cancelText: {
      fontSize: 16,
      lineHeight: 24,
      color: '#3E4EF0',
    },
  });

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      backdropColor="#3E4EF0"
      backdropOpacity={0.85}
      useNativeDriverForBackdrop
      useNativeDriver
      hideModalContentWhileAnimating
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modal}
    >
      <View style={styles.modalContent}>
        <View style={styles.iconContainer}>
          <ThemedIcon iconName={iconName} size={56} tintColor="#3E4EF0" />
        </View>
        <ThemedText weight="bold" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText style={styles.description}>
          {description}
        </ThemedText>

        {singleButton ? (
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <ThemedText weight="bold" style={styles.confirmText}>
              {confirmText}
            </ThemedText>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}
              activeOpacity={0.85}
              onPress={onConfirm}
            >
              <ThemedText weight="bold" style={styles.confirmText}>
                {confirmText}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onClose}
            >
              <ThemedText weight="bold" style={styles.cancelText}>{cancelText}</ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

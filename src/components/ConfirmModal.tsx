import React from 'react';
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';
import ThemedIcon from './ThemedIcon';
import { ThemedText } from './ThemedText';
import type { IconName } from '../constants/iconMap';
import { theme } from '../theme/ThemeContext';

export interface ConfirmModalAction {
  text: string;
  onPress: () => void;
  color?: string;
}

interface ConfirmModalProps {
  visible?: boolean;
  onClose?: () => void;
  onConfirm?: (() => void) | null;
  onCancel?: (() => void) | null;
  iconName?: IconName;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  singleButton?: boolean;
  actions?: ConfirmModalAction[] | null;
}

export default function ConfirmModal({ 
  visible = false, 
  onClose = () => {},
  onConfirm = null,
  onCancel = null,
  iconName = "logout",
  title = "Confirm",
  description = "Are you sure?",
  confirmText = "Yes, I want",
  cancelText = "No, Thanks",
  confirmButtonColor = "#3E4EF0",
  singleButton = false,
  actions = null,
}: ConfirmModalProps) {
  const styles = StyleSheet.create({
    modal: {
      margin: 0,
      justifyContent: 'flex-end',
      alignItems: 'stretch',
    },
    contentWrap: {
      width: '100%',
      maxWidth: theme.layout.maxActionWidth,
      alignSelf: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#fff',
      alignItems: 'center',
      borderRadius: 12,
      padding: 24,
      marginHorizontal: 16,
      marginBottom: Platform.OS === "ios" ? 32 : 16,
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
      maxWidth: '100%',
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
        <View style={styles.contentWrap}>
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
        ) : actions && Array.isArray(actions) ? (
          <>
            {actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.confirmButton, { backgroundColor: action.color || confirmButtonColor }]}
                activeOpacity={0.85}
                onPress={action.onPress}
              >
                <ThemedText weight="bold" style={styles.confirmText}>
                  {action.text}
                </ThemedText>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onCancel || onClose}
            >
              <ThemedText weight="bold" style={styles.cancelText}>{cancelText}</ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: confirmButtonColor }]}
              activeOpacity={0.85}
              onPress={onConfirm ?? undefined}
            >
              <ThemedText weight="bold" style={styles.confirmText}>
                {confirmText}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onCancel || onClose}
            >
              <ThemedText weight="bold" style={styles.cancelText}>{cancelText}</ThemedText>
            </TouchableOpacity>
          </>
        )}
        </View>
      </View>
    </Modal>
  );
}

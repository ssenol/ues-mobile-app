import React from "react";
import { TouchableOpacity, View, Text, StyleSheet, Platform } from "react-native";
import colors from "../styles/colors";
import Icon from './Icon';

export default function MenuButton({
  title,
  subtitle,
  onPress,
  disabled,
  iconIos,
  iconAndroid,
}) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.buttonContent}>
        {(iconIos || iconAndroid) && (
          <Icon
            iosName={iconIos}
            androidName={iconAndroid}
            size={28}
            style={styles.icon}
          />
        )}
        <View>
          <Text style={styles.buttonTitle}>{title}</Text>
          <Text style={styles.buttonSubtitle}>{subtitle}</Text>
        </View>
        <Icon
          iosName="chevron.forward"
          androidName="arrow-forward-ios"
          size={24}
          style={styles.arrowIcon}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  buttonTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  buttonSubtitle: {
    color: colors.white,
    fontSize: 12,
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    tintColor: colors.white,
    color: colors.white,
  },
  arrowIcon: {
    tintColor: colors.white,
    color: colors.white,
    marginLeft: "auto",
  },
});

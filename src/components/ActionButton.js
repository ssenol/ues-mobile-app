import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import colors from "../styles/colors";
import Icon from "./Icon";

export default function ActionButton({
  title,
  onPress,
  variant = "primary", // primary, secondary, tertiary
  width = "100%",
  iconIos,
  iconAndroid,
  loading = false,
  iconLeft = false,
}) {
  const buttonStyle = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    tertiary: {
      backgroundColor: "",
      borderWidth: 1,
      borderColor: colors.white,
    },
    danger: { backgroundColor: colors.danger },
  };

  const textStyle = {
    primary: { color: colors.white },
    secondary: { color: colors.white },
    tertiary: { color: colors.white, fontWeight: "normal" },
    danger: { color: colors.white },
  };

  const iconStyle = {
    primary: { tintColor: colors.white, color: colors.white },
    secondary: { tintColor: colors.white, color: colors.white },
    tertiary: { tintColor: colors.white, color: colors.white },
    danger: { tintColor: colors.white, color: colors.white },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle[variant],
        { width },
        loading && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : iconLeft ? (
          <>
            {(iconIos || iconAndroid) && (
              <Icon
                iosName={iconIos}
                androidName={iconAndroid}
                size={Platform.OS === "ios" ? 18 : 20}
                style={[styles.icon, iconStyle[variant]]}
              />
            )}
            <Text style={[styles.buttonText, textStyle[variant]]}>{title}</Text>
          </>
        ) : (
          <>
            <Text style={[styles.buttonText, textStyle[variant]]}>{title}</Text>
            {(iconIos || iconAndroid) && (
              <Icon
                iosName={iconIos}
                androidName={iconAndroid}
                size={Platform.OS === "ios" ? 18 : 20}
                style={[styles.icon, iconStyle[variant]]}
              />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 6,
    alignSelf: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  icon: {
    marginLeft: 6,
  },
});

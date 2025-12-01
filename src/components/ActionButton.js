import React from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  // ActivityIndicator,
} from "react-native";
import ThemedIcon from "./ThemedIcon";
import {ThemedText} from "./ThemedText";
import {useTheme} from "../theme/ThemeContext";

export default function ActionButton({
  title,
  onPress,
  variant = "primary", // primary, secondary, tertiary
  width = "100%",
  iconName,
  iconSize,
  loading = false,
  iconLeft = false,
  style,
}) {
  const { colors } = useTheme();
  const buttonStyle = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.secondary },
    tertiary: {
      backgroundColor: "t",
      borderWidth: 1,
      borderColor: colors.white,
    },
    outline: {
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: colors.border,
    },
    danger: { backgroundColor: colors.danger },
  };

  const textStyle = {
    primary: { color: colors.white },
    secondary: { color: colors.white },
    tertiary: { color: colors.white, fontWeight: "normal" },
    danger: { color: colors.white },
  };

  const iconTintByVariant = {
    primary: colors.white,
    secondary: colors.white,
    tertiary: colors.white,
    danger: colors.white,
    outline: colors.primary,
  };

  const renderIcon = () => {
    if (!iconName) {
      return null;
    }

    const tintColor = iconTintByVariant[variant];

    return (
      <ThemedIcon
        iconName={iconName}
        size={iconSize}
        tintColor={tintColor}
        style={styles.icon}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle[variant],
        { width },
        loading && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      <View style={styles.buttonContent}>
        {/*{loading ? ( <ActivityIndicator color={colors.white} />) : ""}*/}
        {iconLeft ? (
          <>
            {renderIcon()}
            <ThemedText weight="bold" style={[styles.buttonText, textStyle[variant]]}>{title}</ThemedText>
          </>
        ) : (
          <>
            <ThemedText weight="bold" style={[styles.buttonText, textStyle[variant]]}>{title}</ThemedText>
            {renderIcon()}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 50,
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
    lineHeight: 22
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  icon: {
    marginHorizontal: 4,
  },
});

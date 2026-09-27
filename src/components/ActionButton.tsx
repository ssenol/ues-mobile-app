import React from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  DimensionValue,
  // ActivityIndicator,
} from "react-native";
import ThemedIcon from "./ThemedIcon";
import {ThemedText} from "./ThemedText";
import {useTheme} from "../theme/ThemeContext";
import type { IconName } from "../constants/iconMap";

type ActionButtonVariant = "primary" | "outline";

interface ActionButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ActionButtonVariant;
  width?: DimensionValue;
  iconName?: IconName;
  iconSize?: number;
  loading?: boolean;
  iconLeft?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function ActionButton({
  title,
  onPress,
  variant = "primary", // primary, outline
  width = "100%",
  iconName,
  iconSize,
  loading = false,
  iconLeft = false,
  style,
}: ActionButtonProps) {
  const { colors } = useTheme();
  const buttonStyle: Record<ActionButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    outline: {
      backgroundColor: "white",
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  const textStyle: Partial<Record<ActionButtonVariant, TextStyle>> = {
    primary: { color: colors.white },
  };

  const iconTintByVariant: Record<ActionButtonVariant, string> = {
    primary: colors.white,
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

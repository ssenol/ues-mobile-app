import React from "react";
import {View, TextInput, StyleSheet, TextInputProps} from "react-native";
import ThemedIcon from "./ThemedIcon";
import { Theme, useTheme } from "../theme/ThemeContext";
import type { IconName } from "../constants/iconMap";

interface CustomInputProps
  extends Pick<TextInputProps, "placeholder" | "secureTextEntry" | "value" | "onChangeText" | "autoCapitalize" | "onFocus"> {
  iconName?: IconName;
}

const CustomInput = ({
  iconName,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  autoCapitalize = 'sentences',
  onFocus,
}: CustomInputProps) => {
  const { colors, fonts } = useTheme();
  const styles = makeStyles(colors, fonts);

  const renderIcon = () => {
    if (!iconName) {
      return null;
    }

    return (
      <ThemedIcon
        iconName={iconName}
        size={16}
        tintColor={colors.placeholder}
        style={styles.icon}
      />
    );
  };

  return (
    <View style={styles.inputContainer}>
      {renderIcon()}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        onFocus={onFocus}
      />
    </View>
  );
};

const makeStyles = (colors: Theme['colors'], fonts: Theme['fonts']) =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      // paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 48,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    icon: {
      marginLeft: 20,
      marginRight: 12,
    },
    input: {
      flex: 1,
      backgroundColor: "transparent",
      paddingVertical: 12,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
      fontFamily: fonts.semiBold,
    },
  });

export default CustomInput;
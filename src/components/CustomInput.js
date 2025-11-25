import React from "react";
import {View, TextInput, StyleSheet} from "react-native";
import ThemedIcon from "./ThemedIcon";
import { useTheme } from "../theme/ThemeContext";

const CustomInput = ({
  iconName,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
}) => {
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
      />
    </View>
  );
};

const makeStyles = (colors, fonts) =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    icon: {
      marginHorizontal: 10,
    },
    input: {
      flex: 1,
      backgroundColor: "transparent",
      marginLeft: 8,
      paddingVertical: 12,
      fontSize: 16,
      lineHeight: 22,
      color: colors.text,
      fontFamily: fonts.semiBold,
    },
  });

export default CustomInput;
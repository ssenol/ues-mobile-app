import React from "react";
import { View, TextInput, StyleSheet, Platform } from "react-native";
import colors from "../styles/colors";
import Icon from './Icon';

const CustomInput = ({
  iconIos,
  iconAndroid,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
}) => {
  return (
    <View style={styles.inputContainer}>
      <Icon
        iosName={iconIos}
        androidName={iconAndroid}
        size={Platform.OS === 'ios' ? 18 : 20}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.white,
    borderRadius: 6,
  },
  icon: {
    // width: 16,
    // height: 16,
    tintColor: colors.slate400,
    color: colors.slate400,
  },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 10,
    fontSize: 16,
  },
});

export default CustomInput;

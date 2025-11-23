import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { getIconSource } from '../constants/iconMap';

const ThemedIcon = ({ iconName, style, size = 24, tintColor }) => {
  const source = getIconSource(iconName);

  if (!source) {
    return null;
  }

  return (
    <Image
      source={source}
      style={[styles.icon, { width: size, height: size }, tintColor != null ? { tintColor } : null, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  icon: {
    tintColor: undefined,
  },
});

export default ThemedIcon;

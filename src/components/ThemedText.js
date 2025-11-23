import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const ThemedText = ({ children, weight = 'regular', style, ...props }) => {
  const { fonts, colors } = useTheme();
  const fontFamily = fonts[weight] || fonts.regular;

  return (
    <Text {...props} style={[{ fontFamily, color: colors.text }, style]}>
      {children}
    </Text>
  );
};

import React from 'react';
import { Text, TextProps } from 'react-native';
import { FontWeight, useTheme } from '../theme/ThemeContext';

export interface ThemedTextProps extends TextProps {
  weight?: FontWeight;
}

export const ThemedText = ({ children, weight = 'regular', style, ...props }: ThemedTextProps) => {
  const { fonts, colors } = useTheme();
  const fontFamily = fonts[weight] || fonts.regular;

  return (
    <Text {...props} style={[{ fontFamily, color: colors.text }, style]}>
      {children}
    </Text>
  );
};

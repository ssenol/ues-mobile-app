import React from 'react';
import { icons } from '../constants/iconMap';

const ThemedIcon = ({ iconName, style, size = 24, tintColor, opacity = 1 }) => {
  const IconComponent = icons[iconName];

  if (!IconComponent) return null;

  // Artık sadece SVG component'ler var
  return <IconComponent tintColor={tintColor} size={size} opacity={opacity} style={style} />;
};

export default ThemedIcon;
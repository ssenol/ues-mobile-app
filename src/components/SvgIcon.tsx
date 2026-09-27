import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import svgIcons from '../constants/svgIcons.json';

export type SvgIconName = keyof typeof svgIcons;

export interface SvgIconProps {
  name: SvgIconName;
  tintColor?: string;
  size?: number;
  width?: number;
  height?: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
}

const SvgIcon = ({ name, tintColor, size = 24, width, height, opacity = 1, style }: SvgIconProps) => {
  const svgContent: string | undefined = svgIcons[name];
  
  if (!svgContent) {
    console.warn(`[SvgIcon] Icon not found: ${name}`);
    return null;
  }
  
  return (
    <SvgXml 
      xml={svgContent.replace(/currentColor/g, tintColor || '#969696')}
      width={width || size}
      height={height || size}
      opacity={opacity}
      style={style}
    />
  );
};

export default SvgIcon;

import React from 'react';
import { SvgXml } from 'react-native-svg';
import svgIcons from '../constants/svgIcons.json';

const SvgIcon = ({ name, tintColor, size = 24, width, height, opacity = 1, style }) => {
  const svgContent = svgIcons[name];
  
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

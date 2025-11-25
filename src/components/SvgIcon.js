import React from 'react';
import { SvgXml } from 'react-native-svg';
import svgIcons from '../constants/svgIcons.json';

const SvgIcon = ({ name, tintColor, size = 24, opacity = 1 }) => {
  const svgContent = svgIcons[name];
  
  if (!svgContent) {
    console.warn(`[SvgIcon] Icon not found: ${name}`);
    return null;
  }
  
  return (
    <SvgXml 
      xml={svgContent.replace(/currentColor/g, tintColor || '#969696')}
      width={size}
      height={size}
      opacity={opacity}
    />
  );
};

export default SvgIcon;

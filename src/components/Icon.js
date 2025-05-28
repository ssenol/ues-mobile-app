import React from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';

/**
 * Icon komponenti - iOS ve Android için platform bazlı ikon gösterimi
 * @param {Object} props
 * @param {string} props.iosName - iOS için ikon adı (SF Symbols)
 * @param {string} props.androidName - Android için ikon adı (Material Icons)
 * @param {number} props.size - İkon boyutu
 * @param {string} props.color - İkon rengi
 * @param {Object} props.style - İlave stil özellikleri
 */
const Icon = ({ iosName, androidName, size = 20, color, style }) => {
  // Eğer platform için gerekli ikon adı verilmemişse null döndür
  if ((Platform.OS === 'ios' && !iosName) || (Platform.OS === 'android' && !androidName)) {
    return null;
  }

  // iOS için SF Symbols
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={iosName}
        size={size}
        tintColor={color}
        style={style}
      />
    );
  }

  // Android için Material Icons
  return (
    <MaterialIcons
      name={androidName}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default Icon;

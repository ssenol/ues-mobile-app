import { useWindowDimensions } from 'react-native';

// iPad mini (744pt) ve üzeri genişlik tablet yerleşimi kullanır
export const TABLET_BREAKPOINT = 744;

// Pencere boyutunu canlı okur. iPadOS 26+ uygulama pencerelerini her zaman yeniden boyutlandırılabilir
// yaptığı için (requireFullScreen dikkate alınmıyor) Dimensions.get('window') modül seviyesinde
// kullanılmamalı: değer uygulama açılırken bir kez okunur ve pencere küçülünce güncellenmez.
export interface ResponsiveInfo {
  width: number;
  height: number;
  isTablet: boolean;
}

export default function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();
  return { width, height, isTablet: width >= TABLET_BREAKPOINT };
}

import React, { ComponentProps } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedIcon from './ThemedIcon';
import { useTheme } from '../theme/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import type { IconName } from '../constants/iconMap';

// Hangi tab bar'ın kullanılacağı (app/(tabs)/_layout.tsx ile ortak karar).
// iPad, iOS 26 öncesi iPhone ve Android: bu floating CustomTabBar. iOS 26+ iPhone: NativeTabs (Liquid Glass).
// Genişliğe değil cihaz tipine bakılır: iPad penceresi küçülünce navigator baştan kurulmasın.
const isIPad = Platform.OS === 'ios' && Platform.isPad;
const iosMajorVersion = Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) : 0;
const supportsLiquidGlassTabs = Platform.OS === 'ios' && iosMajorVersion >= 26;
export const USES_CUSTOM_TAB_BAR = isIPad || !supportsLiquidGlassTabs;

const TAB_BAR_HEIGHT = 56;
// Kaydırılan içeriğin son öğesi ile tab bar arasında bırakılan boşluk
const CONTENT_GAP_ABOVE_TAB_BAR = 16;

// Tab bar'ın ekranın altından mesafesi: sistem alanı (home indicator / nav bar / dock) + kenar boşluğu
function useTabBarBottom() {
  const insets = useSafeAreaInsets();
  const { isTablet, bottomDockOffset } = useResponsive();
  const verticalPadding = isTablet ? 10 : 20; // Telefonlarda alta yapışmasın
  return insets.bottom + verticalPadding + bottomDockOffset;
}

// Sekme ekranlarının kaydırılan içeriği için alt boşluk: ekranın verdiği değer ile floating tab bar'ın
// gerçekte kapladığı yüksekliğin büyüğü. NativeTabs'ta (iOS 26+ iPhone) sistem yönettiği için ekranın değeri aynen kalır.
export function useTabBarClearance(minPaddingBottom: number): number {
  const tabBarBottom = useTabBarBottom();
  if (!USES_CUSTOM_TAB_BAR) return minPaddingBottom;
  return Math.max(minPaddingBottom, tabBarBottom + TAB_BAR_HEIGHT + CONTENT_GAP_ABOVE_TAB_BAR);
}

// expo-router Tabs'ın tabBar render prop'una verdiği prop'lar
type CustomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const theme = useTheme();
  const { colors, shadows } = theme;
  
  // Tablet kontrolü (iPad ve Android tablet dahil, ekran genişliğine göre)
  const { width, isTablet } = useResponsive();
  const tabBarBottom = useTabBarBottom();
  // Tablette 240px yan boşluk, ama bar en fazla 400px: yatay tablette sekmeler birbirinden çok açılmasın
  const barWidth = isTablet ? Math.min(width - 480, 400) : width - 48;
  const horizontalPadding = (width - barWidth) / 2;
  
  // Tab icon mapping
  const getTabIcon = (routeName: string): IconName => {
    const iconMap: Record<string, IconName> = {
      'index': 'tabHome',
      'assignments': 'tabAssignment',
      'completed': 'tabCompleted',
      'notifications': 'tabNotification',
      'my-progress': 'tabMyProgress',
      'profile': 'tabProfile',
    };
    return iconMap[routeName] || 'tabHome';
  };
  
  const tabBarStyles = StyleSheet.create({
    tabBarContainer: {
      position: "absolute",
      bottom: tabBarBottom,
      left: horizontalPadding,
      right: horizontalPadding,
      height: TAB_BAR_HEIGHT,
      backgroundColor: colors.primary, // Mavi zemin
      borderRadius: 28,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: 8,
      ...shadows.dark,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: TAB_BAR_HEIGHT,
    },
  });
  
  // href:null verilen (gizlenen) route'lar options.tabBarItemStyle.display='none' olarak işaretlenir;
  // varsayılan tab bar bunu kendisi filtreliyor ama custom render'da elle filtrelememiz gerekiyor
  const visibleRoutes = state.routes.filter(
    (route) => StyleSheet.flatten(descriptors[route.key]?.options?.tabBarItemStyle)?.display !== 'none'
  );

  return (
    <View style={tabBarStyles.tabBarContainer}>
      {visibleRoutes.map((route) => {
        const index = state.routes.indexOf(route);
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.8}
            style={tabBarStyles.tabItem}
          >
            <ThemedIcon
              iconName={getTabIcon(route.name)}
              size={24}
              tintColor={isFocused ? '#fff' : 'rgba(255, 255, 255, 0.6)'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

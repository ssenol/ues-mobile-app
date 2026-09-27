import React, { ComponentProps } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ThemedIcon from './ThemedIcon';
import { useTheme } from '../theme/ThemeContext';
import useResponsive from '../hooks/useResponsive';
import type { IconName } from '../constants/iconMap';

// expo-router Tabs'ın tabBar render prop'una verdiği prop'lar
type CustomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, shadows } = theme;
  
  // Tablet kontrolü (iPad ve Android tablet dahil, ekran genişliğine göre)
  const { width, isTablet, bottomDockOffset } = useResponsive();
  // Tablette 240px yan boşluk, ama bar en fazla 400px: yatay tablette sekmeler birbirinden çok açılmasın
  const barWidth = isTablet ? Math.min(width - 480, 400) : width - 48;
  const horizontalPadding = (width - barWidth) / 2;
  const verticalPadding = isTablet ? 10 : 20; // Dikey padding (telefonlarda alta yapışmasın)
  
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
      bottom: insets.bottom + verticalPadding + bottomDockOffset,
      left: horizontalPadding,
      right: horizontalPadding,
      height: 56,
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
      height: 56,
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

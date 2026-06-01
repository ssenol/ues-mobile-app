import React from 'react';
import { Dimensions, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './ThemedText';
import ThemedIcon from './ThemedIcon';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { colors, shadows } = theme;
  
  // iPad kontrolü (sadece iOS tablet)
  const isTablet = Platform.OS === 'ios' && SCREEN_WIDTH >= 744;
  const horizontalPadding = isTablet ? 180 : 10; // Yatay padding
  const verticalPadding = isTablet ? 10 : 10; // Dikey padding
  
  // Tab icon mapping
  const getTabIcon = (routeName) => {
    const iconMap = {
      'index': 'tabHome',
      'assignments': 'tabAssignment',
      'completed': 'tabCompleted',
      'notifications': 'tabNotification',
      'profile': 'tabProfile',
    };
    return iconMap[routeName] || 'tabHome';
  };
  
  const tabBarStyles = StyleSheet.create({
    tabBarContainer: {
      position: "absolute",
      bottom: insets.bottom + verticalPadding,
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
    tabLabel: {
      fontSize: 10,
      marginTop: 2,
      fontFamily: 'Nunito_600SemiBold',
    },
  });
  
  return (
    <View style={tabBarStyles.tabBarContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
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
            <ThemedText
              style={[
                tabBarStyles.tabLabel,
                { color: isFocused ? '#fff' : 'rgba(255, 255, 255, 0.6)' }
              ]}
            >
              {options.title || route.name}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

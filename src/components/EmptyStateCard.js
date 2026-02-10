import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import ThemedIcon from './ThemedIcon';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 744;

const EmptyStateCard = ({ 
  containerStyle,
  iconName = 'bigcheck', 
  iconSize = isTablet ? 100 : 72,
  iconColor = '#3E4EF0',
  iconBackgroundColor = '#fff',
  title = 'Great Job!', 
  subtitle = 'You made no mistakes in this task.',
  subtitleColor = '#727272',
  showLink = false,
  linkIconName = 'tabAssignment',
  linkIconSize = isTablet ? 24 : 16,
  linkText = 'Assignments',
  onLinkPress,
  dividerColor = '#F3F4FF'
}) => {
  const { shadows } = useTheme();
  
  return (
    <View style={[styles.container, containerStyle, shadows.light]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBackgroundColor }]}>
        <ThemedIcon
          iconName={iconName}
          size={iconSize}
          tintColor={iconColor}
        />
      </View>
      <ThemedText weight="bold" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.subtitle, { color: subtitleColor }]}>
        {subtitle}
      </ThemedText>
      
      {showLink && (
        <>
          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          
          {/* Link */}
          <TouchableOpacity
            style={styles.link}
            onPress={onLinkPress}
            activeOpacity={0.7}
          >
            <ThemedIcon
              iconName={linkIconName}
              size={linkIconSize}
              tintColor="#3E4EF0"
            />
            <ThemedText weight="bold" style={styles.linkText}>
              {linkText}
            </ThemedText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: isTablet ? 48 : 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 24,
  },
  iconContainer: {
    width: isTablet ? 100 : 72,
    height: isTablet ? 100 : 72,
    borderRadius: isTablet ? 50 : 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isTablet ? 20 : 16,
  },
  title: {
    fontSize: isTablet ? 24 : 18,
    lineHeight: isTablet ? 32 : 24,
    color: '#3A3A3A',
    marginBottom: isTablet ? 8 : 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTablet ? 18 : 14,
    lineHeight: isTablet ? 24 : 20,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    marginVertical: isTablet ? 24 : 16,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3E4EF0',
  },
});

export default EmptyStateCard;

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';
import ThemedIcon from './ThemedIcon';

const EmptyStateCard = ({ 
  iconName = 'bigcheck', 
  iconSize = 72,
  iconColor = '#3E4EF0',
  iconBackgroundColor = '#fffff',
  title = 'Great Job!', 
  subtitle = 'You made no mistakes in this task.',
  containerStyle 
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
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
      <ThemedText style={styles.subtitle}>
        {subtitle}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 24,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3A3A3A',
    textAlign: 'center',
  },
});

export default EmptyStateCard;

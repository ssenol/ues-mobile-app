import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../ThemedText';

// Rapor ekranlarında kullanılan yatay kaydırmalı pill tab bar (normal ve sticky render için ortak)
export default function ReportTabBar({ tabs, activeTab, onTabPress, pillsScrollRef, onPillsRowLayout, onPillLayout }) {
  return (
    <ScrollView
      ref={pillsScrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      onLayout={onPillsRowLayout}
    >
      {tabs.map((t, idx) => {
        const isActive = t.key === activeTab;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onTabPress(t.key, idx)}
            onLayout={(e) => onPillLayout(idx, e)}
            activeOpacity={0.7}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <ThemedText weight="bold" style={[styles.pillText, isActive && styles.pillTextActive]}>
              {t.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: '#E7E9FF',
  },
  pillText: {
    fontSize: 15,
    color: '#969696',
  },
  pillTextActive: {
    color: '#3E4EF0',
  },
});

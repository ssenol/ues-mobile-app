import * as Haptics from 'expo-haptics';
import React, {useMemo} from 'react';
import {Dimensions, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import ThemedIcon from '../ThemedIcon';
import {ThemedText} from '../ThemedText';
import {useTheme} from '../../theme/ThemeContext';
import {catForType, formatSubType} from './reportIssueCategories';
import {getExampleSegments} from './reportUtils';

const { height: SCREEN_H } = Dimensions.get('window');

// Grammar/Word Choice/Logic gibi metin hatalarının detayını ortada gösteren modal (prev/next ile gezinilebilir)
export default function ReportErrorModal({ issue, index, total, onPrev, onNext, onClose }) {
  const { fonts, colors } = useTheme();

  // Parmakla sola/sağa kaydırınca prev/next (yatay hareket dikeyden belirgin şekilde
  // fazlaysa ScrollView'ın dikey kaydırmasıyla çakışmaz)
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => (
      total > 1 && Math.abs(gesture.dx) > 20 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2
    ),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > 60 && index > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPrev();
      } else if (gesture.dx < -60 && index < total - 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onNext();
      }
    },
  }), [index, total, onPrev, onNext]);

  const handlePrevPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPrev();
  };

  const handleNextPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNext();
  };

  if (!issue) return null;

  const cat = catForType(issue.type);
  const exampleSegments = getExampleSegments(issue.exampleOfUsage);

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} visible>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card} {...panResponder.panHandlers}>
          <View style={styles.topRow}>
            <ThemedText weight="bold" style={[styles.catLabel, { color: cat.color }]}>
              {cat.label} Error
            </ThemedText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ThemedIcon iconName="close" size={16} tintColor="#969696" />
            </TouchableOpacity>
          </View>

          {!!issue.subType && (
            <View style={[styles.subTypePill, { backgroundColor: cat.bg, borderColor: cat.border }]}>
              <ThemedText weight="semiBold" style={[styles.subTypeText, { color: cat.color }]}>
                {formatSubType(issue.subType)}
              </ThemedText>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 14 }}>
            <View style={styles.wordsRow}>
              <ThemedText weight="bold" style={[styles.wrongWord, { color: cat.color }]}>
                {issue.wrongWord || issue.wrongContent || '—'}
              </ThemedText>
              {!!issue.correctWord && (
                <>
                  <ThemedText style={styles.arrow}>→</ThemedText>
                  <ThemedText weight="semiBold" style={styles.correctWord}>{issue.correctWord}</ThemedText>
                </>
              )}
            </View>

            {!!issue.detailFeedbackWithReason && (
              <ThemedText style={styles.detailText}>{issue.detailFeedbackWithReason}</ThemedText>
            )}

            {exampleSegments.length > 0 && (
              <View style={styles.exampleBox}>
                <ThemedText weight="semiBold" style={styles.exampleLabel}>Example</ThemedText>
                <Text style={[styles.exampleText, { fontFamily: fonts.regular }]}>
                  {exampleSegments.map((segment, i) => (
                    <Text
                      key={i}
                      style={[
                        segment.isStrong ? { color: colors.primary } : null,
                        { fontFamily: segment.isStrong ? fonts.bold : fonts.regular },
                      ]}
                    >
                      {segment.text}
                    </Text>
                  ))}
                </Text>
              </View>
            )}
          </ScrollView>

          {total > 1 && (
            <View style={styles.nav}>
              <TouchableOpacity
                onPress={handlePrevPress}
                disabled={index === 0}
                style={[styles.navBtn, index === 0 && { opacity: 0.3 }]}
              >
                <ThemedIcon iconName="leftArrow" size={16} tintColor="#3A3A3A" />
              </TouchableOpacity>
              <ThemedText style={styles.navCounter}>{index + 1} / {total}</ThemedText>
              <TouchableOpacity
                onPress={handleNextPress}
                disabled={index === total - 1}
                style={[styles.navBtn, index === total - 1 && { opacity: 0.3 }]}
              >
                <ThemedIcon iconName="rightArrow" size={16} tintColor="#3A3A3A" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    height: SCREEN_H * 0.42,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catLabel: {
    fontSize: 17,
  },
  subTypePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  subTypeText: {
    fontSize: 12,
  },
  wordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  wrongWord: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  arrow: {
    fontSize: 16,
    color: '#969696',
  },
  correctWord: {
    fontSize: 16,
    color: '#34A853',
  },
  detailText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#3A3A3A',
    marginBottom: 12,
  },
  exampleBox: {
    backgroundColor: '#F3F4FF',
    borderRadius: 10,
    padding: 12,
  },
  exampleLabel: {
    fontSize: 11,
    color: '#969696',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#3A3A3A',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4FF',
  },
  navBtn: {
    padding: 6,
  },
  navCounter: {
    fontSize: 13,
    color: '#727272',
  },
});

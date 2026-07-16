import React from 'react';
import { View } from 'react-native';
import ThemedIcon from '../ThemedIcon';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../theme/ThemeContext';
import reportStyles from './reportStyles';

// ── Achievements / Issues satırları (kriter sekmelerinde statik liste) ──
export function AchievementRow({ text, last }) {
  const { colors } = useTheme();
  return (
    <View style={[reportStyles.row, !last && reportStyles.rowDivider]}>
      <View style={[reportStyles.rowIconContainer, { backgroundColor: colors.goalBackgroundGreen }]}>
        <ThemedIcon iconName="bigcheck" size={14} tintColor={colors.goalGreen} />
      </View>
      <ThemedText style={reportStyles.rowText}>{text}</ThemedText>
    </View>
  );
}

export function IssueRow({ text, last }) {
  const { colors } = useTheme();
  return (
    <View style={[reportStyles.row, !last && reportStyles.rowDivider]}>
      <View style={[reportStyles.rowIconContainer, { backgroundColor: colors.goalBackgroundOrange }]}>
        <ThemedIcon iconName="info3" size={14} tintColor={colors.goalOrange} />
      </View>
      <ThemedText style={reportStyles.rowText}>{text}</ThemedText>
    </View>
  );
}

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function NextStepRow({ text, index, last }) {
  const { colors } = useTheme();
  const letter = LETTERS[index] || String(index + 1);
  return (
    <View style={[reportStyles.row, !last && reportStyles.rowDivider]}>
      <View style={[reportStyles.letterBadge, { borderColor: colors.border, backgroundColor: '#F3F4FF' }]}>
        <ThemedText weight="bold" style={[reportStyles.letterText, { color: colors.primary }]}>{letter}</ThemedText>
      </View>
      <ThemedText style={[reportStyles.rowText, { flex: 1 }]}>{text}</ThemedText>
    </View>
  );
}

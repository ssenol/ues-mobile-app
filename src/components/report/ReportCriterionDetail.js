import React from 'react';
import { View } from 'react-native';
import ThemedIcon from '../ThemedIcon';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../theme/ThemeContext';
import reportStyles from './reportStyles';
import { AchievementRow, IssueRow } from './ReportRows';
import { getScoreColor, isUnmeasuredCriterion } from './reportUtils';

// Kriter detay sekmesi (Pronunciation & Intonation, Language, Task & Interaction, vb.)
export default function ReportCriterionDetail({ criterion }) {
  const { colors, shadows } = useTheme();
  const unmeasured = isUnmeasuredCriterion(criterion);
  const score = criterion.score || 0;
  const scoreColor = unmeasured ? colors.placeholder : getScoreColor(colors, score);

  return (
    <View>
      <View style={[reportStyles.card, shadows.light]}>
        <View style={reportStyles.headerRow}>
          <ThemedText weight="bold" style={reportStyles.criterionTitle}>{criterion.name}</ThemedText>
          <View style={{ alignItems: 'flex-end' }}>
            {typeof criterion.weight === 'number' && (
              <ThemedText style={reportStyles.weightText}>{criterion.weight}% of final</ThemedText>
            )}
            <ThemedText weight="bold" style={[reportStyles.scoreText, { color: scoreColor }]}>
              {unmeasured ? '—' : score}
            </ThemedText>
          </View>
        </View>

        <View style={reportStyles.progressTrack}>
          <View
            style={[
              reportStyles.progressFill,
              { width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: unmeasured ? colors.border : scoreColor },
            ]}
          />
        </View>

        {unmeasured && (
          <ThemedText style={reportStyles.unmeasuredHint}>No audio was recorded for this task, so this could not be measured.</ThemedText>
        )}

        {!!criterion.explanation && (
          <ThemedText style={reportStyles.explanationText}>{criterion.explanation}</ThemedText>
        )}
      </View>

      {(criterion.achievements?.length > 0 || criterion.issues?.length > 0) && (
        <View style={{ marginTop: 16, gap: 16 }}>
          {criterion.achievements?.length > 0 && (
            <View>
              <ThemedText weight="bold" style={reportStyles.sectionLabel}>ACHIEVEMENTS</ThemedText>
              <View style={[reportStyles.listCardShadowWrap, shadows.light]}>
                <View style={reportStyles.listCard}>
                  {criterion.achievements.map((a, i) => (
                    <AchievementRow key={i} text={a} last={i === criterion.achievements.length - 1} />
                  ))}
                </View>
              </View>
            </View>
          )}

          {criterion.issues?.length > 0 && (
            <View>
              <ThemedText weight="bold" style={reportStyles.sectionLabel}>ISSUES</ThemedText>
              <View style={[reportStyles.listCardShadowWrap, shadows.light]}>
                <View style={reportStyles.listCard}>
                  {criterion.issues.map((issueText, i) => (
                    <IssueRow key={i} text={issueText} last={i === criterion.issues.length - 1} />
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {!!criterion.summary && (
        <View style={{ marginTop: 16 }}>
          <ThemedText weight="bold" style={reportStyles.sectionLabel}>SUMMARY</ThemedText>
          <View style={[reportStyles.summaryCard, { backgroundColor: colors.goalBackgroundGreen }, shadows.light]}>
            <ThemedIcon iconName="bigcheck" size={16} tintColor={colors.goalGreen} />
            <ThemedText style={reportStyles.summaryText}>{criterion.summary}</ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import ThemedIcon from '../ThemedIcon';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../theme/ThemeContext';
import reportStyles from './reportStyles';
import { AchievementRow, IssueRow } from './ReportRows';
import { getScoreColor, isUnmeasuredCriterion } from './reportUtils';

// Kriterin türüne göre "WHAT TO WORK ON" listesini oluşturur:
// pronunciation -> voiceErrors, task -> logic-error mistakes, language -> diğer mistakes
function getWorkOnItems(criterion, mistakes, voiceErrors) {
  if (criterion.key === 'pronunciation') {
    return (voiceErrors || []).map((v) => ({ red: v.word, green: v.word, text: v.reason }));
  }
  if (criterion.key === 'task') {
    return (mistakes || [])
      .filter((m) => m.type === 'logic-error')
      .map((m) => ({
        red: m.wrongWord || m.wrongContent,
        green: m.correctWord || m.correctedContent || null,
        text: m.detailFeedbackWithReason,
      }));
  }
  if (criterion.key === 'language') {
    return (mistakes || [])
      .filter((m) => m.type !== 'logic-error')
      .map((m) => ({
        red: m.wrongWord || m.wrongContent,
        green: m.correctWord || m.correctedContent || null,
        text: m.detailFeedbackWithReason,
      }));
  }
  return [];
}

// Metnin kelime sayısı ve ses süresine göre dakikadaki kelime sayısını hesaplar
function getReadingRate(text, durationSeconds) {
  if (!text || !durationSeconds) return null;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return null;

  const wpm = Math.round(wordCount / (durationSeconds / 60));
  let status = 'IN RANGE';
  let statusKey = 'green';
  if (wpm < 100) { status = 'TOO SLOW'; statusKey = 'red'; }
  else if (wpm < 120) { status = 'A LITTLE SLOW'; statusKey = 'orange'; }
  else if (wpm <= 160) { status = 'IN RANGE'; statusKey = 'green'; }
  else if (wpm <= 180) { status = 'A LITTLE FAST'; statusKey = 'orange'; }
  else { status = 'TOO FAST'; statusKey = 'red'; }

  return { wpm, status, statusKey };
}

function MetricCard({ label, value, color }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <ThemedText weight="bold" style={reportStyles.sectionLabel}>{label}</ThemedText>
        <ThemedText weight="extraBold" style={[styles.metricValue, { color }]}>{value}</ThemedText>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// Kriter detay sekmesi (Pronunciation & Intonation, Language, Task & Interaction, vb.)
export default function ReportCriterionDetail({ criterion, mistakes, voiceErrors, voiceResult, responseText, durationSeconds }) {
  const { colors, shadows } = useTheme();
  const unmeasured = isUnmeasuredCriterion(criterion);
  const score = criterion.score || 0;
  const scoreColor = unmeasured ? colors.placeholder : getScoreColor(colors, score);
  const workOnItems = getWorkOnItems(criterion, mistakes, voiceErrors).filter((item) => item.red);

  const showCompletenessAccuracy = criterion.key === 'task'
    && typeof voiceResult?.completeness === 'number'
    && typeof voiceResult?.accuracy === 'number';

  const readingRate = criterion.key === 'fluency' ? getReadingRate(responseText, durationSeconds) : null;
  const statusColors = {
    green: { fg: colors.goalGreen, bg: colors.goalBackgroundGreen },
    orange: { fg: colors.goalOrange, bg: colors.goalBackgroundOrange },
    red: { fg: colors.goalRed, bg: colors.goalBackgroundRed },
  };

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

      {showCompletenessAccuracy && (
        <View style={[reportStyles.listCardShadowWrap, styles.metricOuterWrap, shadows.light]}>
          <View style={[reportStyles.listCard, styles.metricOuterCard]}>
            <View style={styles.metricRow}>
              <MetricCard label="COMPLETENESS" value={voiceResult.completeness} color={getScoreColor(colors, voiceResult.completeness)} />
              <MetricCard label="ACCURACY" value={voiceResult.accuracy} color={getScoreColor(colors, voiceResult.accuracy)} />
            </View>
          </View>
        </View>
      )}

      {!!readingRate && (
        <View style={[reportStyles.listCardShadowWrap, styles.metricOuterWrap, shadows.light]}>
          <View style={[reportStyles.listCard, styles.metricOuterCard]}>
            <View style={styles.readingRateCard}>
              <View style={styles.readingRateHeader}>
                <View style={styles.readingRateLabelRow}>
                  <ThemedText weight="semiBold" style={styles.readingRateLabel}>Reading rate</ThemedText>
                  <ThemedText weight="bold" style={[styles.readingRateValue, { color: colors.primary }]}>
                    {readingRate.wpm} words/min
                  </ThemedText>
                </View>
                <View style={[styles.readingRateBadge, { backgroundColor: statusColors[readingRate.statusKey].bg }]}>
                  <ThemedText weight="bold" style={[styles.readingRateBadgeText, { color: statusColors[readingRate.statusKey].fg }]}>
                    {readingRate.status}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.readingRateNote}>A comfortable read-aloud pace is roughly 120–160 words per minute.</ThemedText>
            </View>
          </View>
        </View>
      )}

      {workOnItems.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <ThemedText weight="bold" style={reportStyles.sectionLabel}>WHAT TO WORK ON</ThemedText>
          <View style={[reportStyles.listCardShadowWrap, shadows.light]}>
            <View style={[reportStyles.listCard, styles.workOnListCard]}>
              {workOnItems.map((item, i) => (
                <View key={i} style={[styles.workOnCard, { backgroundColor: colors.goalBackgroundRed }]}>
                  <View style={styles.workOnHeader}>
                    <ThemedText weight="bold" style={{ color: colors.goalRed }}>{item.red}</ThemedText>
                    {!!item.green && <ThemedText weight="bold" style={{ color: colors.goalGreen }}>{item.green}</ThemedText>}
                  </View>
                  {!!item.text && <ThemedText style={styles.workOnText}>{item.text}</ThemedText>}
                </View>
              ))}
            </View>
          </View>
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

const styles = StyleSheet.create({
  metricOuterWrap: {
    marginTop: 16,
  },
  metricOuterCard: {
    padding: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#F3F4FF',
    borderRadius: 12,
    padding: 14,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
  },
  metricTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7FF',
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },
  readingRateCard: {
    backgroundColor: '#F3F4FF',
    borderRadius: 12,
    padding: 14,
  },
  readingRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  readingRateLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flex: 1,
  },
  readingRateLabel: {
    fontSize: 14,
    color: '#3A3A3A',
  },
  readingRateValue: {
    fontSize: 15,
  },
  readingRateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  readingRateBadgeText: {
    fontSize: 11,
  },
  readingRateNote: {
    fontSize: 13,
    lineHeight: 19,
    color: '#727272',
  },
  workOnListCard: {
    padding: 12,
    gap: 10,
  },
  workOnCard: {
    borderRadius: 12,
    padding: 14,
  },
  workOnHeader: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  workOnText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
  },
});

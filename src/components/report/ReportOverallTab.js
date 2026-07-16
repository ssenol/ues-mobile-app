import React from 'react';
import {StyleSheet, View} from 'react-native';
import EmptyStateCard from '../EmptyStateCard';
import ThemedIcon from '../ThemedIcon';
import {ThemedText} from '../ThemedText';
import {useTheme} from '../../theme/ThemeContext';
import reportStyles from './reportStyles';
import {getCriterionTagline, getScoreColor, getScoreIcon, isUnmeasuredCriterion} from './reportUtils';

function ProgressBar({ value, color, style }) {
  return (
    <View style={[reportStyles.progressTrack, style]}>
      <View style={[reportStyles.progressFill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

function CriterionRow({ criterion, subType, last }) {
  const { colors } = useTheme();
  const unmeasured = isUnmeasuredCriterion(criterion);
  const score = criterion.score || 0;
  const scoreColor = unmeasured ? colors.placeholder : getScoreColor(colors, score);
  const description = criterion.explanation || getCriterionTagline(subType, criterion.key);

  return (
    <View style={[reportStyles.row, !last && reportStyles.rowDivider, { flexDirection: 'column', alignItems: 'stretch' }]}>
      <View style={styles.criterionRowHeader}>
        <ThemedText weight="bold" style={styles.criterionRowName}>{criterion.name}</ThemedText>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <ThemedText weight="bold" style={[styles.criterionRowScore, { color: scoreColor }]}>
            {unmeasured ? '—' : score}
          </ThemedText>
          {typeof criterion.weight === 'number' && (
            <ThemedText style={styles.criterionRowWeight}>· {criterion.weight}%</ThemedText>
          )}
        </View>
      </View>
      <ProgressBar value={score} color={unmeasured ? colors.border : scoreColor} style={styles.criterionRowProgress} />
      {!!description && (
        <ThemedText style={styles.criterionRowExplanation}>{description}</ThemedText>
      )}
    </View>
  );
}

// Overall Score sekmesi: scoreBreakdown'dan final skor + completeness kırılımı + kriter listesi
export default function ReportOverallTab({ mainScore, scoreBreakdown, completenessLabel, completenessNote, subType }) {
  const { colors, shadows } = useTheme();

  if (!scoreBreakdown) {
    return (
      <EmptyStateCard
        iconName="info"
        title="Overall Score Not Ready"
        subtitle="The score breakdown for this submission isn't available yet."
      />
    );
  }

  const score = mainScore || 0;
  const scoreColor = getScoreColor(colors, score);
  const completeness = scoreBreakdown.completeness ?? 0;
  const completenessColor = getScoreColor(colors, completeness);
  const maxAchievable = scoreBreakdown.maxAchievable ?? 0;
  const maxColor = getScoreColor(colors, maxAchievable);
  const criteria = scoreBreakdown.criteria || [];

  return (
    <View>
      {/* Overall Score */}
      <View style={[styles.overallCard, shadows.light]}>
        <View style={[styles.overallIconBox, { backgroundColor: scoreColor }]}>
          <ThemedIcon iconName={getScoreIcon(score)} size={28} tintColor="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText weight="bold" style={styles.overallTitle}>Overall Score</ThemedText>
          <ProgressBar value={score} color={scoreColor} />
          <ThemedText weight="bold" style={[styles.overallScoreText, { color: scoreColor }]}>{score}</ThemedText>
        </View>
      </View>

      {/* Completeness */}
      {scoreBreakdown.completenessApplies !== false && (
        <View style={[styles.completenessCard, shadows.light]}>
          <View style={styles.completenessHeader}>
            <View style={styles.completenessLabelRow}>
              <View style={styles.completenessDash} />
              <ThemedText weight="bold" style={styles.completenessLabel}>
                {(completenessLabel || 'Completeness').toUpperCase()}
              </ThemedText>
            </View>
            <View style={[styles.maxPill, { backgroundColor: `${maxColor}22` }]}>
              <ThemedText weight="semiBold" style={[styles.maxPillText, { color: maxColor }]}>
                MAX {maxAchievable}
              </ThemedText>
            </View>
          </View>

          <View style={styles.completenessRow}>
            <ThemedText weight="bold" style={styles.completenessRowLabel}>Completeness</ThemedText>
            <ThemedText weight="bold" style={[styles.completenessPercent, { color: completenessColor }]}>
              {completeness}%
            </ThemedText>
          </View>
          <ProgressBar value={completeness} color={completenessColor} />

          {!!completenessNote && (
            <ThemedText style={styles.completenessNote}>{completenessNote}</ThemedText>
          )}

          <View style={styles.formulaBox}>
            <View style={styles.formulaItem}>
              <ThemedText weight="bold" style={styles.formulaValue}>{scoreBreakdown.weightedScore}</ThemedText>
              <ThemedText style={styles.formulaCaption}>CRITERIA SCORE</ThemedText>
            </View>
            <ThemedText style={styles.formulaOperator}>×</ThemedText>
            <View style={styles.formulaItem}>
              <ThemedText weight="bold" style={styles.formulaValue}>{completeness}%</ThemedText>
              <ThemedText style={styles.formulaCaption}>COMPLETENESS</ThemedText>
            </View>
            <ThemedText style={styles.formulaOperator}>=</ThemedText>
            <View style={[styles.formulaItem, styles.formulaFinalBox]}>
              <ThemedText weight="bold" style={[styles.formulaValue, { color: scoreColor }]}>
                {scoreBreakdown.finalScore}
              </ThemedText>
              <ThemedText style={styles.formulaCaption}>FINAL SCORE</ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Criteria breakdown */}
      {criteria.length > 0 && (
        <View style={[reportStyles.listCardShadowWrap, shadows.light]}>
          <View style={reportStyles.listCard}>
            <View style={styles.criteriaIntro}>
              <ThemedText weight="bold" style={styles.sectionTitle}>How the criteria score is made</ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                Your criteria score is the weighted average of the criteria below. Each one contributes by its weight (in %).
              </ThemedText>
            </View>
            <View style={styles.criteriaDivider} />
            {criteria.map((c, i) => (
              <CriterionRow key={c.key || i} criterion={c} subType={subType} last={i === criteria.length - 1} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  overallIconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overallTitle: {
    fontSize: 16,
    color: '#3A3A3A',
    marginBottom: 12,
  },
  overallScoreText: {
    fontSize: 22,
  },
  completenessCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  completenessLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completenessDash: {
    width: 14,
    height: 2,
    backgroundColor: '#F0AC3D',
  },
  completenessLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#F0AC3D',
  },
  maxPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  maxPillText: {
    fontSize: 12,
  },
  completenessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completenessRowLabel: {
    fontSize: 15,
    color: '#3A3A3A',
  },
  completenessPercent: {
    fontSize: 20,
  },
  completenessNote: {
    fontSize: 13,
    lineHeight: 19,
    color: '#727272',
    marginTop: 12,
  },
  formulaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  formulaItem: {
    flex: 1,
    alignItems: 'center',
  },
  formulaFinalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
  },
  formulaOperator: {
    fontSize: 16,
    color: '#969696',
    marginHorizontal: 4,
  },
  formulaValue: {
    fontSize: 18,
    color: '#3A3A3A',
  },
  formulaCaption: {
    fontSize: 9,
    letterSpacing: 0.3,
    color: '#969696',
    marginTop: 2,
    textAlign: 'center',
  },
  criteriaIntro: {
    padding: 16,
  },
  criteriaDivider: {
    height: 1,
    backgroundColor: '#F3F4FF',
  },
  sectionTitle: {
    fontSize: 16,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#727272',
  },
  criterionRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  criterionRowProgress: {
    marginBottom: 6,
  },
  criterionRowName: {
    fontSize: 14,
    color: '#3A3A3A',
    flex: 1,
    marginRight: 8,
  },
  criterionRowScore: {
    fontSize: 15,
  },
  criterionRowWeight: {
    fontSize: 12,
    color: '#969696',
  },
  criterionRowExplanation: {
    fontSize: 13,
    lineHeight: 19,
    color: '#727272',
  },
});

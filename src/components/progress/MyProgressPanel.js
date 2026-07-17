import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import CircularProgress from '../CircularProgress';
import EmptyStateCard from '../EmptyStateCard';
import InfoModal from '../InfoModal';
import reportStyles from '../report/reportStyles';
import {catForType} from '../report/reportIssueCategories';
import {getScoreColor} from '../report/reportUtils';
import {ThemedText} from '../ThemedText';
import ThemedIcon from '../ThemedIcon';
import {useTheme} from '../../theme/ThemeContext';
import {getSelfAnalytics} from '../../services/speak';
import {BarRow, LineTrend, StatTile} from './ProgressCharts';
import {
  formatDuration,
  formatErrorTypeLabel,
  SUBTYPE_LABELS,
  SUBTYPE_SHORT_LABELS,
  titleCase,
} from './progressUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 744;
const VOICE_PROFILE_KEYS = ['pronunciation', 'fluency', 'prosody', 'accuracy', 'completeness', 'clarity'];

const SECTION_INFO = {
  voiceProfile: {
    title: 'Voice Profile',
    text: 'Acoustic measures taken from your audio — Pronunciation, Fluency, Prosody (rhythm & intonation), Accuracy, Completeness, Clarity. Each is 0–100, averaged across your submissions.',
  },
  scoreTrend: {
    title: 'Speaking Score Trend',
    text: 'Your overall speaking score (0–100) for each submission, oldest to newest — watch the line to see if you are improving over time.',
  },
  subTypeBreakdown: {
    title: 'Sub-Type Breakdown',
    text: 'How your speaking practice splits across the three task types. The big number is your average score (out of 100) in that type; the bar shows that score, and the chip shows how many you did.',
  },
  criteria: {
    title: 'Speaking Criteria',
    text: 'The rubric your score is built from. Each criterion shows your average (0–100) plus how much it counts toward the score in each task type. Voice criteria come from your audio; Language & Task are judged by AI.',
  },
  errors: {
    title: 'Language & Logic Mistakes',
    text: 'Language and logic mistakes found across your speech, grouped by type (grammar, word choice, logic, …). The longer the bar, the more often that mistake appears — these are your areas to focus on.',
  },
  pronunciation: {
    title: 'Pronunciation Issues',
    text: 'The words your audio was hardest to pronounce, across all your speech tasks. The count (×N) is how often a word was flagged; the bar shows its average accuracy (0–100) — lower means it needs more practice.',
  },
};

// Bölüm başlığı + info ikonu + (opsiyonel) sağdaki meta metni
function SectionHeader({ title, meta, onInfoPress }) {
  return (
    <View style={reportStyles.headerRow}>
      <View style={styles.sectionTitleRow}>
        <ThemedText weight="bold" style={[reportStyles.sectionLabel, styles.sectionLabelNoMargin]}>{title}</ThemedText>
        <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ThemedIcon iconName="info" size={14} tintColor="#3E4EF0" />
        </TouchableOpacity>
      </View>
      {!!meta && <ThemedText style={styles.sectionMeta}>{meta}</ThemedText>}
    </View>
  );
}

// boostifywrite/src/components/AnalyticsPanel.tsx'in konuşma verisine uyarlanmış hali.
// Backend /student/get-self-analytics'i type:'speaking' ile çağırır.
export default function MyProgressPanel({ userId }) {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoKey, setInfoKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSelfAnalytics(userId, 'speaking');
      setData(res?.data?.speaking ?? null);
    } catch (err) {
      console.error('getSelfAnalytics error:', err);
      setError('Could not load your progress.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerBox}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={load} activeOpacity={0.7}>
          <ThemedText weight="bold" style={styles.retryButtonText}>Retry</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data || !data.kpis || data.kpis.submissions === 0) {
    return (
      <EmptyStateCard
        iconName="report"
        title="No analysis yet"
        subtitle="Complete a speaking task first to see your progress here."
      />
    );
  }

  const { kpis, voiceProfile, scoreTrend, subTypeBreakdown, criteria, criteriaWeights, errorBreakdown, voiceErrorTotal, voiceErrorWords } = data;

  const voiceProfileMetrics = VOICE_PROFILE_KEYS.map((key) => ({
    key,
    label: titleCase(key),
    value: voiceProfile?.[key] ?? 0,
  }));

  const trendLabelEvery = scoreTrend?.length ? Math.max(1, Math.ceil(scoreTrend.length / 8)) : 1;
  const trendWidth = scoreTrend?.length ? Math.max(SCREEN_WIDTH - 64, scoreTrend.length * 26) : 0;

  const sortedErrors = [...(errorBreakdown || [])].sort((a, b) => b.count - a.count);
  const totalErrors = sortedErrors.reduce((sum, e) => sum + e.count, 0);
  const maxErrorCount = Math.max(1, ...sortedErrors.map((e) => e.count));
  const maxVoiceErrorAccuracy = 100;

  const statTiles = [
    { key: 'submissions', label: 'SUBMISSIONS', value: kpis.submissions },
    {
      key: 'avgScore',
      label: 'AVG SCORE',
      value: Math.round(kpis.avgScore),
      unit: '/ 100',
      valueColor: getScoreColor(colors, kpis.avgScore),
    },
    {
      key: 'bestScore',
      label: 'BEST SCORE',
      value: kpis.bestScore,
      unit: '/ 100',
      valueColor: getScoreColor(colors, kpis.bestScore),
    },
    {
      key: 'totalMistakes',
      label: 'TOTAL MISTAKES',
      value: kpis.totalMistakes,
      valueColor: kpis.totalMistakes > 0 ? colors.goalRed : undefined,
    },
    { key: 'timeSpoken', label: 'TIME SPOKEN', value: formatDuration(kpis.totalSeconds) },
  ];

  return (
    <View>
      {isTablet ? (
        <View style={styles.tileRow}>
          {statTiles.map((t) => (
            <StatTile key={t.key} label={t.label} value={t.value} unit={t.unit} valueColor={t.valueColor} style={styles.tileFifth} />
          ))}
        </View>
      ) : (
        <>
          <View style={styles.tileRow}>
            {statTiles.slice(0, 2).map((t) => (
              <StatTile key={t.key} label={t.label} value={t.value} unit={t.unit} valueColor={t.valueColor} style={styles.tileHalf} />
            ))}
          </View>
          <View style={styles.tileRow}>
            {statTiles.slice(2, 4).map((t) => (
              <StatTile key={t.key} label={t.label} value={t.value} unit={t.unit} valueColor={t.valueColor} style={styles.tileHalf} />
            ))}
          </View>
          <StatTile label={statTiles[4].label} value={statTiles[4].value} style={{ marginTop: 8 }} />
        </>
      )}

      <View style={styles.section}>
        <SectionHeader title="VOICE PROFILE" onInfoPress={() => setInfoKey('voiceProfile')} />
        <View style={[reportStyles.card, styles.voiceProfileCard]}>
          {voiceProfileMetrics.map((m) => (
            <CircularProgress key={m.key} value={m.value} label={m.label} size={isTablet ? 90 : 72} strokeWidth={7} color={colors.primary} />
          ))}
        </View>
      </View>

      {scoreTrend && scoreTrend.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="SPEAKING SCORE TREND"
            meta={`${scoreTrend.length} tasks`}
            onInfoPress={() => setInfoKey('scoreTrend')}
          />
          <View style={[reportStyles.card, { paddingHorizontal: 4 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineTrend
                data={scoreTrend.map((t) => ({ value: t.score }))}
                xLabels={scoreTrend.map((_, i) => (i % trendLabelEvery === 0 ? `S${i + 1}` : ''))}
                width={trendWidth}
                color={colors.primary}
              />
            </ScrollView>
          </View>
        </View>
      )}

      {subTypeBreakdown && subTypeBreakdown.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="SUB-TYPE BREAKDOWN"
            meta={`${kpis.submissions} tasks`}
            onInfoPress={() => setInfoKey('subTypeBreakdown')}
          />
          <View style={[styles.subTypeGrid, isTablet && styles.subTypeGridTablet]}>
            {subTypeBreakdown.map((s) => {
              const pct = kpis.submissions > 0 ? Math.round((s.count / kpis.submissions) * 100) : 0;
              const color = getScoreColor(colors, s.avgScore);
              return (
                <View key={s.subType} style={[reportStyles.card, isTablet && styles.subTypeCardTablet]}>
                  <View style={styles.subTypeHeader}>
                    <ThemedText weight="semiBold" style={styles.subTypeTitle} numberOfLines={1}>
                      {SUBTYPE_LABELS[s.subType] || s.subType}
                    </ThemedText>
                    <View style={styles.subTypeBadge}>
                      <ThemedText style={styles.subTypeBadgeText}>{s.count} · {pct}%</ThemedText>
                    </View>
                  </View>
                  <ThemedText weight="extraBold" style={[styles.subTypeScore, { color }]}>
                    {s.avgScore}<ThemedText weight="regular" style={styles.subTypeScoreUnit}> /100 avg</ThemedText>
                  </ThemedText>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, s.avgScore))}%`, backgroundColor: color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {criteria && criteria.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="SPEAKING CRITERIA"
            meta="your average per criterion"
            onInfoPress={() => setInfoKey('criteria')}
          />
          <View style={reportStyles.card}>
            {criteria.map((c, i) => {
              const color = getScoreColor(colors, c.avgScore);
              const weightPills = Object.entries(criteriaWeights || {})
                .filter(([, weights]) => weights[c.key] != null)
                .map(([subType, weights]) => ({ subType, weight: weights[c.key] }));

              return (
                <View key={c.key} style={[styles.criterionRow, i > 0 && styles.criterionRowDivider]}>
                  <View style={reportStyles.headerRow}>
                    <ThemedText weight="semiBold" style={styles.criterionLabel}>{c.label}</ThemedText>
                    <ThemedText weight="bold" style={[styles.criterionScore, { color }]}>{c.avgScore}</ThemedText>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, c.avgScore))}%`, backgroundColor: color }]} />
                  </View>
                  {weightPills.length > 0 && (
                    <View style={[styles.weightPillsWrap, isTablet && styles.weightPillsWrapTablet]}>
                      <ThemedText style={[styles.weightPillIntro, isTablet && styles.weightPillIntroTablet]}>
                        Counts toward score:
                      </ThemedText>
                      <View style={styles.weightPillRow}>
                        {weightPills.map((p) => (
                          <View key={p.subType} style={styles.weightPill}>
                            <ThemedText style={styles.weightPillText}>
                              {SUBTYPE_SHORT_LABELS[p.subType] || p.subType} {p.weight}%
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {sortedErrors.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="LANGUAGE & LOGIC MISTAKES"
            meta={`${totalErrors} total`}
            onInfoPress={() => setInfoKey('errors')}
          />
          <View style={reportStyles.card}>
            {sortedErrors.map((e, i) => (
              <BarRow
                key={i}
                label={formatErrorTypeLabel(e.type)}
                value={e.count}
                max={maxErrorCount}
                color={catForType(e.type).color}
              />
            ))}
          </View>
        </View>
      )}

      {voiceErrorWords && voiceErrorWords.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="PRONUNCIATION ISSUES"
            meta={`${voiceErrorTotal ?? voiceErrorWords.length} total`}
            onInfoPress={() => setInfoKey('pronunciation')}
          />
          <View style={reportStyles.card}>
            {voiceErrorWords.map((w, i) => (
              <BarRow
                key={i}
                label={w.count > 1 ? `${w.word} ×${w.count}` : w.word}
                value={w.avgAccuracy}
                max={maxVoiceErrorAccuracy}
                color={getScoreColor(colors, w.avgAccuracy)}
              />
            ))}
          </View>
        </View>
      )}

      <InfoModal
        visible={!!infoKey}
        onClose={() => setInfoKey(null)}
        title={infoKey ? SECTION_INFO[infoKey].title : ''}
        height={SCREEN_HEIGHT * 0.4}
        primaryButton={{ text: 'Close', onPress: () => setInfoKey(null) }}
      >
        <ThemedText style={styles.infoModalText}>{infoKey ? SECTION_INFO[infoKey].text : ''}</ThemedText>
      </InfoModal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#727272',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#E7E9FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 14,
    color: '#3E4EF0',
  },
  tileRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tileHalf: {
    flex: 1,
  },
  tileFifth: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabelNoMargin: {
    marginBottom: 0,
  },
  sectionMeta: {
    fontSize: 12,
    color: '#969696',
  },
  infoModalText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#3A3A3A',
    padding: 16,
  },
  voiceProfileCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  subTypeGrid: {
    gap: 8,
  },
  subTypeGridTablet: {
    flexDirection: 'row',
  },
  subTypeCardTablet: {
    flex: 1,
  },
  subTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subTypeTitle: {
    fontSize: 13,
    color: '#3A3A3A',
    flex: 1,
    marginRight: 6,
  },
  subTypeBadge: {
    backgroundColor: '#F3F4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subTypeBadgeText: {
    fontSize: 10,
    color: '#969696',
  },
  subTypeScore: {
    fontSize: 22,
    marginBottom: 8,
  },
  subTypeScoreUnit: {
    fontSize: 12,
    color: '#969696',
  },
  criterionRow: {
    paddingVertical: 14,
  },
  criterionRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4FF',
  },
  criterionLabel: {
    fontSize: 15,
    color: '#3A3A3A',
    flex: 1,
  },
  criterionScore: {
    fontSize: 17,
  },
  weightPillsWrap: {
    marginTop: 10,
  },
  weightPillsWrapTablet: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  weightPillIntro: {
    fontSize: 11,
    color: '#969696',
    marginBottom: 6,
  },
  weightPillIntroTablet: {
    marginBottom: 0,
    marginRight: 6,
  },
  weightPill: {
    backgroundColor: '#F3F4FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  weightPillText: {
    fontSize: 11,
    color: '#727272',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4FF',
    overflow: 'hidden',
    marginTop: 4,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});

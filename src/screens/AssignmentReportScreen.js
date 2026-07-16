import {useLocalSearchParams} from 'expo-router';
import React, {useState} from 'react';
import {ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import AudioPlayer from '../components/AudioPlayer';
import CircularProgress from '../components/CircularProgress';
import InfoModal from '../components/InfoModal';
import ReportAnnotatedText from '../components/report/ReportAnnotatedText';
import {getHighlightIssues} from '../components/report/reportIssueCategories';
import ReportScreenShell from '../components/report/ReportScreenShell';
import reportStyles from '../components/report/reportStyles';
import ThemedIcon from '../components/ThemedIcon';
import {ThemedText} from '../components/ThemedText';
import {useTheme} from '../theme/ThemeContext';

const VOICE_METRIC_INFO = [
  { key: 'prosody', label: 'Prosody', description: 'Stress, rhythm and intonation of your speech.' },
  { key: 'pronunciation', label: 'Pronunciation', description: 'How accurately individual sounds were produced.' },
  { key: 'completeness', label: 'Completeness', description: 'How much of the expected text you actually produced.' },
  { key: 'fluency', label: 'Fluency', description: 'Smoothness, pacing and pausing.' },
  { key: 'accuracy', label: 'Accuracy', description: 'Correctness of the words you produced.' },
];

function RecordingTab({ firstResult, reportData, issuesPanel, mistakes, voiceErrors, resolvedAudioUrl, audioResolving }) {
  const { shadows } = useTheme();
  const isReadAloud = reportData.subType === 'read_aloud';
  const resultDetail = firstResult?.result || {};
  const transcription = resultDetail.transcription || '';
  const audioDuration = firstResult?.durationAsSeconds ?? resultDetail.durationAsSeconds;

  const languageConventionIssues = (mistakes || []).filter((m) => m.type !== 'logic-error');
  const logicIssues = (mistakes || []).filter((m) => m.type === 'logic-error');
  const pronunciationIssues = voiceErrors || [];

  // Aynı anda sadece aktif panonun (ve Language Convention'daysa seçili kategorinin) hataları vurgulanır
  const highlightedLcIssues = issuesPanel.lcFilter === 'all'
    ? languageConventionIssues
    : languageConventionIssues.filter((i) => i.type === issuesPanel.lcFilter);
  const annotationIssues = getHighlightIssues(issuesPanel.activeIssueTab, issuesPanel.lcFilter, {
    pronunciationIssues,
    lcIssues: languageConventionIssues,
    logicIssues,
  });

  return (
    <View>
      <View style={[styles.introCard, shadows.light]}>
        <ThemedText weight="bold" style={styles.tabIntroTitle}>
          {isReadAloud ? 'Your reading, annotated' : 'Your speech, annotated'}
        </ThemedText>
        <ThemedText style={styles.tabIntroSubtitle}>
          Words with feedback are highlighted. Open a tab to see voice, language and logic detail.
        </ThemedText>
      </View>

      <View style={{ gap: 16 }}>
        {resolvedAudioUrl ? (
          <AudioPlayer
            audioUri={resolvedAudioUrl}
            duration={audioDuration}
            onError={(error) => {
              console.error('Audio playback error:', error);
              Alert.alert('Playback Error', 'Failed to play audio.');
            }}
          />
        ) : audioResolving ? (
          <ActivityIndicator size="small" color="#3E4EF0" />
        ) : (
          <View style={[styles.noRecordingCard, shadows.light]}>
            <ThemedText style={styles.noRecordingText}>No recording available for this submission.</ThemedText>
          </View>
        )}

        {!!transcription && (
          <View>
            <ThemedText weight="bold" style={reportStyles.sectionLabel}>
              {isReadAloud ? 'YOUR READING' : 'RESPONSE'}
            </ThemedText>
            <View style={[styles.transcriptionCard, shadows.light]}>
              <ReportAnnotatedText
                text={transcription}
                issues={annotationIssues}
                onIssuePress={(issue) => issuesPanel.handleIssuePress(issue, {
                  pronunciation: pronunciationIssues,
                  languageConvention: highlightedLcIssues,
                  logic: logicIssues,
                })}
                style={styles.transcriptionText}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function VoiceResultCharts({ firstResult }) {
  const [showMoreCharts, setShowMoreCharts] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const voiceResult = firstResult?.result?.voiceResult || {};

  return (
    <View>
      <View style={styles.divider} />

      <View style={styles.chartsHeaderRow}>
        <TouchableOpacity
          onPress={() => setInfoModalVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ThemedIcon iconName="info" size={20} tintColor="#969696" />
        </TouchableOpacity>
      </View>

      <View style={styles.circularProgressContainer}>
        <CircularProgress value={voiceResult.prosody || 0} label="Prosody" size={80} strokeWidth={8} color="#3E4EF0" shouldAnimate />
        <CircularProgress value={voiceResult.pronunciation || 0} label="Pronunciation" size={80} strokeWidth={8} color="#3E4EF0" shouldAnimate />
        <CircularProgress value={voiceResult.completeness || 0} label="Completeness" size={80} strokeWidth={8} color="#3E4EF0" shouldAnimate />
      </View>

      {showMoreCharts && (
        <View style={styles.moreChartsContainer}>
          <CircularProgress value={voiceResult.fluency || 0} label="Fluency" size={80} strokeWidth={8} color="#3E4EF0" shouldAnimate={showMoreCharts} />
          <CircularProgress value={voiceResult.accuracy || 0} label="Accuracy" size={80} strokeWidth={8} color="#3E4EF0" shouldAnimate={showMoreCharts} />
        </View>
      )}

      <View style={styles.divider} />
      <View style={styles.moreLinkContainer}>
        <TouchableOpacity style={styles.moreLink} onPress={() => setShowMoreCharts((v) => !v)} activeOpacity={0.7}>
          <ThemedText weight="bold" style={styles.moreLinkText}>
            {showMoreCharts ? 'Less' : 'More'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      <InfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        title="Scoring Criteria"
      >
        <ScrollView style={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          {VOICE_METRIC_INFO.map((metric, index) => (
            <View
              key={metric.key}
              style={[styles.metricInfoRow, index === VOICE_METRIC_INFO.length - 1 && { borderBottomWidth: 0 }]}
            >
              <ThemedText weight="bold" style={styles.metricInfoLabel}>{metric.label}</ThemedText>
              <ThemedText style={styles.metricInfoDescription}>{metric.description}</ThemedText>
            </View>
          ))}
        </ScrollView>
      </InfoModal>
    </View>
  );
}

export default function AssignmentReportScreen() {
  const params = useLocalSearchParams();
  const { solvedTaskId, reportId } = params || {};
  const taskId = reportId || solvedTaskId;

  return (
    <ReportScreenShell
      taskId={taskId}
      headerTitleFallback="Assignment Report"
      firstTabKey="recording"
      firstTabLabel="Your Recording"
      getCriteria={(firstResult) => firstResult?.result?.criteria || []}
      getFeedback={(firstResult) => firstResult?.result?.feedback || null}
      getMistakes={(firstResult) => firstResult?.result?.mistakes || []}
      getVoiceErrors={(firstResult) => firstResult?.result?.voiceErrors || []}
      getResponseTextForIssues={(firstResult) => firstResult?.result?.transcription || ''}
      getScoreBreakdown={(firstResult) => firstResult?.result?.scoreBreakdown || null}
      getAudioUrl={(firstResult) => firstResult?.audioUrl}
      getCompletenessInfo={(scoreBreakdown, reportData) => {
        const isReadAloud = reportData?.subType === 'read_aloud';
        return {
          label: isReadAloud ? 'Reading Completeness' : 'Speaking Completeness',
          note: `You ${isReadAloud ? 'read' : 'spoke'} ${scoreBreakdown?.completeness ?? 0}% of the expected length, so your maximum possible score is capped at ${scoreBreakdown?.maxAchievable ?? 0}. ${isReadAloud ? 'Read' : 'Speak'} the full expected amount to lift this cap.`,
        };
      }}
      renderFirstTab={({ firstResult, reportData, issuesPanel, mistakes, voiceErrors, resolvedAudioUrl, audioResolving }) => (
        <RecordingTab
          firstResult={firstResult}
          reportData={reportData}
          issuesPanel={issuesPanel}
          mistakes={mistakes}
          voiceErrors={voiceErrors}
          resolvedAudioUrl={resolvedAudioUrl}
          audioResolving={audioResolving}
        />
      )}
      renderStatisticExtra={({ firstResult }) => <VoiceResultCharts firstResult={firstResult} />}
    />
  );
}

const styles = StyleSheet.create({
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tabIntroTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  tabIntroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#727272',
  },
  noRecordingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  noRecordingText: {
    fontSize: 14,
    color: '#727272',
    textAlign: 'center',
  },
  transcriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  transcriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#3A3A3A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4FF',
    marginVertical: 16,
  },
  chartsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  metricInfoRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4FF',
  },
  metricInfoLabel: {
    fontSize: 15,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  metricInfoDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#727272',
  },
  circularProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moreChartsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 8,
  },
  moreLinkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreLink: {
    paddingHorizontal: 16,
  },
  moreLinkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3E4EF0',
  },
});

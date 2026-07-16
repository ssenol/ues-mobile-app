import {useLocalSearchParams} from 'expo-router';
import React from 'react';
import {StyleSheet, View} from 'react-native';
import ReportAnnotatedText from '../components/report/ReportAnnotatedText';
import {getHighlightIssues} from '../components/report/reportIssueCategories';
import ReportScreenShell from '../components/report/ReportScreenShell';
import reportStyles from '../components/report/reportStyles';
import {stripHtml} from '../components/report/reportUtils';
import {ThemedText} from '../components/ThemedText';
import {useTheme} from '../theme/ThemeContext';

// User mesajlarındaki correction HTML'ini parse edip styled Text bileşenleri döndürür (sohbet balonuna özgü, eski span sistemi)
const PUNCTUATION = /^[,.\-!?;:'")\]]/;

const parseCorrection = (html, fonts) => {
  if (!html) return null;

  const normalized = html
    .replace(/```html?\s*/gi, '')    // ```html veya ``` başlangıç
    .replace(/```/g, '')             // ``` kapanış
    .replace(/<br\s*\/?>/gi, ' ')    // <br> → boşluk
    .replace(/\s+/g, ' ')           // çoklu boşluk → tek boşluk
    .trim();

  const parts = [];
  const spanRegex = /<span([^>]*)>(.*?)<\/span>/gi;
  let match;
  let index = 0;
  let lastIndex = 0;

  while ((match = spanRegex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      // Span'lar arasındaki düz metin varsa ekle
      const between = normalized.substring(lastIndex, match.index);
      if (between) {
        parts.push(<ThemedText key={`bt-${index}`} style={{ fontFamily: fonts.regular }}>{between}</ThemedText>);
      }
    } else if (lastIndex > 0) {
      // Bitişik span'lar: içerik noktalama ile başlamıyorsa boşluk ekle
      const text = match[2];
      if (!PUNCTUATION.test(text)) {
        parts.push(<ThemedText key={`sp-${index}`} style={{ fontFamily: fonts.regular }}>{' '}</ThemedText>);
      }
    }

    const attrs = match[1];
    const text = match[2];

    if (/class\s*=\s*["']mistaken-word["']/.test(attrs)) {
      parts.push(
        <ThemedText key={index} style={[styles.mistakenWord, { fontFamily: fonts.regular }]}>{text}</ThemedText>
      );
    } else if (/class\s*=\s*["']corrected-word["']/.test(attrs)) {
      parts.push(
        <ThemedText key={index} style={[styles.correctedWord, { fontFamily: fonts.bold }]}>{text}</ThemedText>
      );
    } else {
      parts.push(
        <ThemedText key={index} style={{ fontFamily: fonts.regular }}>{text}</ThemedText>
      );
    }
    lastIndex = match.index + match[0].length;
    index++;
  }

  // Son span'dan sonra kalan düz metin varsa ekle
  if (lastIndex < normalized.length) {
    const remaining = normalized.substring(lastIndex);
    if (remaining.trim()) {
      parts.push(<ThemedText key={`end-${index}`} style={{ fontFamily: fonts.regular }}>{remaining}</ThemedText>);
    }
  }

  return parts.length > 0 ? parts : null;
};

function DialogueTab({ firstResult, issuesPanel, mistakes, voiceErrors }) {
  const { fonts, shadows } = useTheme();
  const messages = firstResult?.messages || [];

  const languageConventionIssues = (mistakes || []).filter((m) => m.type !== 'logic-error');
  const logicIssues = (mistakes || []).filter((m) => m.type === 'logic-error');

  const renderMessage = (msg, index) => {
    if (msg.role === 'assistant') {
      return (
        <View key={index} style={[styles.messageBubble, styles.botBubble]}>
          <View style={styles.messageHeader}>
            <ThemedText weight="semibold" style={styles.messageHeaderText}>TalkBuddy</ThemedText>
          </View>
          <ThemedText weight="semiBold" style={styles.messageText}>
            {stripHtml(msg.content)}
          </ThemedText>
        </View>
      );
    }

    if (msg.role === 'user') {
      // Eski kayıtlarda hazır HTML correction gelir; yeni sistemde mistakes/voiceErrors ile vurgulanır
      const correctionParts = parseCorrection(msg.correction, fonts);
      const messagePronunciationIssues = (voiceErrors || []).filter((v) => v.__messageIndex === index);
      // Aynı anda sadece aktif panonun (ve Language Convention'daysa seçili kategorinin) hataları vurgulanır
      const highlightedLcIssues = issuesPanel.lcFilter === 'all'
        ? languageConventionIssues
        : languageConventionIssues.filter((i) => i.type === issuesPanel.lcFilter);
      const annotationIssues = getHighlightIssues(issuesPanel.activeIssueTab, issuesPanel.lcFilter, {
        pronunciationIssues: messagePronunciationIssues,
        lcIssues: languageConventionIssues,
        logicIssues,
      });

      return (
        <View key={index} style={[styles.messageBubble, styles.userBubble]}>
          {correctionParts ? (
            <ThemedText style={[styles.messageText, { fontFamily: fonts.semiBold }]}>
              {correctionParts}
            </ThemedText>
          ) : (
            <ReportAnnotatedText
              text={stripHtml(msg.content)}
              issues={annotationIssues}
              onIssuePress={(issue) => issuesPanel.handleIssuePress(issue, {
                pronunciation: voiceErrors,
                languageConvention: highlightedLcIssues,
                logic: logicIssues,
              })}
              style={[styles.messageText, { fontFamily: fonts.semiBold }]}
            />
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View>
      <View style={[styles.introCard, shadows.light]}>
        <ThemedText weight="bold" style={styles.tabIntroTitle}>Your conversation</ThemedText>
        <ThemedText style={styles.tabIntroSubtitle}>
          Words with feedback are highlighted. Open a tab to see voice, language and logic detail.
        </ThemedText>
      </View>

      <ThemedText weight="bold" style={reportStyles.sectionLabel}>CONVERSATION</ThemedText>
      <View style={[styles.conversationCard, shadows.light]}>
        <View style={styles.messagesContainer}>
          {messages.length > 0 ? (
            messages.map((msg, index) => renderMessage(msg, index))
          ) : (
            <ThemedText style={styles.emptyMessagesText}>No conversation data available.</ThemedText>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ScenarioReportScreen() {
  const params = useLocalSearchParams();
  const { solvedTaskId, reportId } = params || {};
  const taskId = reportId || solvedTaskId;

  return (
    <ReportScreenShell
      taskId={taskId}
      headerTitleFallback="Scenario Report"
      firstTabKey="dialogue"
      firstTabLabel="Your Dialogue"
      getCriteria={(firstResult) => firstResult?.criteria || []}
      getFeedback={(firstResult) => firstResult?.feedback || null}
      getMistakes={(firstResult) => firstResult?.mistakes || []}
      getVoiceErrors={(firstResult) => (firstResult?.messages || []).flatMap((m, idx) => (
        m.role === 'user' ? (m.speechScore?.voiceErrors || []).map((v) => ({ ...v, __messageIndex: idx })) : []
      ))}
      getResponseTextForIssues={(firstResult) => (firstResult?.messages || [])
        .filter((m) => m.role === 'user')
        .map((m) => stripHtml(m.content))
        .join(' ')}
      getScoreBreakdown={(firstResult) => firstResult?.scoreBreakdown || null}
      getCompletenessInfo={(scoreBreakdown) => ({
        label: 'Dialogue Completeness',
        note: `You completed ${scoreBreakdown?.completeness ?? 0}% of the expected dialogue, so your maximum possible score is capped at ${scoreBreakdown?.maxAchievable ?? 0}. Take more turns to lift this cap.`,
      })}
      renderFirstTab={({ firstResult, issuesPanel, mistakes, voiceErrors }) => (
        <DialogueTab
          firstResult={firstResult}
          issuesPanel={issuesPanel}
          mistakes={mistakes}
          voiceErrors={voiceErrors}
        />
      )}
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
  conversationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  messagesContainer: {
    marginBottom: 0,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: '#E7E9FF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3A3A3A',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageHeaderText: {
    fontSize: 12,
    color: '#949494',
  },
  mistakenWord: {
    color: '#EB4335',
    textDecorationLine: 'line-through',
  },
  correctedWord: {
    color: '#34A853',
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#727272',
    textAlign: 'center',
  },
});

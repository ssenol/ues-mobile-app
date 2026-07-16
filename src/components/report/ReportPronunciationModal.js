import {useAudioPlayer} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Dimensions, Modal, PanResponder, Pressable, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {getWordTts} from '../../services/speak';
import ThemedIcon from '../ThemedIcon';
import {ThemedText} from '../ThemedText';
import {useTheme} from '../../theme/ThemeContext';
import {getScoreColor} from './reportUtils';

const { height: SCREEN_H } = Dimensions.get('window');

// Kelime/mesaj değişiminde eski native player zaten serbest bırakılmış olabilir
// (expo-audio kaynak değişince kendi iç effect'iyle onu yok ediyor) — bu yarış
// durumunda play/pause/seekTo çağrıları NativeSharedObjectNotFoundException fırlatabilir
function safeCall(fn) {
  try {
    fn();
  } catch (_error) {
    // yok sayılır — player zaten serbest bırakılmış
  }
}

// Telaffuz hatası detayını ortada gösteren modal (prev/next ile gezinilebilir)
// audioUri: kullanıcının tam ses kaydı (varsa) — issue.startTime/endTime aralığı bundan çalınır
export default function ReportPronunciationModal({ issue, index, total, onPrev, onNext, onClose, audioUri }) {
  const { colors } = useTheme();

  const recordingPlayer = useAudioPlayer(audioUri || '');
  const segmentEndRef = useRef(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  const [ttsUri, setTtsUri] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const ttsPlayer = useAudioPlayer(ttsUri || '');
  const ttsWordRef = useRef(null);

  useEffect(() => {
    const subscription = recordingPlayer.addListener('playbackStatusUpdate', (status) => {
      if (segmentEndRef.current != null && status.currentTime >= segmentEndRef.current) {
        safeCall(() => recordingPlayer.pause());
        segmentEndRef.current = null;
        setIsPlayingRecording(false);
      }
    });
    return () => subscription.remove();
  }, [recordingPlayer]);

  useEffect(() => {
    const subscription = ttsPlayer.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        setIsPlayingTts(false);
      }
    });
    return () => subscription.remove();
  }, [ttsPlayer]);

  useEffect(() => {
    if (ttsUri) {
      setIsPlayingTts(true);
      safeCall(() => ttsPlayer.play());
    }
  }, [ttsUri, ttsPlayer]);

  // Modal kapanınca/kelime değişince oynatmayı durdur
  useEffect(() => {
    return () => {
      segmentEndRef.current = null;
      safeCall(() => recordingPlayer.pause());
      safeCall(() => ttsPlayer.pause());
      setIsPlayingRecording(false);
      setIsPlayingTts(false);
    };
  }, [issue, recordingPlayer, ttsPlayer]);

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

  const accuracy = issue.accuracy ?? 0;
  const accuracyColor = getScoreColor(colors, accuracy);
  const hasRecordingSegment = !!audioUri && issue.startTime != null && issue.endTime != null;

  const playRecordingSegment = async () => {
    segmentEndRef.current = issue.endTime;
    setIsPlayingRecording(true);
    try {
      await recordingPlayer.seekTo(issue.startTime);
      safeCall(() => recordingPlayer.play());
    } catch (_error) {
      setIsPlayingRecording(false);
    }
  };

  const playCorrectPronunciation = async () => {
    if (!issue.word) return;

    if (ttsWordRef.current === issue.word && ttsUri) {
      setIsPlayingTts(true);
      safeCall(() => {
        ttsPlayer.seekTo(0);
        ttsPlayer.play();
      });
      return;
    }

    setTtsLoading(true);
    try {
      const uri = await getWordTts(issue.word, 'slow', 'nova');
      ttsWordRef.current = issue.word;
      setTtsUri(uri);
    } catch (error) {
      console.error('word-tts error:', error);
    } finally {
      setTtsLoading(false);
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose} visible>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={styles.card} {...panResponder.panHandlers}>
          <View style={styles.topRow}>
            <ThemedText weight="bold" style={styles.catLabel}>Pronunciation</ThemedText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <ThemedIcon iconName="close" size={16} tintColor="#969696" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, marginTop: 14 }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <View style={styles.wordRow}>
              <ThemedText weight="bold" style={styles.word}>{issue.word || '—'}</ThemedText>
              <View style={[styles.accuracyBadge, { backgroundColor: `${accuracyColor}22` }]}>
                <ThemedText weight="bold" style={[styles.accuracyText, { color: accuracyColor }]}>
                  {accuracy}
                </ThemedText>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, accuracy))}%`, backgroundColor: accuracyColor }]} />
            </View>

            <ThemedText style={styles.detailText}>
              {issue.reason || 'Detailed pronunciation feedback for this word is not available yet.'}
            </ThemedText>

            <View style={styles.playRow}>
              {hasRecordingSegment && (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playRecordingSegment}
                  disabled={isPlayingRecording}
                  activeOpacity={0.8}
                >
                  <ThemedIcon iconName={isPlayingRecording ? 'pause' : 'play'} size={16} tintColor="#3E4EF0" />
                  <ThemedText weight="semiBold" style={styles.playButtonText}>You said</ThemedText>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.playButton}
                onPress={playCorrectPronunciation}
                disabled={ttsLoading || isPlayingTts}
                activeOpacity={0.8}
              >
                {ttsLoading ? (
                  <ActivityIndicator size="small" color="#3E4EF0" />
                ) : (
                  <ThemedIcon iconName={isPlayingTts ? 'pause' : 'play'} size={16} tintColor="#3E4EF0" />
                )}
                <ThemedText weight="semiBold" style={styles.playButtonText}>Correct</ThemedText>
              </TouchableOpacity>
            </View>
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
    height: SCREEN_H * 0.46,
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
    color: '#3A3A3A',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  word: {
    fontSize: 20,
    color: '#3A3A3A',
  },
  accuracyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accuracyText: {
    fontSize: 16,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4FF',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#3A3A3A',
  },
  playRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4FF',
  },
  playButtonText: {
    fontSize: 13,
    color: '#3E4EF0',
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

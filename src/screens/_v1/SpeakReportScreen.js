import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
} from "react-native";
import { Svg, Path, Circle, Line, Text as SvgText } from "react-native-svg";
import Icon from "../components/Icon";
import colors from "../styles/colors";
import { useSelector } from "react-redux";
import { Audio } from "expo-av";
import { PanGestureHandler } from 'react-native-gesture-handler';

const { width } = Dimensions.get("window");
const CARD_PADDING = 18;
const CARD_WIDTH = width - 2 * CARD_PADDING;

const FEEDBACK_TYPES = {
  pronunciation: "Pronunciation",
  fluency: "Fluency",
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  content: "Content",
  general: "General Feedback",
};

const SpeakReportScreen = ({ route, navigation }) => {
  // Parametre isimleri ve fallback'ler
  const reduxSpeakResults = useSelector((state) => state.speak?.speakResults);

  // Redux'tan gelen veri bir katman daha içerebilir, düzelt
  let reduxResults = reduxSpeakResults;
  if (reduxResults && reduxResults.speechResults) {
    reduxResults = reduxResults.speechResults;
  }

  // route.params'tan tüm olası anahtarları kontrol et
  const {
    reportResults,
    speakResults,
    prevResults,
    quizName,
    speechData,
    speakData,
    taskDetails,
    taskType,
    questionSubDetails,
    ...restParams
  } = route.params || {};

  // route.params'tan results parametresini al
  const results = route?.params?.results;
  // Eğer results bir dizi ise doğrudan kullan
  let normalizedResults = Array.isArray(results) && results.length > 0 ? results : [];

  // Çoklu rapor: prevResults ile gelen veya results dizisi 2+ ise aktif
  const isMultiReport = Array.isArray(results) && results.length > 1;

  // Eğer tekli rapor ise swipe ve sayfa geçişini gizle
  // currentPage ve setCurrentPage sadece isMultiReport true ise kullanılacak
  const [currentPage, setCurrentPage] = useState(0);
  const [feedbackPage, setFeedbackPage] = useState(0);
  const scrollRef = useRef();
  const currentResult = isMultiReport ? normalizedResults[currentPage] : normalizedResults[0];

  // --- Responsive Radar Chart boyut fonksiyonu ---
  const getRadarChartSize = () => {
    const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
    const minSize = 180;
    const maxSize = 400;
    // Hem genişliğin %80'i hem yüksekliğin %45'i alınır
    const responsiveSize = Math.min(SCREEN_WIDTH * 0.8, SCREEN_HEIGHT * 0.45);
    return Math.max(minSize, Math.min(maxSize, responsiveSize));
  };

  // --- Normalizasyon fonksiyonu ---
  function extractReportData(resultObj) {
    if (!resultObj) return {
      scores: [],
      suggestions: [],
      audioUrl: null,
      questionText: '',
      userAnswerText: '',
      totalScore: null,
      type: '',
      rubric: '',
    };
    // Eğer resultObj.result varsa, içeriği oradan çıkar
    const result = resultObj.result || resultObj;
    const answer =
      result?.studentAnswers && Array.isArray(result.studentAnswers) && result.studentAnswers.length > 0
        ? result.studentAnswers[0]
        : null;
    const correctAnswer = answer?.correctAnswer || {};
    const aiResponse = correctAnswer?.aiResponse || {};
    const evulationResult = correctAnswer?.evulationResult || {};
    // Radar chart için skorları anahtar-değerden label-value objelerine çevir
    const scores = evulationResult && typeof evulationResult === 'object'
      ? Object.entries(evulationResult).map(([label, value]) => ({
          label: label.replace(/Score$/, ""),
          value: typeof value === "number" ? value : Number(value) || 0,
        }))
      : [];
    // Feedback kartları
    const suggestions = Array.isArray(aiResponse.suggestions) ? aiResponse.suggestions : [];
    // Ses kaydı
    const audioUrl = answer?.userAnswer?.audio || null;
    // Başlık ve açıklama
    const questionText = correctAnswer?.text || "";
    const userAnswerText = answer?.userAnswer?.text || "";
    return {
      scores,
      suggestions,
      audioUrl,
      questionText,
      userAnswerText,
      totalScore: result?.totalScore ?? null,
      type: answer?.type || '',
      rubric: aiResponse.rubricEvaluationResult || "",
    };
  }

  // --- Normalize edilmiş veri ---
  let reportData = {
    scores: [],
    suggestions: [],
    audioUrl: null,
    questionText: '',
    userAnswerText: '',
    totalScore: null,
    type: '',
    rubric: '',
  };
  try {
    reportData = extractReportData(currentResult);
  } catch (e) {
    // Hatalı veri durumunda ekranı boş göster
    reportData = {
      scores: [],
      suggestions: [],
      audioUrl: null,
      questionText: '',
      userAnswerText: '',
      totalScore: null,
      type: '',
      rubric: '',
    };
  }
  const scores = Array.isArray(reportData.scores) ? reportData.scores : [];
  const labels = scores.map((s) => ({ text: s.label, angle: 0 }));
  const chartScores = scores.map((s) => s.value);
  const suggestions = { data: { suggestion: Array.isArray(reportData.suggestions) ? reportData.suggestions : [] } };
  const recordedUri = reportData.audioUrl;
  const questionText = reportData.questionText;
  // const userAnswerText = reportData.userAnswerText;
  // const totalScore = reportData.totalScore;
  // const rubric = reportData.rubric;

  // Radar chart çizimi için parametreler
  const numPoints = chartScores.length;
  const angleStep = numPoints > 0 ? (2 * Math.PI) / numPoints : 0;
  const maxScore = 100;
  const points =
    numPoints > 0
      ? chartScores.map((score, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const ratio = score / maxScore;
          return {
            angle,
            ratio,
            score,
          };
        })
      : [];

  // Başlık ve açıklama için fallback
  const displayQuizName = questionText || quizName || restParams.quizName || "Speak Report";
  // const displaySpeechData = userAnswerText || speechData || speakData || "";

  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(null);
  const canPlayAudio = !!recordedUri;

  // Ses oynatımı yönetimi
  useEffect(() => {
    return () => {
      if (sound) {
        sound.stopAsync && sound.stopAsync();
        sound.unloadAsync && sound.unloadAsync();
      }
      setIsPlaying(false);
      setSound(null);
    };
  }, [currentPage, navigation]);

  useEffect(() => {
    if (!recordedUri) {
      setAudioDuration(null);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        const { sound: tempSound } = await Audio.Sound.createAsync(
          { uri: recordedUri },
          {},
          undefined,
          true
        );
        const status = await tempSound.getStatusAsync();
        if (isMounted && status && status.durationMillis) {
          setAudioDuration(Math.round(status.durationMillis / 1000));
        }
        await tempSound.unloadAsync();
      } catch {
        setAudioDuration(null);
      }
    })();
    return () => { isMounted = false; };
  }, [recordedUri]);

  function formatDuration(sec) {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`;
  }

  // Ses kaydını çal/durdur fonksiyonu
  const handlePlayAudio = async () => {
    try {
      if (isPlaying) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
        }
        setIsPlaying(false);
        return;
      }
      if (!recordedUri) return;
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (err) {
      setIsPlaying(false);
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      alert("Ses kaydı çalınamadı.");
    }
  };

  // 1. isFeedbackScrolling state'i ekle
  const [isFeedbackScrolling, setIsFeedbackScrolling] = useState(false);

  // FEEDBACK_TYPES kullanılmasın, başlıklar dinamik olarak işlenmeli
  function formatFeedbackTitle(type) {
    if (!type) return '';
    // tireleri boşlukla değiştir, her kelimenin baş harfini büyüt
    return type
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // currentPage değişince feedbackPage'i sıfırla
  useEffect(() => {
    setFeedbackPage(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [currentPage]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Sayfa geçiş okları ve gösterge */}
        {isMultiReport && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <TouchableOpacity
              onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              style={{ opacity: currentPage === 0 ? 0.4 : 1, marginRight: 8, width: 32, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon iosName="chevron.left" androidName="chevron-left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, color: colors.primary, fontWeight: 'bold', minWidth: 54, textAlign: 'center' }}>{`${currentPage + 1} / ${normalizedResults.length}`}</Text>
            <TouchableOpacity
              onPress={() => setCurrentPage((prev) => Math.min(prev + 1, normalizedResults.length - 1))}
              disabled={currentPage === normalizedResults.length - 1}
              style={{ opacity: currentPage === normalizedResults.length - 1 ? 0.4 : 1, marginLeft: 8, width: 32, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon iosName="chevron.right" androidName="chevron-right" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        )}
        {/* Başlık tam metin olarak */}
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { textAlign: 'center' }]}>{displayQuizName}</Text>
        </View>
        {/* Radar Grafik Kartı */}
        <View style={styles.radarCardContainer}>
          {(() => {
            // Responsive SVG boyutu
            const SVG_SIZE = getRadarChartSize();
            const RADAR_MARGIN = 34;
            const center = { x: SVG_SIZE / 2, y: SVG_SIZE / 2 };
            const radius = (SVG_SIZE / 2) - RADAR_MARGIN;
            const labelRadius = radius + 18;
            labels.forEach((label, i) => {
              label.angle = i * angleStep - Math.PI / 2;
            });
            return (
              <Svg width={SVG_SIZE} height={SVG_SIZE} style={{ alignSelf: 'center', padding: 0 }}>
                {/* Grid çizgileri */}
                {numPoints > 0 && Array.from({ length: 4 }, (_, i) => {
                  const gridRadius = ((i + 1) * radius) / 4;
                  const gridPoints = Array.from({ length: numPoints }, (_, j) => {
                    const angle = j * angleStep - Math.PI / 2;
                    return {
                      x: center.x + gridRadius * Math.cos(angle),
                      y: center.y + gridRadius * Math.sin(angle),
                    };
                  });
                  return (
                    <Path
                      key={`grid-${i}`}
                      d={
                        gridPoints.reduce(
                          (path, point, j) =>
                            path + (j === 0 ? "M" : "L") + point.x + "," + point.y,
                          ""
                        ) + (gridPoints.length > 1 ? "Z" : "")
                      }
                      stroke={colors.slate400}
                      strokeWidth="1"
                      strokeDasharray="2"
                      fill="none"
                      opacity={0.45}
                    />
                  );
                })}
                {/* Eksen çizgileri */}
                {numPoints > 0 && Array.from({ length: numPoints }, (_, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  return (
                    <Line
                      key={`axis-${i}`}
                      x1={center.x}
                      y1={center.y}
                      x2={center.x + radius * Math.cos(angle)}
                      y2={center.y + radius * Math.sin(angle)}
                      stroke={colors.slate500}
                      strokeWidth="1.5"
                      opacity={0.32}
                    />
                  );
                })}
                {/* Veri alanı */}
                {points.length > 1 && (
                  <Path
                    d={points.reduce(
                      (path, point, j) =>
                        path + (j === 0 ? "M" : "L") + (center.x + (point.ratio * radius) * Math.cos(point.angle)) + "," + (center.y + (point.ratio * radius) * Math.sin(point.angle)),
                      ""
                    ) + (points.length > 1 ? "Z" : "")}
                    fill="rgba(234, 147, 51, 0.13)"
                    stroke={colors.secondary}
                    strokeWidth="2.2"
                  />
                )}
                {/* Veri noktaları ve değerleri */}
                {points.map((point, i) => {
                  const px = center.x + (point.ratio * radius) * Math.cos(point.angle);
                  const py = center.y + (point.ratio * radius) * Math.sin(point.angle);
                  return (
                    <React.Fragment key={`point-${i}`}>
                      <Circle
                        cx={px}
                        cy={py}
                        r="4.5"
                        fill={colors.secondary}
                        stroke="#fff"
                        strokeWidth="1.2"
                      />
                      <SvgText
                        x={px}
                        y={py - 14}
                        fill={colors.secondary}
                        fontSize="15"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {Math.round(point.score)}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
                {/* Etiketler */}
                {labels.map((label, i) => (
                  <SvgText
                    key={`label-${i}`}
                    x={center.x + labelRadius * Math.cos(label.angle)}
                    y={center.y + labelRadius * Math.sin(label.angle) + 18}
                    fill={colors.slate800}
                    fontSize="13"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {label.text}
                  </SvgText>
                ))}
              </Svg>
            );
          })()}
        </View>
        {/* Ses Kaydını Dinleme Butonu */}
        <TouchableOpacity
          style={styles.listenButton}
          onPress={handlePlayAudio}
          disabled={!canPlayAudio}
        >
          <Icon
            iosName={isPlaying ? "stop" : "volume.3"}
            androidName={isPlaying ? "stop" : "volume-up"}
            size={22}
            color={colors.white}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.listenButtonText}>
            {isPlaying ? "Stop Recording" : "Listen to Recording"}
            {audioDuration ? ` (${formatDuration(audioDuration)})` : ""}
          </Text>
        </TouchableOpacity>
        {/* Kaydırmalı Feedback Kartları */}
        <View style={styles.feedbackContainer}>
          <View style={styles.feedbackBorder}>
            {suggestions?.data?.suggestion?.length > 0 ? (
              <PanGestureHandler
                activeOffsetX={[-10, 10]} // Sadece yatay kaydırmayı yakala
                onGestureEvent={() => {}}
                onHandlerStateChange={(event) => {
                  // Gesture başladıysa parent swipe'ı engelle
                  if (event.nativeEvent.state === 2) { // BEGAN
                    setIsFeedbackScrolling(true);
                  }
                  // Gesture bittiğinde tekrar izin ver
                  if (event.nativeEvent.state === 5) { // END
                    setIsFeedbackScrolling(false);
                  }
                }}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled
                  snapToAlignment="start"
                  snapToInterval={width - 2 * CARD_PADDING}
                  decelerationRate={0}
                  onScroll={(event) => {
                    if (!isFeedbackScrolling) return;
                    const x = event.nativeEvent.contentOffset.x;
                    const page = Math.round(x / (width - 2 * CARD_PADDING));
                    setFeedbackPage(page);
                  }}
                  scrollEventThrottle={16}
                  ref={scrollRef}
                >
                  {suggestions.data.suggestion.map((item, index) => (
                    <View key={index} style={styles.feedbackCard}>
                      <Text style={styles.feedbackTitle}>
                        {formatFeedbackTitle(item.type)}
                      </Text>
                      <ScrollView
                        style={styles.feedbackTextContainer}
                        showsVerticalScrollIndicator={false}
                      >
                        <Text style={styles.feedbackText}>{item.feedback}</Text>
                      </ScrollView>
                    </View>
                  ))}
                </ScrollView>
              </PanGestureHandler>
            ) : (
              <View style={styles.noSuggestionsContainer}>
                <Text style={styles.noSuggestionsText}>
                  Değerlendirme sonuçları alınamadı.
                </Text>
              </View>
            )}
          </View>
          {/* Noktalı Sayfa Göstergesi ve Butonlu Sayfa Geçişi */}
          {suggestions?.data?.suggestion?.length > 0 && (
            <View style={styles.pageIndicator}>
              <TouchableOpacity
                onPress={() => {
                  setFeedbackPage((prev) => Math.max(prev - 1, 0));
                  scrollRef.current?.scrollTo({ x: (Math.max(feedbackPage - 1, 0)) * (width - 2 * CARD_PADDING), animated: true });
                }}
                disabled={feedbackPage === 0}
                style={{ opacity: feedbackPage === 0 ? 0.4 : 1, marginRight: 8 }}
              >
                <Icon iosName="chevron-back" androidName="chevron-left" size={24} color={colors.primary} />
              </TouchableOpacity>
              {suggestions.data.suggestion.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pageDot,
                    feedbackPage === index && styles.pageDotActive,
                  ]}
                />
              ))}
              <TouchableOpacity
                onPress={() => {
                  setFeedbackPage((prev) => Math.min(prev + 1, suggestions.data.suggestion.length - 1));
                  scrollRef.current?.scrollTo({ x: (Math.min(feedbackPage + 1, suggestions.data.suggestion.length - 1)) * (width - 2 * CARD_PADDING), animated: true });
                }}
                disabled={feedbackPage === suggestions.data.suggestion.length - 1}
                style={{ opacity: feedbackPage === suggestions.data.suggestion.length - 1 ? 0.4 : 1, marginLeft: 8 }}
              >
                <Icon iosName="chevron-forward" androidName="chevron-right" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {/* Rubrik değerlendirme özeti */}
        {/*{rubric ? (*/}
        {/*  <View style={{ padding: 16 }}>*/}
        {/*    <Text style={{ color: colors.primary, fontWeight: "bold", marginBottom: 6 }}>Rubric Evaluation</Text>*/}
        {/*    <Text style={{ color: colors.slate700, fontSize: 13 }}>{rubric}</Text>*/}
        {/*  </View>*/}
        {/*) : null}*/}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingVertical: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
  },
  listenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    // marginTop: 16,
    // marginBottom: 16,
    marginVertical: 16,
    marginHorizontal: 20,
  },
  listenButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  feedbackContainer: {
    marginBottom: 16,
    paddingHorizontal: CARD_PADDING,
  },
  feedbackBorder: {
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  feedbackCard: {
    width: width - 2 * CARD_PADDING,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: CARD_PADDING,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.slate700,
    lineHeight: 18,
    paddingRight: CARD_PADDING,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.slate300,
    marginHorizontal: 4,
  },
  pageDotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.slate700,
    textAlign: "center",
  },
  noSuggestionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  noSuggestionsText: {
    fontSize: 16,
    color: colors.slate800,
    textAlign: "center",
  },
  radarCardContainer: {
    width: '90%',
    maxWidth: 420,
    minWidth: 200,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: 14, // Sekmeli alanla aynı
    borderWidth: 1,
    borderColor: colors.slate300,
    elevation: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginBottom: 12,
  },
});

export default SpeakReportScreen;

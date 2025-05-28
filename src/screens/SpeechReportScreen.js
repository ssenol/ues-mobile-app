import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Svg, Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { useSelector, useDispatch } from "react-redux";
import { Audio } from "expo-av";
import { selectCurrentUser } from "../store/slices/authSlice";
import colors from "../styles/colors";
import Icon from "../components/Icon";
import { cleanHtmlAndBreaks } from "../utils/helpers";

const { width } = Dimensions.get("window");

const CARD_WIDTH = width * 0.88;
const CARD_PADDING = width * 0.06;

const FEEDBACK_TYPES = {
  "content-relevance": "Content Relevance",
  "tone-and-perspective": "Tone And Perspective",
  "performance-summary": "Performance Summary",
  "suggestions-for-improvement": "Suggestions For Improvement",
  error: "Hata",
};

const SpeechReportScreen = ({ route, navigation }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const dispatch = useDispatch();

  // Route params
  const {
    taskId,
    quizName,
    speechData,
    taskDetails,
    taskType,
    questionSubDetails,
    recordedUri,
  } = route.params;
  const username = useSelector(selectCurrentUser)?.username;
  const speechResults = useSelector(
    (state) => state.speech.speechResults?.speechResults
  );

  useEffect(() => {
    if (speechResults) {
      setResults(speechResults);
    }
    setLoading(false);
  }, [speechResults]);

  const suggestions = useMemo(() => {
    if (!results?.aiEvaluation?.data) return null;
    return results.aiEvaluation;
  }, [results?.aiEvaluation]);

  // Radar grafik için değerler
  const scores = useMemo(() => {
    if (
      !results?.evaluation?.results?.[0]?.NBest?.[0]?.PronunciationAssessment
    ) {
      return {
        accuracy: 0,
        fluency: 0,
        prosody: 0,
        completeness: 0,
        pronunciation: 0,
      };
    }

    const assessment =
      results.evaluation.results[0].NBest[0].PronunciationAssessment;
    return {
      accuracy: assessment.AccuracyScore || 0,
      fluency: assessment.FluencyScore || 0,
      prosody: assessment.ProsodyScore || 0,
      completeness: assessment.CompletenessScore || 0,
      pronunciation: assessment.PronScore || 0,
    };
  }, [results?.evaluation]);

  const labels = [
    { text: "Accuracy", angle: -Math.PI / 2 },
    { text: "Fluency", angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
    { text: "Prosody", angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
    { text: "Completeness", angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
    { text: "Pronunciation", angle: -Math.PI / 2 + (8 * Math.PI) / 5 },
  ];

  const values = [
    scores.accuracy,
    scores.fluency,
    scores.prosody,
    scores.completeness,
    scores.pronunciation,
  ];

  // Radar grafik hesaplamaları
  const center = { x: CARD_WIDTH / 2, y: (CARD_WIDTH - 30) / 2 };
  const radius = CARD_WIDTH * 0.3;
  const numPoints = 5;
  const angleStep = (2 * Math.PI) / numPoints;
  const gridLevels = [20, 40, 60, 80, 100];
  const labelRadius = radius + 30;

  // Veri noktaları
  const points = values.map((value, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const distance = (value / 100) * radius;
    return {
      x: center.x + distance * Math.cos(angle),
      y: center.y + distance * Math.sin(angle),
      score: value,
    };
  });

  // Grafik alanı için path
  const pathData =
    points.reduce(
      (path, point, i) =>
        path + (i === 0 ? "M" : "L") + point.x + "," + point.y, ""
    ) + "Z";

  // Ses çalma fonksiyonları
  const playSound = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.stopAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
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
      }
    } catch (error) {
      console.error("Ses oynatma hatası:", error);
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Sonuçlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!results?.evaluation?.results) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noSuggestionsContainer}>
          <Text style={styles.noSuggestionsText}>
            Değerlendirme sonuçları alınamadı.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{cleanHtmlAndBreaks(quizName)}</Text>
        </View>
        {/* Radar Grafik */}
        <View style={styles.chartContainer}>
          <Svg width={CARD_WIDTH} height={CARD_WIDTH - 30}>
            {/* Izgara çizgileri */}
            {gridLevels.map((level, i) => {
              const gridRadius = (level / 100) * radius;
              const points = Array.from({ length: numPoints }, (_, j) => {
                const angle = j * angleStep - Math.PI / 2;
                return {
                  x: center.x + gridRadius * Math.cos(angle),
                  y: center.y + gridRadius * Math.sin(angle),
                };
              });

              return (
                <React.Fragment key={`grid-${i}`}>
                  <Path
                    d={
                      points.reduce(
                        (path, point, j) =>
                          path +
                          (j === 0 ? "M" : "L") +
                          point.x +
                          "," +
                          point.y,
                        ""
                      ) + "Z"
                    }
                    stroke={colors.slate500}
                    strokeWidth="0.6"
                    strokeDasharray="3"
                    fill="none"
                    opacity={0.5}
                  />
                </React.Fragment>
              );
            })}

            {/* Eksen çizgileri */}
            {Array.from({ length: numPoints }, (_, i) => {
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
                  opacity={0.5}
                />
              );
            })}

            {/* Veri alanı */}
            <Path
              d={pathData}
              fill="rgba(234, 147, 51, 0.3)"
              stroke={colors.secondary}
              strokeWidth="1.5"
            />

            {/* Veri noktaları ve değerleri */}
            {points.map((point, i) => (
              <React.Fragment key={`point-${i}`}>
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r="2.5"
                  fill={colors.secondary}
                />
                <SvgText
                  x={point.x}
                  y={point.y - 10}
                  fill={colors.secondary}
                  fontSize="13"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {Math.round(point.score)}
                </SvgText>
              </React.Fragment>
            ))}

            {/* Etiketler */}
            {labels.map((label, i) => {
              const angle = label.angle;
              return (
                <SvgText
                  key={`label-${i}`}
                  x={center.x + labelRadius * Math.cos(angle)}
                  y={center.y + labelRadius * Math.sin(angle)}
                  fill={colors.slate800}
                  fontSize="11"
                  textAnchor="middle"
                >
                  {label.text}
                </SvgText>
              );
            })}
          </Svg>
        </View>

        {/* Ses Kaydını Dinleme Butonu */}
        <TouchableOpacity
          style={styles.listenButton}
          onPress={playSound}
          disabled={!recordedUri}
        >
          <Icon
            iosName={isPlaying ? "stop.fill" : "play.fill"}
            androidName={isPlaying ? "stop" : "play-arrow"}
            size={24}
            color={colors.white}
          />
          <Text style={styles.listenButtonText}>
            {isPlaying ? "Stop Recording" : "Listen to Recording"}
          </Text>
        </TouchableOpacity>

        {/* Kaydırmalı Feedback Kartları */}
        <View style={styles.feedbackContainer}>
          <View style={styles.feedbackBorder}>
            {suggestions?.data?.suggestion?.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToAlignment="start"
                snapToInterval={width - 2 * CARD_PADDING}
                decelerationRate={0}
                onScroll={(event) => {
                  const x = event.nativeEvent.contentOffset.x;
                  const page = Math.round(x / (width - 2 * CARD_PADDING));
                  setCurrentPage(page);
                }}
                scrollEventThrottle={16}
              >
                {suggestions.data.suggestion.map((item, index) => (
                  <View key={index} style={styles.feedbackCard}>
                    <Text style={styles.feedbackTitle}>
                      {FEEDBACK_TYPES[item.type] || item.type}
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
            ) : (
              <View style={styles.noSuggestionsContainer}>
                <Text style={styles.noSuggestionsText}>
                  Değerlendirme sonuçları alınamadı.
                </Text>
              </View>
            )}
          </View>

          {/* Noktalı Sayfa Göstergesi */}
          {suggestions?.data?.suggestion?.length > 0 && (
            <View style={styles.pageIndicator}>
              {suggestions.data.suggestion.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.pageDot,
                    currentPage === index && styles.pageDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
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
  chartContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH - 30,
    marginHorizontal: (width - CARD_WIDTH) / 2,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate300,
    borderRadius: 8,
    padding: CARD_PADDING,
    alignItems: "center",
    justifyContent: "center",
  },
  listenButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
    marginHorizontal: 26,
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
});

export default SpeechReportScreen;

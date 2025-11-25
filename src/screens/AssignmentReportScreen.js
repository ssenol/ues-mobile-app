/**
 * ✅ OPTİMİZASYON: Scroll performansı iyileştirildi
 * 
 * YAPILAN DEĞİŞİKLİKLER:
 * 1. ✅ setValue() çağrıları requestAnimationFrame ile optimize edildi
 * 2. ✅ State güncellemeleri sadece değiştiğinde yapılıyor
 * 3. ✅ Animated.ScrollView kullanılıyor
 * 
 * NOT: Eski cihazlarda (A9 chip) test edilmesi gerekiyor.
 * Eğer hala sorun varsa, ek optimizasyonlar yapılabilir:
 * - State güncellemelerini de requestAnimationFrame içine almak
 * - Hesaplamaları throttle etmek veya önbelleğe almak
 * - Gereksiz setValue() çağrılarını önlemek (değer değişmediyse çağırma)
 */

import { useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import AudioPlayer from '../components/AudioPlayer';
import CircularProgress from '../components/CircularProgress';
import LoadingOverlay from '../components/LoadingOverlay';
import ThemedIcon from '../components/ThemedIcon';
import { ThemedText } from '../components/ThemedText';
import { generateFileUrl, getSolvedExerciseDetail } from '../services/speak';
import { selectCurrentUser } from '../store/slices/authSlice';
import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STRONG_SEGMENT_REGEX = /(<strong>.*?<\/strong>)/gi;

const getExampleSegments = (text) => {
  if (!text) return [];

  return text
    .split(STRONG_SEGMENT_REGEX)
    .filter(Boolean)
    .map((segment) => {
      const isStrong = /<strong>.*<\/strong>/i.test(segment);
      return {
        text: segment.replace(/<\/?strong>/gi, ''),
        isStrong,
      };
    });
};

const FEEDBACK_TYPE_ICON_MAP = {
  'content-relevance': 'report1',
  'tone-and-perspective': 'report2',
  'performance-summary': 'report3',
  'suggestions-for-improvement': 'report4',
};

export default function AssignmentReportScreen({ navigation }) {
  const { colors, fonts, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  
  // ========== YÜKSEKLİK DEĞİŞKENLERİ ==========
  const STATUSBAR_HEIGHT = insets.top;
  
  const route = useRoute();
  const { solvedTaskId, reportId } = route.params || {};
  // reportId veya solvedTaskId kullan (backward compatibility)
  const taskId = reportId || solvedTaskId;
  const user = useSelector((state) => selectCurrentUser(state));
  
  // ========== STATE DEĞİŞKENLERİ ==========
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('speech-components');
  const [showMoreCharts, setShowMoreCharts] = useState(false);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [filterTabsY, setFilterTabsY] = useState(0);
  const [filterTabsHeight, setFilterTabsHeight] = useState(70); // Filter tabs yüksekliği (başlangıç tahmini)
  const [headerHeight, setHeaderHeight] = useState(STATUSBAR_HEIGHT + 30); // Başlangıç tahmini
  const [blueSectionActualHeight, setBlueSectionActualHeight] = useState(284); // Mavi zemin gerçek yüksekliği
  const [audioModalVisible, setAudioModalVisible] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  // ========== REF DEĞİŞKENLERİ ==========
  const scrollViewRef = useRef(null);
  const filterTabsRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateYValue = useRef(new Animated.Value(0)).current;
  const lastTranslateYRef = useRef(0); // Son translateY değerini sakla (gereksiz setValue çağrılarını önlemek için)

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    if (!taskId) {
      Alert.alert('Error', 'Report ID is missing');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const response = await getSolvedExerciseDetail(taskId);
      
      if (response?.success || response?.status_code === 200) {
        setReportData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load report data');
        navigation.goBack();
      }
    } catch (error) {
      console.error('AssignmentReportScreen fetchReportData error:', error);
      Alert.alert('Error', 'Failed to load report data');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [taskId, navigation]);

  // Load audio file URL
  const loadAudioUrl = useCallback(async () => {
    // audioUrl result array'inin içinde
    const audioFileUrl = reportData?.result?.[0]?.audioUrl;
    
    if (!audioFileUrl) {
      Alert.alert('Error', 'Audio file not found');
      return;
    }

    try {
      setLoadingAudio(true);
      const response = await generateFileUrl(audioFileUrl);
      
      if (response?.success && response?.data) {
        setAudioUrl(response.data);
        setAudioModalVisible(true);
      } else {
        Alert.alert('Error', 'Failed to load audio file');
      }
    } catch (error) {
      console.error('Error loading audio URL:', error);
      Alert.alert('Error', 'Failed to load audio file');
    } finally {
      setLoadingAudio(false);
    }
  }, [reportData]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Mavi zeminin ScrollView içindeki görünür yüksekliği
  // Mavi zemin total: blueSectionActualHeight (onLayout ile ölçülür)
  // Header mavi zeminin içinde, bu yüzden görünür yükseklik: blueSectionActualHeight - headerHeight
  const BLUE_SECTION_HEIGHT = useMemo(() => {
    const visibleHeight = blueSectionActualHeight - headerHeight;
    return visibleHeight;
  }, [blueSectionActualHeight, headerHeight, STATUSBAR_HEIGHT]);

  const FILTER_TABS_STICKY_PADDING = 12; // Sticky filter tabs paddingVertical değeri

  // Handle scroll - Filter tabs mavi zeminin altına gelince birlikte hareket eder
  const handleScrollListener = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // Filter tabs sticky kontrolü
    // Filter tabs'ın üst kenarı header'ın alt kenarına tam geldiğinde sticky olmalı
    // Scroll pozisyonu X olduğunda filter tabs ekranda (filterTabsY - X) pozisyonunda
    // Filter tabs header'ın altına tam geldiğinde: filterTabsY - X = headerHeight
    // Yani: X = filterTabsY - headerHeight
    const stickyThreshold = filterTabsY > 0
      ? filterTabsY - FILTER_TABS_STICKY_PADDING
      : BLUE_SECTION_HEIGHT;
    
    // Tüm güncellemeleri requestAnimationFrame içine al (eski cihazlar için optimizasyon)
    requestAnimationFrame(() => {
      // State güncellemelerini optimize et - sadece değiştiğinde güncelle
      if (offsetY >= stickyThreshold && stickyThreshold > 0) {
        if (!isFilterSticky) {
          setIsFilterSticky(true);
        }
      } else if (isFilterSticky) {
        setIsFilterSticky(false);
      }
      
      // Mavi zemin kaydırma kontrolü
      if (filterTabsY > 0) {
        // Filter tabs'ın üst kenarı mavi zeminin alt kenarına 12px kala geldiği scroll pozisyonu
        // Sticky filter tabs'ın padding'i (12px) nedeniyle mavi zemin 12px erken hareket etmeli
        // Böylece sticky olduğunda pürüzsüz geçiş sağlanır
        // Scroll pozisyonu X olduğunda filter tabs ekranda (filterTabsY - X) pozisyonunda
        // Filter tabs mavi zeminin altına 12px kala geldiğinde: filterTabsY - X = BLUE_SECTION_HEIGHT - 12
        // Yani: X = filterTabsY - BLUE_SECTION_HEIGHT - 12 (eksi işareti çünkü "kala" = daha erken)
        const blueSectionBottomReached = filterTabsY - BLUE_SECTION_HEIGHT - FILTER_TABS_STICKY_PADDING;
        
        let newTranslateY = 0;
        
        if (offsetY < blueSectionBottomReached) {
          // Durum 1: Filter tabs henüz mavi zeminin altına gelmedi - Mavi zemin sabit
          newTranslateY = 0;
        } else if (isFilterSticky) {
          // Durum 2: Filter tabs sticky - Mavi zemin tamamen yukarı kaymış, sabit
          // Filter tabs sticky olduğunda padding 12px var, bu yüzden mavi zemin 12px daha az kaymalı
          // Böylece filter tabs'ın üst kenarı (padding dahil) mavi zeminin alt kenarına 12px kala olur
          newTranslateY = -(BLUE_SECTION_HEIGHT - FILTER_TABS_STICKY_PADDING);
        } else {
          // Durum 3: Filter tabs mavi zeminin altında ama sticky değil - Birlikte kayıyorlar
          // Filter tabs ve mavi zemin 1:1 oranında birlikte yukarı kayıyor
          const scrolledDistance = offsetY - blueSectionBottomReached;
          const translateY = -scrolledDistance;
          // Maksimum translateY: Filter tabs sticky olduğunda ulaşacağı değer (12px padding hesaba katılıyor)
          const maxTranslateY = -(BLUE_SECTION_HEIGHT - FILTER_TABS_STICKY_PADDING);
          // translateY'yi maxTranslateY ile sınırla
          newTranslateY = Math.max(translateY, maxTranslateY - FILTER_TABS_STICKY_PADDING);
        }
        
        // Sadece değer değiştiyse setValue çağır (gereksiz çağrıları önle)
        if (Math.abs(newTranslateY - lastTranslateYRef.current) > 0.5) {
          headerTranslateYValue.setValue(newTranslateY);
          lastTranslateYRef.current = newTranslateY;
        }
      } else {
        // Filter tabs pozisyonu henüz bilinmiyor - HomeScreen'deki gibi basit kaydırma
        let newTranslateY = 0;
        if (offsetY >= BLUE_SECTION_HEIGHT) {
          newTranslateY = -(offsetY - BLUE_SECTION_HEIGHT);
        }
        
        // Sadece değer değiştiyse setValue çağır (gereksiz çağrıları önle)
        if (Math.abs(newTranslateY - lastTranslateYRef.current) > 0.5) {
          headerTranslateYValue.setValue(newTranslateY);
          lastTranslateYRef.current = newTranslateY;
        }
      }
    });
  }, [filterTabsY, isFilterSticky, BLUE_SECTION_HEIGHT, blueSectionActualHeight, headerHeight]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: handleScrollListener,
    }
  );

  const scrollToTabContentStart = useCallback(() => {
    const targetY = filterTabsY > 0 ? filterTabsY - FILTER_TABS_STICKY_PADDING + 1 : 0;

    if (!scrollViewRef.current) return;

    const scrollNode =
      typeof scrollViewRef.current.scrollTo === 'function'
        ? scrollViewRef.current
        : scrollViewRef.current.getNode?.();

    scrollNode?.scrollTo?.({ y: targetY, animated: true });
  }, [filterTabsY]);

  const handleTabPress = useCallback(
    (tabKey) => {
      if (activeTab === tabKey) {
        // Sadece sticky durumunda scroll yap
        if (isFilterSticky) {
          scrollToTabContentStart();
        }
        return;
      }
      setActiveTab(tabKey);
      // Scroll resetini bir sonraki frame'e bırakmak daha stabil oluyor
      // Sadece sticky durumunda scroll yap
      if (isFilterSticky) {
        requestAnimationFrame(scrollToTabContentStart);
      }
    },
    [activeTab, scrollToTabContentStart, isFilterSticky]
  );

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading || !reportData) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <LoadingOverlay visible={loading} message="Loading report..." />
      </View>
    );
  }

  const firstResult = reportData.result && reportData.result.length > 0 ? reportData.result[0] : null;
  const voiceEvaluationResult = firstResult?.result?.voiceEvaluationResult || {};
  const feedbacks = firstResult?.result?.feedback || [];
  const mistakes = firstResult?.result?.mistakes || [];
  const mainScore = reportData.mainScore || 0;
  const solvedDate = reportData.solvedDate || reportData.createdAt;
  const studentInfo = reportData.studentInfo || {};
  const className = studentInfo.className || (user?.classInfo && Array.isArray(user.classInfo) ? user.classInfo[0] : null) || '-';
  const studentName = studentInfo.studentName || user?.name || '';

  // Score color
  const getScoreColor = (score) => {
    if (score >= 85) return colors.goalGreen;
    if (score >= 60) return colors.goalOrange;
    return colors.goalRed;
  };

  const getScoreBackgroundColor = (score) => {
    if (score >= 85) return colors.goalBackgroundGreen;
    if (score >= 60) return colors.goalBackgroundOrange;
    return colors.goalBackgroundRed;
  };

  const getScoreIcon = (score) => {
    if (score >= 85) return 'goalGreen';
    if (score >= 60) return 'goalOrange';
    return 'goalRed';
  };

  const scoreColor = getScoreColor(mainScore);
  const scoreBackgroundColor = getScoreBackgroundColor(mainScore);
  const scoreIcon = getScoreIcon(mainScore);
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      
      {/* Mavi arka plan - Animated.View ile kaydırılabilir */}
      {/* headerTranslateYValue: Scroll pozisyonuna göre mavi zeminin kaydırılma miktarı */}
      {/* Filter tabs sticky olduğunda mavi zemin yukarı kaydırılır (negatif translateY) */}
      {/* Mavi zeminin alt kenarı header + filter tabs yüksekliğinde olmalı */}
      {/* Böylece filter tabs mavi zeminin altında kalır */}
      <Animated.View 
        pointerEvents="none"
        style={[
          styles.headerBackground,
          {
            transform: [{ translateY: headerTranslateYValue }],
          },
        ]}
        onLayout={(event) => {
          // Mavi zeminin gerçek yüksekliğini ölç
          const { height, width, x, y } = event.nativeEvent.layout;
          setBlueSectionActualHeight(height);
        }}
      >
        <Image
          pointerEvents="none"
          source={require('../../assets/images/screenHeader.png')}
          style={styles.headerBg}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Header - Mavi zemin üzerinde */}
      <View 
        style={[styles.header, { paddingTop: STATUSBAR_HEIGHT }]}
        onLayout={(event) => {
          // Header'ın gerçek yüksekliğini ölç (paddingTop dahil)
          const { height, width, x, y } = event.nativeEvent.layout;
          setHeaderHeight(height);
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackButton}
          activeOpacity={0.7}
        >
          <ThemedIcon
            iconName="back"
            size={24}
            tintColor="#fff"
          />
        </TouchableOpacity>
        <ThemedText weight="bold" style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {reportData.taskName || 'Assignment Report'}
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <View style={styles.userInfoLeft}>
            <View style={styles.profileImageContainer}>
              <ThemedIcon
                iconName="avatar"
                size={40}
                // tintColor="#3E4EF0"
              />
            </View>
            <View style={styles.userInfoText}>
              <ThemedText weight="bold" style={styles.userGreeting}>
                Hello, {studentName}!
              </ThemedText>
              <ThemedText style={styles.userClass}>{className}</ThemedText>
            </View>
          </View>
          <View style={styles.userInfoRight}>
            <View style={styles.dateTimeRow}>
              <ThemedIcon
                iconName="date"
                size={16}
                tintColor="#B7B7B7"
              />
              <ThemedText style={styles.dateTimeText}>
                {formatDate(solvedDate)}
              </ThemedText>
            </View>
            <View style={styles.dateTimeRow}>
              <ThemedIcon
                iconName="time"
                size={16}
                tintColor="#B7B7B7"
              />
              <ThemedText style={styles.dateTimeText}>
                {formatTime(solvedDate)}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Assignment Statistic Card */}
        <View style={[styles.statisticCard, shadows.light]}>
          <View style={styles.statisticHeader}>
            <ThemedText weight="bold" style={styles.statisticTitle}>
              Assignment Statistic
            </ThemedText>
            <View style={[styles.scoreBadge, { backgroundColor: scoreBackgroundColor }]}>
              <View style={[styles.scoreIconContainer, { backgroundColor: scoreColor }]}>
                <ThemedIcon
                  iconName={scoreIcon}
                  size={16}
                  tintColor={colors.white}
                />
              </View>
              <ThemedText weight="semiBold" style={[styles.scoreBadgeText, { color: scoreColor }]}>
                Score {mainScore}
              </ThemedText>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.circularProgressContainer}>
            <CircularProgress
              value={voiceEvaluationResult.fluency || 0}
              label="Fluency"
              size={80}
              strokeWidth={8}
              color="#3E4EF0"
              shouldAnimate={true}
            />
            <CircularProgress
              value={voiceEvaluationResult.prosody || 0}
              label="Prosody"
              size={80}
              strokeWidth={8}
              color="#3E4EF0"
              shouldAnimate={true}
            />
            <CircularProgress
              value={voiceEvaluationResult.completeness || 0}
              label="Completeness"
              size={80}
              strokeWidth={8}
              color="#3E4EF0"
              shouldAnimate={true}
            />
          </View>

          {showMoreCharts && (
            <View style={styles.moreChartsContainer}>
              <CircularProgress
                value={voiceEvaluationResult.pronunciation || 0}
                label="Pronunciation"
                size={80}
                strokeWidth={8}
                color="#3E4EF0"
                shouldAnimate={showMoreCharts}
              />
              <CircularProgress
                value={voiceEvaluationResult.accuracy || 0}
                label="Accuracy"
                size={80}
                strokeWidth={8}
                color="#3E4EF0"
                shouldAnimate={showMoreCharts}
              />
              <CircularProgress
                value={voiceEvaluationResult.clarity || 0}
                label="Clarity"
                size={80}
                strokeWidth={8}
                color="#3E4EF0"
                shouldAnimate={showMoreCharts}
              />
            </View>
          )}

          <View style={styles.divider} />
          <View style={styles.moreLinkContainer}>
            <TouchableOpacity 
              style={styles.moreLink}
              onPress={() => setShowMoreCharts(!showMoreCharts)}
              activeOpacity={0.7}
            >
              <ThemedText weight='bold' style={styles.moreLinkText}>
                {showMoreCharts ? 'Less' : 'More'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Tabs - Normal durumda ScrollView içinde */}
        {!isFilterSticky && (
          <View 
          pointerEvents="box-none"
            ref={filterTabsRef}
            style={styles.filterTabs}
            onLayout={(event) => {
              const { y, height, width, x } = event.nativeEvent.layout;
              setFilterTabsY(y);
              setFilterTabsHeight(height); // Filter tabs yüksekliğini dinamik olarak kaydet
            }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabsScrollContent}
              style={styles.filterTabsScrollView}
            >
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeTab === 'speech-components' && styles.filterTabActive
                ]}
                onPress={() => handleTabPress('speech-components')}
                activeOpacity={0.7}
              >
                <ThemedText 
                  weight="bold"
                  style={activeTab === 'speech-components' ? styles.filterTabTextActive : styles.filterTabText}
                >
                  Speech Components
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  activeTab === 'error-analysis' && styles.filterTabActive
                ]}
                onPress={() => handleTabPress('error-analysis')}
                activeOpacity={0.7}
              >
                <ThemedText 
                  weight="bold"
                  style={activeTab === 'error-analysis' ? styles.filterTabTextActive : styles.filterTabText}
                >
                  Error Analysis
                </ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
        
        {/* Sticky Filter Tabs için spacer - Dinamik yükseklik + 24px paddingTop */}
        {isFilterSticky && <View style={{ height: filterTabsHeight + 24 }} />}

        {/* Tab Content - Sekme yapısı */}
        {activeTab === 'speech-components' && (
          <View style={styles.section}>
            {feedbacks.length > 0 ? (
              feedbacks.map((feedback, index) => {
                const iconName = FEEDBACK_TYPE_ICON_MAP[feedback.type] || 'report1';
                return (
                  <View key={index} style={[styles.feedbackCard, shadows.light]}>
                    <View style={styles.feedbackHeader}>
                      <View style={styles.feedbackIconContainer}>
                        <ThemedIcon
                          iconName={iconName}
                          size={32}
                          tintColor="#3E4EF0"
                        />
                      </View>
                      <View style={styles.feedbackContent}>
                        <ThemedText weight="semiBold" style={styles.feedbackType}>
                          {feedback.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </ThemedText>
                        <ThemedText style={styles.feedbackText}>
                          {feedback.feedback}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <ThemedText style={styles.emptyText}>No feedback available</ThemedText>
            )}
          </View>
        )}

        {activeTab === 'error-analysis' && (
          <View style={styles.section}>
            {/* <ThemedText weight="bold" style={styles.sectionTitle}>About Errors</ThemedText> */}
            {mistakes.length > 0 ? (
              mistakes.map((mistake, index) => {
                const formattedType = (mistake?.type || 'Error')
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const wrongWord = mistake?.wrongWord || mistake?.incorrectWord || '';
                const correctWord = mistake?.correctWord || '';
                const detail = mistake?.detailFeedbackWithReason || mistake?.explanation || '';
                const example = mistake?.exampleOfUsage || mistake?.example || '';
                const exampleSegments = getExampleSegments(example);

                return (
                  <View key={index} style={[styles.errorCard, shadows.light]}>
                    <ThemedText
                      weight="semiBold"
                      style={[styles.errorType, { color: '#EB4335' }]}
                    >
                      {formattedType}
                    </ThemedText>

                    {wrongWord ? (
                      <ThemedText weight='bold' style={styles.incorrectWord}>{wrongWord}</ThemedText>
                    ) : null}

                    {correctWord ? (
                      <ThemedText weight='semiBold' style={styles.correctWord}>{correctWord}</ThemedText>
                    ) : null}

                    {detail ? (
                      <ThemedText weight='bold' style={styles.errorExplanation}>{detail}</ThemedText>
                    ) : null}

                    {exampleSegments.length > 0 ? (
                      <View style={styles.exampleContainer}>
                        <ThemedText weight='semiBold' style={styles.exampleLabel}>Example:</ThemedText>
                        <Text style={[styles.exampleText, { fontFamily: fonts.regular }]}>
                          {exampleSegments.map((segment, segmentIndex) => (
                            <Text
                              key={`example-${index}-${segmentIndex}`}
                              style={[
                                segment.isStrong ? styles.exampleTextBold : null,
                                { fontFamily: segment.isStrong ? fonts.bold : fonts.regular },
                              ]}
                            >
                              {segment.text}
                            </Text>
                          ))}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <View style={[styles.noMistakesContainer, shadows.light]}>
                <ThemedIcon
                  iconName="bigcheck"
                  size={72}
                />
                <ThemedText weight="bold" style={styles.noMistakesTitle}>
                  Great Job!
                </ThemedText>
                <ThemedText style={styles.noMistakesMessage}>
                  You made no mistakes in this quiz.
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </Animated.ScrollView>

      {/* Sticky Filter Tabs - Header'ın altında */}
      {isFilterSticky && (
        <View
          pointerEvents="box-none"
          style={[styles.filterTabsSticky, { top: headerHeight }]}
        >
          <View pointerEvents="auto">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsScrollContent}
            style={styles.filterTabsScrollView}
          >
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeTab === 'speech-components' && styles.filterTabActive
              ]}
              onPress={() => handleTabPress('speech-components')}
              activeOpacity={0.7}
            >
              <ThemedText 
                weight="bold"
                style={activeTab === 'speech-components' ? styles.filterTabTextActive : styles.filterTabText}
              >
                Speech Components
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeTab === 'error-analysis' && styles.filterTabActive
              ]}
              onPress={() => handleTabPress('error-analysis')}
              activeOpacity={0.7}
            >
              <ThemedText 
                weight="bold"
                style={activeTab === 'error-analysis' ? styles.filterTabTextActive : styles.filterTabText}
              >
                Error Analysis
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
          </View>
        </View>
      )}

      {/* Sticky Recorded Voice Button */}
      <View style={[styles.stickyRecordedVoiceContainer, shadows.sticky]} pointerEvents="box-none">
        <TouchableOpacity 
          style={styles.recordedVoiceButton}
          onPress={loadAudioUrl}
          activeOpacity={0.8}
          disabled={loadingAudio}
        >
          <ThemedText weight="bold" style={styles.recordedVoiceButtonText}>
            {loadingAudio ? 'Loading...' : 'Recorded Voice'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Audio Player Modal */}
      <Modal
        isVisible={audioModalVisible}
        onBackdropPress={() => setAudioModalVisible(false)}
        style={styles.audioModal}
        backdropColor="#3E4EF0"
        backdropOpacity={0.95}
        useNativeDriverForBackdrop
        useNativeDriver
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.audioModalContent}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setAudioModalVisible(false)}
            activeOpacity={0.8}
          >
            <ThemedIcon iconName="close" size={24} tintColor="#3A3A3A" />
          </TouchableOpacity>

          {/* Title */}
          <ThemedText weight="bold" style={styles.audioModalTitle}>
            Recorded Voice
          </ThemedText>

          {/* Audio Player */}
          {audioUrl && (
            <AudioPlayer 
              audioUri={audioUrl}
              duration={reportData?.result?.[0]?.durationAsSeconds}
              onError={(error) => {
                console.error('Audio playback error:', error);
                Alert.alert(
                  'Playback Error',
                  'Failed to play audio. Do you want to try loading it again?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Retry', onPress: loadAudioUrl }
                  ]
                );
              }}
            />
          )}

          {/* Transcription */}
          {reportData?.result?.[0]?.result?.transcription && (
            <View style={styles.transcriptionContainer}>
              <ThemedText weight="semibold" style={styles.transcriptionLabel}>
                Transcription
              </ThemedText>
              <ScrollView 
                style={styles.transcriptionBox}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                <ThemedText style={styles.transcriptionText}>
                  {reportData.result[0].result.transcription}
                </ThemedText>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4FF',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 284,
    zIndex: 1,
  },
  headerBg: {
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 2,
    // backgroundColor: 'red',
  },
  headerBackButton: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 24,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
    marginTop: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // Sticky button için boşluk
    flexGrow: 1,
  },
  userInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userInfoText: {
    flex: 1,
  },
  userGreeting: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3A3A3A',
    marginBottom: 2,
  },
  userClass: {
    fontSize: 14,
    color: '#3A3A3A',
  },
  userInfoRight: {
    alignItems: 'flex-start',
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 12,
    color: '#B7B7B7',
  },
  statisticCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    // shadowColor: "#3E4EF0",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.12,
    // shadowRadius: 10,
    // elevation: 12,
  },
  statisticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statisticTitle: {
    fontSize: 18,
    color: '#3A3A3A',
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
  },
  scoreIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBadgeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4FF',
    marginBottom: 16,
  },
  circularProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  moreChartsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
  filterTabs: {
    marginBottom: 24,
  },
  filterTabsSticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 100,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: "#3E4EF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  filterTabsScrollView: {
    flexGrow: 0,
  },
  filterTabsScrollContent: {
    paddingLeft: 0,
    paddingRight: 0,
    alignItems: 'center',
  },
  filterTab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 0,
  },
  filterTabActive: {
    backgroundColor: '#E7E9FF',
  },
  filterTabText: {
    fontSize: 16,
    color: '#ABB3FF',
  },
  filterTabTextActive: {
    fontSize: 16,
    color: '#3E4EF0',
  },
  section: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#3A3A3A',
    marginBottom: 16,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  feedbackIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackType: {
    fontSize: 14,
    lineHeight: 24,
    color: '#3A3A3A',
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#727272',
  },
  errorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  errorType: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  wordComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  // arrow: {
  //   fontSize: 14,
  //   color: '#727272',
  // },
  incorrectWord: {
    fontSize: 14,
    lineHeight: 24,
    color: '#EB4335',
    textDecorationLine: 'line-through',
    marginBottom: 8,
  },
  correctWord: {
    fontSize: 14,
    lineHeight: 24,
    color: '#34A853',
    marginBottom: 8,
  },
  errorExplanation: {
    fontSize: 14,
    lineHeight: 24,
    color: '#727272',
  },
  exampleContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4FF',
    paddingTop: 12,
  },
  exampleLabel: {
    fontSize: 14,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#3A3A3A',
  },
  exampleTextBold: {
    lineHeight: 24,
    color: '#3A3A3A',
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
  },
  emptyText: {
    fontSize: 14,
    color: '#727272',
    textAlign: 'center',
    padding: 20,
  },
  noMistakesContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  noMistakesTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#3A3A3A',
    marginTop: 16,
    marginBottom: 8,
  },
  noMistakesMessage: {
    fontSize: 16,
    lineHeight: 20,
    color: '#3A3A3A',
    textAlign: 'center',
  },
  stickyRecordedVoiceContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    zIndex: 100,
  },
  recordedVoiceButton: {
    backgroundColor: '#3E4EF0',
    borderRadius: 32,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordedVoiceButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  audioModal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  audioModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    height: '85%',
    flexDirection: 'column',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  audioModalTitle: {
    fontSize: 24,
    lineHeight: 32,
    color: '#3A3A3A',
    marginBottom: 32,
    textAlign: 'center',
  },
  transcriptionContainer: {
    marginTop: 32,
    width: '100%',
    flex: 1,
    minHeight: 0, // ScrollView için gerekli
  },
  transcriptionLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3A3A3A',
    marginBottom: 12,
  },
  transcriptionBox: {
    backgroundColor: '#F3F4FF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minHeight: 0, // ScrollView için gerekli
  },
  transcriptionText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#3A3A3A',
  },
});

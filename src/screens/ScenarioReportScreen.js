import {useFocusEffect, useLocalSearchParams, useRouter} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import ThemedIcon from '../components/ThemedIcon';
import {ThemedText} from '../components/ThemedText';
import {getSolvedExerciseDetail} from '../services/speak';
import {selectCurrentUser} from '../store/slices/authSlice';
import {useTheme} from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// HTML tag'lerini temizleyip düz metin döndürür
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// User mesajlarındaki correction HTML'ini parse edip styled Text bileşenleri döndürür
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

export default function ScenarioReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, fonts, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  const STATUSBAR_HEIGHT = insets.top;
  const HEADER_MARGIN_TOP = 16;

  const { solvedTaskId, reportId } = params || {};
  const taskId = reportId || solvedTaskId;
  const user = useSelector((state) => selectCurrentUser(state));

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [isConversationTitleSticky, setIsConversationTitleSticky] = useState(false);
  const [conversationTitleY, setConversationTitleY] = useState(0);
  const [conversationTitleHeight, setConversationTitleHeight] = useState(50);

  const scrollViewRef = useRef(null);
  const conversationTitleRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateYValue = useRef(new Animated.Value(0)).current;
  const lastTranslateYRef = useRef(0);
  const [headerHeight, setHeaderHeight] = useState(STATUSBAR_HEIGHT + 30);
  const [blueSectionActualHeight, setBlueSectionActualHeight] = useState(284);

  const BLUE_SECTION_HEIGHT = useMemo(() => {
    return blueSectionActualHeight - (headerHeight + HEADER_MARGIN_TOP);
  }, [blueSectionActualHeight, headerHeight, HEADER_MARGIN_TOP]);

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    if (!taskId) {
      Alert.alert('Error', 'Report ID is missing');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await getSolvedExerciseDetail(taskId);

      if (response?.success || response?.status_code === 200) {
        setReportData(response.data);
      } else {
        Alert.alert('Error', 'Failed to load report data');
        router.back();
      }
    } catch (error) {
      console.error('ScenarioReportScreen fetchReportData error:', error);
      Alert.alert('Error', 'Failed to load report data');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [taskId, router]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  useFocusEffect(
    useCallback(() => {
      fetchReportData();

      return () => {
        const scrollNode = typeof scrollViewRef.current?.scrollTo === 'function'
          ? scrollViewRef.current
          : scrollViewRef.current?.getNode?.();

        scrollNode?.scrollTo?.({ y: 0, animated: false });
        headerTranslateYValue.setValue(0);
        lastTranslateYRef.current = 0;
        setIsConversationTitleSticky(false);
      };
    }, [fetchReportData, headerTranslateYValue])
  );

  const STICKY_PADDING = 12;

  const handleScrollListener = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    const stickyThreshold = conversationTitleY > 0
      ? conversationTitleY - STICKY_PADDING
      : BLUE_SECTION_HEIGHT;

    requestAnimationFrame(() => {
      // Sticky kontrolü
      if (offsetY >= stickyThreshold && stickyThreshold > 0) {
        if (!isConversationTitleSticky) {
          setIsConversationTitleSticky(true);
        }
      } else if (isConversationTitleSticky) {
        setIsConversationTitleSticky(false);
      }

      // Mavi zemin kaydırma
      if (conversationTitleY > 0) {
        const blueSectionBottomReached = conversationTitleY - BLUE_SECTION_HEIGHT - STICKY_PADDING;

        let newTranslateY = 0;

        if (offsetY < blueSectionBottomReached) {
          newTranslateY = 0;
        } else if (isConversationTitleSticky) {
          newTranslateY = -(BLUE_SECTION_HEIGHT - STICKY_PADDING);
        } else {
          const scrolledDistance = offsetY - blueSectionBottomReached;
          const translateY = -scrolledDistance;
          const maxTranslateY = -(BLUE_SECTION_HEIGHT - STICKY_PADDING);
          newTranslateY = Math.max(translateY, maxTranslateY - STICKY_PADDING);
        }

        if (Math.abs(newTranslateY - lastTranslateYRef.current) > 0.5) {
          headerTranslateYValue.setValue(newTranslateY);
          lastTranslateYRef.current = newTranslateY;
        }
      } else {
        let newTranslateY = 0;
        if (offsetY >= BLUE_SECTION_HEIGHT) {
          newTranslateY = -(offsetY - BLUE_SECTION_HEIGHT);
        }

        if (Math.abs(newTranslateY - lastTranslateYRef.current) > 0.5) {
          headerTranslateYValue.setValue(newTranslateY);
          lastTranslateYRef.current = newTranslateY;
        }
      }
    });
  }, [conversationTitleY, BLUE_SECTION_HEIGHT, isConversationTitleSticky, headerTranslateYValue]);

  const handleScroll = useMemo(() => {
    return Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: false,
        listener: handleScrollListener,
      }
    );
  }, [handleScrollListener, scrollY]);

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
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading || !reportData) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#3E4EF0" />
        <ThemedText style={styles.loadingText}>Loading report...</ThemedText>
        <TouchableOpacity style={styles.loadingBackButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ThemedText style={styles.loadingBackText}>Go Back</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const firstResult = reportData.result && reportData.result.length > 0 ? reportData.result[0] : null;
  const messages = firstResult?.messages || [];
  const mainScore = reportData.mainScore || 0;
  const solvedDate = reportData.solvedDate || reportData.createdAt;
  const studentInfo = reportData.studentInfo || {};
  const className = studentInfo.className || (user?.classInfo && Array.isArray(user.classInfo) ? user.classInfo[0] : null) || '-';
  const studentName = studentInfo.studentName || user?.name || '';

  // Score color helpers
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
      const correctionParts = parseCorrection(msg.correction, fonts);

      return (
        <View key={index} style={[styles.messageBubble, styles.userBubble]}>
          {correctionParts ? (
            <ThemedText style={[styles.messageText, { fontFamily: fonts.semiBold }]}>
              {correctionParts}
            </ThemedText>
          ) : (
            <ThemedText weight="semiBold" style={styles.messageText}>
              {stripHtml(msg.content)}
            </ThemedText>
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Mavi arka plan */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.headerBackground,
          {
            transform: [{ translateY: headerTranslateYValue }],
          },
        ]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
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

      {/* Header */}
      <View
        style={[styles.header, { paddingTop: STATUSBAR_HEIGHT, marginTop: HEADER_MARGIN_TOP }]}
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          setHeaderHeight(height);
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
          activeOpacity={0.7}
        >
          <ThemedIcon
            iconName="back"
            size={24}
            tintColor="#fff"
          />
        </TouchableOpacity>
        <ThemedText weight="semibold" style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          {stripHtml(reportData.taskName) || 'Scenario Report'}
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      {/* Scrollable Content */}
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
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <ThemedIcon
                  iconName="avatar"
                  size={40}
                />
              )}
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
              <ThemedIcon iconName="date" size={16} tintColor="#B7B7B7" />
              <ThemedText style={styles.dateTimeText}>
                {formatDate(solvedDate)}
              </ThemedText>
            </View>
            <View style={styles.dateTimeRow}>
              <ThemedIcon iconName="time" size={16} tintColor="#B7B7B7" />
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

          <View style={styles.taskInfoContainer}>
            <ThemedText weight="semiBold" style={styles.taskInfoTitle}>
              {stripHtml(reportData.taskName) || 'Speech on Scenario'}
            </ThemedText>
            <ThemedText style={styles.taskInfoDate}>
              {formatDate(solvedDate)}
            </ThemedText>
          </View>
        </View>

        {/* Conversation Tab - Normal durumda ScrollView içinde */}
        {!isConversationTitleSticky && (
          <View
            ref={conversationTitleRef}
            style={styles.conversationTitleContainer}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              setConversationTitleY(y);
              setConversationTitleHeight(height);
            }}
          >
            <View style={[styles.filterTab, styles.filterTabActive]}>
              <ThemedText weight="bold" style={styles.filterTabTextActive}>Conversations</ThemedText>
            </View>
          </View>
        )}

        {/* Sticky Conversation Tab spacer */}
        {isConversationTitleSticky && <View style={{ height: conversationTitleHeight + 24 }} />}

        {/* Chat Messages */}
        <View style={styles.messagesContainer}>
          {messages.length > 0 ? (
            messages.map((msg, index) => renderMessage(msg, index))
          ) : (
            <View style={styles.emptyMessages}>
              <ThemedText style={styles.emptyMessagesText}>No conversation data available.</ThemedText>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </Animated.ScrollView>

      {/* Sticky Conversation Tab - Header'ın altında */}
      {isConversationTitleSticky && (
        <View
          style={[styles.conversationTitleSticky, { top: headerHeight + HEADER_MARGIN_TOP }]}
        >
          <View style={[styles.filterTab, styles.filterTabActive]}>
            <ThemedText weight="bold" style={styles.filterTabTextActive}>Conversations</ThemedText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  headerBackButton: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
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
  taskInfoContainer: {
    alignItems: 'left',
    gap: 4,
  },
  taskInfoTitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3A3A3A',
    textAlign: 'left',
  },
  taskInfoDate: {
    fontSize: 12,
    lineHeight: 20,
    color: '#B7B7B7',
  },
  conversationTitleContainer: {
    marginBottom: 24,
  },
  conversationTitleSticky: {
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
  filterTab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  filterTabActive: {
    backgroundColor: '#E7E9FF',
  },
  filterTabTextActive: {
    fontSize: 16,
    color: '#3E4EF0',
  },
  messagesContainer: {
    marginBottom: 16,
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
  emptyMessages: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#727272',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F3F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#3A3A3A',
  },
  loadingBackButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#3E4EF0',
  },
  loadingBackText: {
    color: '#fff',
    fontSize: 14,
  },
});

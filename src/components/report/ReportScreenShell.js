import {useFocusEffect, useRouter} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import EmptyStateCard from '../EmptyStateCard';
import ThemedIcon from '../ThemedIcon';
import {ThemedText} from '../ThemedText';
import {useTheme} from '../../theme/ThemeContext';
import {selectCurrentUser} from '../../store/slices/authSlice';
import {getSolvedExerciseDetail} from '../../services/speak';
import ReportCriterionDetail from './ReportCriterionDetail';
import ReportErrorModal from './ReportErrorModal';
import ReportFeedbackTab from './ReportFeedbackTab';
import ReportIssuesBottomSheet from './ReportIssuesBottomSheet';
import ReportOverallTab from './ReportOverallTab';
import ReportPronunciationModal from './ReportPronunciationModal';
import ReportTabBar from './ReportTabBar';
import useReportIssuesPanel from './useReportIssuesPanel';
import useReportTabs from './useReportTabs';
import useResolvedAudioUrl from './useResolvedAudioUrl';
import {getScoreBackgroundColor, getScoreColor, getScoreIcon, stripHtml} from './reportUtils';

// Read Aloud, Speech on Topic ve Speech on Scenario raporlarının ortak iskeleti.
// Header, mavi zemin, kullanıcı/istatistik kartı, sticky tab bar ve Feedback/Criteria
// sekmelerinin render'ı burada; her ekran sadece ilk sekmenin içeriğini ve
// criteria/feedback/mistakes'in reportData içindeki konumunu (adapter) sağlar.
export default function ReportScreenShell({
  taskId,
  headerTitleFallback,
  firstTabKey,
  firstTabLabel,
  renderFirstTab,
  getCriteria,
  getFeedback,
  getMistakes,
  getScoreBreakdown,
  getCompletenessInfo,
  getVoiceErrors,
  getResponseTextForIssues,
  getVoiceResult,
  getDurationSeconds,
  getAudioUrl,
  renderStatisticExtra,
}) {
  const router = useRouter();
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => selectCurrentUser(state));

  const STATUSBAR_HEIGHT = insets.top;
  const HEADER_MARGIN_TOP = 16;

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const {
    activeTab,
    isTabBarSticky,
    tabBarHeight,
    headerHeight,
    headerTranslateYValue,
    mainScrollRef,
    pillsScrollRef,
    handleScroll,
    handleTabPress,
    resetOnBlur,
    onBlueBackgroundLayout,
    onHeaderLayout,
    onTabBarLayout,
    onPillsRowLayout,
    onPillLayout,
  } = useReportTabs({
    initialTab: 'overall',
    headerMarginTop: HEADER_MARGIN_TOP,
    initialHeaderHeight: STATUSBAR_HEIGHT + 30,
  });

  const issuesPanel = useReportIssuesPanel();

  const firstResult = reportData?.result?.length > 0 ? reportData.result[0] : null;
  const rawAudioUrl = typeof getAudioUrl === 'function' ? getAudioUrl(firstResult, reportData) : null;
  const { resolvedAudioUrl, audioResolving } = useResolvedAudioUrl(rawAudioUrl);

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
      console.error('ReportScreenShell fetchReportData error:', error);
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
        resetOnBlur();
      };
    }, [fetchReportData, resetOnBlur])
  );

  // Değerlendirme arka planda hazırlanıyorsa (status 'pending') sonuç gelene kadar tekrar tekrar sorgula
  useEffect(() => {
    const reportStatus = reportData?.result?.[0]?.status || 'success';
    if (reportStatus !== 'pending') {
      return;
    }

    const pollTimer = setTimeout(() => {
      fetchReportData();
    }, 5000);

    return () => clearTimeout(pollTimer);
  }, [reportData, fetchReportData]);

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

  const reportStatus = reportData.result?.[0]?.status || 'success';

  if (reportStatus === 'pending') {
    return (
      <View style={styles.pendingContainer}>
        <StatusBar style="dark" />
        <EmptyStateCard
          iconName="hourglass"
          title="Evaluating Your Speech"
          subtitle="This usually takes just a few seconds. We'll refresh automatically."
          showLink
          linkIconName="back"
          linkText="Go Back"
          onLinkPress={() => router.back()}
        />
      </View>
    );
  }

  const criteria = getCriteria(firstResult, reportData) || [];
  const feedback = getFeedback(firstResult, reportData) || null;
  const mistakes = getMistakes(firstResult, reportData) || [];
  const voiceErrors = typeof getVoiceErrors === 'function' ? getVoiceErrors(firstResult, reportData) || [] : [];
  const responseTextForIssues = typeof getResponseTextForIssues === 'function' ? getResponseTextForIssues(firstResult, reportData) || '' : '';
  const voiceResult = typeof getVoiceResult === 'function' ? getVoiceResult(firstResult, reportData) || null : null;
  const durationSeconds = typeof getDurationSeconds === 'function' ? getDurationSeconds(firstResult, reportData) || null : null;
  const scoreBreakdown = typeof getScoreBreakdown === 'function' ? getScoreBreakdown(firstResult, reportData) || null : null;
  const completenessInfo = (typeof getCompletenessInfo === 'function' && scoreBreakdown)
    ? getCompletenessInfo(scoreBreakdown, reportData) || {}
    : {};
  const mainScore = reportData.mainScore || 0;
  const cefrLevel = reportData.cefrLevel;
  const solvedDate = reportData.solvedDate || reportData.createdAt;
  const studentInfo = reportData.studentInfo || {};
  const className = studentInfo.className || (user?.classInfo && Array.isArray(user.classInfo) ? user.classInfo[0] : null) || '-';
  const studentName = studentInfo.studentName || user?.name || '';

  const scoreColor = getScoreColor(colors, mainScore);
  const scoreBackgroundColor = getScoreBackgroundColor(colors, mainScore);
  const scoreIcon = getScoreIcon(mainScore);

  const showIssuesSheet = activeTab === firstTabKey && (typeof getVoiceErrors === 'function' || mistakes.length > 0);

  const tabs = [
    { key: 'overall', label: 'Overall' },
    { key: firstTabKey, label: firstTabLabel },
    { key: 'feedback', label: 'Feedback' },
    ...criteria.map((c) => ({ key: c.key, label: c.name || c.key })),
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Mavi arka plan - scroll'a göre yukarı kayar */}
      <Animated.View
        pointerEvents="none"
        style={[styles.headerBackground, { transform: [{ translateY: headerTranslateYValue }] }]}
        onLayout={onBlueBackgroundLayout}
      >
        <Image
          pointerEvents="none"
          source={require('../../../assets/images/screenHeader.png')}
          style={styles.headerBg}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Header */}
      <View
        style={[styles.header, { paddingTop: STATUSBAR_HEIGHT, marginTop: HEADER_MARGIN_TOP }]}
        onLayout={onHeaderLayout}
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
          {stripHtml(reportData.taskName) || headerTitleFallback}
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        ref={mainScrollRef}
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
                <ThemedIcon iconName="avatar" size={40} />
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
                {cefrLevel || `Score ${mainScore}`}
              </ThemedText>
            </View>
          </View>

          {typeof renderStatisticExtra === 'function' && renderStatisticExtra({ firstResult, reportData })}
        </View>

        {/* Tab Pills - normal durumda ScrollView içinde */}
        {!isTabBarSticky && (
          <View style={styles.tabBarWrap} onLayout={onTabBarLayout}>
            <ReportTabBar
              tabs={tabs}
              activeTab={activeTab}
              onTabPress={handleTabPress}
              pillsScrollRef={pillsScrollRef}
              onPillsRowLayout={onPillsRowLayout}
              onPillLayout={onPillLayout}
            />
          </View>
        )}

        {/* Sticky Tab Pills için spacer */}
        {isTabBarSticky && <View style={{ height: tabBarHeight + 24 }} />}

        {/* Aktif sekmenin içeriği - her sekme kendi kart(lar)ını kendi oluşturur */}
        <View style={styles.tabContentWrap}>
          {activeTab === 'overall' && (
            <ReportOverallTab
              mainScore={mainScore}
              scoreBreakdown={scoreBreakdown}
              completenessLabel={completenessInfo.label}
              completenessNote={completenessInfo.note}
              subType={reportData.subType}
            />
          )}

          {activeTab === firstTabKey && renderFirstTab({ firstResult, reportData, issuesPanel, mistakes, voiceErrors, resolvedAudioUrl, audioResolving })}

          {activeTab === 'feedback' && (
            <ReportFeedbackTab feedback={feedback} studentName={studentName} />
          )}

          {criteria.map((c) => (
            activeTab === c.key && (
              <ReportCriterionDetail
                key={c.key}
                criterion={c}
                mistakes={mistakes}
                voiceErrors={voiceErrors}
                voiceResult={voiceResult}
                responseText={responseTextForIssues}
                durationSeconds={durationSeconds}
              />
            )
          ))}
        </View>

        <View style={{ height: 32 }} />
      </Animated.ScrollView>

      {/* Sticky Tab Pills - Header'ın altında */}
      {isTabBarSticky && (
        <View style={[styles.tabBarSticky, { top: headerHeight + HEADER_MARGIN_TOP }]}>
          <ReportTabBar
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={handleTabPress}
            pillsScrollRef={pillsScrollRef}
            onPillsRowLayout={onPillsRowLayout}
            onPillLayout={onPillLayout}
          />
        </View>
      )}

      {/* Pronunciation / Language Convention / Logic panosu - sadece ilk sekmede (Dialogue/Recording) */}
      {showIssuesSheet && (
        <ReportIssuesBottomSheet
          mistakes={mistakes}
          voiceErrors={voiceErrors}
          responseText={responseTextForIssues}
          issuesPanel={issuesPanel}
        />
      )}

      {issuesPanel.modalState && issuesPanel.modalState.kind === 'pronunciation' && (
        <ReportPronunciationModal
          issue={issuesPanel.modalState.list[issuesPanel.modalState.index]}
          index={issuesPanel.modalState.index}
          total={issuesPanel.modalState.list.length}
          onPrev={issuesPanel.goPrev}
          onNext={issuesPanel.goNext}
          onClose={issuesPanel.closeModal}
          audioUri={resolvedAudioUrl}
        />
      )}

      {issuesPanel.modalState && issuesPanel.modalState.kind === 'error' && (
        <ReportErrorModal
          issue={issuesPanel.modalState.list[issuesPanel.modalState.index]}
          index={issuesPanel.modalState.index}
          total={issuesPanel.modalState.list.length}
          onPrev={issuesPanel.goPrev}
          onNext={issuesPanel.goNext}
          onClose={issuesPanel.closeModal}
        />
      )}
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
  },
  scrollContent: {
    flexGrow: 1,
  },
  userInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
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
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statisticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  tabBarWrap: {
    marginBottom: 16,
  },
  tabBarSticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    zIndex: 100,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#3E4EF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  tabContentWrap: {
    paddingHorizontal: 16,
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
  pendingContainer: {
    flex: 1,
    backgroundColor: '#F3F4FF',
    justifyContent: 'center',
    padding: 16,
  },
});

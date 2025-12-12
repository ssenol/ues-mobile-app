import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ImageBackground, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import AssignmentCard from '../components/AssignmentCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { ThemedText } from '../components/ThemedText';
import { useTheme } from '../theme/ThemeContext';
import { fetchAssignedSpeechTasks } from '../services/speak';
import { selectCurrentUser } from '../store/slices/authSlice';
import {
  buildAssignedSpeechTaskParams,
  parseAssignedTasksResponse,
  transformTaskToAssignment,
} from '../utils/assignmentTransform';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AssignmentsScreen({ navigation, route }) {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => selectCurrentUser(state));
  const STATUSBAR_HEIGHT = insets.top;
  // Route params'tan gelen filtreyi kullan, yoksa 'All'
  const initialFilter = route?.params?.filter || 'All';
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [isFilterSticky, setIsFilterSticky] = useState(false);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const filterTabsRef = useRef(null);
  const headerRef = useRef(null);
  const scrollViewRef = useRef(null);
  const quizListRef = useRef(null);
  const [filterTabsY, setFilterTabsY] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [filterTabsHeight, setFilterTabsHeight] = useState(0);
  const [quizListY, setQuizListY] = useState(0);
  const [filterScrollX, setFilterScrollX] = useState(0); // Filtre scroll pozisyonu
  const scrollY = useRef(new Animated.Value(0)).current;
  const normalFilterScrollRef = useRef(null);
  const stickyFilterScrollRef = useRef(null);
  const filterTabLayouts = useRef({});

  const scrollToFilter = (filterName) => {
    const layout = filterTabLayouts.current[filterName];
    if (layout) {
      const scrollRef = isFilterSticky ? stickyFilterScrollRef.current : normalFilterScrollRef.current;
      if (scrollRef) {
        scrollRef.scrollTo({ x: layout.x - 16, animated: true });
      }
    }
  };

  const handleFilterPress = (filterName) => {
    setSelectedFilter(filterName);
    setTimeout(() => scrollToFilter(filterName), 50);

    // Scroll to the top of the list when a filter is pressed and sticky is active
    if (isFilterSticky && scrollViewRef.current && quizListY > 0) {
      const stickyHeaderHeight = filterTabsHeight + 24 + 1;
      const scrollToPosition = quizListY - stickyHeaderHeight;
      const scrollView = scrollViewRef.current.getNode ? scrollViewRef.current.getNode() : scrollViewRef.current;
      scrollView.scrollTo({
        y: Math.max(0, scrollToPosition),
        animated: true,
      });
    }
  };

  // API'den assignment'ları çek
  const fetchAssignments = React.useCallback(async (isFromRefresh = false) => {
    if (!user) return;
    
    try {
      if (!isFromRefresh) {
        setLoading(true);
      }

      const { params, missingFields } = buildAssignedSpeechTaskParams(user);

      if (!params) {
        console.error('AssignmentsScreen: Missing required user parameters', {
          missingFields,
          userId: user?.userId,
          institutionId: user?.schoolId,
          institutionSubSchoolId: user?.campusId,
          className: user?.classInfo?.[0],
        });
        setAllQuizzes([]);
        setLoading(false);
        return;
      }

      const response = await fetchAssignedSpeechTasks(params);
      const { success, tasks } = parseAssignedTasksResponse(response);

      if (success && Array.isArray(tasks) && tasks.length > 0) {
        const transformedAssignments = tasks.map(transformTaskToAssignment).filter(Boolean);
        setAllQuizzes(transformedAssignments);
      } else {
        setAllQuizzes([]);
      }
    } catch (error) {
      console.error('AssignmentsScreen fetchAssignments error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setAllQuizzes([]);
    } finally {
      if (!isFromRefresh) {
        setLoading(false);
      }
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (scrollViewRef.current) {
      const scrollView = scrollViewRef.current.getNode ? scrollViewRef.current.getNode() : scrollViewRef.current;
      scrollView.scrollTo({ y: 0, animated: false });
    }
    try {
      await fetchAssignments(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAssignments]);

  // Ekrana focus olduğunda filtreyi kontrol et, sticky'yi sıfırla ve statusbar'ı ayarla
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
      
      // Route params varsa onu kullan, yoksa veya null ise 'All' yap
      // Tabbar'dan geldiğinde route.params.filter null veya undefined olacak
      const filter = route?.params?.filter;
      if (filter && filter !== null) {
        setSelectedFilter(filter);
        setTimeout(() => scrollToFilter(filter), 150);
      } else {
        setSelectedFilter('All');
        // "All" seçildiğinde filtre çubuğunu en başa kaydır
        setTimeout(() => scrollToFilter('All'), 50);
      }
      // Sayfa yüklendiğinde sticky'yi sıfırla (sadece kullanıcı scroll yaptığında aktif olacak)
      setIsFilterSticky(false);
      // Sayfanın üstüne scroll yap (Home'dan filtre seçildiğinde sayfanın üstü görünür olsun)
      if (scrollViewRef.current) {
        const scrollView = scrollViewRef.current.getNode ? scrollViewRef.current.getNode() : scrollViewRef.current;
        scrollView.scrollTo({
          y: 0,
          animated: false,
        });
      }
      // Assignment'ları çek
      fetchAssignments();

      return () => {
        setIsFilterSticky(false);
      };
    }, [route?.params?.filter, fetchAssignments])
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // filterTabsY, ScrollView içindeki pozisyonu gösteriyor
        // Filter tabs'ın üst boşluğunu (marginTop: 16) çıkararak threshold hesaplıyoruz
        // Böylece filter tabs'ın border'ı header'a dokunduğu anda sticky görünür
        const filterTabsMarginTop = 16; // filterTabs'ın marginVertical: 16 değeri
        const threshold = filterTabsY - filterTabsMarginTop;
        
        if (offsetY >= threshold && threshold > 0) {
          if (!isFilterSticky) {
            setIsFilterSticky(true);
            // Sticky filter tabs'a scroll pozisyonunu aktar
            setTimeout(() => {
              if (stickyFilterScrollRef.current) {
                stickyFilterScrollRef.current.scrollTo({
                  x: filterScrollX,
                  animated: false,
                });
              }
            }, 0);
          }
        } else {
          if (isFilterSticky) {
            setIsFilterSticky(false);
            // Normal filter tabs'a scroll pozisyonunu aktar
            setTimeout(() => {
              if (normalFilterScrollRef.current) {
                normalFilterScrollRef.current.scrollTo({
                  x: filterScrollX,
                  animated: false,
                });
              }
            }, 0);
          }
        }
      },
    }
  );

  // Summary data
  const solvedAssignments = allQuizzes.filter(q => q.isSolved).length;
  const unsolvedAssignments = allQuizzes.filter(q => !q.isSolved).length;

  // Filter options with counts
  const speechOnTopicCount = allQuizzes.filter(q => q.type === 'speechOnTopic').length;
  const readAloudCount = allQuizzes.filter(q => q.type === 'readAloud').length;
  const speechOnScenarioCount = allQuizzes.filter(q => q.type === 'speechOnScenario').length;

  const filters = [
    { name: 'All', count: null },
    { name: 'Speech On Topic', count: speechOnTopicCount },
    { name: 'Read Aloud', count: readAloudCount },
    { name: 'Speech On Scenario', count: speechOnScenarioCount },
  ];

  // Filter and sort assignments using useMemo for performance and correctness
  const filteredAssignments = React.useMemo(() => {
    const filtered = selectedFilter === 'All'
      ? allQuizzes
      : allQuizzes.filter(assignment => {
          const filterMap = {
            'Speech On Topic': 'speechOnTopic',
            'Read Aloud': 'readAloud',
            'Speech On Scenario': 'speechOnScenario',
          };
          return assignment.type === filterMap[selectedFilter];
        });

    // Sort the filtered assignments
    return filtered.sort((a, b) => {
      if (a.isSolved !== b.isSolved) {
        return a.isSolved ? 1 : -1;
      }
      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();
      return dateA - dateB;
    });
  }, [allQuizzes, selectedFilter]);

  // Helper function to get filter display text
  const getFilterDisplayText = (filter) => {
    if (filter.count !== null && filter.count !== undefined) {
      return `${filter.name} (${filter.count})`;
    }
    return filter.name;
  };

  const handleAssignmentPress = (assignment) => {
    // Eğer task completed ise rapor sayfasına git
    if (assignment.isSolved) {
      // reportId results array'inin içinde
      const reportId = assignment.originalTask?.prevSolvedTask?.results?.[0]?.id;
      
      if (reportId) {
        navigation.navigate('AssignmentReport', {
          reportId: reportId
        });
        return;
      }
    }
    
    // Completed değilse normal akış
    if (assignment.type === 'readAloud' || assignment.type === 'speechOnTopic') {
      navigation.navigate('ReadAloud', { 
        task: assignment.originalTask, // Orijinal task objesini gönder
        assignedTaskId: assignment.assignedTaskId,
        speechTaskId: assignment.speechTaskId 
      });
    } else {
      navigation.navigate('WritingTasks');
    }
  };


  const renderFilterTabs = (scrollRef, isSticky = false) => (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterTabsScrollContent}
      style={styles.filterTabsScrollView}
      onScroll={(event) => {
        if (!isSticky) {
          setFilterScrollX(event.nativeEvent.contentOffset.x);
        }
      }}
      scrollEventThrottle={16}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.name}
          style={[
            styles.filterTab,
            selectedFilter === filter.name && styles.filterTabActive
          ]}
          onPress={() => handleFilterPress(filter.name)}
          activeOpacity={0.7}
          onLayout={(event) => {
            filterTabLayouts.current[filter.name] = event.nativeEvent.layout;
          }}
        >
          <ThemedText
            weight="bold"
            style={selectedFilter === filter.name ? styles.filterTabTextActive : styles.filterTabText}>
            {getFilterDisplayText(filter)}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const BANNER_WIDTH = SCREEN_WIDTH - 32;
  const BANNER_ASPECT_RATIO = 343 / 133;
  const BANNER_HEIGHT = BANNER_WIDTH / BANNER_ASPECT_RATIO;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <View 
        ref={headerRef}
        style={[styles.header, { paddingTop: STATUSBAR_HEIGHT }]}
        onLayout={(event) => {
          const { height, y } = event.nativeEvent.layout;
          // Header'ın toplam yüksekliği: paddingTop + içerik + paddingBottom
          const totalHeight = height;
          setHeaderHeight(totalHeight);
        }}
      >
        <View style={styles.headerLeft} />
        <ThemedText weight="bold" style={styles.headerTitle}>Assignments</ThemedText>
        <View style={styles.headerRight} />
      </View>

      {/* Sticky Filter Tabs */}
      {isFilterSticky && (
        <View style={[
          styles.filterTabsSticky, 
          { 
            top: headerHeight || STATUSBAR_HEIGHT + 60,
          }
        ]}>
          {renderFilterTabs(stickyFilterScrollRef, true)}
        </View>
      )}

      <Animated.ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryNumberContainer}>
              <ThemedText weight="bold" style={styles.summaryNumber}>{solvedAssignments}</ThemedText>
            </View>
            <ThemedText style={styles.summaryLabel}>Solved Assignments</ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryNumberContainer}>
              <ThemedText weight="bold" style={styles.summaryNumber}>{unsolvedAssignments}</ThemedText>
            </View>
            <ThemedText style={styles.summaryLabel}>UnSolved Assignments</ThemedText>
          </View>
        </View>

        {/* Banner */}
        <View style={[styles.bannerContainer, shadows.dark]}>
          <ImageBackground
            source={require('../../assets/images/assignments-banner.png')}
            style={[styles.banner, { width: BANNER_WIDTH, height: BANNER_HEIGHT }]}
            resizeMode="cover"
          >
            <View style={styles.bannerContent}>
              <ThemedText weight="bold" style={styles.bannerTitle}>Awesome!</ThemedText>
              <ThemedText style={styles.bannerSubtitle}>You've finished {solvedAssignments} assignments</ThemedText>
            </View>
          </ImageBackground>
        </View>

        {/* Filter Tabs */}
        {!isFilterSticky && (
          <View 
            ref={filterTabsRef}
            style={styles.filterTabs}
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              setFilterTabsY(y);
              setFilterTabsHeight(height);
            }}
          >
            {renderFilterTabs(normalFilterScrollRef)}
          </View>
        )}
        {/* Placeholder to maintain scroll position when sticky */}
        {isFilterSticky && (
          <View style={{ height: filterTabsHeight, marginVertical: 16 }} />
        )}

        {/* Assignment List */}
        <View 
          ref={quizListRef} 
          style={styles.quizList}
          onLayout={(event) => {
            const { y } = event.nativeEvent.layout;
            setQuizListY(y);
          }}
        >
          {filteredAssignments.length > 0 ? (
            filteredAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onPress={() => handleAssignmentPress(assignment)}
              />
            ))
          ) : (
            <ThemedText style={{ textAlign: 'center', padding: 20, color: '#666' }}>
              No assignments available
            </ThemedText>
          )}
        </View>
      </Animated.ScrollView>

      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} message="Loading assignments..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#fff',
  },
  headerLeft: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: '#3A3A3A',
    flex: 1,
    textAlign: 'center',
    marginTop: 16
  },
  headerRight: {
    width: 24,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Tabbar için boşluk
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#E7E9FF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#D8DCFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  summaryNumber: {
    fontSize: 14,
    color: '#3E4EF0',
  },
  summaryLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
    flex: 1,
  },
  bannerContainer: {
    paddingHorizontal: 16,
},
  banner: {
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  bannerContent: {
    paddingLeft: 170,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  bannerTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#fff',
  },
  filterTabs: {
    marginVertical: 16,
  },
  filterTabsScrollView: {
    flexGrow: 0,
  },
  filterTabsScrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
  },
  filterTabsSticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingVertical: 12,
    backgroundColor: '#fff',
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterTab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    // borderWidth: 2,
    // borderColor: '#D8DCFF',
    // backgroundColor: '#E7E9FF',
    // marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#E7E9FF',
    // borderColor: '#3E4EF0',
  },
  filterTabText: {
    fontSize: 16,
    color: '#ABB3FF',
  },
  filterTabTextActive: {
    fontSize: 16,
    color: '#3E4EF0',
  },
  quizList: {
    paddingHorizontal: 16,
  },
});


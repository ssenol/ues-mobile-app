import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {Platform, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import useResponsive from '../hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CompletedAssignmentCard from '../components/CompletedAssignmentCard';
import { useTabBarClearance } from '../components/CustomTabBar';
import { ThemedText } from '../components/ThemedText';
import EmptyStateCard from '../components/EmptyStateCard';
import { getCompletedExercises, deleteSolvedTask } from '../services/speak';
import { selectCurrentUser } from '../store/slices/authSlice';
import { clearCache } from '../store/slices/assignmentSlice';
import ThemedIcon from "../components/ThemedIcon";
import InfoModal from '../components/InfoModal';
import ConfirmModal from '../components/ConfirmModal';
import InlineCalendar from '../components/InlineCalendar';
import {theme, useTheme} from "../theme/ThemeContext";
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { CompletedAssignment, CompletedExercise, SpeechTaskType } from '../types/assignment';

const ALL_SUB_TASK_TYPES: SpeechTaskType[] = ['speech_on_topic', 'read_aloud', 'speech_on_scenario'];

interface CompletedFilters {
  subTaskTypes: string[];
  completionDate: string | null; // ISO tarih
}

const DEFAULT_FILTERS: CompletedFilters = { subTaskTypes: ALL_SUB_TASK_TYPES, completionDate: null };


export default function CompletedScreen() {
  const router = useRouter();
  const { shadows } = useTheme();

  // Navigation helper
  const navigation = {
    navigate: (screen: string, params?: Record<string, unknown>) => {
      const routes: Record<string, string> = {
        'ScenarioReport': '/scenario-report',
        'AssignmentReport': '/assignment-report'
      };
      const pathname = routes[screen] || `/${screen.toLowerCase()}`;
      if (params) {
        const serializedParams: Record<string, string> = {};
        Object.keys(params).forEach(key => {
          serializedParams[key] = typeof params[key] === 'object' 
            ? JSON.stringify(params[key]) 
            : params[key] as string;
        });
        router.push({ pathname: pathname as never, params: serializedParams });
      } else {
        router.push(pathname as never);
      }
    }
  };
  const { height: SCREEN_HEIGHT, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const STATUSBAR_HEIGHT = insets.top;
  const user = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const scrollViewRef = useRef<ScrollView>(null);
  const [completedTasks, setCompletedTasks] = useState<CompletedAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const autoRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleRefreshRef = useRef<(() => Promise<void>) | null>(null);
  const fetchCompletedExercisesRef = useRef<
    ((reset?: boolean, cursor?: string | null, isRefresh?: boolean, filters?: CompletedFilters) => Promise<void>) | null
  >(null);
  
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedSubTaskTypes, setSelectedSubTaskTypes] = useState<string[]>(DEFAULT_FILTERS.subTaskTypes); // Multi selection
  const [completionDate, setCompletionDate] = useState<string | null>(DEFAULT_FILTERS.completionDate); // ISO tarih

  // Dinamik scrollContent stili
  const scrollContentStyle = {
    padding: 16,
    paddingBottom: useTabBarClearance(isTablet ? 150 : 100),
  };
  const [showMore, setShowMore] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<CompletedAssignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const assignmentSubTypeOptions = [
    { value: 'speech_on_topic', label: 'Speech On Topic' },
    { value: 'read_aloud', label: 'Read Aloud' },
    { value: 'speech_on_scenario', label: 'Speech Scenario' },
  ];

  // Ay ismini al
  const getMonthName = (monthIndex: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  // Tarih formatla
  const formatDate = (dateString: Date | string | null | undefined, format: 'display' | 'api' = 'display') => {
    if (!dateString) return format === 'api' ? null : '';
    
    const date = new Date(dateString);
    
    if (format === 'api') {
      // API format: YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Display format: DD Month YYYY - HH:MM (local timezone)
    const day = String(date.getDate()).padStart(2, '0');
    const month = getMonthName(date.getMonth());
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} - ${hours}:${minutes}`;
  };

  // Fetch completed exercises
  // filters verilmezse state'teki filtreler kullanılır. Filtreleri sıfırlayan çağrılar (Reset, ekrana dönüş) yeni
  // değerleri burada verir: setState sonrası aynı closure'daki state hâlâ eski filtreleri tutar.
  const fetchCompletedExercises = useCallback(async (
    reset = false,
    cursor: string | null = null,
    isRefresh = false,
    filters: CompletedFilters = { subTaskTypes: selectedSubTaskTypes, completionDate },
  ) => {
    if (!user) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get user ID
      const userId = user?.userId;
      if (!userId) {
        console.error('CompletedScreen: Missing user ID');
        setCompletedTasks([]);
        setLoading(false);
        return;
      }

      const params = {
        completionDate: formatDate(filters.completionDate, 'api'),
        lastAssignedTaskId: reset ? null : (cursor || nextCursor),
        perPageCount: 100,
        role: 'student',
        selectedTaskNames: [],
        selectedTaskTypes: ['speech'],
        selectedSubTaskTypes: filters.subTaskTypes.length > 0 ? filters.subTaskTypes : ALL_SUB_TASK_TYPES,
        userId: userId,
      };

      // console.log('CompletedScreen - Request Payload:', JSON.stringify(params, null, 2));
      const response = await getCompletedExercises(params);
      // console.log('CompletedScreen - Response:', JSON.stringify(response, null, 2));

      if (response?.success || response?.status_code === 200) {
        const data = response?.data;
        const exercises: CompletedExercise[] = (Array.isArray(data) ? data : data?.exercises) || [];
        const newNextCursor = (Array.isArray(data) ? null : data?.nextCursor) || null;
        const totalCount = response.results;

        setCompletedCount(totalCount || 0);
        setNextCursor(newNextCursor);
        setHasMore(!!newNextCursor);
        
        // Transform exercises to display format
        const transformedTasks: CompletedAssignment[] = exercises.map((exercise) => {
          const isSpeechOnTopic = exercise.subTaskType === 'speech_on_topic';
          const isReadAloud = exercise.subTaskType === 'read_aloud';
          const isSpeechOnScenario = exercise.subTaskType === 'speech_on_scenario';
          const completionDate = exercise.attempts[0].completionDate;
          
          // attempts[0].mainScore'dan score al
          const firstAttempt = exercise.attempts && exercise.attempts.length > 0 ? exercise.attempts[0] : null;
          const score = firstAttempt?.mainScore || 0;
          const solvedTaskId = firstAttempt?.solvedTaskId || null;
          const status = firstAttempt?.status || 'success'; // status bilgisini al

          const getTaskType = () => {
            if (isSpeechOnTopic) return 'Speech On Topic';
            if (isReadAloud) return 'Read Aloud';
            if (isSpeechOnScenario) return 'Speech on Scenario';
            return 'Assignment Type';
          };

          const taskType = getTaskType();

          return {
            id: exercise.assignedTaskId,
            title: exercise.taskName || taskType,
            completionDate: formatDate(completionDate) ?? '',
            rawCompletionDate: completionDate, // For sorting
            type: taskType,
            score: Math.round(score),
            solvedTaskId: solvedTaskId, // Detay için kullanılacak
            status: status, // Status bilgisini ekle
            // assignedTaskId: exercise.assignedTaskId,
            // speechTaskId: exercise.taskId || exercise.speechTaskId,
          };
        });

        if (reset) {
          setCompletedTasks(transformedTasks);
        } else {
          setCompletedTasks(prev => [...prev, ...transformedTasks]);
        }
      } else {
        if (reset) {
          setCompletedTasks([]);
        }
      }
    } catch (error) {
      console.error('CompletedScreen fetchCompletedExercises error:', error);
      if (reset) {
        setCompletedTasks([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, nextCursor, completionDate, selectedSubTaskTypes]);

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    // Timer'ı sıfırla
    if (autoRefreshTimerRef.current) {
      clearTimeout(autoRefreshTimerRef.current);
    }
    
    setNextCursor(null);
    setHasMore(true);
    await fetchCompletedExercises(true, null, true);

    // Timer useEffect içinde otomatik başlayacak
  }, [fetchCompletedExercises]);

  // handleRefresh'i ref'e ata
  useEffect(() => {
    handleRefreshRef.current = handleRefresh;
  }, [handleRefresh]);

  // fetchCompletedExercises'i ref'e ata
  useEffect(() => {
    fetchCompletedExercisesRef.current = fetchCompletedExercises;
  }, [fetchCompletedExercises]);

  // completedTasks değiştiğinde timer'ı kontrol et ve gerekirse yeniden başlat
  useEffect(() => {
    const hasPendingTasks = completedTasks.some(task => task.status === 'pending');
    
    // Timer'ı temizle
    if (autoRefreshTimerRef.current) {
      clearTimeout(autoRefreshTimerRef.current);
    }
    
    // Eğer pending task varsa timer'ı başlat
    if (hasPendingTasks && completedTasks.length > 0) {
      autoRefreshTimerRef.current = setTimeout(() => {
        if (handleRefreshRef.current) {
          handleRefreshRef.current();
        }
      }, 30000);
    }
    
    // Cleanup
    return () => {
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current);
      }
    };
  }, [completedTasks]);

  const scrollToTop = useCallback(() => {
    if (!scrollViewRef.current) return;

    scrollViewRef.current.scrollTo({ y: 0, animated: false });
  }, []);

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      setStatusBarStyle('dark');
      scrollToTop();
      
      // Reset filters when screen comes into focus
      setSelectedSubTaskTypes(DEFAULT_FILTERS.subTaskTypes);
      setCompletionDate(DEFAULT_FILTERS.completionDate);
      setNextCursor(null);
      setHasMore(true);
      
      // Varsayılan filtreler açıkça verilir; state güncellemesinin yansımasına güvenilmez
      const timer = setTimeout(async () => {
        if (fetchCompletedExercisesRef.current) {
          await fetchCompletedExercisesRef.current(true, null, false, DEFAULT_FILTERS);
        }
      }, 100);
      
      // Cleanup: Sayfa unfocus olunca timer'ı temizle
      return () => {
        clearTimeout(timer);
        if (autoRefreshTimerRef.current) {
          clearTimeout(autoRefreshTimerRef.current);
        }
      };
    }, [user])
  );

  // rapor detaya gider
  const handleReportPress = (assignment: CompletedAssignment) => {
    if (!assignment.solvedTaskId) {
      console.error('CompletedScreen: Missing solvedTaskId');
      return;
    }

    if (assignment.type === 'Speech on Scenario') {
      navigation.navigate('ScenarioReport', {
        solvedTaskId: assignment.solvedTaskId,
      });
      return;
    }

    navigation.navigate('AssignmentReport', {
      solvedTaskId: assignment.solvedTaskId,
    });
  };

  // filtre seçeneklerinin modal'ını açar
  const filterModal = () => {
    setFilterModalVisible(true);
  };

  const toggleSubTaskType = (taskType: string) => {
    setSelectedSubTaskTypes(prev => {
      if (prev.includes(taskType)) {
        return prev.filter(t => t !== taskType);
      } else {
        return [...prev, taskType];
      }
    });
  };

  const applyFilters = async () => {
    setFilterModalVisible(false);
    setShowMore(false);
    setNextCursor(null);
    setHasMore(true);
    await fetchCompletedExercises(true, null);
  };

  const resetFilters = async () => {
    setSelectedSubTaskTypes(DEFAULT_FILTERS.subTaskTypes);
    setCompletionDate(DEFAULT_FILTERS.completionDate);
    setShowMore(false);
    setNextCursor(null);
    setHasMore(true);
    await fetchCompletedExercises(true, null, false, DEFAULT_FILTERS);
  };

  const handleDeletePress = (assignment: CompletedAssignment) => {
    setTaskToDelete(assignment);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const userId = user?.userId;
      if (!userId) {
        console.error('CompletedScreen: Missing user ID');
        return;
      }

      const response = await deleteSolvedTask(taskToDelete.solvedTaskId, [userId]);
      
      if (response?.status === 'success' || response?.successed) {
        // Clear assignment cache to ensure fresh data
        dispatch(clearCache());
        
        setDeleteModalVisible(false);
        setTaskToDelete(null);
        
        // Refresh the list
        setNextCursor(null);
        setHasMore(true);
        await fetchCompletedExercises(true, null, true);
      } else {
        console.error('Failed to delete task:', response);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT }]}>
        <View style={styles.headerLeft} />
        <ThemedText weight="semiBold" style={styles.headerTitle}>
          Completed {completedCount > 0 ? `(${completedCount})` : ''}
        </ThemedText>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => filterModal()}
            activeOpacity={0.7}
          >
            <ThemedIcon
              iconName="filter"
              size={16}
              tintColor="#3A3A3A"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={scrollContentStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3E4EF0"
            colors={['#3E4EF0']}
          />
        }
      >
        {completedTasks.length > 0 ? (
          isTablet ? (
            // Tablet'te iki sütun halinde göster
            <View style={styles.assignmentsGrid}>
              {completedTasks.map((assignment, index) => (
                <View key={assignment.solvedTaskId || assignment.id || `task-${index}`} style={styles.assignmentGridItem}>
                  <CompletedAssignmentCard
                    assignment={assignment}
                    onPress={() => handleReportPress(assignment)}
                    onDelete={() => handleDeletePress(assignment)}
                  />
                </View>
              ))}
            </View>
          ) : (
            // Cep telefonunda alt alta göster
            completedTasks.map((assignment, index) => (
              <CompletedAssignmentCard
                key={assignment.solvedTaskId || assignment.id || `task-${index}`}
                assignment={assignment}
                onPress={() => handleReportPress(assignment)}
                onDelete={() => handleDeletePress(assignment)}
              />
            ))
          )
        ) : !loading && (
          <EmptyStateCard
            iconName={'report'}
            title ={'No Completed Assignments'}
            subtitle={"You can go to Assignments and do your homework."}
            onLinkPress={() => navigation.navigate('Assignments')}
            showLink={true}
            linkIconName={'tabAssignment'}
            linkText={'Assignments'}
          />
        )}
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ThemedText style={styles.loadingTextOverlay}>Loading completed assignments...</ThemedText>
        </View>
      )}

      <InfoModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        title="Filter"
        height={SCREEN_HEIGHT * 0.85}
        footer={
          <View style={[styles.applyButtonContainer, shadows.dark]}>
            <View style={styles.applyButtonsInner}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
                activeOpacity={0.8}
              >
                <ThemedText weight="bold" style={styles.applyButtonText}>
                  Apply Filter
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}
                activeOpacity={0.8}
              >
                <ThemedText weight="semiBold" style={styles.resetButtonText}>
                  Reset Filter
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        }
      >
        <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
          {/* Type Section */}
          <View style={styles.filterSection}>
            <ThemedText weight="semiBold" style={styles.filterSectionTitle}>Type</ThemedText>
            
            {assignmentSubTypeOptions.slice(0, showMore ? assignmentSubTypeOptions.length : 3).map((option) => (
              <TouchableOpacity 
                key={option.value}
                style={styles.checkboxRow}
                onPress={() => toggleSubTaskType(option.value)}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.checkboxLabel}>{option.label}</ThemedText>
                <View style={styles.checkbox}>
                  {selectedSubTaskTypes.includes(option.value) && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {assignmentSubTypeOptions.length > 3 && (
              <TouchableOpacity 
                onPress={() => setShowMore(!showMore)}
                activeOpacity={0.7}
                style={styles.moreButton}
              >
                <ThemedText weight="semiBold" style={styles.moreButtonText}>
                  {showMore ? 'Less' : 'More'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Completion Date Section */}
          <View style={styles.filterSection}>
            <ThemedText weight="semiBold" style={styles.filterSectionTitle}>Completion Date</ThemedText>
            
            <InlineCalendar
              selectedDate={completionDate}
              onDateSelect={(date) => setCompletionDate(date.toISOString())}
            />
          </View>
        </ScrollView>

      </InfoModal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        iconName="info3"
        title="Delete Task Report?"
        description="Are you sure you want to delete this task report? This action cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Yes, Delete'}
        cancelText="Cancel"
        confirmButtonColor="#FF3B30"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginTop: 16,
    fontSize: 16,
    lineHeight: 22,
    color: '#3A3A3A',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    marginTop: 16,
    width: 24,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F3F4FF',
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingTextOverlay: {
    backgroundColor: 'rgba(62, 78, 240, 0.1)',
    color: '#3E4EF0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3A3A3A',
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4FF',
  },
  checkboxLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#3E4EF0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    backgroundColor: '#3E4EF0',
    borderRadius: 7,
  },
  moreButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  moreButtonText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#3E4EF0',
  },
  applyButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 16,
    // paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4FF',
  },
  // Gölgeli kutu tam genişlikte; butonlar tablette ortalı ve sınırlı
  applyButtonsInner: {
    width: '100%',
    maxWidth: theme.layout.maxActionWidth,
    alignSelf: 'center',
  },
  applyButton: {
    backgroundColor: '#3E4EF0',
    borderRadius: 36,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
  },
  resetButton: {
    // backgroundColor: '#fff',
    // borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    // borderWidth: 1,
    // borderColor: '#E5E5E5',
  },
  resetButtonText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3E4EF0',
  },
  confirmDateIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3E4EF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButtonText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#3A3A3A',
  },
  datePickerContainer: {
    marginTop: 16,
    backgroundColor: '#F9F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  iosDatePicker: {
    height: 200,
  },
  assignmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: -8,
  },
  assignmentGridItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});

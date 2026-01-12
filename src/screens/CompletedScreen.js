import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {Dimensions, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, Platform} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import CompletedAssignmentCard from '../components/CompletedAssignmentCard';
import { ThemedText } from '../components/ThemedText';
import { getCompletedExercises } from '../services/speak';
import { selectCurrentUser } from '../store/slices/authSlice';
import ThemedIcon from "../components/ThemedIcon";
import InfoModal from '../components/InfoModal';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CompletedScreen({ navigation }) {
  // const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const STATUSBAR_HEIGHT = insets.top;
  const user = useSelector((state) => selectCurrentUser(state));
  const scrollViewRef = useRef(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const autoRefreshTimerRef = useRef(null);
  const handleRefreshRef = useRef(null);
  
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedSubTaskTypes, setSelectedSubtTaskTypes] = useState(['speech_on_topic', 'read_aloud', 'speech_on_scenario']);
  const [completionDate, setCompletionDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);

  const assignmentSubTypeOptions = [
    { value: 'speech_on_topic', label: 'Speech On Topic' },
    { value: 'read_aloud', label: 'Read Aloud' },
    { value: 'speech_on_scenario', label: 'Speech Scenario' },
  ];

  // Ay ismini al
  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  // Tarih formatla
  const formatDate = (dateString, format = 'display') => {
    if (!dateString) return format === 'api' ? null : '';
    
    const date = new Date(dateString);
    
    if (format === 'api') {
      // API format: YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Display format: DD Month YYYY - HH:MM
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = getMonthName(date.getUTCMonth());
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} - ${hours}:${minutes}`;
  };

  // Fetch completed exercises
  const fetchCompletedExercises = useCallback(async (reset = false, cursor = null, isRefresh = false) => {
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
        completionDate: formatDate(completionDate, 'api'),
        lastAssignedTaskId: reset ? null : (cursor || nextCursor),
        perPageCount: 100,
        role: 'student',
        selectedTaskNames: [],
        selectedTaskTypes: ['speech'],
        selectedSubTaskTypes: selectedSubTaskTypes.length > 0 ? selectedSubTaskTypes : ['speech_on_topic', 'read_aloud', 'speech_on_scenario'],
        userId: userId,
      };

      // console.log('CompletedScreen - Request Payload:', JSON.stringify(params, null, 2));
      const response = await getCompletedExercises(params);
      // console.log('CompletedScreen - Response:', JSON.stringify(response, null, 2));

      if (response?.success || response?.status_code === 200) {
        const exercises = response?.data?.exercises || response?.data || [];
        const newNextCursor = response?.data?.nextCursor || null;
        const totalCount = response.results;

        setCompletedCount(totalCount || 0);
        setNextCursor(newNextCursor);
        setHasMore(!!newNextCursor);
        
        // Transform exercises to display format
        const transformedTasks = exercises.map((exercise, index) => {
          const isSpeechOnTopic = exercise.subTaskType === 'speech_on_topic';
          const isReadAloud = exercise.subTaskType === 'read_aloud';
          const isSpeechOnScenario = exercise.subTaskType === 'speech_on_scenario';
          const completionDate = exercise.attempts[0].completionDate;
          
          // attempts[0].mainScore'dan score al
          const firstAttempt = exercise.attempts && exercise.attempts.length > 0 ? exercise.attempts[0] : null;
          const score = firstAttempt?.mainScore || 0;
          const solvedTaskId = firstAttempt?.solvedTaskId || null;
          const status = firstAttempt?.status || 'success'; // status bilgisini al
          
          // TEST: İlk sonucun status'ünü 'pending' yap
          // const testStatus = index === 0 ? 'pending' : status;

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
            completionDate: formatDate(completionDate),
            rawCompletionDate: completionDate, // For sorting
            type: taskType,
            score: Math.round(score),
            solvedTaskId: solvedTaskId, // Detay için kullanılacak
            status: status, // Status bilgisini ekle
            // status: testStatus, // Status bilgisini ekle
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
      
      const loadData = async () => {
        setNextCursor(null);
        setHasMore(true);
        await fetchCompletedExercises(true, null);
        // Timer useEffect içinde otomatik başlayacak
      };
      
      loadData();
      
      // Cleanup: Sayfa unfocus olunca timer'ı temizle
      return () => {
        if (autoRefreshTimerRef.current) {
          clearTimeout(autoRefreshTimerRef.current);
        }
      };
    }, [user, fetchCompletedExercises])
  );

  // rapor detaya gider
  const handleReportPress = (assignment) => {
    if (!assignment.solvedTaskId) {
      console.error('CompletedScreen: Missing solvedTaskId');
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

  const toggleSubTaskType = (taskType) => {
    setSelectedSubtTaskTypes(prev => {
      if (prev.includes(taskType)) {
        return prev.filter(t => t !== taskType);
      } else {
        return [...prev, taskType];
      }
    });
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setCompletionDate(selectedDate.toISOString());
      }
    } else if (Platform.OS === 'ios') {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmDateSelection = () => {
    if (tempDate) {
      setCompletionDate(tempDate.toISOString());
    }
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    setTempDate(completionDate ? new Date(completionDate) : new Date());
    setShowDatePicker(true);
  };

  const clearDate = () => {
    setCompletionDate(null);
  };

  const applyFilters = async () => {
    setFilterModalVisible(false);
    setNextCursor(null);
    setHasMore(true);
    await fetchCompletedExercises(true, null);
  };

  const resetFilters = async () => {
    setSelectedSubtTaskTypes(['speech_on_topic', 'read_aloud', 'speech_on_scenario']);
    setCompletionDate(null);
    setFilterModalVisible(false);
    setNextCursor(null);
    setHasMore(true);
    await fetchCompletedExercises(true, null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT }]}>
        <View style={styles.headerLeft} />
        <ThemedText weight="semibold" style={styles.headerTitle}>
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
        contentContainerStyle={styles.scrollContent}
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
          completedTasks.map((assignment) => (
            <CompletedAssignmentCard
              key={assignment.id}
              assignment={assignment}
              onPress={() => handleReportPress(assignment)}
            />
          ))
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ThemedText style={{ color: '#666' }}>No completed assignments yet</ThemedText>
          </View>
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
        title="Filter Options"
        height={SCREEN_HEIGHT * 0.85}
        primaryButton={{
          text: 'Apply Filter',
          onPress: applyFilters,
        }}
        secondaryButton={{
          text: 'Reset Filter',
          onPress: resetFilters,
        }}
      >
        <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <ThemedText weight="bold" style={styles.filterSectionTitle}>Assignment Type</ThemedText>
            
            {assignmentSubTypeOptions.map((option) => (
              <TouchableOpacity 
                key={option.value}
                style={styles.checkboxRow}
                onPress={() => toggleSubTaskType(option.value)}
                activeOpacity={0.7}
              >
                <View style={styles.checkbox}>
                  {selectedSubTaskTypes.includes(option.value) && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <ThemedText style={styles.checkboxLabel}>{option.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterSection}>
            <ThemedText weight="bold" style={styles.filterSectionTitle}>Completion Date</ThemedText>
            
            <View style={styles.datePickerRow}>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={openDatePicker}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.datePickerButtonText}>
                  {completionDate ? new Date(completionDate).toLocaleDateString() : 'Select Date'}
                </ThemedText>
                <ThemedIcon iconName="calendar" size={20} tintColor="#3E4EF0" />
              </TouchableOpacity>
              
              {showDatePicker && Platform.OS === 'ios' ? (
                <TouchableOpacity 
                  style={styles.confirmDateIconButton}
                  onPress={confirmDateSelection}
                  activeOpacity={0.7}
                >
                  <ThemedIcon iconName="checkmark" size={20} tintColor="#FFFFFF" />
                </TouchableOpacity>
              ) : completionDate ? (
                <TouchableOpacity 
                  style={styles.clearDateButton}
                  onPress={clearDate}
                  activeOpacity={0.7}
                >
                  <ThemedIcon iconName="close" size={18} tintColor="#666" />
                </TouchableOpacity>
              ) : null}
            </View>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={tempDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  style={styles.iosDatePicker}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </InfoModal>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 80
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
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#3E4EF0',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    backgroundColor: '#3E4EF0',
    borderRadius: 3,
  },
  checkboxLabel: {
    fontSize: 15,
    lineHeight: 20,
    color: '#3A3A3A',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  clearDateButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4FF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
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
});

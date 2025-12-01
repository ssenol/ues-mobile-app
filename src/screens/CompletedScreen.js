import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import CompletedAssignmentCard from '../components/CompletedAssignmentCard';
import LoadingOverlay from '../components/LoadingOverlay';
import { ThemedText } from '../components/ThemedText';
import { getCompletedExercises } from '../services/speak';
import { selectCurrentUser } from '../store/slices/authSlice';
// import { useTheme } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CompletedScreen({ navigation }) {
  // const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const STATUSBAR_HEIGHT = insets.top;
  const user = useSelector((state) => selectCurrentUser(state));
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const autoRefreshTimerRef = useRef(null);
  const handleRefreshRef = useRef(null);

  // HTML'den metni temizle
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  // Ay ismini al
  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  // Tarih formatla
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = getMonthName(date.getMonth());
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
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
      const userId = user?.id || user?._id || user?.userId;
      if (!userId) {
        console.error('CompletedScreen: Missing user ID');
        setCompletedTasks([]);
        setLoading(false);
        return;
      }

      const params = {
        completionDate: null,
        lastAssignedTaskId: reset ? null : (cursor || nextCursor),
        perPageCount: 100,
        role: 'student',
        selectedTaskNames: [],
        selectedTaskTypes: ['speech'],
        userId: userId,
      };

      // console.log('CompletedScreen - Request Payload:', JSON.stringify(params, null, 2));
      const response = await getCompletedExercises(params);
      // console.log('CompletedScreen - Response:', JSON.stringify(response, null, 2));
      
      if (response?.success || response?.status_code === 200) {
        const exercises = response?.data?.exercises || response?.data || [];
        const newNextCursor = response?.data?.nextCursor || null;
        
        setNextCursor(newNextCursor);
        setHasMore(!!newNextCursor);
        
        // Transform exercises to display format
        const transformedTasks = exercises.map((exercise, index) => {
          const isSpeechOnTopic = exercise.subTaskType === 'speech_on_topic';
          const completionDate = exercise.attempts[0].completionDate;
          
          // attempts[0].mainScore'dan score al
          const firstAttempt = exercise.attempts && exercise.attempts.length > 0 ? exercise.attempts[0] : null;
          const score = firstAttempt?.mainScore || 0;
          const solvedTaskId = firstAttempt?.solvedTaskId || null;
          const status = firstAttempt?.status || 'success'; // status bilgisini al
          
          // TEST: İlk sonucun status'ünü 'pending' yap
          // const testStatus = index === 0 ? 'pending' : status;

          return {
            id: exercise.assignedTaskId,
            title: exercise.taskName || (isSpeechOnTopic ? 'Speech On Topic' : 'Read Aloud'),
            completionDate: formatDate(completionDate),
            rawCompletionDate: completionDate, // For sorting
            type: isSpeechOnTopic ? 'Speech On Topic' : 'Read Aloud',
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
  }, [user, nextCursor]);

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

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      
      setStatusBarStyle('dark');
      
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

  const handleReportPress = (assignment) => {
    if (!assignment.solvedTaskId) {
      console.error('CompletedScreen: Missing solvedTaskId');
      return;
    }
    navigation.navigate('AssignmentReport', {
      solvedTaskId: assignment.solvedTaskId,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT }]}>
        <View style={styles.headerLeft} />
        <ThemedText weight="bold" style={styles.headerTitle}>Completed</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
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

      {/* Loading Overlay */}
      <LoadingOverlay visible={loading} message="Loading completed assignments..." />
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
    fontSize: 18,
    lineHeight: 24,
    color: '#3A3A3A',
    flex: 1,
    textAlign: 'center',
    marginTop: 16,
  },
  headerRight: {
    width: 24,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F3F4FF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Tabbar için boşluk
    backgroundColor: '#F3F4FF',
  },
});


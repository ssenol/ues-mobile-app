import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from "react-redux";
import AssignmentCard from "../components/AssignmentCard";
import GoalProgress from "../components/GoalProgress";
import LoadingOverlay from "../components/LoadingOverlay";
import NotificationModal from "../components/NotificationModal";
import ThemedIcon from "../components/ThemedIcon";
import { ThemedText } from "../components/ThemedText";
import { fetchAssignedSpeechTasks } from "../services/speak";
import { selectCurrentUser } from "../store/slices/authSlice";
import { useTheme } from "../theme/ThemeContext";
import {
  buildAssignedSpeechTaskParams,
  parseAssignedTasksResponse,
  transformTaskToAssignment,
} from "../utils/assignmentTransform";

export default function HomeScreen({ navigation }) {
  const user = useSelector((state) => selectCurrentUser(state));
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const STATUSBAR_HEIGHT = insets.top;
  const BANNER_WIDTH = SCREEN_WIDTH - 32; // 16px padding sağ + sol
  const BANNER_ASPECT_RATIO = 343 / 128; // senin banner görsel oranı (örneğin 346x149px)
  const BANNER_HEIGHT = BANNER_WIDTH / BANNER_ASPECT_RATIO;

  const scrollY = useRef(new Animated.Value(0)).current;
  const [isSticky, setIsSticky] = useState(false);
  const lastAssignmentsHeaderRef = useRef(null);
  const [lastAssignmentsHeaderY, setLastAssignmentsHeaderY] = useState(0);

  // Sayfa focus olduğunda StatusBar'ı sıfırla
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => {};
    }, [])
  );

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        
        // Sticky header kontrolü
        if (lastAssignmentsHeaderY > 0) {
          if (offsetY >= lastAssignmentsHeaderY && !isSticky) {
            setIsSticky(true);
          } else if (offsetY < lastAssignmentsHeaderY && isSticky) {
            setIsSticky(false);
          }
        }
      },
    }
  );

  const [progressKey, setProgressKey] = useState(0);
  const [lastAssignments, setLastAssignments] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [completedAssignments, setCompletedAssignments] = useState(0);

  // API'den assignment'ları çek
  const fetchQuizzes = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { params, missingFields } = buildAssignedSpeechTaskParams(user);

      if (!params) {
        console.error('HomeScreen: Missing required user parameters', {
          missingFields,
          userId: user?.id || user?._id || user?.userId,
          institutionId: user?.institution_id || user?.institutionId || user?.schoolId,
          institutionSubSchoolId: user?.sub_school_id || user?.institutionSubSchoolId || user?.campusId,
          className: user?.classInfo?.[0] || user?.class_name || user?.className || '',
        });
        setAllQuizzes([]);
        setLastAssignments([]);
        setLoading(false);
        return;
      }

      const response = await fetchAssignedSpeechTasks(params);
      const {
        success,
        tasks,
        totals: { totalAssigned, completedAssignments: completedCount },
      } = parseAssignedTasksResponse(response);

      setTotalAssignments(totalAssigned);
      setCompletedAssignments(completedCount);

      if (success && Array.isArray(tasks) && tasks.length > 0) {
        const transformedAssignments = tasks.map(transformTaskToAssignment).filter(Boolean);
        // Tüm assignment'ları sakla (GoalProgress için)
        setAllQuizzes(transformedAssignments);
        
        // Çözülmeyenleri filtrele ve startDate'e göre artan sırada sırala
        const unsolvedAssignments = transformedAssignments
          .filter(assignment => !assignment.isSolved)
          .sort((a, b) => {
            const dateA = new Date(a.startDate || 0).getTime();
            const dateB = new Date(b.startDate || 0).getTime();
            return dateA - dateB; // Artan sıra (en eski önce)
          });
        
        // Son 5 assignment'ı al
        setLastAssignments(unsolvedAssignments.slice(0, 5));
      } else {
        setAllQuizzes([]);
        setLastAssignments([]);
      }
    } catch (error) {
      console.error('HomeScreen fetchQuizzes error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setAllQuizzes([]);
      setLastAssignments([]);
      setTotalAssignments(0);
      setCompletedAssignments(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Sayfa focus olduğunda progress animasyonunu tetikle ve assignment'ları çek
  useFocusEffect(
    useCallback(() => {
      setProgressKey(prev => prev + 1);
      fetchQuizzes();
    }, [fetchQuizzes])
  );

  // Kart verilerini tanımlayalım
  const activityCards = [
    {
      id: 'speech',
      title: 'Speech on Topic',
      description: 'Topic-focused speaking practice',
      icon: 'speechOnTopic',
      onPress: () => navigation.navigate('Assignments', { filter: 'Speech On Topic' }),
    },
    {
      id: 'read',
      title: 'Read Aloud',
      description: 'Read Well, Feel Confident.',
      icon: 'readAloud',
      onPress: () => navigation.navigate('Assignments', { filter: 'Read Aloud' }),
    },
    {
      id: 'scenario',
      title: 'Speech on Scenario',
      description: 'Speak According to The Given Scenario.',
      icon: 'speechOnScenario',
      onPress: () => navigation.navigate('Assignments', { filter: 'Read Aloud' }),
    },
  ];

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: '#fff',
    },

    // Status bar alanı (sabit kalacak)
    statusBarArea: {
      height: STATUSBAR_HEIGHT,
      backgroundColor: colors.primary,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 999,
    },

    // ScrollView
    scroll: {
      flex: 1,
      zIndex: 2,
      marginTop: STATUSBAR_HEIGHT,
    },
    scrollContent: {
      paddingBottom: 100,
      flexGrow: 1,
    },

    // Mavi background
    blueBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 216 - STATUSBAR_HEIGHT,
      zIndex: -1,
    },
    blueBackgroundImage: {
      width: '100%',
      height: '100%',
    },

    // Avatar ve yazılar (en önde)
    avatarContainer: {
      flexDirection: 'row',
      alignItems: 'top',
      marginTop: 24,
      // backgroundColor: "red"
    },
    avatarButton: {
      width: 40,
      height: 40,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    username: {
      fontSize: 18,
      lineHeight: 20,
      color: '#fff',
    },
    campusname: {
      fontSize: 14,
      lineHeight: 20,
      color: '#909BFF',
    },
    notification: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // banner
    bannerContainer: {
      alignItems: 'center',
      // paddingHorizontal: 16,
      // backgroundColor: "red",
      marginTop: 16,
    },
    banner: {
      borderRadius: 12,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    bannerContent: {
      paddingLeft: 145,
      justifyContent: 'center',
      alignItems: 'flex-start',
      flex: 1,
    },
    bannerTitle: {
      marginTop: 25,
      fontSize: 18,
      lineHeight: 26,
      color: '#000',
    },

    // Activity Cards
    activityCardsContainer: {
      // marginBottom: 16,
    },
    activityCardsScrollView: {
      paddingLeft: 16,
    },
    activityCard: {
      // Ekran genişliği - sol/sağ padding (16+16) - gap / 2
      // activityCard'da 2 kart varsa 48px, 1 kart varsa 32px
      width: (SCREEN_WIDTH - (activityCards.length > 2 ? 48 : 32) - 12) / 2,
      borderRadius: 8,
      marginRight: 12,
      overflow: 'hidden',
    },
    activityCardBackground: {
      position: 'absolute',
      top: -60, // Görseli 20px yukarı kaydır
      left: 0,
      right: 0,
      bottom: 0,
    },
    activityCardContent: {
      flex: 1,
      padding: 16,
    },
    activityIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    activityTitle: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
      color: '#fff',
    },
    activityDescription: {
      fontSize: 12,
      lineHeight: 18,
      color: '#929DFF',
    },
    
    // Last Assignments
    lastAssignmentsSection: {
      marginTop: 8,
      marginBottom: 16,
    },
    lastAssignmentsHeaderSticky: {
      position: 'absolute',
      top: STATUSBAR_HEIGHT,
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      zIndex: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    lastAssignmentsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 16, 
      marginBottom: 16,
    },
    lastAssignmentsTitle: {
      fontSize: 18,
      lineHeight: 26,
      color: '#3A3A3A',
    },
    allQuizzesLink: {
      fontSize: 14,
      color: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Status bar için sabit alan */}
      <View style={styles.statusBarArea} />

      {/* --- Sticky Last Assignments Header --- */}
      {isSticky && (
        <View style={styles.lastAssignmentsHeaderSticky}>
          <View style={styles.lastAssignmentsHeader}>
            <ThemedText weight="semiBold" style={styles.lastAssignmentsTitle}>Last Assignments</ThemedText>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Assignments')}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.allQuizzesLink}>All Assignments ({totalAssignments - completedAssignments})</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- Scrollable içerik --- */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
          {/* --- Mavi arka plan --- */}
          <View style={styles.blueBackground}>
            <Image
              source={require('../../assets/images/screenHeader.png')}
              style={styles.blueBackgroundImage}
              resizeMode="cover"
            />
          </View>

          {/* --- Avatar, isim ve bildirim sabit (mavinin üstünde) --- */}
          <View style={[styles.avatarContainer, { paddingHorizontal: 16 }]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.7}
              style={styles.avatarButton}
            >
              <ThemedIcon
                iconName="avatar"
                size={40}
                // tintColor={colors.primary}
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <ThemedText weight="bold" style={styles.username}>Hello, {user?.name}!</ThemedText>
              <ThemedText style={styles.campusname}>{user?.campusName}</ThemedText>
            </View>

            <TouchableOpacity
              style={styles.notification}
              onPress={() => setNotificationModalVisible(true)}
              activeOpacity={0.7}
            >
              <ThemedIcon
                iconName="noti"
                size="16"
                tintColor={colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* --- Banner --- */}
          <View style={[styles.bannerContainer, { paddingHorizontal: 16 }]}>
            <ImageBackground
              source={require('../../assets/images/home-banner.png')}
              style={[styles.banner, { width: BANNER_WIDTH, height: BANNER_HEIGHT }]}
              resizeMode="cover"
            >
            <View style={styles.bannerContent}>
              <ThemedText style={styles.bannerTitle}>Focus on your <ThemedText weight='bold' style={{ color: colors.primary }}>growth</ThemedText>, prepare your <ThemedText weight='bold' style={{ color: colors.primary }}>future!</ThemedText></ThemedText>
            </View>
            </ImageBackground>
          </View>

          {/* --- Goal Progress --- */}
          <View style={{ paddingHorizontal: 16 }}>
            <GoalProgress 
              key={progressKey}
              completedAssignments={completedAssignments}
              totalAssignments={totalAssignments}
            />
          </View>

          {/* --- Activity Cards --- */}
          <View style={styles.activityCardsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activityCardsScrollView}
            >
              {activityCards.map((card, index) => (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.activityCard,
                    index === activityCards.length - 1 && { marginRight: 16 }
                  ]}
                  onPress={card.onPress}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require('../../assets/images/screenHeader.png')}
                    style={styles.activityCardBackground}
                    resizeMode="stretch"
                  />
                  <View style={styles.activityCardContent}>
                    <View style={styles.activityIconContainer}>
                      <ThemedIcon
                        iconName={card.icon}
                        size={24}
                        tintColor={colors.primary}
                      />
                    </View>
                    <ThemedText weight="bold" style={styles.activityTitle}>{card.title}</ThemedText>
                    <ThemedText style={styles.activityDescription}>{card.description}</ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* --- Last Assignments --- */}
          <View 
            ref={lastAssignmentsHeaderRef}
            style={[styles.lastAssignmentsSection, { paddingHorizontal: 16 }]}
            onLayout={(event) => {
              setLastAssignmentsHeaderY(event.nativeEvent.layout.y);
            }}
          >
            <View style={styles.lastAssignmentsHeader}>
              <ThemedText weight="semiBold" style={styles.lastAssignmentsTitle}>Last Assignments</ThemedText>
              <TouchableOpacity 
              onPress={() => navigation.navigate('Assignments')}
              activeOpacity={0.7}>
                <ThemedText style={styles.allQuizzesLink}>All Assignments ({totalAssignments - completedAssignments})</ThemedText>
              </TouchableOpacity>
            </View>

            {lastAssignments.length > 0 ? (
              lastAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onPress={() => {
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
                    
                    // Navigate to assignment detail
                    if (assignment.type === 'speechOnTopic' || assignment.type === 'readAloud') {
                      navigation.navigate('ReadAloud', { 
                        task: assignment.originalTask, // Orijinal task objesini gönder
                        assignedTaskId: assignment.assignedTaskId,
                        speechTaskId: assignment.speechTaskId 
                      });
                    } else {
                      navigation.navigate('WritingTasks');
                    }
                  }}
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

      {/* Notification Modal */}
      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
      />
    </View>
  );
}


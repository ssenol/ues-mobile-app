import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../components/Icon";
import speechService from "../services/speech";
import {
  selectAccessToken,
  selectCurrentUser,
} from "../store/slices/authSlice";
import { setCurrentQuiz } from "../store/slices/speechSlice";
import colors from "../styles/colors";
import { cleanHtmlAndBreaks } from "../utils/helpers";

export default function SpeechTasksScreen({ navigation, route }) {
  const { taskType } = route.params;
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paginationIndex, setPaginationIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [scrollY] = useState(new Animated.Value(0));
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);

  const HEADER_HEIGHT = 50;

  const getHeaderTitle = () => {
    if (taskType === "speaking-topic") return "Speech on Topic";
    return "Read Aloud";
  };

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      // Navigation title, header tamamen kaybolunca gösteriliyor
      if (value >= HEADER_HEIGHT && !showHeaderTitle) {
        setShowHeaderTitle(true);
        navigation.setOptions({ title: getHeaderTitle() });
      } else if (value < HEADER_HEIGHT && showHeaderTitle) {
        setShowHeaderTitle(false);
        navigation.setOptions({ title: "" });
      }
    });
    return () => scrollY.removeListener(listener);
  }, [navigation, showHeaderTitle, scrollY, taskType]);

  useEffect(() => {
    if (user && accessToken) {
      fetchTasks(1, true);
    } else {
      setLoading(false);
    }
  }, [user, accessToken]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchTasks(1, true).finally(() => setRefreshing(false));
  }, [user, accessToken]);

  const fetchTasks = async (page = 1, reset = false) => {
    if (!user || !accessToken) {
      return;
    }
    if (isNextPageLoading && !reset) return;
    try {
      if (reset) setLoading(true);
      else setIsNextPageLoading(true);
      const requestParams = {
        uesId: user.id,
        institutionId: user.institution_id,
        institutionSubSchoolId: user.sub_school_id,
        className: user.class_name,
        paginationIndex: page,
        activityType: taskType,
        perPageCount: 10,
      };
      const response = await speechService.fetchSpeechTasks(requestParams);
      // API'dan dönen veri yeni backend yapısına uygun şekilde işleniyor
      if (
        response &&
        response.data &&
        Array.isArray(response.data.assigned_quizzez)
      ) {
        if (reset) {
          setTaskList(response.data.assigned_quizzez);
          setPaginationIndex(1);
        } else {
          if (response.data.assigned_quizzez.length > 0) {
            setTaskList((prev) => [...prev, ...response.data.assigned_quizzez]);
            setPaginationIndex(page);
          }
        }
        if (typeof response.data.assigned_quizzez_total_count === "number") {
          setTotalCount(response.data.assigned_quizzez_total_count);
        }
      } else {
        if (reset) setTaskList([]);
        Alert.alert("Error", "There was a problem loading tasks (data yapısı beklenmiyor)");
      }
      setLoading(false);
      setIsNextPageLoading(false);
    } catch (error) {
      setLoading(false);
      setIsNextPageLoading(false);
      console.error("Görevleri getirirken hata oluştu:", error);
      if (error?.response?.status === 401) {
        Alert.alert(
          "Session Error",
          "Your session may have ended. Please log in again.",
          [{ text: "Tamam", onPress: () => navigation.navigate("Login") }]
        );
      } else {
        Alert.alert("Error", "There was a problem loading tasks.");
      }
    }
  };

  const loadMoreTasks = () => {
    const nextPage = paginationIndex + 1;
    const alreadyLoaded = taskList.length;
    if (alreadyLoaded >= totalCount) return;
    if (isNextPageLoading) return;
    fetchTasks(nextPage);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!taskList || taskList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No speech assignment found.
        </Text>
      </View>
    );
  }

  const handleTaskPress = (task) => {
    dispatch(setCurrentQuiz(task));
    const speechCard = task.question.questionAnswersData.speechCards[0];
    if (taskType === "speaking-topic") {
      navigation.navigate("SpeechRecord", {
        taskId: task.quizId,
        questionId: task.question._id,
        quizName: speechCard.data,
        speechData: speechCard.data,
        taskDetails: speechCard.settings,
        taskType: "speaking-topic",
      });
    } else {
      navigation.navigate("SpeechRecord", {
        taskId: task.quizId,
        questionId: task.question._id,
        quizName: task.quizName,
        speechData: speechCard.data.replace(/<[^>]*>/g, ""),
        taskType: "read-aloud",
      });
    }
  };

  const renderTask = ({ item: task }) => (
    <TouchableOpacity
      key={task.quizId}
      style={styles.taskCard}
      onPress={() => handleTaskPress(task)}
    >
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>
          {(() => {
            const rawTitle =
              taskType === "speaking-topic"
                ? task.question.questionAnswersData.speechCards[0].data
                : task.quizName;
            const cleaned = cleanHtmlAndBreaks(rawTitle);
            return cleaned.length > 100
              ? cleaned.substring(0, 100) + "..."
              : cleaned;
          })()}
        </Text>
        <View style={styles.taskDetails}>
          {taskType === "read-aloud" &&
            task.question.questionAnswersData.speechCards[0].ai_filters && (
              <>
                <View style={styles.taskDetailItem}>
                  <Icon
                    iosName="star"
                    androidName="star"
                    size={Platform.OS === "ios" ? 14 : 16}
                    color={colors.primary}
                  />
                  <Text style={styles.taskDetailText}>
                    { task.question.questionAnswersData.speechCards[0].ai_filters.cefr_level }
                  </Text>
                </View>
                <View style={styles.taskDetailItem}>
                  <Icon
                    iosName="book"
                    androidName="menu-book"
                    size={Platform.OS === "ios" ? 14 : 16}
                    color={colors.primary}
                  />
                  <Text style={styles.taskDetailText}>
                    { task.question.questionAnswersData.speechCards[0].ai_filters.subject }
                  </Text>
                </View>
              </>
            )}
          {taskType === "speaking-topic" &&
            task.question.questionAnswersData.speechCards[0].settings && (
              <>
                <View style={styles.taskDetailItem}>
                  <Icon
                    iosName="clock"
                    androidName="av-timer"
                    size={Platform.OS === "ios" ? 14 : 16}
                    color={colors.primary}
                  />
                  <Text style={styles.taskDetailText}>
                    { task.question.questionAnswersData.speechCards[0].settings.duration }{" "}seconds
                  </Text>
                </View>
                <View style={styles.taskDetailItem}>
                  <Icon
                    iosName="text.alignleft"
                    androidName="text-snippet"
                    size={Platform.OS === "ios" ? 14 : 16}
                    color={colors.primary}
                  />
                  <Text style={styles.taskDetailText}>
                    { task.question.questionAnswersData.speechCards[0].settings.wordCount }{" "}words
                  </Text>
                </View>
                <View style={styles.taskDetailItem}>
                  <Icon
                    iosName="text.quote"
                    androidName="wrap-text"
                    size={Platform.OS === "ios" ? 14 : 16}
                    color={colors.primary}
                  />
                  <Text style={styles.taskDetailText}>
                    { task.question.questionAnswersData.speechCards[0].settings.sentenceCount }{" "}sentences
                  </Text>
                </View>
              </>
            )}
        </View>
      </View>
      <Icon
        iosName="chevron.right"
        androidName="chevron-right"
        size={Platform.OS === "ios" ? 20 : 24}
        color={colors.primary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: HEADER_HEIGHT,
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: colors.background,
          zIndex: 2,
          paddingHorizontal: 16,
          paddingBottom: showHeaderTitle ? 10 : 0,
          transform: [
            {
              translateY: scrollY.interpolate({
                inputRange: [0, HEADER_HEIGHT],
                outputRange: [0, -HEADER_HEIGHT],
                extrapolate: "clamp",
              }),
            },
          ],
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}>
          {getHeaderTitle()}
        </Text>
      </Animated.View>
      <Animated.FlatList
        data={taskList}
        renderItem={renderTask}
        keyExtractor={(item) => item.quizId.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMoreTasks}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isNextPageLoading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: HEADER_HEIGHT }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    color: colors.slate600,
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  taskContent: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 8,
  },
  taskDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  taskDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDetailText: {
    fontSize: 12,
    color: colors.slate600,
  },
});

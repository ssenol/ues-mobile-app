import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import {
  setAssignedWritingQuizzes,
  setCurrentWritingQuiz,
  setWritingTotalCount,
  setWritingPage,
} from "../store/slices/writingSlice";
import {
  selectCurrentUser,
  selectAccessToken,
} from "../store/slices/authSlice";
import writingService from "../services/writing";
import Icon from "../components/Icon";
import colors from "../styles/colors";
import { cleanHtmlAndBreaks } from "../utils/helpers";

export default function WritingTasksScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paginationIndex, setPaginationIndex] = useState(1);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [taskList, setTaskList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [scrollY] = useState(new Animated.Value(0));
  const [showHeaderTitle, setShowHeaderTitle] = useState(false);

  // Başlık yüksekliği (px)
  const HEADER_HEIGHT = 60;

  useEffect(() => {
    // Sayfa ilk açıldığında header başlığını boş yap
    navigation.setOptions({ title: "" });
  }, [navigation]);

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      if (value > HEADER_HEIGHT && !showHeaderTitle) {
        setShowHeaderTitle(true);
        navigation.setOptions({ title: "Writing Task" });
      } else if (value <= HEADER_HEIGHT && showHeaderTitle) {
        setShowHeaderTitle(false);
        navigation.setOptions({ title: "" });
      }
    });
    return () => scrollY.removeListener(listener);
  }, [navigation, showHeaderTitle, scrollY]);

  const fetchTasks = useCallback(
    async (page = 1, reset = false) => {
      if (!user || !accessToken) return;
      try {
        if (reset) setLoading(true);
        const params = {
          uesId: user.id,
          institutionId: user.institution_id,
          institutionSubSchoolId: user.sub_school_id,
          className: user.class_name,
          paginationIndex: page,
          perPageCount: 10,
        };
        const data = await writingService.fetchWritingTasks(
          params,
          accessToken
        );
        if (data && data.assigned_quizzez) {
          if (reset) {
            setTaskList(data.assigned_quizzez);
          } else {
            setTaskList((prev) => [...prev, ...data.assigned_quizzez]);
          }
          setTotalCount(data.assigned_quizzez_total_count || 0);
          dispatch(setAssignedWritingQuizzes(data.assigned_quizzez));
          dispatch(
            setWritingTotalCount(data.assigned_quizzez_total_count || 0)
          );
          dispatch(setWritingPage(page));
        }
      } catch (error) {
        console.error("Writing görevleri alınırken hata:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsNextPageLoading(false);
      }
    },
    [user, accessToken, dispatch]
  );

  useEffect(() => {
    fetchTasks(1, true);
  }, [fetchTasks]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPaginationIndex(1);
    fetchTasks(1, true);
  };

  const loadMoreTasks = () => {
    const nextPage = paginationIndex + 1;
    const alreadyLoaded = taskList.length;
    if (alreadyLoaded >= totalCount) return;
    if (isNextPageLoading) return;
    setIsNextPageLoading(true);
    setPaginationIndex(nextPage);
    fetchTasks(nextPage);
  };

  const handleTaskPress = (task) => {
    dispatch(setCurrentWritingQuiz(task));
    navigation.navigate("WritingTaskDetail", { quizId: task.quizId });
  };

  const renderTask = ({ item: task }) => {
    const headContent = task.question?.questionHeadData?.headContent || "";
    const subDetails = task.question?.questionSubDetails || {};
    return (
      <TouchableOpacity
        key={task.quizId}
        style={styles.taskCard}
        onPress={() => handleTaskPress(task)}
      >
        <View style={styles.taskContent}>
          <Text style={styles.taskTitle} numberOfLines={6}>
            {cleanHtmlAndBreaks(headContent)}
          </Text>
          <View style={styles.taskDetails}>
            <View style={styles.taskDetailItem}>
              <Icon
                iosName="list.number"
                androidName="format-list-numbered"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.taskDetailText}>
                {subDetails.minParagraphCount || "-"} Paragraphs
              </Text>
            </View>
            <View style={styles.taskDetailItem}>
              <Icon
                iosName="textformat.size"
                androidName="text-fields"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.taskDetailText}>
                {subDetails.maxLengthOfResponse || "-"} Words
              </Text>
            </View>
            <View style={styles.taskDetailItem}>
              <Icon
                iosName="person.crop.circle"
                androidName="person"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.taskDetailText}>
                {subDetails.cefrLevel || "-"}
              </Text>
            </View>
          </View>
        </View>
        <Icon
          iosName="chevron.forward"
          androidName="chevron-right"
          size={24}
          color={colors.primary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        {/* Ana başlık */}
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
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, HEADER_HEIGHT],
                  outputRange: [0, -HEADER_HEIGHT],
                  extrapolate: "clamp",
                })
              }
            ],
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary }}>
            Writing Task
          </Text>
        </Animated.View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : taskList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Yazma görevi bulunamadı.</Text>
          </View>
        ) : (
          <Animated.FlatList
            data={taskList}
            renderItem={renderTask}
            keyExtractor={(item) => item.quizId}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            onEndReached={loadMoreTasks}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isNextPageLoading ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
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
        )}
      </View>
    </SafeAreaView>
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
  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
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
    gap: 6,
  },
  taskDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 8,
  },
  taskDetailText: {
    fontSize: 12,
    color: colors.slate600,
  },
});

import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import colors from "../styles/colors";

const SpeakReportScreen = ({ route }) => {
  const { speakResults, quizName, speakData, taskDetails, taskType } = route.params;
  const [results, setResults] = useState(null);
  const reduxResults = useSelector(state => state.speak?.speakResults);

  useEffect(() => {
    if (speakResults) {
      setResults(speakResults);
    } else if (reduxResults) {
      setResults(reduxResults);
    }
  }, [speakResults, reduxResults]);

  if (!results) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Speak Report</Text>
      <Text style={styles.quizName}>{quizName}</Text>
      <Text style={styles.data}>{speakData}</Text>
      {/* Sonuç detaylarını burada gösterin */}
      <Text style={styles.resultDetails}>{JSON.stringify(results, null, 2)}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  quizName: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  data: {
    fontSize: 15,
    color: colors.slate700,
    marginBottom: 16,
    textAlign: "center",
  },
  resultDetails: {
    fontSize: 13,
    color: colors.slate600,
    marginTop: 12,
  },
});

export default SpeakReportScreen;

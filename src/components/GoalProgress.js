import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import ThemedIcon from './ThemedIcon';
import { ThemedText } from './ThemedText';

export default function GoalProgress({ completedAssignments, totalAssignments }) {
  const { colors } = useTheme();
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const firstRange = 85;
  const secondRange = 60;

  // Tamamlanma oranına göre renk ve ikon belirleme
  const getProgressBackgroundColor = () => {
    if (completionRate >= firstRange) return colors.goalBackgroundGreen;
    if (completionRate >= secondRange) return colors.goalBackgroundOrange;
    return colors.goalBackgroundRed;
  };

  const getProgressColor = () => {
    if (completionRate >= firstRange) return colors.goalGreen;
    if (completionRate >= secondRange) return colors.goalOrange;
    return colors.goalRed;
  };

  // İlerleme durumuna göre mesaj belirleme
  const getProgressMessage = () => {
    if (completionRate >= firstRange) return "Nice work!";
    if (completionRate >= secondRange) return "Good progress!";
    return "Keep going!";
  };

  const getProgressIcon = () => {
    if (completionRate >= firstRange) return "goalGreen";
    if (completionRate >= secondRange) return "goalOrange";
    return "goalRed";
  };

  const progressColor = getProgressColor();
  const backgroundColor = getProgressBackgroundColor();

  // Progress bar animasyonu - component mount olduğunda veya completionRate değiştiğinde
  useEffect(() => {
    // Animasyonu sıfırdan başlat
    animatedWidth.setValue(0);
    Animated.timing(animatedWidth, {
      toValue: completionRate,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [completionRate, animatedWidth]);

  return (
    <View style={[styles.goalProgressContainer, { backgroundColor }]}>
      <View style={styles.goalProgressHeader}>
        <View style={[styles.iconContainer, { backgroundColor: progressColor }]}>
          <ThemedIcon
            iconName={getProgressIcon()}
            size={16}
            tintColor={colors.white}
          />
        </View>
        <ThemedText weight="bold" style={styles.goalProgressTitle}>Goal Progress</ThemedText>
      </View>

      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }),
              backgroundColor: progressColor
            }
          ]}
        />
      </View>

      <ThemedText style={[styles.progressText, { color: progressColor }]}>
        {getProgressMessage()} <Text style={{color: colors.black}}>{completedAssignments} of {totalAssignments} assignments done!</Text>
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  goalProgressContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalProgressTitle: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    lineHeight: 18,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


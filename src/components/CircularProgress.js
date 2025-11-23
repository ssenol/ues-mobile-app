import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from './ThemedText';

export default function CircularProgress({ value, label, size = 80, strokeWidth = 8, color = '#3E4EF0', shouldAnimate = false }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), 100);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(shouldAnimate ? 0 : progress);
  const [strokeDashoffset, setStrokeDashoffset] = useState(
    shouldAnimate ? circumference : circumference - (progress / 100) * circumference
  );

  useEffect(() => {
    if (shouldAnimate) {
      // Animasyonu sıfırdan başlat
      animatedValue.setValue(0);
      setDisplayValue(0);
      setStrokeDashoffset(circumference);

      // Progress animasyonu
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 700,
        useNativeDriver: false,
      }).start();

      // Değer ve strokeDashoffset animasyonu
      const listener = animatedValue.addListener(({ value: animatedProgress }) => {
        const roundedValue = Math.round(animatedProgress);
        setDisplayValue(roundedValue);
        const offset = circumference - (circumference * animatedProgress / 100);
        setStrokeDashoffset(offset);
      });

      return () => {
        animatedValue.removeListener(listener);
      };
    } else {
      // Animasyon yoksa direkt değeri göster
      setDisplayValue(progress);
      setStrokeDashoffset(circumference - (progress / 100) * circumference);
    }
  }, [shouldAnimate, progress, animatedValue, circumference]);

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E7E9FF"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(0 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.valueContainer}>
          <ThemedText weight="bold" style={[styles.valueText]}>
            {displayValue}
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.labelText}>{label}</ThemedText>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  valueContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
  },
  labelText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#727272',
    marginTop: 4,
    textAlign: 'center',
  },
});


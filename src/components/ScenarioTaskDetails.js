import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import { ThemedText } from './ThemedText';
import { getOptimizedImageUrl } from '../utils/helpers';

// HTML'den metni temizle
const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const ScenarioTaskDetails = ({ task }) => {
  const [speed, setSpeed] = useState(1);

  if (!task) {
    return null;
  }

  const { concept, scenario, title: conceptTitle } = task.task.setting.selectedConcept.concept;
  const { coverImage } = task.task.data;

  return (
    <View style={styles.container}>
      {/* Concept Card */}
      <View style={styles.card}>
        <ThemedText weight="bold" style={styles.cardTitle}>{stripHtml(conceptTitle) || 'Speech On Scenario'}</ThemedText>
        <ThemedText style={styles.cardContent}>{stripHtml(concept)}</ThemedText>
      </View>

      {/* Scenario Card */}
      <View style={styles.card}>
        <ThemedText weight="bold" style={styles.cardTitle}>Scenario To Interact</ThemedText>
        <View style={styles.scenarioContainer}>
          <ThemedText style={styles.scenarioText}>{stripHtml(scenario)}</ThemedText>
          {coverImage && <Image source={{ uri: getOptimizedImageUrl(coverImage) }} style={styles.scenarioImage} />}
        </View>
      </View>

      {/* Audio Speed */}
      <View style={styles.card}>
        <ThemedText weight="bold" style={styles.cardTitle}>Audio Speed</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={2}
          step={1}
          value={speed}
          onValueChange={value => setSpeed(value)}
          minimumTrackTintColor="#3E4EF0"
          maximumTrackTintColor="#E7E9FF"
          thumbTintColor="#3E4EF0"
        />
        <View style={styles.speedTicksContainer}>
          <ThemedText style={styles.speedTick}>Slow</ThemedText>
          <ThemedText style={styles.speedTick}>Natural</ThemedText>
          <ThemedText style={styles.speedTick}>Fast</ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 16,
  },
  card: {
    backgroundColor: '#F3F4FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: '#3A3A3A',
  },
  cardContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3A3A3A',
  },
  scenarioContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scenarioText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#3A3A3A',
  },
  scenarioImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginLeft: 12,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  speedTicksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  speedTick: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
  },
});

export default ScenarioTaskDetails;

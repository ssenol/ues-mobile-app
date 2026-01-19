import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { setStatusBarStyle } from 'expo-status-bar';
import { ThemedText } from '../components/ThemedText';
import ThemedIcon from '../components/ThemedIcon';
import ScenarioTaskDetails from '../components/ScenarioTaskDetails';

const { width } = Dimensions.get('window');

const SpeechOnScenarioStep1Screen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { task } = route.params || {};

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle('dark');
    }, [])
  );

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>Task data is not available.</ThemedText>
      </SafeAreaView>
    );
  }

  const { taskName } = task.task.setting;

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <ThemedIcon
            iconName="back"
            size={24}
            tintColor="#3A3A3A"
          />
        </TouchableOpacity>
        <ThemedText weight="semibold" style={styles.headerTitle}>{stripHtml(taskName) || 'Speech On Scenario'}</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <ThemedIcon iconName="info2" size={24} tintColor="#F0AC3D" />
          <ThemedText style={styles.infoText}>
            When the quiz begins, reach this page using <ThemedText weight="bold">Show Task Options</ThemedText>.
          </ThemedText>
        </View>

        <ScenarioTaskDetails task={task} />
      </ScrollView>

      {/* Start Chat Button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity 
          style={styles.buttonContainer} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SpeechOnScenarioStep2', { task })}
        >
          <ThemedText weight="bold" style={styles.buttonText}>Start Chat</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    marginTop: 16
  },
  headerButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    color: '#1c1c1e',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 24,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 120, // Make space for the button
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3DF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 16,
  },
  infoText: {
    flex: 1,
    color: '#3A3A3A',
    fontSize: 14,
    lineHeight: 22
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32, // Extra padding for home indicator
    backgroundColor: '#fff',
    shadowColor: '#3E4EF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContainer: {
    backgroundColor: '#3E4EF0',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12

  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default SpeechOnScenarioStep1Screen;

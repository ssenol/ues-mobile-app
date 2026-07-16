import {StatusBar} from 'expo-status-bar';
import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import MyProgressPanel from '../components/progress/MyProgressPanel';
import {ThemedText} from '../components/ThemedText';
import {selectCurrentUser} from '../store/slices/authSlice';

export default function MyProgressScreen() {
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => selectCurrentUser(state));

  if (!user) return null;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft} />
        <ThemedText weight="semiBold" style={styles.headerTitle}>My Progress</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MyProgressPanel userId={user.userId} />
      </ScrollView>
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
    paddingBottom: 130,
  },
});

import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedIcon from './ThemedIcon';
import { ThemedText } from './ThemedText';

export default function AssignmentCard({ assignment, onPress }) {
  return (
    <TouchableOpacity
      style={styles.assignmentCard}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.assignmentCardTopRow}>
        <Image
          source={assignment.image}
          style={styles.assignmentCardImage}
          resizeMode="cover"
        />
        <View style={styles.assignmentCardContent}>
          <View style={styles.assignmentCardTitleRow}>
            <ThemedText weight="bold" style={styles.assignmentCardTitle} numberOfLines={2}>{assignment.title}</ThemedText>
          </View>
          <ThemedText style={styles.assignmentCardDescription} numberOfLines={3}>
            {assignment.description}
          </ThemedText>
        </View>
      </View>
      <View style={styles.assignmentCardDivider} />
      <View style={styles.assignmentCardBottomRow}>
        {assignment.isSolved ? (
          <View style={styles.showReport}>
            <ThemedIcon
              iconName="report"
              size={16}
              tintColor="#929DFF"
            />
            <ThemedText weight="bold" style={styles.showReportText}>Show Report</ThemedText>
          </View>
        ) : (
          <>
          <View style={styles.assignmentCardMetadata}>
            {assignment.metadata.map((item, index) => (
              <View key={index} style={styles.assignmentCardMetadataItem}>
                <ThemedIcon
                  iconName={item.icon}
                  size={16}
                  tintColor="#929DFF"
                />
                <ThemedText style={styles.assignmentCardMetadataText}>{item.label}</ThemedText>
              </View>
            ))}
          </View>
          <ThemedText style={styles.assignmentCardDate}>{assignment.date}</ThemedText>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  assignmentCard: {
    backgroundColor: '#F3F4FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  assignmentCardTopRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  assignmentCardImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    marginRight: 16,
  },
  assignmentCardContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  assignmentCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  assignmentCardTitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
    flex: 1,
  },
  showReport: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showReportText: {
    fontSize: 14,
    color: '#929DFF',
    marginLeft: 6,
  },
  assignmentCardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
  },
  assignmentCardDivider: {
    height: 1,
    backgroundColor: '#E7E9FF',
    marginBottom: 16,
  },
  assignmentCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentCardMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  assignmentCardMetadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  assignmentCardMetadataText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#929DFF',
    marginLeft: 6,
  },
  assignmentCardDate: {
    fontSize: 12,
    lineHeight: 18,
    color: '#929DFF',
  },
});


import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import ThemedIcon from './ThemedIcon';
import { ThemedText } from './ThemedText';

export default function CompletedAssignmentCard({ assignment, onPress }) {
  const { colors, shadows } = useTheme();

  // Eğer status 'pending' ise farklı bir card göster
  if (assignment.status === 'pending') {
    return (
      <View style={[styles.pendingCard, shadows.light]}>
        <ThemedIcon
          iconName="hourglass"
          style={styles.pendingIcon}
          size={72}
          tintColor="#3E4EF0"
        />
        
        {/* Title */}
        <ThemedText weight="bold" style={styles.pendingTitle}>
          Preparing Your Report...
        </ThemedText>
        
        {/* Subtitle */}
        <ThemedText style={styles.pendingSubtitle}>
          Your last assignment will appear here{'\n'}once it's ready.
        </ThemedText>
        
        {/* Divider */}
        <View style={styles.pendingDivider} />
        
        {/* Report Hint */}
        <ThemedText style={styles.pendingHint}>
          View your detailed quiz performance below
        </ThemedText>
        
        {/* Report Link (Disabled) */}
        <View style={styles.pendingReportLink}>
          <ThemedIcon
            iconName="report"
            size={16}
            tintColor="#ccc"
          />
          <ThemedText weight="bold" style={styles.pendingReportLinkText}>
            Report
          </ThemedText>
        </View>
      </View>
    );
  }

  // Score'a göre renk ve ikon belirleme (GoalProgress mantığıyla)
  const firstRange = 85;
  const secondRange = 60;

  const getScoreStyle = (score) => {
    if (score >= firstRange) {
      return {
        backgroundColor: colors.goalBackgroundGreen,
        textColor: colors.goalGreen,
        iconName: 'goalGreen',
      };
    } else if (score >= secondRange) {
      return {
        backgroundColor: colors.goalBackgroundOrange,
        textColor: colors.goalOrange,
        iconName: 'goalOrange',
      };
    } else {
      return {
        backgroundColor: colors.goalBackgroundRed,
        textColor: colors.goalRed,
        iconName: 'goalRed',
      };
    }
  };

  const scoreStyle = getScoreStyle(assignment.score);

  // Type'a göre renk belirleme
  const getTypeColor = (type) => {
    if (type === 'Speech On Topic') {
      return '#D97184';
    } else if (type === 'Read Aloud') {
      return '#A274DF';
    } else if (type === 'Speech on Scenario') {
      return '#E169C1';
    }
    return '#000000';
  };

  const typeColor = getTypeColor(assignment.type);

  // HTML'den metni temizle
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <View style={styles.card}>
      {/* Header: Title and Score */}
      <View style={styles.header}>
        <ThemedText weight="bold" style={styles.title}>
          {stripHtml(assignment.title)}
        </ThemedText>
        <View style={[styles.scoreBadge, { backgroundColor: scoreStyle.backgroundColor }]}>
          <View style={[styles.scoreIconContainer, { backgroundColor: scoreStyle.textColor }]}>
            <ThemedIcon
              iconName={scoreStyle.iconName}
              size={16}
              tintColor={colors.white}
            />
          </View>
          <ThemedText weight="semiBold" style={[styles.scoreText, { color: scoreStyle.textColor }]}>
            Score {assignment.score}
          </ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Completion Date */}
      <View style={styles.infoRow}>
        <View style={styles.iconBox}>
          <ThemedIcon
            iconName="date"
            size={24}
            tintColor="#3E4EF0"
          />
        </View>
        <View style={styles.infoContent}>
          <ThemedText weight='semiBold' style={styles.infoLabel}>Completion Date</ThemedText>
          <ThemedText style={styles.infoValue}>{assignment.completionDate}</ThemedText>
        </View>
      </View>

      {/* Type */}
      <View style={[styles.infoRow, styles.lastInfoRow]}>
        <View style={styles.iconBox}>
          <ThemedIcon
            iconName="type"
            size={24}
            tintColor="#3E4EF0"
          />
        </View>
        <View style={styles.infoContent}>
          <ThemedText weight='semiBold' style={styles.infoLabel}>Type</ThemedText>
          <ThemedText weight='semiBold' style={[styles.typeValue, { color: typeColor }]}>
            {assignment.type}
          </ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Report Section */}
      <View>
        {/*<ThemedText style={styles.reportHint}>
          View your detailed assignment performance below
        </ThemedText>*/}
        <TouchableOpacity
          style={styles.reportLink}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <ThemedIcon
            iconName="report"
            size={16}
            tintColor="#3E4EF0"
          />
          <ThemedText weight="bold" style={styles.reportLinkText}>
            Report
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#3E4EF0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  pendingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    paddingTop: 32,
    marginBottom: 24,
    alignItems: 'center',
  },
  pendingIcon: {
    marginBottom: 24,
  },
  pendingTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#3A3A3A',
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#727272',
    marginBottom: 24,
    textAlign: 'center',
  },
  pendingDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4FF',
    marginBottom: 16,
  },
  pendingHint: {
    fontSize: 14,
    lineHeight: 20,
    color: '#ccc',
    marginBottom: 12,
    textAlign: 'center',
  },
  pendingReportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pendingReportLinkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ccc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3A3A3A',
    flex: 1,
    marginRight: 12,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    gap: 8,
  },
  scoreIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4FF',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  lastInfoRow: {
    marginBottom: 0,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F3F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 20,
    color: '#727272',
  },
  typeValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  reportHint: {
    fontSize: 14,
    lineHeight: 20,
    color: '#949494',
    marginBottom: 12,
    textAlign: 'center',
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  reportLinkText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3E4EF0',
  },
});


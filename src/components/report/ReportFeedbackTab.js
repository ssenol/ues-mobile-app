import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import EmptyStateCard from '../EmptyStateCard';
import ThemedIcon from '../ThemedIcon';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../theme/ThemeContext';
import reportStyles from './reportStyles';
import { LETTERS, NextStepRow } from './ReportRows';

// ── Feedback sekmesi satırları (aç/kapa) ──
function TopBreadRow({ point, last }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setOpen((o) => !o)}
      style={[reportStyles.expandableRow, !last && reportStyles.rowDivider]}
    >
      <View style={reportStyles.rowMain}>
        <View style={[reportStyles.rowIconContainer, { backgroundColor: colors.goalBackgroundGreen }]}>
          <ThemedIcon iconName="bigcheck" size={14} tintColor={colors.goalGreen} />
        </View>
        <ThemedText weight="semiBold" style={[reportStyles.rowText, { flex: 1 }]}>{point.label}</ThemedText>
        <ThemedIcon
          iconName="upArrow"
          size={14}
          tintColor={colors.placeholder}
          style={{ transform: [{ rotate: open ? '0deg' : '180deg' }] }}
        />
      </View>
      {open && !!point.detail && (
        <ThemedText style={reportStyles.rowDetail}>{point.detail}</ThemedText>
      )}
    </TouchableOpacity>
  );
}

function FillingRow({ point, index, last }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const letter = LETTERS[index] || String(index + 1);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setOpen((o) => !o)}
      style={[reportStyles.expandableRow, !last && reportStyles.rowDivider]}
    >
      <View style={reportStyles.rowMain}>
        <View style={[reportStyles.letterBadge, { borderColor: colors.border }]}>
          <ThemedText weight="bold" style={[reportStyles.letterText, { color: colors.placeholder }]}>{letter}</ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText weight="semiBold" style={reportStyles.rowText}>{point.label}</ThemedText>
          {!!point.criterion && (
            <ThemedText style={reportStyles.criterionTag}>{point.criterion}</ThemedText>
          )}
        </View>
        <ThemedIcon
          iconName="upArrow"
          size={14}
          tintColor={colors.placeholder}
          style={{ transform: [{ rotate: open ? '0deg' : '180deg' }] }}
        />
      </View>
      {open && (
        <View style={reportStyles.fillingDetail}>
          {!!point.issue && <ThemedText style={reportStyles.rowDetail}>{point.issue}</ThemedText>}
          {(!!point.before || !!point.after) && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {!!point.before && (
                <View style={[reportStyles.tipBox, { flex: 1, backgroundColor: '#FFF4E5' }]}>
                  <ThemedText style={reportStyles.tipLabel}>BEFORE</ThemedText>
                  <ThemedText style={reportStyles.tipText}>{point.before}</ThemedText>
                </View>
              )}
              {!!point.after && (
                <View style={[reportStyles.tipBox, { flex: 1, backgroundColor: '#EDF7EE' }]}>
                  <ThemedText style={reportStyles.tipLabel}>AFTER</ThemedText>
                  <ThemedText style={reportStyles.tipText}>{point.after}</ThemedText>
                </View>
              )}
            </View>
          )}
          {!!point.tip && (
            <View style={[reportStyles.tipBox, { backgroundColor: '#F3F4FF' }]}>
              <ThemedText weight="semiBold" style={reportStyles.tipLabel}>TIP</ThemedText>
              <ThemedText style={reportStyles.tipText}>{point.tip}</ThemedText>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Feedback sekmesi (sandwich: topBread / filling / bottomBread) ──
export default function ReportFeedbackTab({ feedback, studentName }) {
  const { colors, shadows } = useTheme();

  if (!feedback) {
    return (
      <EmptyStateCard
        iconName="info"
        title="Feedback Not Ready"
        subtitle="Detailed feedback for this submission isn't available yet."
      />
    );
  }

  const { topBread, filling, bottomBread } = feedback;

  return (
    <View>
      <View style={[reportStyles.card, shadows.light]}>
        <ThemedText weight="bold" style={reportStyles.feedbackPageTitle}>
          Nice work{studentName ? `, ${studentName}` : ''}! Here&apos;s your detailed feedback.
        </ThemedText>
        <ThemedText style={reportStyles.feedbackPageSubtitle}>
          Strengths first — then what to improve — and your next steps to close.
        </ThemedText>
      </View>

      {topBread?.points?.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <View style={[reportStyles.sectionHeader, { backgroundColor: colors.goalBackgroundGreen }]}>
            <View style={[reportStyles.sectionNum, { backgroundColor: colors.goalGreen }]}>
              <ThemedText weight="bold" style={reportStyles.sectionNumText}>1</ThemedText>
            </View>
            <ThemedText weight="bold" style={[reportStyles.sectionHeaderText, { color: colors.goalGreen }]}>
              What&apos;s Working
            </ThemedText>
          </View>
          <View style={[reportStyles.listCardShadowWrapBottom, shadows.light]}>
            <View style={[reportStyles.listCard, reportStyles.sectionCard]}>
              {topBread.points.map((p, i) => (
                <TopBreadRow key={i} point={p} last={i === topBread.points.length - 1} />
              ))}
            </View>
          </View>
        </View>
      )}

      {filling?.points?.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <View style={[reportStyles.sectionHeader, { backgroundColor: colors.goalBackgroundOrange }]}>
            <View style={[reportStyles.sectionNum, { backgroundColor: colors.goalOrange }]}>
              <ThemedText weight="bold" style={reportStyles.sectionNumText}>2</ThemedText>
            </View>
            <ThemedText weight="bold" style={[reportStyles.sectionHeaderText, { color: colors.goalOrange }]}>
              What to Work On
            </ThemedText>
          </View>
          <View style={[reportStyles.listCardShadowWrapBottom, shadows.light]}>
            <View style={[reportStyles.listCard, reportStyles.sectionCard]}>
              {filling.points.map((p, i) => (
                <FillingRow key={i} point={p} index={i} last={i === filling.points.length - 1} />
              ))}
            </View>
          </View>
        </View>
      )}

      {(bottomBread?.summary || bottomBread?.nextSteps?.length > 0) && (
        <View style={{ marginTop: 16 }}>
          <View style={[reportStyles.sectionHeader, { backgroundColor: '#E7E9FF' }]}>
            <View style={[reportStyles.sectionNum, { backgroundColor: colors.primary }]}>
              <ThemedText weight="bold" style={reportStyles.sectionNumText}>3</ThemedText>
            </View>
            <ThemedText weight="bold" style={[reportStyles.sectionHeaderText, { color: colors.primary }]}>
              Keep Going
            </ThemedText>
          </View>
          <View style={[reportStyles.listCardShadowWrapBottom, shadows.light]}>
            <View style={[reportStyles.listCard, reportStyles.sectionCard]}>
              {!!bottomBread.summary && (
                <View style={[reportStyles.row, bottomBread.nextSteps?.length > 0 && reportStyles.rowDivider]}>
                  <ThemedText style={reportStyles.rowText}>{bottomBread.summary}</ThemedText>
                </View>
              )}
              {(bottomBread.nextSteps || []).map((step, i) => (
                <NextStepRow key={i} text={step} index={i} last={i === bottomBread.nextSteps.length - 1} />
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';
import EmptyStateCard from '../EmptyStateCard';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../theme/ThemeContext';
import reportStyles from './reportStyles';
import { getExampleSegments } from './reportUtils';

const formatMistakeType = (raw) => {
  return (raw || 'Error').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

function MistakeCard({ mistake }) {
  const { colors, fonts, shadows } = useTheme();

  const wrongText = mistake?.wrongContent || mistake?.wrongWord || '';
  const correctText = mistake?.correctedContent || mistake?.correctWord || '';
  const detail = mistake?.detailFeedbackWithReason || mistake?.explanation || '';
  const example = mistake?.exampleOfUsage || mistake?.example || '';
  const exampleSegments = getExampleSegments(example);

  return (
    <View style={[reportStyles.mistakeCard, shadows.light]}>
      <ThemedText weight="semiBold" style={reportStyles.mistakeTypeTag}>
        {formatMistakeType(mistake?.type)}{mistake?.subType ? ` · ${formatMistakeType(mistake.subType)}` : ''}
      </ThemedText>

      {(wrongText || correctText) && (
        <View style={reportStyles.mistakeCompareRow}>
          {!!wrongText && <ThemedText weight="bold" style={reportStyles.mistakeWrongText}>{wrongText}</ThemedText>}
          {!!correctText && <ThemedText weight="semiBold" style={reportStyles.mistakeCorrectText}>{correctText}</ThemedText>}
        </View>
      )}

      {!!detail && <ThemedText style={reportStyles.mistakeReasonText}>{detail}</ThemedText>}

      {exampleSegments.length > 0 && (
        <View style={reportStyles.mistakeExampleContainer}>
          <ThemedText weight="semiBold" style={reportStyles.mistakeExampleLabel}>Example</ThemedText>
          <Text style={[reportStyles.mistakeExampleText, { fontFamily: fonts.regular }]}>
            {exampleSegments.map((segment, i) => (
              <Text
                key={i}
                style={[
                  segment.isStrong ? { color: colors.primary } : null,
                  { fontFamily: segment.isStrong ? fonts.bold : fonts.regular },
                ]}
              >
                {segment.text}
              </Text>
            ))}
          </Text>
        </View>
      )}
    </View>
  );
}

// Dilbilgisi/mantık hataları listesi (mistakes dizisi) — tüm görev tiplerinde aynı şekil
export default function ReportMistakesTab({ mistakes }) {
  if (!mistakes || mistakes.length === 0) {
    return (
      <EmptyStateCard
        iconName="bigcheck"
        title="Great Job!"
        subtitle="You made no mistakes in this task."
      />
    );
  }

  return (
    <View>
      {mistakes.map((mistake, index) => (
        <MistakeCard key={index} mistake={mistake} />
      ))}
    </View>
  );
}

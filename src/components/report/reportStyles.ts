import { StyleSheet } from 'react-native';

// Kriter/feedback/mistakes sekmelerinde kullanılan paylaşılan stiller
const reportStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  criterionTitle: {
    fontSize: 17,
    color: '#3A3A3A',
    flex: 1,
    marginRight: 12,
  },
  weightText: {
    fontSize: 12,
    color: '#969696',
  },
  scoreText: {
    fontSize: 22,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4FF',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  unmeasuredHint: {
    fontSize: 13,
    color: '#969696',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#969696',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  // listCard'ın overflow:hidden'ı köşeleri kırparken gölgeyi de kırpıyor;
  // bu yüzden gölge listCard'ın kendisine değil, bu sarmalayıcıya uygulanmalı
  // (shadows.light ile birlikte kullanılır: [reportStyles.listCardShadowWrap, shadows.light])
  listCardShadowWrap: {
    borderRadius: 12,
  },
  listCardShadowWrapBottom: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  sectionCard: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
  },
  expandableRow: {
    padding: 14,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4FF',
  },
  rowIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rowText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
    flex: 1,
  },
  rowDetail: {
    fontSize: 13,
    lineHeight: 19,
    color: '#727272',
    marginTop: 8,
    width: '100%',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3A3A3A',
    flex: 1,
  },
  feedbackPageTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  feedbackPageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#727272',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  sectionNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumText: {
    fontSize: 12,
    color: '#fff',
  },
  sectionHeaderText: {
    fontSize: 15,
    flex: 1,
  },
  letterBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  letterText: {
    fontSize: 12,
  },
  criterionTag: {
    fontSize: 11,
    color: '#969696',
    marginTop: 2,
  },
  fillingDetail: {
    width: '100%',
    marginTop: 8,
    gap: 8,
  },
  tipBox: {
    borderRadius: 8,
    padding: 10,
  },
  tipLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#969696',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#727272',
  },
  // Mistakes (grammar-error / logic-error) sekmesi
  mistakeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  mistakeTypeTag: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#EB4335',
    marginBottom: 8,
  },
  mistakeCompareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  mistakeWrongText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#EB4335',
    textDecorationLine: 'line-through',
  },
  mistakeCorrectText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#34A853',
  },
  mistakeReasonText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#727272',
  },
  mistakeExampleContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4FF',
    paddingTop: 12,
  },
  mistakeExampleLabel: {
    fontSize: 12,
    color: '#969696',
    marginBottom: 4,
  },
  mistakeExampleText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#3A3A3A',
  },
});

export default reportStyles;

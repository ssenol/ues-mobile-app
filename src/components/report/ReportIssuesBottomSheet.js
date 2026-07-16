import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ThemedIcon from '../ThemedIcon';
import {ThemedText} from '../ThemedText';
import {useTheme} from '../../theme/ThemeContext';
import {CATEGORY_DEFS, LOGIC_DEF, formatSubType} from './reportIssueCategories';
import {getScoreColor} from './reportUtils';

const TABS = ['Pronunciation', 'Language Convention', 'Logic'];

// "Your Dialogue"/"Your Recording" sekmesinde ekranın altına sabitlenen, sabit yükseklikli
// Pronunciation / Language Convention / Logic panosu (boostifywrite/src/screens/ReportWriting.tsx
// içindeki WritingBottomSheet ile aynı desen)
export default function ReportIssuesBottomSheet({ mistakes, voiceErrors, responseText, issuesPanel }) {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const {
    activeIssueTab,
    setActiveIssueTab,
    lcFilter,
    setLcFilter,
    sheetExpanded,
    setSheetExpanded,
    openModal,
  } = issuesPanel;

  const pronunciationIssues = voiceErrors || [];
  const lcIssues = (mistakes || []).filter((m) => m.type !== 'logic-error');
  const logicIssuesRaw = (mistakes || []).filter((m) => m.type === 'logic-error');

  // Aynı cümlede birden fazla hata varsa metindeki sıraya göre grupla (API sırası korunur, pozisyon öncelikli)
  const logicIssues = useMemo(() => {
    if (!responseText) return logicIssuesRaw;
    return [...logicIssuesRaw].sort((a, b) => {
      const aPos = responseText.indexOf(a.wrongContent || '');
      const bPos = responseText.indexOf(b.wrongContent || '');
      if (aPos !== bPos) return aPos - bPos;
      return (a.errorIndex || 0) - (b.errorIndex || 0);
    });
  }, [logicIssuesRaw, responseText]);

  const counts = {};
  for (const issue of lcIssues) counts[issue.type] = (counts[issue.type] || 0) + 1;
  const activeCats = CATEGORY_DEFS.filter((c) => c.id !== 'all' && (counts[c.key] || 0) > 0);

  const badgeFor = (tab) => {
    if (tab === 'Pronunciation') return pronunciationIssues.length;
    if (tab === 'Language Convention') return lcIssues.length;
    return logicIssues.length;
  };

  return (
    <View style={[styles.sheet, shadows.sticky, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Tab bar - her zaman görünür */}
      <View style={styles.tabBar}>
        <View style={styles.handleWrap} pointerEvents="none">
          <View style={styles.handle} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.tabRow}>
          {TABS.map((t) => {
            const isActive = t === activeIssueTab;
            const count = badgeFor(t);
            return (
              <TouchableOpacity
                key={t}
                onPress={() => { setActiveIssueTab(t); setSheetExpanded(true); }}
                style={styles.tabItem}
              >
                <ThemedText weight={isActive ? 'bold' : 'semiBold'} style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {t}{count > 0 ? ` (${count})` : ''}
                </ThemedText>
                {isActive && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={() => setSheetExpanded((e) => !e)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.toggleBtn}
        >
          <ThemedIcon
            iconName="upArrow"
            size={16}
            tintColor="#969696"
            style={{ transform: [{ rotate: sheetExpanded ? '0deg' : '180deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {/* İçerik - sabit yükseklik, sekmeler arası kayma yok */}
      {sheetExpanded && (
        <View style={styles.content}>
          {activeIssueTab === 'Pronunciation' && (
            pronunciationIssues.length === 0 ? (
              <View style={styles.emptyWrap}>
                <ThemedText style={styles.emptyText}>Clear pronunciation throughout — nothing to work on here.</ThemedText>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {pronunciationIssues.map((issue, i) => {
                  const accuracyColor = getScoreColor(colors, issue.accuracy || 0);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.pronunciationRow}
                      onPress={() => openModal(pronunciationIssues, i, 'pronunciation')}
                    >
                      <ThemedText weight="semiBold" style={styles.pronunciationWord}>{issue.word}</ThemedText>
                      <View style={[styles.pronunciationScoreBadge, { backgroundColor: `${accuracyColor}22` }]}>
                        <ThemedText weight="bold" style={[styles.pronunciationScoreText, { color: accuracyColor }]}>
                          {issue.accuracy ?? '—'}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )
          )}

          {activeIssueTab === 'Language Convention' && (
            lcIssues.length === 0 ? (
              <View style={styles.emptyWrap}>
                <ThemedText style={styles.emptyText}>No language-convention issues to show.</ThemedText>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.pillsWrap} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {[CATEGORY_DEFS[0], ...activeCats].map((cat) => {
                  const count = cat.id === 'all' ? lcIssues.length : (counts[cat.key] || 0);
                  const active = lcFilter === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setLcFilter(cat.key)}
                      style={[styles.catPill, { borderColor: cat.border, backgroundColor: active ? cat.bg : 'transparent' }]}
                    >
                      <View style={[styles.catRadio, { borderColor: cat.border }]}>
                        {active && <View style={[styles.catRadioDot, { backgroundColor: cat.color }]} />}
                      </View>
                      <ThemedText weight="semiBold" style={[styles.catPillText, { color: cat.color }]}>
                        {cat.label} ({count})
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )
          )}

          {activeIssueTab === 'Logic' && (
            logicIssues.length === 0 ? (
              <View style={styles.emptyWrap}>
                <ThemedText style={styles.emptyText}>No logic issues to show.</ThemedText>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.logicList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {logicIssues.map((issue, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.logicItem}
                    onPress={() => openModal(logicIssues, i, 'error')}
                  >
                    <View style={[styles.logicNumBadge, { backgroundColor: LOGIC_DEF.color }]}>
                      <ThemedText weight="bold" style={styles.logicNumText}>{i + 1}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      {!!issue.subType && (
                        <ThemedText weight="semiBold" style={[styles.logicSubType, { color: LOGIC_DEF.color }]}>
                          {formatSubType(issue.subType)}
                        </ThemedText>
                      )}
                      {!!issue.detailFeedbackWithReason && (
                        <ThemedText style={styles.logicPreview} numberOfLines={2}>
                          {issue.detailFeedbackWithReason}
                        </ThemedText>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
    // borderTopWidth: 1,
    // borderTopColor: '#E5E5E5',
  },
  handleWrap: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#E5E5E5',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4FF',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabRow: {
    gap: 20,
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'flex-start',
    paddingVertical: 10,
    position: 'relative',
  },
  toggleBtn: {
    paddingVertical: 10,
    paddingLeft: 8,
  },
  tabText: {
    fontSize: 13,
    color: '#969696',
  },
  tabTextActive: {
    color: '#3A3A3A',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3E4EF0',
    borderRadius: 1,
  },
  content: {
    height: 180,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#969696',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 8,
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4FF',
    borderRadius: 10,
  },
  pronunciationWord: {
    fontSize: 14,
    color: '#3A3A3A',
  },
  pronunciationScoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pronunciationScoreText: {
    fontSize: 12,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catRadio: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRadioDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  catPillText: {
    fontSize: 12,
  },
  logicList: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 10,
  },
  logicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  logicNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  logicNumText: {
    fontSize: 11,
    color: '#fff',
  },
  logicSubType: {
    fontSize: 12,
    marginBottom: 2,
  },
  logicPreview: {
    fontSize: 12,
    color: '#727272',
    lineHeight: 17,
  },
});

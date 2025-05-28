import React, { useLayoutEffect, useState, useEffect, } from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Animated, Pressable, ScrollView, StatusBar } from "react-native";
import { useSelector } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import { cleanHtmlAndBreaks } from "../utils/helpers";
import colors from "../styles/colors";
import Icon from "../components/Icon";
import rubricContents from '../rubricContents';
import Modal from 'react-native-modal';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH < 320 ? SCREEN_WIDTH : SCREEN_WIDTH * 0.75;

export default function WritingTaskDetailScreen() {
  const navigation = useNavigation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const drawerAnim = useState(new Animated.Value(SCREEN_WIDTH))[0];
  const currentQuiz = useSelector(state => state.writing.currentQuiz);
  const [drawerHintAnim] = useState(new Animated.Value(0));
  const [modalType, setModalType] = useState(null); // 'rubric' | 'example'
  const [modalVisible, setModalVisible] = useState(false);

  // Sağ üstteki buton için toggle fonksiyonu
  function toggleDrawer() {
    if (drawerVisible) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  // Header'a info/X icon ekle
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={toggleDrawer} style={{ marginRight: 10 }}>
          {drawerVisible ? (
            <Icon iosName="xmark.circle" androidName="close" size={26} color={colors.white} />
          ) : (
            <Icon iosName="info.circle" androidName="info" size={26} color={colors.white} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, drawerVisible]);

  // İlk girişte drawer olduğunu belli eden animasyon
  useEffect(() => {
    Animated.sequence([
      Animated.timing(drawerHintAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(drawerHintAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  function openDrawer() {
    setDrawerVisible(true);
    Animated.timing(drawerAnim, {
      toValue: SCREEN_WIDTH - DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setOverlayVisible(true));
  }
  function closeDrawer() {
    setOverlayVisible(false); // overlay hemen kaybolsun
    Animated.timing(drawerAnim, {
      toValue: SCREEN_WIDTH,
      duration: 100,
      useNativeDriver: false,
    }).start(() => setDrawerVisible(false));
  }

  // sampleQuestionText'teki keywords'leri bold yapan ve satır/paragraf koruyan fonksiyon
  function renderSampleWithHighlights(text, keywords) {
    if (!text) return null;
    let kwArr = Array.isArray(keywords)
      ? keywords.filter(Boolean).map(k => k.trim()).filter(k => k.length > 0)
      : (keywords ? [keywords] : []);
    kwArr = kwArr.map(k => k.toLowerCase());
    return text.split(/\n+/).map((paragraph, pIdx) => {
      if (!paragraph.trim()) return null;
      const parts = paragraph.split(/(\s+)/).map((part, i) => {
        const normalized = part.toLowerCase().replace(/[^\w\u00C0-\u017F]+/g, '');
        const isKeyword = kwArr.some(k => k && normalized === k.replace(/[^\w\u00C0-\u017F]+/g, ''));
        if (isKeyword) {
          return <Text key={pIdx + '-' + i} style={styles.exampleBold}>{part}</Text>;
        }
        return <Text key={pIdx + '-' + i}>{part}</Text>;
      });
      return <Text key={'p-' + pIdx} style={styles.exampleParagraph}>{parts}</Text>;
    });
  }

  // Modal açıcılar
  function openRubricModal() {
     setModalType('rubric');
     setModalVisible(true);
  }
  function openExampleModal() {
     setModalType('example');
     setModalVisible(true);
  }

  // Rubric içeriğini writingTypeName ile çek
  function getRubricContent() {
    const key = subDetails.writingTypeName || subDetails.writingType || '';
    // Tüm tire ve boşlukları kaldırarak normalize et
    const normKey = key.toLowerCase().replace(/[-\s]+/g, '');
    // rubricContents anahtarlarını da aynı şekilde normalize et
    const rubricMap = Object.fromEntries(
      Object.entries(rubricContents).map(([k, v]) => [k.toLowerCase().replace(/[-\s]+/g, ''), v])
    );
    return rubricMap[normKey] || '<p>Rubric detayları hazırlanıyor...</p>';
  }

  // Gelişmiş HTML parser: <p>, <ul>, <ol>, <li>, <strong>, <br> destekler, blokları optimize işler
  function renderHtmlLike(text) {
    if (!text) return null;
    // Satırları bloklara ayır (hem <p> hem <ul>/<ol> blokları)
    let blocks = text
      .replace(/<ul>/g, '\n<ul>')
      .replace(/<ol>/g, '\n<ol>')
      .replace(/<\/ul>/g, '</ul>\n')
      .replace(/<\/ol>/g, '</ol>\n')
      .replace(/<p>/g, '\n<p>')
      .replace(/<\/p>/g, '</p>\n')
      .split(/\n+/)
      .map(b => b.trim())
      .filter(Boolean);
    const result = [];
    let i = 0;
    while (i < blocks.length) {
      const block = blocks[i];
      if (block.startsWith('<ul>')) {
        // Unordered list
        const items = [];
        i++;
        while (i < blocks.length && !blocks[i].startsWith('</ul>')) {
          if (blocks[i].startsWith('<li>')) {
            items.push(blocks[i].replace(/<li>|<\/li>/g, ''));
          }
          i++;
        }
        result.push(
          <View key={'ul-' + i} style={{ marginVertical: 2, marginLeft: 12 }}>
            {items.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                <Text style={{ fontWeight: 'bold', marginRight: 6, fontSize: 15, lineHeight: 22 }}>&#8226;</Text>
                <Text style={[styles.exampleParagraph, {marginBottom: 0, marginTop: 0, lineHeight: 22}]}>{renderHtmlInline(item)}</Text>
              </View>
            ))}
          </View>
        );
        // </ul> bloğunu atla
        while (i < blocks.length && !blocks[i].startsWith('</ul>')) i++;
        i++;
        continue;
      }
      if (block.startsWith('<ol>')) {
        // Ordered list
        const items = [];
        i++;
        while (i < blocks.length && !blocks[i].startsWith('</ol>')) {
          if (blocks[i].startsWith('<li>')) {
            items.push(blocks[i].replace(/<li>|<\/li>/g, ''));
          }
          i++;
        }
        result.push(
          <View key={'ol-' + i} style={{ marginVertical: 2, marginLeft: 12 }}>
            {items.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
                <Text style={{ fontWeight: 'bold', marginRight: 6, fontSize: 15, lineHeight: 22 }}>{idx + 1}.</Text>
                <Text style={[styles.exampleParagraph, {marginBottom: 0, marginTop: 0, lineHeight: 22}]}>{renderHtmlInline(item)}</Text>
              </View>
            ))}
          </View>
        );
        // </ol> bloğunu atla
        while (i < blocks.length && !blocks[i].startsWith('</ol>')) i++;
        i++;
        continue;
      }
      if (block.startsWith('<p>')) {
        // Paragraf bloğu
        const content = block.replace(/<p>|<\/p>/g, '');
        result.push(
          <Text key={'p-' + i} style={[styles.exampleParagraph, {marginBottom: 6, marginTop: 0, lineHeight: 22}]}>{renderHtmlInline(content)}</Text>
        );
        i++;
        continue;
      }
      // Düz metin veya <br> ile ayrılmış satırlar
      result.push(
        <Text key={'t-' + i} style={[styles.exampleParagraph, {marginBottom: 6, marginTop: 0, lineHeight: 22}]}>{renderHtmlInline(block)}</Text>
      );
      i++;
    }
    return result;
  }

  // Inline HTML: <strong>, <br>
  function renderHtmlInline(text) {
    if (!text) return null;
    // <br> ile satır böl
    const parts = text.split(/<br\s*\/?\s*>/i);
    return parts.map((part, idx) => {
      // <strong> ... </strong>
      const strongRegex = /<strong>(.*?)<\/strong>/gi;
      let lastIndex = 0;
      let match;
      const nodes = [];
      let keyIdx = 0;
      while ((match = strongRegex.exec(part)) !== null) {
        if (match.index > lastIndex) {
          nodes.push(<Text key={'t-' + idx + '-' + keyIdx++}>{part.slice(lastIndex, match.index)}</Text>);
        }
        nodes.push(<Text key={'b-' + idx + '-' + keyIdx++} style={styles.exampleBold}>{match[1]}</Text>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < part.length) {
        nodes.push(<Text key={'t-' + idx + '-end'}>{part.slice(lastIndex)}</Text>);
      }
      if (idx > 0) {
        // <br> için satır başı
        return [<Text key={'br-' + idx}>{'\n'}</Text>, ...nodes];
      }
      return nodes;
    });
  }

  if (!currentQuiz) {
    return (
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Görev verisi bulunamadı.</Text>
      </View>
    );
  }

  const subDetails = currentQuiz.question?.questionSubDetails || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>{currentQuiz.quizName}</Text>
        <Text style={styles.headContent}>
          {cleanHtmlAndBreaks(currentQuiz.question?.questionHeadData?.headContent || "")}
        </Text>
        {/* Drawer hint animasyonu */}
        <Animated.View style={[styles.drawerHint, {
          opacity: drawerHintAnim,
          transform: [{ translateX: drawerHintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) }],
        }]}
        pointerEvents="none"
        >
          <View style={styles.drawerHintContent}>
            <Icon iosName="info.circle" androidName="info" size={22} color={colors.primary} />
            <Text style={styles.drawerHintText}>You can open details with "Info"</Text>
          </View>
        </Animated.View>
      </View>
      {/* Drawer */}
      {drawerVisible && (
        <>
          {/* Overlay: sadece drawer dışında kalan alanı kaplar */}
          {overlayVisible && (
            <Pressable
              style={[
                styles.drawerOverlay,
                {
                  left: 0,
                  width: SCREEN_WIDTH - DRAWER_WIDTH,
                  height: '100%',
                  top: 0,
                  zIndex: 10,
                },
              ]}
              onPress={closeDrawer}
            />
          )}
          {/* Drawer: overlay'in yanında, sağda ve üstte */}
          <Animated.View style={[styles.drawer, { left: drawerAnim, zIndex: 11 }]} pointerEvents="box-none">
            <View style={styles.drawerContent} pointerEvents="auto">
              <Text style={styles.drawerTitle}>Task Info</Text>
              <Text style={styles.drawerLabel}>Minimum Paragraph Count</Text>
              <Text style={styles.drawerValue}>{subDetails.minParagraphCount || '-'}</Text>
              <Text style={styles.drawerLabel}>Minimum Word Count</Text>
              <Text style={styles.drawerValue}>{subDetails.maxLengthOfResponse || '-'}</Text>
              <Text style={styles.drawerLabel}>Expected CEFR Level</Text>
              <Text style={styles.drawerValue}>{subDetails.cefrLevel || '-'}</Text>
              <Text style={styles.drawerLabel}>Keywords</Text>
              <Text style={styles.drawerValue}>
                {Array.isArray(subDetails.questionTextKeywords)
                  ? (subDetails.questionTextKeywords.length > 0
                      ? subDetails.questionTextKeywords
                          .map(k => cleanHtmlAndBreaks(String(k)).trim())
                          .filter(k => k.length > 0)
                          .join(', ')
                      : '-')
                  : (cleanHtmlAndBreaks(String(subDetails.questionTextKeywords || '')).trim() || '-')}
              </Text>
              {/* Tips alanı */}
              <Text style={styles.drawerLabel}>Tips</Text>
              {/* 1. Satır: responseEvaluationFocus içeriği bold ve büyük harf başlatılmış şekilde, başında ikon */}
              <View style={styles.tipRow}>
                <Icon iosName="lightbulb" androidName="lightbulb-outline" size={16} color={colors.secondary} style={{ marginRight: 6 }} />
                <Text style={styles.tipText}>
                  Please give extra focus on writing to{' '}
                  {Array.isArray(subDetails.responseEvaluationFocus)
                    ? subDetails.responseEvaluationFocus.map((item, idx) => (
                        <Text key={item} style={styles.tipBold}>
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                          {idx !== subDetails.responseEvaluationFocus.length - 1 ? ', ' : ''}
                        </Text>
                      ))
                    : (
                        <Text style={styles.tipBold}>
                          {subDetails.responseEvaluationFocus ? (subDetails.responseEvaluationFocus.charAt(0).toUpperCase() + subDetails.responseEvaluationFocus.slice(1)) : '-'}
                        </Text>
                      )}
                  .
                </Text>
              </View>
              {/* 2. Satır: writingType bold ve büyük harf başlatılmış şekilde, başında ikon */}
              <View style={styles.tipRow}>
                <Icon iosName="lightbulb" androidName="lightbulb-outline" size={16} color={colors.secondary} style={{ marginRight: 6 }} />
                <Text style={styles.tipText}>
                  Please take referance on writing to the{' '}
                  <Text style={styles.tipBold}>
                    {subDetails.writingType ? (subDetails.writingType.charAt(0).toUpperCase() + subDetails.writingType.slice(1)) : '-'}
                  </Text>
                  {' '}Rubric.
                </Text>
              </View>
              <TouchableOpacity style={styles.rubricButton} onPress={openRubricModal}>
                <Icon iosName="doc.text.magnifyingglass" androidName="description" size={20} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.rubricButtonText}>Rubric Details</Text>
              </TouchableOpacity>
              {/* Example of Answer butonu */}
              <TouchableOpacity style={[styles.rubricButton, { backgroundColor: colors.secondary, marginTop: 10 }]} onPress={openExampleModal}>
                <Icon iosName="eye" androidName="visibility" size={20} color={colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.rubricButtonText}>Example of Answer</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
      {/* Full Page Modal */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={{ margin: 0 }}
        useNativeDriver
        hideModalContentWhileAnimating
        propagateSwipe
      >
        <SafeAreaView style={styles.exampleModalContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.exampleHeader}>
            <Text style={styles.exampleTitle}>
              {modalType === 'rubric' ? 'Rubric Details' : 'Example of Answer'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon iosName="xmark.circle.fill" androidName="close" size={28} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.exampleScroll} contentContainerStyle={{ padding: 20 }}>
            {modalType === 'example'
              ? renderSampleWithHighlights(subDetails.sampleQuestionText, subDetails.questionTextKeywords)
              : renderHtmlLike(getRubricContent())
            }
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  innerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    color: colors.black,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  headContent: {
    fontSize: 16,
    color: colors.black,
    textAlign: "center",
    marginBottom: 32,
  },
  // Drawer hint
  drawerHint: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  drawerHintContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerHintText: {
    color: colors.primary,
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  rubricButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  rubricButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  // Drawer styles
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: colors.slate800,
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 11,
  },
  drawerContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 18,
    textAlign: 'left',
  },
  drawerLabel: {
    fontSize: 15,
    color: colors.black,
    marginTop: 10,
    fontWeight: '600',
  },
  drawerValue: {
    fontSize: 14,
    color: colors.primary,
    marginVertical: 6,
    lineHeight: 18
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.primary,
  },
  tipBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  // Modal styles
  exampleModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
  },
  exampleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  exampleScroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  exampleParagraph: {
    marginBottom: 14,
    fontSize: 16,
    color: colors.black,
    lineHeight: 22,
  },
  exampleBold: {
    fontWeight: 'bold',
    color: colors.secondary,
  },
});

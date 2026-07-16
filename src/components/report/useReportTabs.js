import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Animated } from 'react-native';

const TAB_BAR_STICKY_PADDING = 12;

// Rapor ekranlarındaki mavi header + sticky tab bar davranışını yöneten paylaşılan hook.
// Header/tab bar/blue background JSX'i ekranın kendisinde kalır; bu hook sadece
// scroll takibini, sticky state'i ve tab değişince kaydırmayı sağlar.
export default function useReportTabs({ initialTab, headerMarginTop = 16, initialHeaderHeight = 46 }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isTabBarSticky, setIsTabBarSticky] = useState(false);
  const [tabBarY, setTabBarY] = useState(0);
  const [tabBarHeight, setTabBarHeight] = useState(56);
  const [headerHeight, setHeaderHeight] = useState(initialHeaderHeight);
  const [blueSectionActualHeight, setBlueSectionActualHeight] = useState(284);

  const mainScrollRef = useRef(null);
  const pillsScrollRef = useRef(null);
  const pillLayoutsRef = useRef([]);
  const pillsContainerWidthRef = useRef(0);
  const lastPillScrollXRef = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateYValue = useRef(new Animated.Value(0)).current;
  const lastTranslateYRef = useRef(0);

  const BLUE_SECTION_HEIGHT = useMemo(() => {
    return blueSectionActualHeight - (headerHeight + headerMarginTop);
  }, [blueSectionActualHeight, headerHeight, headerMarginTop]);

  const handleScrollListener = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    const stickyThreshold = tabBarY > 0
      ? tabBarY - TAB_BAR_STICKY_PADDING
      : BLUE_SECTION_HEIGHT;

    requestAnimationFrame(() => {
      if (offsetY >= stickyThreshold && stickyThreshold > 0) {
        if (!isTabBarSticky) {
          setIsTabBarSticky(true);
        }
      } else if (isTabBarSticky) {
        setIsTabBarSticky(false);
      }

      if (tabBarY > 0) {
        const blueSectionBottomReached = tabBarY - BLUE_SECTION_HEIGHT - TAB_BAR_STICKY_PADDING;

        let newTranslateY = 0;

        if (offsetY < blueSectionBottomReached) {
          newTranslateY = 0;
        } else if (isTabBarSticky) {
          newTranslateY = -(BLUE_SECTION_HEIGHT - TAB_BAR_STICKY_PADDING);
        } else {
          const scrolledDistance = offsetY - blueSectionBottomReached;
          const translateY = -scrolledDistance;
          const maxTranslateY = -(BLUE_SECTION_HEIGHT - TAB_BAR_STICKY_PADDING);
          newTranslateY = Math.max(translateY, maxTranslateY - TAB_BAR_STICKY_PADDING);
        }

        if (Math.abs(newTranslateY - lastTranslateYRef.current) > 0.5) {
          headerTranslateYValue.setValue(newTranslateY);
          lastTranslateYRef.current = newTranslateY;
        }
      } else {
        let newTranslateY = 0;
        if (offsetY >= BLUE_SECTION_HEIGHT) {
          newTranslateY = -(offsetY - BLUE_SECTION_HEIGHT);
        }

        if (Math.abs(newTranslateY - lastTranslateYRef.current) > 0.5) {
          headerTranslateYValue.setValue(newTranslateY);
          lastTranslateYRef.current = newTranslateY;
        }
      }
    });
  }, [tabBarY, BLUE_SECTION_HEIGHT, isTabBarSticky, headerTranslateYValue]);

  const handleScroll = useMemo(() => {
    return Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: false,
        listener: handleScrollListener,
      }
    );
  }, [handleScrollListener, scrollY]);

  const scrollToTabContentStart = useCallback(() => {
    const targetY = tabBarY > 0 ? tabBarY - TAB_BAR_STICKY_PADDING + 1 : 0;

    if (!mainScrollRef.current) return;

    const scrollNode = typeof mainScrollRef.current.scrollTo === 'function'
      ? mainScrollRef.current
      : mainScrollRef.current.getNode?.();

    scrollNode?.scrollTo?.({ y: targetY, animated: true });
  }, [tabBarY]);

  const handleTabPress = useCallback((key, index) => {
    setActiveTab(key);

    const layout = pillLayoutsRef.current[index];
    if (layout && pillsContainerWidthRef.current > 0) {
      const center = Math.max(0, layout.x + layout.width / 2 - pillsContainerWidthRef.current / 2);
      lastPillScrollXRef.current = center;
      pillsScrollRef.current?.scrollTo({ x: center, animated: true });
    }

    if (isTabBarSticky) {
      requestAnimationFrame(scrollToTabContentStart);
    }
  }, [isTabBarSticky, scrollToTabContentStart]);

  // Sticky duruma geçince (veya çıkınca) pill satırı ayrı bir ScrollView instance'ı olarak
  // yeniden mount oluyor ve x=0'a dönüyor — seçili sekmenin kaydırma konumunu geri uygula
  useLayoutEffect(() => {
    if (lastPillScrollXRef.current > 0) {
      pillsScrollRef.current?.scrollTo({ x: lastPillScrollXRef.current, animated: false });
    }
  }, [isTabBarSticky, pillsScrollRef]);

  // Ekran blur olduğunda (useFocusEffect cleanup'ında) çağırın
  const resetOnBlur = useCallback(() => {
    const scrollNode = typeof mainScrollRef.current?.scrollTo === 'function'
      ? mainScrollRef.current
      : mainScrollRef.current?.getNode?.();

    scrollNode?.scrollTo?.({ y: 0, animated: false });
    headerTranslateYValue.setValue(0);
    lastTranslateYRef.current = 0;
    lastPillScrollXRef.current = 0;
    setIsTabBarSticky(false);
    setActiveTab(initialTab);
  }, [headerTranslateYValue, initialTab]);

  const onBlueBackgroundLayout = useCallback((event) => {
    setBlueSectionActualHeight(event.nativeEvent.layout.height);
  }, []);

  const onHeaderLayout = useCallback((event) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  }, []);

  const onTabBarLayout = useCallback((event) => {
    const { y, height } = event.nativeEvent.layout;
    setTabBarY(y);
    setTabBarHeight(height);
  }, []);

  const onPillsRowLayout = useCallback((event) => {
    pillsContainerWidthRef.current = event.nativeEvent.layout.width;
  }, []);

  const onPillLayout = useCallback((index, event) => {
    const { x, width } = event.nativeEvent.layout;
    pillLayoutsRef.current[index] = { x, width };
  }, []);

  return {
    activeTab,
    isTabBarSticky,
    tabBarHeight,
    headerHeight,
    headerTranslateYValue,
    mainScrollRef,
    pillsScrollRef,
    handleScroll,
    handleTabPress,
    resetOnBlur,
    onBlueBackgroundLayout,
    onHeaderLayout,
    onTabBarLayout,
    onPillsRowLayout,
    onPillLayout,
  };
}

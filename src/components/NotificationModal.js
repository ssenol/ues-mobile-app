import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import ThemedIcon from './ThemedIcon';
import { ThemedText } from './ThemedText';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NotificationModal({ visible = false, onClose = () => {}, mode = 'modal', resetScrollSignal = 0 }) {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);
  const isClosing = useRef(false);
  const isScreenMode = mode === 'screen';
  const [isSectionSticky, setIsSectionSticky] = useState(false);
  const sectionHeaderY = useRef(0);

  // PanResponder for swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Grant the responder
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0 && !isClosing.current) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isClosing.current) return;
        
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // If swiped down more than 100px or fast swipe, close modal
          isClosing.current = true;
          
          // Overlay fade out animasyonu
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
          
          onClose();
          
          // Reset animation after a short delay
          setTimeout(() => {
            translateY.setValue(0);
            overlayOpacity.setValue(1);
            isClosing.current = false;
          }, 300);
        } else {
          // Otherwise, bounce back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Dummy notification data
  const notifications = {
    banner: {
      title: "Don't Miss Any Update!",
      message: "Turn on notifications to get the latest lessons and reports.",
      icon: 'notiFill',
    },
    lastWeek: [
      {
        id: '1',
        title: 'Practice Upgrade!',
        message: 'The quiz experience just got smoother check out the new process!',
        time: '8 days ago',
        icon: 'noti',
      },
      {
        id: '2',
        title: 'Smarter Reports Are Here',
        message: 'View detailed feedback and insights in your new report layout.',
        time: '10 days ago',
        icon: 'noti',
      },
      {
        id: '3',
        title: 'New Lessons Are Now Available',
        message: 'Start exploring the new lessons to boost your skills!',
        time: '12 days ago',
        icon: 'noti',
      },
      {
        id: '4',
        title: 'New Lessons Are Now Available',
        message: 'Start exploring the new lessons to boost your skills!',
        time: '12 days ago',
        icon: 'noti',
      },
      {
        id: '5',
        title: 'Smarter Reports Are Here',
        message: 'View detailed feedback and insights in your new report layout.',
        time: '10 days ago',
        icon: 'noti',
      },
      {
        id: '6',
        title: 'New Lessons Are Now Available',
        message: 'Start exploring the new lessons to boost your skills!',
        time: '12 days ago',
        icon: 'noti',
      },
      {
        id: '7',
        title: 'New Lessons Are Now Available',
        message: 'Start exploring the new lessons to boost your skills!',
        time: '12 days ago',
        icon: 'noti',
      },
      {
        id: '8',
        title: 'Smarter Reports Are Here',
        message: 'View detailed feedback and insights in your new report layout.',
        time: '10 days ago',
        icon: 'noti',
      },
      {
        id: '9',
        title: 'New Lessons Are Now Available',
        message: 'Start exploring the new lessons to boost your skills!',
        time: '12 days ago',
        icon: 'noti',
      },
      {
        id: '10',
        title: 'New Lessons Are Now Available',
        message: 'Start exploring the new lessons to boost your skills!',
        time: '12 days ago',
        icon: 'noti',
      },
    ],
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalOverlayTouchable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(62, 78, 240, 0.75)',
    },
    modalContent: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      height: SCREEN_HEIGHT * 0.85,
      paddingTop: 12,
      flexDirection: 'column',
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: '#E5E5E5',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4FF',
    },
    headerTitle: {
      fontSize: 18,
      lineHeight: 24,
      color: '#3A3A3A',
      textAlign: 'center',
      marginTop: 16,
    },
    scrollableContent: {
      flex: 1,
      backgroundColor: '#fff',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: insets.bottom + 24,
      flexGrow: 1,
    },
    bannerCard: {
      backgroundColor: '#E7E9FF',
      borderRadius: 8,
      paddingVertical: 24,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#D9DDFF',
      gap: 16,
    },
    bannerIconContainer: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    bannerBadge: {
      position: 'absolute',
      top: -6,
      right: -6,
      backgroundColor: '#FF3B30',
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
    bannerBadgeText: {
      fontSize: 12,
      color: '#fff',
      lineHeight: 16,
    },
    bannerContent: {
      flex: 1,
    },
    bannerTitle: {
      fontSize: 14,
      lineHeight: 20,
      color: '#000',
      marginBottom: 4,
    },
    bannerMessage: {
      fontSize: 12,
      lineHeight: 18,
      color: '#000',
    },
    bannerArrow: {
      // marginLeft: 8,
    },
    sectionHeaderSticky: {
      backgroundColor: '#fff',
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: -16,
      zIndex: 1,
    },
    sectionTitle: {
      fontSize: 16,
      lineHeight: 24,
      color: '#3A3A3A',
      marginBottom: 0,
    },
    notificationItem: {
      marginTop: 16,
      flexDirection: 'row',
      paddingBottom: 16,
      // marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4FF',
    },
    notificationIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: '#FFF3E1',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 14,
      lineHeight: 20,
      color: '#3A3A3A',
      marginBottom: 4,
    },
    notificationMessage: {
      fontSize: 14,
      lineHeight: 22,
      color: '#727272',
      marginBottom: 4,
    },
    notificationTime: {
      fontSize: 12,
      lineHeight: 18,
      color: '#949494',
    },
    screenContainer: {
      flex: 1,
      backgroundColor: '#fff',
    },
    screenHeaderContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4FF',
    },
  });

  const handleScroll = ({ nativeEvent }) => {
    if (!sectionHeaderY.current) {
      return;
    }

    const offsetY = nativeEvent.contentOffset.y;
    const shouldStick = offsetY >= sectionHeaderY.current;

    if (shouldStick !== isSectionSticky) {
      setIsSectionSticky(shouldStick);
    }
  };

  React.useEffect(() => {
    if (mode !== 'screen') return;
    if (!scrollViewRef.current) return;

    scrollViewRef.current.scrollTo({ y: 0, animated: false });
  }, [mode, resetScrollSignal]);

  const renderNotificationList = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollableContent}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={true}
      scrollEventThrottle={16}
      nestedScrollEnabled={true}
      stickyHeaderIndices={[1]}
      onScroll={handleScroll}
    >
      {/* Banner Card */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerIconContainer}>
          <ThemedIcon
            iconName={notifications.banner.icon}
            size={32}
            tintColor="#3E4EF0"
          />
          <View style={styles.bannerBadge}>
            <ThemedText style={styles.bannerBadgeText}>4</ThemedText>
          </View>
        </View>
        <View style={styles.bannerContent}>
          <ThemedText weight="semiBold" style={styles.bannerTitle}>
            {notifications.banner.title}
          </ThemedText>
          <ThemedText style={styles.bannerMessage}>
            {notifications.banner.message}
          </ThemedText>
        </View>
        <View style={styles.bannerArrow}>
          <ThemedIcon
            iconName="back"
            size={16}
            tintColor="#ABB3FF"
            style={{ transform: [{ rotate: '180deg' }] }}
          />
        </View>
      </View>

      {/* Last Week Section */}
      <View
        style={[styles.sectionHeaderSticky, isSectionSticky && shadows.light]}
        onLayout={(event) => {
          sectionHeaderY.current = event.nativeEvent.layout.y;
        }}
      >
        <ThemedText weight="semiBold" style={styles.sectionTitle}>
          Last Week
        </ThemedText>
      </View>

      {notifications.lastWeek.map((item, index) => (
        <View 
          key={item.id} 
          style={[
            styles.notificationItem,
            index === notifications.lastWeek.length - 1 && { borderBottomWidth: 0 }
          ]}
        >
          <View style={styles.notificationIconContainer}>
            <ThemedIcon
              iconName={item.icon}
              size={24}
              tintColor="#FF9500"
            />
          </View>
          <View style={styles.notificationContent}>
            <ThemedText weight="bold" style={styles.notificationTitle}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.notificationMessage}>
              {item.message}
            </ThemedText>
            <ThemedText style={styles.notificationTime}>
              {item.time}
            </ThemedText>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  if (isScreenMode) {
    return (
      <View style={[styles.screenContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.screenHeaderContainer}>
          <ThemedText weight="bold" style={styles.headerTitle}>
            Notifications
          </ThemedText>
        </View>
        {renderNotificationList()}
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalOverlayTouchable,
            { opacity: overlayOpacity }
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              if (isClosing.current) return;
              isClosing.current = true;
              
              // Overlay fade out animasyonu
              Animated.timing(overlayOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start();
              
              onClose();
              
              setTimeout(() => {
                translateY.setValue(0);
                overlayOpacity.setValue(1);
                isClosing.current = false;
              }, 300);
            }}
          />
        </Animated.View>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY }],
            },
          ]}
        >
            {/* Handle bar */}
            <View style={styles.handleBar} {...panResponder.panHandlers} />

            {/* Header - Sabit */}
            <View style={styles.headerContainer} {...panResponder.panHandlers}>
              <ThemedText weight="bold" style={styles.headerTitle}>
                Notifications
              </ThemedText>
            </View>

            {/* Scrollable content */}
            {renderNotificationList()}
        </Animated.View>
      </View>
    </Modal>
  );
}


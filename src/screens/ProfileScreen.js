import AsyncStorage from "@react-native-async-storage/async-storage";
import {StatusBar, setStatusBarStyle} from 'expo-status-bar';
import React, {useCallback, useRef, useState} from "react";
import {
  Alert,
  Animated,
  AppState,
  Dimensions,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View
} from "react-native";
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from "react-redux";
import ThemedIcon from "../components/ThemedIcon";
import { ThemedText } from "../components/ThemedText";
import BiometricAuthService from "../services/biometricAuth";
import { selectCurrentUser } from "../store/slices/authSlice";
import { useTheme } from "../theme/ThemeContext";
import {
  getBiometricEnabled,
  getMicrophoneEnabled,
  requestMicrophonePermission,
  setBiometricEnabled
} from "../utils/helpers";
import { performLogout } from "../utils/logoutHelper";
import {useFocusEffect} from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => selectCurrentUser(state));
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const STATUSBAR_HEIGHT = insets.top;
  const scrollViewRef = useRef(null);

  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabledState] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricType, setBiometricType] = useState("");
  const [clearLoading, setClearLoading] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Ekran fokus olduğunda StatusBar'ı ayarla
  const scrollToTop = useCallback(() => {
    if (!scrollViewRef.current) return;

    const scrollView = scrollViewRef.current.getNode ? scrollViewRef.current.getNode() : scrollViewRef.current;
    scrollView.scrollTo({ y: 0, animated: false });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      scrollToTop();
      return () => {};
    }, [scrollToTop])
  );

  React.useEffect(() => {
    (async () => {
      const type = await BiometricAuthService.getBiometricType();
      setBiometricType(type || "Biyometrik Giriş");
      setBiometricEnabledState(await getBiometricEnabled());
      setMicrophoneEnabledState(await getMicrophoneEnabled());
    })();
    const appStateListener = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        if (nextAppState === "active") {
          setMicrophoneEnabledState(await getMicrophoneEnabled());
        }
      }
    );
    return () => {
      appStateListener.remove();
    };
  }, []);

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const handleLogoutCancel = () => {
    setLogoutModalVisible(false);
  };

  const handleLogoutConfirm = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLogoutModalVisible(false);

    try {
      await performLogout({ dispatch });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleBiometricToggle = async (value) => {
    if (!biometricEnabled && value) {
      Alert.alert(
        biometricType,
        `Do you want to log in with ${biometricType}?`,
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes",
            style: "default",
            onPress: async () => {
              await setBiometricEnabled(true);
              setBiometricEnabledState(true);
              const credsStr = await AsyncStorage.getItem(
                "last_login_credentials"
              );
              if (credsStr) {
                const creds = JSON.parse(credsStr);
                if (creds.username && creds.password) {
                  await BiometricAuthService.saveCredentials(
                    creds.username,
                    creds.password
                  );
                }
              }
            },
          },
        ]
      );
    } else {
      await setBiometricEnabled(value);
      setBiometricEnabledState(value);
      if (value) {
        const credsStr = await AsyncStorage.getItem("last_login_credentials");
        if (credsStr) {
          const creds = JSON.parse(credsStr);
          if (creds.username && creds.password) {
            await BiometricAuthService.saveCredentials(
              creds.username,
              creds.password
            );
          }
        }
      }
    }
  };

  const handleMicrophoneToggle = async (value) => {
    if (!microphoneEnabled && value) {
      Alert.alert("Microphone Permission", "Do you want to allow a microphone?", [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "default",
          onPress: async () => {
            const granted = await requestMicrophonePermission();
            setMicrophoneEnabledState(granted);
            if (!granted) {
              Alert.alert(
                "Permission Required",
                "The microphone permission must be granted in the application settings. Would you like to go to the settings now?",
                [
                  {
                    text: "Open Settings",
                    onPress: () => {
                      if (Platform.OS === "ios") {
                        Linking.openURL("app-settings:");
                      } else {
                        Linking.openSettings();
                      }
                    },
                    style: "default",
                  },
                  { text: "Cancel", style: "cancel" },
                ]
              );
            }
          },
        },
      ]);
    } else if (microphoneEnabled && !value) {
      Alert.alert(
        "Microphone Permission cannot be turned off",
        "The microphone permission can only be removed in the device settings. Would you like to go to the settings now?",
        [
          {
            text: "Open Settings",
            onPress: () => {
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
            style: "default",
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      setMicrophoneEnabledState(await getMicrophoneEnabled());
    }
  };

  // User yoksa loading göster
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ThemedText>Loading...</ThemedText>
      </View>
    );
  }

  // Format joined date
  const formatJoinedDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const joinedDate = formatJoinedDate(user?.createdAt || user?.created_at);
  const userName = user?.name || '-';
  const userSurname = user?.surname || user?.lastName || '';
  const fullName = `${userName} ${userSurname}`.trim();
  const schoolName = user?.school_name || user?.schoolName || 'School Name';
  const campusName = user?.campus_name || user?.campusName || 'Campus Name';
  const className = user?.class_name || (user?.classInfo && Array.isArray(user.classInfo) ? user.classInfo[0] : null) || 'Classroom';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F3F4FF',
    },
    headerBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 284,
      zIndex: 0,
    },
    headerBg: {
      width: '100%',
      height: '100%',
    },
    header: {
      paddingTop: STATUSBAR_HEIGHT + 16,
      paddingHorizontal: 16,
      paddingBottom: 16,
      zIndex: 2,
    },
    headerTitle: {
      fontSize: 18,
      color: '#fff',
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    profileCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      paddingVertical: 24,
      paddingHorizontal: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarContainer: {
      width: 98,
      height: 98,
      borderRadius: 50,
      // backgroundColor: '#F3F4FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    // editIconContainer: {
    //   position: 'absolute',
    //   right: 0,
    //   bottom: 0,
    //   backgroundColor: '#3E4EF0',
    //   width: 28,
    //   height: 28,
    //   borderRadius: 14,
    //   alignItems: 'center',
    //   justifyContent: 'center',
    //   borderWidth: 2,
    //   borderColor: '#fff',
    // },
    userName: {
      fontSize: 24,
      lineHeight: 32,
      color: '#3A3A3A',
      marginBottom: 4,
    },
    joinedText: {
      fontSize: 14,
      color: '#B7B7B7',
      lineHeight: 20,
    },
    infoCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 24,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      lineHeight: 30,
      color: '#3A3A3A',
    },
    divider: {
      height: 1,
      backgroundColor: '#F3F4FF',
      marginVertical: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    infoIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: '#F3F4FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    infoTextContainer: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: '#949494',
      lineHeight: 18,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: 14,
      color: '#3A3A3A',
      lineHeight: 20,
    },
    settingsCard: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 24,
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      // marginBottom: 16,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIconContainer: {
      marginRight: 12,
    },
    settingText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#3A3A3A',
    },
    logoutButton: {
      marginTop: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutText: {
      fontSize: 14,
      lineHeight: 24,
      color: '#909BFF',
    },
    logoutModal: {
      margin: 0,
      justifyContent: 'flex-end',
      alignItems: 'stretch',
    },
    logoutModalContent: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 36,
      // borderTopLeftRadius: 24,
      // borderTopRightRadius: 24,
      // paddingBottom: 32,
    },
    logoutIconContainer: {
      backgroundColor: '#F3F4FF',
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      marginBottom: 16,
    },
    logoutTitle: {
      fontSize: 18,
      lineHeight: 24,
      color: '#3A3A3A',
      textAlign: 'center',
      marginBottom: 8,
    },
    logoutDescription: {
      fontSize: 14,
      lineHeight: 20,
      color: '#949494',
      textAlign: 'center',
      marginBottom: 32,
    },
    logoutConfirmButton: {
      backgroundColor: '#3E4EF0',
      borderRadius: 32,
      paddingVertical: 12,
      paddingHorizontal: 32,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      marginBottom: 24,
    },
    logoutConfirmText: {
      fontSize: 16,
      lineHeight: 24,
      color: '#fff',
    },
    logoutCancelButton: {
      // alignItems: 'center',
      // justifyContent: 'center',
    },
    logoutCancelText: {
      fontSize: 16,
      lineHeight: 24,
      color: '#3E4EF0',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Mavi arka plan - sabit */}
      <View style={styles.headerBackground}>
        <Image
          source={require('../../assets/images/screenHeader.png')}
          style={styles.headerBg}
          resizeMode="cover"
        />
      </View>

      {/* Header - Mavi zemin üzerinde */}
      <View style={styles.header}>
        <ThemedText weight="bold" style={styles.headerTitle}>
          Profile
        </ThemedText>
      </View>

      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, shadows.light]}>
          <View style={styles.avatarContainer}>
            <ThemedIcon
              iconName="avatar"
              size={98}
              // tintColor="#3E4EF0"
            />
          </View>
          <ThemedText weight="bold" style={styles.userName}>
            {fullName}
          </ThemedText>
          <ThemedText style={styles.joinedText}>
            Joined: {joinedDate}
          </ThemedText>
        </View>

        {/* Information Card */}
        <View style={[styles.infoCard, shadows.light]}>
          <ThemedText weight="semiBold" style={styles.sectionTitle}>
            Information
          </ThemedText>

          <View style={styles.divider}></View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <ThemedIcon
                iconName="school"
                size={24}
                tintColor="#3E4EF0"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <ThemedText style={styles.infoLabel}>School</ThemedText>
              <ThemedText weight="semiBold" style={styles.infoValue}>{schoolName}</ThemedText>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <ThemedIcon
                iconName="campus"
                size={24}
                tintColor="#3E4EF0"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <ThemedText style={styles.infoLabel}>Campus</ThemedText>
              <ThemedText weight="semiBold" style={styles.infoValue}>{campusName}</ThemedText>
            </View>
          </View>

          <View style={[styles.infoRow, { marginBottom: 0 }]}>
            <View style={styles.infoIconContainer}>
              <ThemedIcon
                iconName="classroom"
                size={24}
                tintColor="#3E4EF0"
              />
            </View>
            <View style={styles.infoTextContainer}>
              <ThemedText style={styles.infoLabel}>Classroom</ThemedText>
              <ThemedText weight="semiBold" style={styles.infoValue}>{className}</ThemedText>
            </View>
          </View>
        </View>

        {/* Settings Card */}
        <View style={[styles.settingsCard, shadows.light]}>
          <ThemedText weight="semiBold" style={styles.sectionTitle}>
            Settings
          </ThemedText>

          <View style={styles.divider}></View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <ThemedIcon
                  iconName="bigmic"
                  size={24}
                  tintColor="#3E4EF0"
                />
              </View>
              <ThemedText weight="semiBold" style={styles.settingText}>
                Microphone Permission
              </ThemedText>
            </View>
            <Switch
              value={microphoneEnabled}
              onValueChange={handleMicrophoneToggle}
              trackColor={{ false: "#E5E5E5", true: "#3E4EF0" }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.divider}></View>

          {biometricType && (
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIconContainer}>
                  <ThemedIcon
                    iconName={biometricType.includes('Face') ? 'faceId' : 'touchId'}
                    size={24}
                    tintColor="#3E4EF0"
                  />
                </View>
                <ThemedText weight="semiBold" style={styles.settingText}>
                  {biometricType}
                </ThemedText>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: "#E5E5E5", true: "#3E4EF0" }}
                thumbColor="#fff"
              />
            </View>
          )}

          <View style={styles.divider}></View>

          <View style={[styles.settingRow, { marginBottom: 0 }]}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIconContainer}>
                <ThemedIcon
                  iconName="noti"
                  size={24}
                  tintColor="#3E4EF0"
                />
              </View>
              <ThemedText weight="semiBold" style={styles.settingText}>
                Notifications Preference
              </ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#E5E5E5", true: "#3E4EF0" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.7}
        >
          <ThemedText weight="semiBold" style={styles.logoutText}>
            Logout
          </ThemedText>
        </TouchableOpacity>
      </Animated.ScrollView>

      <Modal
        isVisible={logoutModalVisible}
        onBackdropPress={handleLogoutCancel}
        onBackButtonPress={handleLogoutCancel}
        backdropColor="#3E4EF0"
        backdropOpacity={0.75}
        useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.logoutModal}
      >
        <View style={styles.logoutModalContent}>
          <View style={styles.logoutIconContainer}>
            <ThemedIcon iconName="logout" size={56} tintColor="#3E4EF0" />
          </View>
          <ThemedText weight="bold" style={styles.logoutTitle}>
            You're about to log out
          </ThemedText>
          <ThemedText style={styles.logoutDescription}>
            Your current session will end {'\n'}if you continue.
          </ThemedText>

          <TouchableOpacity
            style={styles.logoutConfirmButton}
            activeOpacity={0.85}
            onPress={handleLogoutConfirm}
          >
            <ThemedText weight="bold" style={styles.logoutConfirmText}>
              Yes, I want
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutCancelButton}
            activeOpacity={0.7}
            onPress={handleLogoutCancel}
          >
            <ThemedText style={styles.logoutCancelText}>No, Thanks</ThemedText>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import {StatusBar, setStatusBarStyle} from 'expo-status-bar';
import React, {useCallback, useRef, useState} from "react";
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from "react-redux";
import ConfirmModal from "../components/ConfirmModal";
import ThemedIcon from "../components/ThemedIcon";
import { ThemedText } from "../components/ThemedText";
import BiometricAuthService from "../services/biometricAuth";
import { selectCurrentUser } from "../store/slices/authSlice";
import { clearAssignmentState } from "../store/slices/assignmentSlice";
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
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [biometricModalVisible, setBiometricModalVisible] = useState(false);
  const [microphoneModalVisible, setMicrophoneModalVisible] = useState(false);
  const [microphoneOffModalVisible, setMicrophoneOffModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetErrorModalVisible, setResetErrorModalVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [cameraPermissionModalVisible, setCameraPermissionModalVisible] = useState(false);
  const [galleryPermissionModalVisible, setGalleryPermissionModalVisible] = useState(false);
  const [cameraErrorModalVisible, setCameraErrorModalVisible] = useState(false);
  const [galleryErrorModalVisible, setGalleryErrorModalVisible] = useState(false);

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

  const handleResetAppSettings = () => {
    setResetModalVisible(true);
  };

  const handleAvatarPress = () => {
    setAvatarPickerVisible(true);
  };

  const handleTakePhoto = async () => {
    setAvatarPickerVisible(false);
    
    // Modal kapanma animasyonunun tamamlanması için bekle
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setCameraPermissionModalVisible(true);
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]) {
          setAvatarUri(result.assets[0].uri);
          // TODO: API servisi gelince burada upload edilecek
          console.log('Avatar URI:', result.assets[0].uri);
        }
      } catch (error) {
        // console.error('Camera error:', error);
        // Kamera hatası - simulator veya cihaz sorunu
        setCameraErrorModalVisible(true);
      }
    }, 500);
  };

  const handlePickImage = async () => {
    setAvatarPickerVisible(false);
    
    // Modal kapanma animasyonunun tamamlanması için bekle
    setTimeout(async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setGalleryPermissionModalVisible(true);
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
          allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets[0]) {
          setAvatarUri(result.assets[0].uri);
          // TODO: API servisi gelince burada upload edilecek
          console.log('Avatar URI:', result.assets[0].uri);
        }
      } catch (error) {
        console.error('Image picker error:', error);
        // Galeri hatası
        setGalleryErrorModalVisible(true);
      }
    }, 500);
  };

  const handleResetConfirm = async () => {
    if (isResetting) return;
    
    setResetModalVisible(false);
    setIsResetting(true);
    try {
      // AsyncStorage'ı temizle (tüm persist verileri)
      await AsyncStorage.clear();
      
      // SecureStore'daki hassas verileri temizle
      const possibleKeys = ['accessToken', 'refreshToken', 'userCredentials', 'biometricToken'];
      for (const key of possibleKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (e) {
          // Anahtar yoksa hata vermez, devam et
        }
      }
      
      // Redux store'u temizle (assignment cache dahil)
      dispatch(clearAssignmentState());
      
      // Logout işlemini gerçekleştir
      await performLogout({ dispatch });
    } catch (error) {
      console.error('Reset app settings error:', error);
      setResetErrorModalVisible(true);
    } finally {
      setIsResetting(false);
    }
  };

  const handleBiometricToggle = async (value) => {
    if (!biometricEnabled && value) {
      setBiometricModalVisible(true);
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

  const handleBiometricConfirm = async () => {
    setBiometricModalVisible(false);
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
  };

  const handleBiometricCancel = () => {
    setBiometricModalVisible(false);
    setBiometricEnabledState(false);
  };

  const handleMicrophoneToggle = async (value) => {
    if (!microphoneEnabled && value) {
      setMicrophoneModalVisible(true);
    } else if (microphoneEnabled && !value) {
      setMicrophoneOffModalVisible(true);
      setMicrophoneEnabledState(await getMicrophoneEnabled());
    }
  };

  const handleMicrophoneConfirm = async () => {
    const granted = await requestMicrophonePermission();
    setMicrophoneModalVisible(false);
    setMicrophoneEnabledState(granted);
    if (!granted) {
      if (Platform.OS === "ios") {
        Linking.openURL("app-settings:");
      } else {
        Linking.openSettings();
      }
    }
  };

  const handleMicrophoneCancel = () => {
    setMicrophoneModalVisible(false);
    setMicrophoneEnabledState(false);
  };

  const handleMicrophoneOffConfirm = () => {
    setMicrophoneOffModalVisible(false);
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
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
      fontSize: 16,
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
      borderRadius: 49,
      backgroundColor: '#F3F4FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      position: 'relative',
    },
    avatarImage: {
      width: 98,
      height: 98,
      borderRadius: 49,
    },
    editIconContainer: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      backgroundColor: '#3E4EF0',
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#fff',
    },
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
    resetButton: {
      marginTop: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resetText: {
      fontSize: 14,
      lineHeight: 24,
      color: '#FF3B30',
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
        <ThemedText weight="semibold" style={styles.headerTitle}>
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
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleAvatarPress}
            activeOpacity={0.7}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
              />
            ) : (
              <ThemedIcon
                iconName="avatar"
                size={98}
              />
            )}
            <View style={styles.editIconContainer}>
              <ThemedIcon
                iconName="editPencil"
                size={12}
                tintColor="#fff"
              />
            </View>
          </TouchableOpacity>
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
          activeOpacity={0.85}
        >
          <ThemedText weight="semiBold" style={styles.logoutText}>
            Logout
          </ThemedText>
        </TouchableOpacity>

        {/* Reset App Settings Button - Debug */}
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetAppSettings}
          activeOpacity={0.85}
          disabled={isResetting}
        >
          <ThemedText weight="semiBold" style={styles.resetText}>
            {isResetting ? 'Resetting...' : 'Reset App Settings'}
          </ThemedText>
        </TouchableOpacity>
      </Animated.ScrollView>

      <ConfirmModal
        visible={logoutModalVisible}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        iconName="logout"
        title="You're about to log out"
        description={`Your current session will end \nif you continue.`}
        confirmText="Yes, I want"
        cancelText="No, Thanks"
      />

      <ConfirmModal
        visible={biometricModalVisible}
        onClose={handleBiometricCancel}
        onConfirm={handleBiometricConfirm}
        iconName={biometricType.includes('Face') ? 'faceId' : 'touchId'}
        title={biometricType}
        description={`Do you want to log in with ${biometricType}?`}
        confirmText="Yes"
        cancelText="No"
      />

      <ConfirmModal
        visible={microphoneModalVisible}
        onClose={handleMicrophoneCancel}
        onConfirm={handleMicrophoneConfirm}
        iconName="bigmic"
        title="Microphone Permission"
        description="Do you want to allow a microphone?"
        confirmText="Yes"
        cancelText="No"
      />

      <ConfirmModal
        visible={microphoneOffModalVisible}
        onClose={() => setMicrophoneOffModalVisible(false)}
        onConfirm={handleMicrophoneOffConfirm}
        iconName="bigmic"
        title="Microphone Permission cannot be turned off"
        description="The microphone permission can only be removed in the device settings. Would you like to go to the settings now?"
        confirmText="Open Settings"
        cancelText="Cancel"
      />

      <ConfirmModal
        visible={resetModalVisible}
        onClose={() => setResetModalVisible(false)}
        onConfirm={handleResetConfirm}
        iconName="logout"
        title="Reset App Settings"
        description="Are you sure you want to reset all app settings? This will log you out and clear all saved data."
        confirmText="OK"
        cancelText="Cancel"
        confirmButtonColor="#FF3B30"
      />

      <ConfirmModal
        visible={resetErrorModalVisible}
        onClose={() => setResetErrorModalVisible(false)}
        iconName="logout"
        title="Error"
        description="Failed to reset app settings."
        confirmText="OK"
        singleButton={true}
      />

      {/* Avatar Picker Modal */}
      <ConfirmModal
        visible={avatarPickerVisible}
        onClose={() => setAvatarPickerVisible(false)}
        iconName="avatarChange"
        title="Change Avatar"
        description="Choose how you want to update your profile picture"
        actions={[
          {
            text: 'Take Photo',
            onPress: handleTakePhoto,
            color: '#3E4EF0'
          },
          {
            text: 'Choose from Gallery',
            onPress: handlePickImage,
            color: '#3E4EF0'
          }
        ]}
        cancelText="Cancel"
      />

      {/* Camera Permission Modal */}
      <ConfirmModal
        visible={cameraPermissionModalVisible}
        onClose={() => setCameraPermissionModalVisible(false)}
        onConfirm={() => {
          setCameraPermissionModalVisible(false);
          Linking.openSettings();
        }}
        iconName="camera"
        title="Camera Permission Required"
        description="Camera permission is required to take photos. Please enable it in settings."
        confirmText="Open Settings"
        cancelText="Cancel"
      />

      {/* Gallery Permission Modal */}
      <ConfirmModal
        visible={galleryPermissionModalVisible}
        onClose={() => setGalleryPermissionModalVisible(false)}
        onConfirm={() => {
          setGalleryPermissionModalVisible(false);
          Linking.openSettings();
        }}
        iconName="gallery"
        title="Gallery Permission Required"
        description="Gallery permission is required to choose photos. Please enable it in settings."
        confirmText="Open Settings"
        cancelText="Cancel"
      />

      {/* Camera Error Modal */}
      <ConfirmModal
        visible={cameraErrorModalVisible}
        onClose={() => setCameraErrorModalVisible(false)}
        onConfirm={() => {
          setCameraErrorModalVisible(false);
          Linking.openSettings();
        }}
        iconName="camera"
        title="Camera Not Available"
        description="Camera is not available. This may be because you're using a simulator or camera access is disabled. Please check your device settings."
        confirmText="Open Settings"
        cancelText="Cancel"
      />

      {/* Gallery Error Modal */}
      <ConfirmModal
        visible={galleryErrorModalVisible}
        onClose={() => setGalleryErrorModalVisible(false)}
        onConfirm={() => {
          setGalleryErrorModalVisible(false);
          Linking.openSettings();
        }}
        iconName="camera"
        title="Gallery Not Available"
        description="Gallery access is not available. Please check your device settings and ensure gallery permission is enabled."
        confirmText="Open Settings"
        cancelText="Cancel"
      />
    </View>
  );
}

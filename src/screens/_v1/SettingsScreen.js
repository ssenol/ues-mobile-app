import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  AppState,
  Platform,
  Linking,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, logout } from "../store/slices/authSlice";
import colors from "../styles/colors";
import ActionButton from "../components/ActionButton";
import Icon from "../components/Icon";
import BiometricAuthService from "../services/biometricAuth";
import {
  getBiometricEnabled,
  setBiometricEnabled,
  getMicrophoneEnabled,
  requestMicrophonePermission,
  clearAllAppData,
} from "../utils/helpers";
import { handleLogout } from "../utils/logoutHelper";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => selectCurrentUser(state));
  const refreshToken = useSelector((state) => state.auth.refreshToken);
  const [biometricEnabled, setBiometricEnabledState] = React.useState(false);
  const [microphoneEnabled, setMicrophoneEnabledState] = React.useState(false);
  const [biometricType, setBiometricType] = React.useState("");
  const [clearLoading, setClearLoading] = React.useState(false);

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

  const handleLogoutPress = async () => {
    await handleLogout({
      dispatch,
      refreshToken,
      navigation,
    });
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
              // Kullanıcı login ise, son giriş bilgisi varsa credential olarak kaydet
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
      // Toggle açılırsa ve son giriş bilgisi varsa credential olarak kaydet
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
      // Kullanıcı mikrofon iznini kapatmak istiyor, sistemden kaldırılamaz. Bilgilendir ve ayarlara yönlendir.
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

  const handleClear = () => {
    Alert.alert(
      "Clear All Data",
      "This operation cannot be undone. All application data will be deleted. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Clear",
          style: "destructive",
          onPress: async () => {
            setClearLoading(true);
            await clearAllAppData();
            setClearLoading(false);
            // Alert.alert("Başarılı", "Tüm veriler temizlendi.");
            await handleLogout({
              dispatch,
              refreshToken,
              navigation: null,
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>User Information</Text>
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoBoxLabel}>Name:</Text>
          <Text style={styles.infoBoxValue}>{user?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoBoxLabel}>Suename:</Text>
          <Text style={styles.infoBoxValue}>{user?.surname}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoBoxLabel}>School:</Text>
          <Text style={styles.infoBoxValue}>{user?.school_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoBoxLabel}>Campus:</Text>
          <Text style={styles.infoBoxValue}>{user?.campus_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoBoxLabel}>Class:</Text>
          <Text style={styles.infoBoxValue}>{user?.class_name}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Settings</Text>
      {biometricType ? (
        <View style={styles.settingRow}>
          <Text>{biometricType}</Text>
          <Switch
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
          />
        </View>
      ) : null}
      <View style={styles.settingRow}>
        <Text>Microphone Permission</Text>
        <Switch
          value={microphoneEnabled}
          onValueChange={handleMicrophoneToggle}
        />
      </View>

      <ActionButton
        title="Logout"
        onPress={handleLogoutPress}
        variant="secondary"
        iconLeft
        width={"75%"}
        iconIos="power"
        iconAndroid="power-settings-new"
        style={{ marginTop: 24 }}
      />

      <View style={{ height: 100 }} />
      <ActionButton
        title="Clear All Data"
        onPress={handleClear}
        variant="danger"
        iconLeft
        width={"75%"}
        iconIos="trash"
        iconAndroid="delete"
        style={{ marginTop: 24, alignSelf: "center", marginBottom: 32 }}
        loading={clearLoading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: colors.primary,
  },
  infoBox: {
    backgroundColor: colors.slate50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  infoBoxLabel: {
    minWidth: 70,
    color: colors.slate700,
    fontWeight: "bold",
    lineHeight: 24,
  },
  infoBoxValue: {
    color: colors.slate900,
    marginLeft: 8,
    lineHeight: 24,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.slate200,
  },
});

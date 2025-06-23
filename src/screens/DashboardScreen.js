import React, { useEffect, useState } from "react";
import { Alert, AppState, Linking, Platform, SafeAreaView, StatusBar, StyleSheet, Text, View, } from "react-native";
import { useSelector } from "react-redux";
import ActionButton from "../components/ActionButton";
import MenuButton from "../components/MenuButton";
import { selectCurrentUser } from "../store/slices/authSlice";
import colors from "../styles/colors";
import { getMicrophoneEnabled, requestMicrophonePermission, } from "../utils/helpers";

export default function DashboardScreen({ navigation }) {
  const user = useSelector((state) => selectCurrentUser(state));
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    syncMicrophonePermission();
    StatusBar.setBarStyle("light-content");
  }, []);

  // Uygulama ekrana tekrar geldiğinde mikrofon iznini tekrar kontrol et
  useEffect(() => {
    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncMicrophonePermission();
      }
    });
    return () => {
      appStateListener.remove();
    };
  }, []);

  // Mikrofon izni ayarlardan değişirse Dashboard'da da güncellensin
  useEffect(() => {
    return navigation.addListener("focus", () => {
      syncMicrophonePermission();
    });
  }, [navigation]);

  const syncMicrophonePermission = async () => {
    setHasPermission(await getMicrophoneEnabled());
  };

  const handleSpeakOnTopic = () => {
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "You need to grant microphone permission to use the speak feature.",
        [
          {
            text: "Open Settings",
            onPress: () => navigation.navigate("SettingsScreen"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    navigation.navigate("SpeakTasks", { taskType: "speaking-topic" });
  };

  const handleReadAloud = () => {
    if (!hasPermission) {
      Alert.alert(
        "Permission Required",
        "You need to grant microphone permission to use the speak feature.",
        [
          {
            text: "Open Settings",
            onPress: () => navigation.navigate("SettingsScreen"),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }
    navigation.navigate("SpeakTasks", { taskType: "read-aloud" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.view}>
        {/* Sol üstte ayarlar butonu kaldırıldı */}
        <Text style={styles.welcome}>
          Hello, {user?.name} {user?.surname}
        </Text>

        <Text style={styles.info}>Which application do you want to do?</Text>

        <View style={styles.buttonContainer}>
          <MenuButton
            title="Speak On Topic"
            subtitle="Practice a speak on a specific subject"
            onPress={handleSpeakOnTopic}
            iconIos="waveform"
            iconAndroid="graphic-eq"
          />

          <MenuButton
            title="Read Aloud"
            subtitle="Practice reading text with proper articulation"
            onPress={handleReadAloud}
            iconIos="book"
            iconAndroid="menu-book"
          />

          {/*<MenuButton*/}
          {/*  title="Writing"*/}
          {/*  subtitle="Solve writing tasks"*/}
          {/*  onPress={() => navigation.navigate("WritingTasks")}*/}
          {/*  iconIos="pencil"*/}
          {/*  iconAndroid="edit"*/}
          {/*/>*/}
        </View>

        {!hasPermission && (
          <View style={styles.permissionWarning}>
            <Text style={styles.permissionText}>
              <Text style={{fontWeight: 'bold', color: '#c62828'}}>⚠️ Microphone permission required!{"\n"}</Text>
              You must grant microphone permission to use the speak features.
            </Text>
            <ActionButton
              title="Microphone Permission"
              onPress={async () => {
                const granted = await requestMicrophonePermission();
                setHasPermission(granted);
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
              }}
              width="45%"
              variant="primary"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  view: {
    flex: 1,
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    color: colors.slate600,
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: "auto",
  },
  permissionWarning: {
    backgroundColor: "#fff3e0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ffd180",
    shadowColor: "#ffcc80",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionText: {
    color: "#c62828",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
    marginRight: 10,
  },
});

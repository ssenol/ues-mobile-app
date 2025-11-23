import React, {useEffect, useState} from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {useDispatch} from "react-redux";
import {setCredentials} from "../store/slices/authSlice";
import {store} from "../store/index";
import colors from "../styles/colors";
import authService from "../services/auth";
import ActionButton from "../components/ActionButton";
import CustomInput from "../components/CustomInput";
import BiometricAuthService from "../services/biometricAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_PROMPT_SHOWN_KEY = "biometric_prompt_shown";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const [username, setUsername] = useState("ues-meq-student1");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const [biometricButtonType, setBiometricButtonType] = useState("");
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricPromptShown, setBiometricPromptShown] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("transparent");
      StatusBar.setTranslucent(true);
    }
    StatusBar.setHidden(false);
    // Otomatik biyometrik giriş kaldırıldı
    // Biyometrik buton görünürlüğü kontrolü
    const checkBiometricButton = async () => {
      const enabled = await BiometricAuthService.isBiometricEnabled();
      // Eğer ayarlarda biyometrik toggle açık ise, buton mutlaka görünsün
      if (enabled) {
        const type = await BiometricAuthService.getBiometricType();
        setBiometricButtonType(type);
        setShowBiometricButton(true);
        return;
      }
      const creds = await BiometricAuthService.getCredentials();
      if (enabled && creds) {
        const type = await BiometricAuthService.getBiometricType();
        setBiometricButtonType(type);
        setShowBiometricButton(true);
      } else {
        setShowBiometricButton(false);
      }
    };
    checkBiometricButton();

    const checkBiometricPrompt = async () => {
      const promptShown = await AsyncStorage.getItem(
        BIOMETRIC_PROMPT_SHOWN_KEY
      );
      setBiometricPromptShown(!!promptShown);
    };
    checkBiometricPrompt();

    // --- EKRANA HER GELİŞTE BUTON KONTROLÜ ---
    return navigation.addListener("focus", () => {
      checkBiometricButton();
      checkBiometricPrompt();
    });
  }, [navigation]);

  // Biyometrik ile otomatik giriş fonksiyonu
  const handleLoginWithCredentials = async (username, password) => {
    try {
      setLoading(true);
      // DEBUG: Fetch ile login API test
      try {
        const fetchResponse = await fetch('https://test-dot-uesquizmaker-api.ey.r.appspot.com/api/v0.0.1/auth/mobile-app-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        const fetchJson = await fetchResponse.json();
      } catch (fetchErr) {
        console.error('FETCH LOGIN ERROR:', fetchErr);
      }
      // ---
      const response = await authService.login(username, password);
      if (!response || !response.token || !response.user) {
        throw new Error("Invalid login response - missing token or user data");
      }
      const credentials = {
        token: response.token,
        user: response.user,
      };
      dispatch(setCredentials(credentials));
      // navigation ile yönlendirme kaldırıldı, AppNavigator otomatik yönlendirecek
    } catch (error) {
      console.error("Biyometrik otomatik giriş hatası:", error);
      Alert.alert(
        "Error",
        "Automatic login with biometric failed. Please login manually."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      const enabled = await BiometricAuthService.isBiometricEnabled();
      const creds = await BiometricAuthService.getCredentials();
      if (enabled && creds) {
        // Önce biyometrik doğrulama yap
        const authResult = await BiometricAuthService.authenticate();
        if (authResult) {
          await handleLoginWithCredentials(creds.username, creds.password);
        } else {
          const type = await BiometricAuthService.getBiometricType();
          Alert.alert(
            `${type} Verification Failed`,
            `${type} validation failed.`
          );
        }
      } else {
        Alert.alert(
          "Error",
          "Biometric login is not active or there are no registered users."
        );
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password.");
      return;
    }

    try {
      setLoading(true);
      // DEBUG: Fetch ile login API test
      try {
        const fetchResponse = await fetch('https://test-dot-uesquizmaker-api.ey.r.appspot.com/api/v0.0.1/auth/mobile-app-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });
        const fetchJson = await fetchResponse.json();
      } catch (fetchErr) {
        console.error('FETCH LOGIN ERROR:', fetchErr);
      }
      // ---
      const response = await authService.login(username, password);
      if (!response || !response.token || !response.user) {
        throw new Error("Invalid login response - missing token or user data");
      }
      const credentials = {
        token: response.token,
        user: response.user,
      };
      setTimeout(() => {
        try {
          const currentState = store.getState();
        } catch (error) {
          console.error("Redux durum kontrolü hatası:", error);
        }
      }, 100);

      // Login işlemi sonrası username ve password'u AsyncStorage'a kaydet
      await AsyncStorage.setItem(
        "last_login_credentials",
        JSON.stringify({ username, password })
      );
      // <--- TOKENI SECURESTORE'A KAYDET --->
      try {
        await SecureStore.setItemAsync('accessToken', response.token);
      } catch (err) {
        console.error('Token SecureStore kaydetme hatası:', err);
      }
      // --- Biyometrik prompt gösterimi: Eğer daha önce gösterilmediyse, kullanıcıya sor ---
      const promptShown = await AsyncStorage.getItem(BIOMETRIC_PROMPT_SHOWN_KEY);
      if (!promptShown) {
        const type = await BiometricAuthService.getBiometricType();
        if (type) {
          Alert.alert(
            `Login with ${type}`,
            `Would you like to log in with ${type}?`,
            [
              {
                text: "No",
                onPress: async () => {
                  await AsyncStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, "true");
                  await BiometricAuthService.setBiometricEnabled(false);
                  setShowBiometricPrompt(false);
                  setBiometricPromptShown(true);
                  setShowBiometricButton(false);
                  dispatch(setCredentials(credentials));
                  // navigation ile yönlendirme kaldırıldı, AppNavigator otomatik yönlendirecek
                },
                style: "cancel",
              },
              {
                text: "Yes",
                onPress: async () => {
                  await AsyncStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, "true");
                  await BiometricAuthService.setBiometricEnabled(true);
                  // Kullanıcı adı ve şifreyi kaydet
                  await BiometricAuthService.saveCredentials(username, password);
                  setShowBiometricPrompt(false);
                  setBiometricPromptShown(true);
                  setShowBiometricButton(true);
                  Alert.alert(
                    "Success",
                    `You can now use ${type} for authentication during logins.`
                  );
                  dispatch(setCredentials(credentials));
                  // navigation ile yönlendirme kaldırıldı, AppNavigator otomatik yönlendirecek
                },
              },
            ]
          );
          return; // Alert sonrası dispatch yapılmasın, yukarıda yapılacak
        }
      }
      dispatch(setCredentials(credentials));
      // navigation ile yönlendirme kaldırıldı, AppNavigator otomatik yönlendirecek
    } catch (error) {
      setLoading(false);
      Alert.alert(
        "Error",
        "Login failed. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBiometric = async () => {
    await AsyncStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, "true");
    await BiometricAuthService.setBiometricEnabled(true);
    setShowBiometricPrompt(false);
    setBiometricPromptShown(true);
    setShowBiometricButton(true);
    Alert.alert(
      "Success",
      "You can now use biometric authentication at entrances."
    );
  };

  const handleDeclineBiometric = async () => {
    await AsyncStorage.setItem(BIOMETRIC_PROMPT_SHOWN_KEY, "true");
    await BiometricAuthService.setBiometricEnabled(false);
    setShowBiometricPrompt(false);
    setBiometricPromptShown(true);
    setShowBiometricButton(false);
    Alert.alert(
      "Info",
      "You can turn on the biometric login feature later from the Settings screen."
    );
  };

  // Biyometrik prompt state'i true olduğunda kullanıcıya Alert ile sor
  useEffect(() => {
    if (showBiometricPrompt) {
      Alert.alert(
        `${biometricType || 'Biometric Login'}`,
        `Would you like to log in with ${biometricType || 'Biometric Login'}`,
        [
          {
            text: "No",
            onPress: handleDeclineBiometric,
            style: "cancel",
          },
          {
            text: "Yes",
            onPress: handleAcceptBiometric,
          },
        ]
      );
    }
  }, [showBiometricPrompt]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <Image
            style={styles.logo}
            source={require("../../assets/images/meqLogo.png")}
          />

          <View style={styles.formContainer}>
            <CustomInput
              iconIos={"person.fill"}
              iconAndroid={"person"}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <CustomInput
              iconIos={"lock.fill"}
              iconAndroid={"lock"}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <ActionButton
              title={loading ? "Logging in..." : "Sign in"}
              onPress={handleLogin}
              variant="secondary"
              width="75%"
              loading={loading}
              iconIos={"arrow.forward"}
              iconAndroid={"arrow-forward"}
              style={{ marginTop: 32 }}
            />
            {/* Biyometrik ile giriş butonu sadece destekleniyorsa ve kullanıcı izin verdiyse görünür */}
            {showBiometricButton && (
              <ActionButton
                title={`${biometricButtonType}`}
                onPress={handleBiometricLogin}
                variant="tertiary"
                width="75%"
                iconLeft
                loading={biometricLoading}
                iconIos={
                  biometricButtonType === "Face ID" ? "faceid" : "touchid"
                }
                iconAndroid={
                  biometricButtonType === "Face ID" ? "face" : "fingerprint"
                }
              />
            )}
          </View>
          <Text style={styles.footer}> 2025 Unlimited Education Services</Text>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 100,
    resizeMode: "contain",
  },
  formContainer: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    marginTop: 60,
    width: "80%",
    padding: 30,
    justifyContent: "center",
    gap: 20,
  },
  footer: {
    marginTop: 60,
    fontSize: 11,
    color: colors.slate400,
  },
});

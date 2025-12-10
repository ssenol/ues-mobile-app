import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import ActionButton from "../components/ActionButton";
import CustomInput from "../components/CustomInput";
import { ThemedText } from "../components/ThemedText";
import authService from "../services/auth";
import BiometricAuthService from "../services/biometricAuth";
import { store } from "../store/index";
import { setCredentials } from "../store/slices/authSlice";
import { useTheme } from "../theme/ThemeContext";
import ThemedIcon from "../components/ThemedIcon";

// Biyometrik hatırlatma Alert'inin daha önce gösterilip gösterilmediğini tutan anahtar.
const BIOMETRIC_PROMPT_SHOWN_KEY = "biometric_prompt_shown";

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const [username, setUsername] = useState("ues-meq-student1"); //
  const [password, setPassword] = useState("123456"); //
  const [loading, setLoading] = useState(false);
  // Biyometrik giriş butonunun gösterilip gösterilmeyeceğini belirler.
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  // Biyometrik butonunda yazacak olan doğrulama tipinin adını tutar.
  const [biometricButtonType, setBiometricButtonType] = useState("");
  // Biyometrik doğrulama işlemi sırasında yüklenme durumunu yönetir.
  const [biometricLoading, setBiometricLoading] = useState(false);

  useEffect(() => {
    // Otomatik biyometrik giriş kaldırıldı
    // Biyometrik buton görünürlüğü kontrolü
    // Biyometrik butonun görünürlüğünü ve tipini belirleyen kontrol fonksiyonu.
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
      if (creds) {
        const type = await BiometricAuthService.getBiometricType();
        setBiometricButtonType(type);
        setShowBiometricButton(true);
      } else {
        setShowBiometricButton(false);
      }
    };
    checkBiometricButton();

    // --- EKRANA HER GELİŞTE BUTON KONTROLÜ ---
    return navigation.addListener("focus", () => {
      checkBiometricButton();
    });
  }, [navigation]);

  // Biyometrik ile otomatik giriş fonksiyonu
  // Biyometrik doğrulama sonrası kaydedilmiş kimlik bilgileriyle giriş yapar.
  const handleLoginWithCredentials = async (username, password) => {
    try {
      setLoading(true);
      const response = await authService.login(username, password);
      if (!response || !response.token || !response.user) {
        throw new Error("Invalid login response - missing token or user data");
      }
      const credentials = {
        token: response.token,
        user: response.user,
        refreshToken: response.refreshToken,
        tokenAcquiredAt: Date.now(),
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

  // Biyometrik doğrulamayı başlatır ve başarılı ise kullanıcının giriş yapmasını sağlar.
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
      const response = await authService.login(username, password);
      if (!response || !response.token || !response.user) {
        throw new Error("Invalid login response - missing token or user data");
      }
      const credentials = {
        token: response.token,
        user: response.user,
        refreshToken: response.refreshToken,
        tokenAcquiredAt: Date.now(),
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
      // <--- TOKEN'I SECURESTORE'A KAYDET --->
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
                  setShowBiometricButton(true);
                  // Alert.alert(
                  //   "Success",
                  //   `You can now use ${type} for authentication during logins.`
                  // );
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

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      backgroundColor: colors.background,
      flex: 1,
    },
    headerContainer: {
      position: 'relative',
      width: '100%',
      height: 285,
    },
    headerImage: {
      width: '100%',
      height: '100%',
    },
    headerContent: {
      position: 'absolute',
      top: 90,
      width: '100%',
      alignItems: 'center',
    },
    logo: {
      marginBottom: 8,
    },
    subtitle: {
      color: colors.white,
      fontSize: 12,
      lineHeight: 16,
    },
    formContainer: {
      marginHorizontal: 16,
      backgroundColor: colors.white,
      marginTop: -100,
      borderRadius: 16,
      padding: 24,
    },
    welcome: {
      fontSize: 24,
      lineHeight: 30,
      textAlign: 'center',
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      lineHeight: 22,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 24,
    },
    inputs: {
      gap: 16,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: 12,
    },
    forgotPasswordText: {
      color: colors.text,
      textDecorationLine: 'underline',
      fontSize: 14,
    },
    divider: {
      height: 1,
      backgroundColor: '#eee',
      marginVertical: 24,
    },
    otherLogins: {
      textAlign: 'center',
      color: colors.color555,
      fontSize: 16,
      lineHeight: 18,
      marginBottom: 24,
    },
    footer: {
      color: "#969696",
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 40,
      marginBottom: 24,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerContainer}>
              <Image
                source={require('../../assets/images/screenHeader.png')}
                style={styles.headerImage}
                resizeMode="cover"
              />
              <View style={styles.headerContent}>
                <ThemedIcon
                  iconName="myeduquiz"
                  style={styles.logo}
                  width={181}
                  height={31}
                  tintColor="#fff"
                />
                <ThemedText style={styles.subtitle}>
                  Unlimited Education Services product.
                </ThemedText>
              </View>
            </View>
            <View style={styles.formContainer}>
              <ThemedText weight="bold" style={styles.welcome}>Welcome Back</ThemedText>
              <ThemedText style={styles.description}>Enter your username and password to {"\n"}access your account.</ThemedText>

              <View style={styles.inputs}>
                <CustomInput
                  iconName="user"
                  placeholder="Enter username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <CustomInput
                  iconName="password"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {/*<TouchableOpacity style={styles.forgotPassword}>
                <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
              </TouchableOpacity>*/}

              <ActionButton
                title={loading ? "Logging in..." : "Log in"}
                onPress={handleLogin}
                loading={loading}
                variant={'primary'}
                style={{ marginTop: 24 }}
              />
              {/* Biyometrik ile giriş butonu sadece destekleniyorsa ve kullanıcı izin verdiyse görünür */}
              {showBiometricButton && (
                <>
                <View style={styles.divider} />
                <ThemedText style={styles.otherLogins}>Other Logins</ThemedText>

                <ActionButton
                  title={`Login with ${biometricButtonType}`}
                  onPress={handleBiometricLogin}
                  variant="outline"
                  iconLeft
                  loading={biometricLoading}
                  iconName={biometricButtonType === "Face ID" ? "faceId" : "touchId"}
                  iconSize={24}
                />
                </>
              )}
            </View>
            <ThemedText style={styles.footer}>© 2025 UES</ThemedText>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

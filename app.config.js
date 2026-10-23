const IS_DEV = process.env.APP_VARIANT === 'development';

module.exports = {
  expo: {
    scheme: "boostifyspeak",
    name: IS_DEV ? "BoostifySpeak DEV" : "BoostifySpeak",
    slug: "boostifyspeak",
    version: "1.1.0",
    orientation: "portrait",
    icon: IS_DEV ? "./assets/images/icon-dev.png" : "./assets/images/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      // iPad'de Split View / Slide Over açık (iPadOS 26+ bunu zaten dikkate almıyor, pencereler hep boyutlandırılabilir)
      requireFullScreen: false,
      icon: IS_DEV 
        ? {
            light: "./assets/images/icon-dev.png",
            dark: "./assets/images/icon-dev-dark.png"
          }
        : {
            light: "./assets/images/icon.png",
            dark: "./assets/images/icon-dark.png"
          },
      infoPlist: {
        // iPhone portre kalır; iPad her yöne döner (expo-screen-orientation varsayılan maskeyi buradan okur)
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait"
        ],
        "UISupportedInterfaceOrientations~ipad": [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight"
        ],
        NSFaceIDUsageDescription: "BoostifySpeak uses Face ID to provide secure and convenient login for student accounts.",
        NSMicrophoneUsageDescription: "BoostifySpeak uses microphone access to record speaking assignments and provide pronunciation, fluency, and speaking assessment feedback.",
        NSCameraUsageDescription: "BoostifySpeak uses camera access to allow students to capture and upload profile photos for their educational account.",
        NSPhotoLibraryUsageDescription: "BoostifySpeak uses photo library access to allow students to select and upload profile photos for their educational account.",
        ITSAppUsesNonExemptEncryption: false
      },
      bundleIdentifier: IS_DEV ? "com.ues.boostifyspeak.dev" : "com.ues.boostifyspeak",
      buildNumber: "10"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: IS_DEV ? "./assets/images/adaptive-icon-dev.png" : "./assets/images/adaptive-icon.png",
        // Foreground görseli kendi zeminini içeriyor; bu renk yalnızca maske kenarında görünür
        backgroundColor: "#303FE0"
      },
      package: IS_DEV ? "com.ues.boostifyspeak.dev" : "com.ues.boostifyspeak",
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      // Manifest portre: telefonlar açılışta hiç yan dönmez. Tabletlerde kilit app/_layout.tsx'te çalışma anında açılır.
      screenOrientation: "portrait"
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    owner: "selcuksenol",
    plugins: [
      "expo-secure-store",
      "expo-router",
      [
        "expo-splash-screen",
        {
          // boostifywrite ile aynı yapı: tam ekran görsel. Tablet yatayda üstten/alttan kırpılır, logo ortada kalır.
          image: "./assets/images/splash.png",
          resizeMode: "cover",
          backgroundColor: "#303FE0",
          enableFullScreenImage_legacy: true
        }
      ],
      "expo-font",
      "expo-audio",
      "expo-web-browser",
      "expo-screen-orientation",
      "expo-status-bar",
      "./plugins/withPodsDeploymentTarget",
      [
        "expo-build-properties",
        {
          ios: {
            // Xcode 27 / iOS 27 SDK UIScene yaşam döngüsünü zorunlu kılıyor (SDK 58'de varsayılan olacak)
            enableSceneSupport: true
          }
        }
      ]
    ],
    extra: {
      // Çalışma anında src/config/env.ts okur (dev araçlarını göstermek için)
      appVariant: IS_DEV ? "development" : "production",
      router: {},
      eas: {
        projectId: "b265e6b9-bacb-437b-b64f-53554b99a0dc"
      }
    }
  }
};

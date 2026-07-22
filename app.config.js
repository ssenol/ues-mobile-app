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
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "cover",
      background: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      requireFullScreen: true,
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
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait"
        ],
        "UISupportedInterfaceOrientations~ipad": [
          "UIInterfaceOrientationPortrait"
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
        background: "#ffffff"
      },
      package: IS_DEV ? "com.ues.boostifyspeak.dev" : "com.ues.boostifyspeak",
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ],
      screenOrientation: "portrait"
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    owner: "selcuksenol",
    plugins: [
      "expo-secure-store",
      "expo-router",
      "expo-font",
      "expo-audio",
      "expo-web-browser",
      "expo-screen-orientation"
    ],
    extra: {
      router: {},
      eas: {
        projectId: "b265e6b9-bacb-437b-b64f-53554b99a0dc"
      }
    }
  }
};

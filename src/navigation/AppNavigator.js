import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  PlatformColor,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from "react-redux";

import NotificationModal from "../components/NotificationModal";
import ThemedIcon from "../components/ThemedIcon";
import { ThemedText } from "../components/ThemedText";
import AssignmentDetailScreen from "../screens/AssignmentDetailScreen";
import AssignmentReportScreen from "../screens/AssignmentReportScreen";
import AssignmentsScreen from "../screens/AssignmentsScreen";
import CompletedScreen from "../screens/CompletedScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ScenarioReportScreen from "../screens/ScenarioReportScreen";
import SpeechOnScenarioStep1Screen from "../screens/SpeechOnScenarioStep1Screen";
import SpeechOnScenarioStep2Screen from "../screens/SpeechOnScenarioStep2Screen";
import {
  selectIsAuthenticated,
} from "../store/slices/authSlice";
import { useTheme } from "../theme/ThemeContext";

// Expo Go uyumluluğu için güvenli import
let LiquidGlassView = View;
let isLiquidGlassSupported = false;
try {
  const liquidGlass = require('@callstack/liquid-glass');
  LiquidGlassView = liquidGlass.LiquidGlassView;
  isLiquidGlassSupported = liquidGlass.isLiquidGlassSupported;
} catch (e) {
  // Expo Go'da native modül yok, fallback kullan
  console.log('Liquid Glass not available, using fallback');
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Tablet ve mobil kontrolü
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 744;
  const basePadding = isTablet ? 30 : 10;
  
  // iOS 26 Liquid Glass desteği
  const useLiquidGlass = Platform.OS === 'ios' && isLiquidGlassSupported;

  // Styles'ı colors hook'undan sonra tanımla
  const tabBarStyles = StyleSheet.create({
    tabBarContainer: {
      position: "absolute",
      bottom: insets.bottom + basePadding,
      left: isTablet ? 192 : 32,
      right: isTablet ? 192 : 32,
      height: 56,
      // Liquid Glass kullanılıyorsa backgroundColor kaldırılır
      backgroundColor: useLiquidGlass ? 'transparent' : colors.primary,
      borderRadius: 28,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingLeft: 25,
      paddingRight: 25,
      zIndex: 10,
      // Liquid Glass kullanılıyorsa shadow kaldırılır (kendi shadow'u var)
      ...(!useLiquidGlass && shadows.dark),
    },
    // Liquid Glass wrapper için stil
    liquidGlassWrapper: {
      position: "absolute",
      bottom: insets.bottom + basePadding,
      left: isTablet ? 192 : 32,
      right: isTablet ? 192 : 32,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      zIndex: 10,
    },
    liquidGlassContent: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingLeft: 25,
      paddingRight: 25,
    },
    tabItem: {
      alignItems: "center",
      justifyContent: "center",
      width: 60,
      height: 56,
      zIndex: 1,
      gap: 2,
    },
    tabLabel: {
      fontSize: 10,
      marginTop: 2,
    },
    // Aktif tab highlight (Liquid Glass bubble)
    activeTabHighlight: {
      position: 'absolute',
      width: 70,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      zIndex: 0,
    },
  });

  // 🔹 Custom TabBar with iOS 26 Liquid Glass
  const CustomTabBar = ({ state, descriptors, navigation, notificationModalVisible, setNotificationModalVisible }) => {
    // Aktif tab animasyonu için
    const highlightAnim = useRef(new Animated.Value(0)).current;
    const [tabPositions, setTabPositions] = useState([0, 0, 0, 0, 0]);
    
    useEffect(() => {
      // Aktif tab değiştiğinde animasyon
      Animated.spring(highlightAnim, {
        toValue: state.index,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
      }).start();
    }, [state.index]);

    // Highlight pozisyonunu hesapla
    const highlightTranslateX = highlightAnim.interpolate({
      inputRange: [0, 1, 2, 3, 4],
      outputRange: tabPositions,
    });
    const renderTabItems = () => (
      state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const iconName = options.tabBarIconName || "tabAssignment";

        const onPress = () => {
          if (route.name === 'Notifications') {
            setNotificationModalVisible(false);
          }

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            // Tabbar'dan geldiğinde params'ı temizle (özellikle Assignments için)
            if (route.name === 'Assignments') {
              navigation.navigate({
                name: route.name,
                params: { filter: null },
                merge: false,
              });
            } else {
              navigation.navigate(route.name);
            }
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.8}
            style={tabBarStyles.tabItem}
            onLayout={(event) => {
              // Her tab'ın X pozisyonunu ölç
              const { x } = event.nativeEvent.layout;
              setTabPositions(prev => {
                const newPositions = [...prev];
                newPositions[index] = x - 10; // -10: highlight merkezlemesi için
                return newPositions;
              });
            }}
          >
            <ThemedIcon 
              iconName={iconName} 
              size={22}
              tintColor={useLiquidGlass 
                ? (isFocused ? colors.primary : '#000') 
                : colors.white
              }
              opacity={useLiquidGlass ? 1 : (isFocused ? 1 : 0.4)}
            />
            {useLiquidGlass && (
              <ThemedText 
                style={[
                  tabBarStyles.tabLabel,
                  { color: isFocused ? colors.primary : '#000' }
                ]}
              >
                {options.tabBarLabel}
              </ThemedText>
            )}
          </TouchableOpacity>
        );
      })
    );

    // iOS 26 Liquid Glass kullan
    if (useLiquidGlass) {
      return (
        <LiquidGlassView
          style={tabBarStyles.liquidGlassWrapper}
          effect="clear"
          interactive={true}
          colorScheme="dark"
        >
          <View style={tabBarStyles.liquidGlassContent}>
            {/* Animasyonlu highlight bubble - Liquid Glass ile */}
            <Animated.View
              style={[
                tabBarStyles.activeTabHighlight,
                {
                  transform: [{ translateX: highlightTranslateX }],
                },
              ]}
            >
              <LiquidGlassView
                style={{ flex: 1, borderRadius: 28 }}
                effect="regular"
                interactive={false}
                colorScheme="light"
              />
            </Animated.View>
            {renderTabItems()}
          </View>
        </LiquidGlassView>
      );
    }

    // Fallback: Normal TabBar (eski iOS/Android)
    return (
      <View style={tabBarStyles.tabBarContainer}>
        {renderTabItems()}
      </View>
    );
  };

  // 🔹 Tabbar ekranları
  const MainTabs = () => {
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);

    return (
      <>
        <Tab.Navigator
          initialRouteName="HomeScreen"
          screenOptions={{ 
            headerShown: false,
          }}
          tabBar={(props) => (
            <CustomTabBar 
              {...props} 
              notificationModalVisible={notificationModalVisible}
              setNotificationModalVisible={setNotificationModalVisible}
            />
          )}
        >
          <Tab.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ tabBarIconName: "tabHome", tabBarLabel: "Home" }}
          />
          <Tab.Screen
            name="Assignments"
            component={AssignmentsScreen}
            options={{ tabBarIconName: "tabAssignment", tabBarLabel: "Tasks" }}
          />
          <Tab.Screen
            name="Completed"
            component={CompletedScreen}
            options={{ tabBarIconName: "tabCompleted", tabBarLabel: "Done" }}
          />
          <Tab.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ tabBarIconName: "tabNotification", tabBarLabel: "Alerts" }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ tabBarIconName: "tabProfile", tabBarLabel: "Profile" }}
          />
        </Tab.Navigator>

        {/* Global Notification Modal */}
        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
        />
      </>
    );
  };

  // 🔹 Ana Stack yapısı
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />
          ) : (
            <>
              {/* Tabbar yapısı */}
              <Stack.Screen name="MainTabs" component={MainTabs} />
              {/* Assignment Detail Screen - Tabbar olmadan (hem speech_on_topic hem read_aloud için) */}
              <Stack.Screen 
                name="ReadAloud" 
                component={AssignmentDetailScreen}
                options={{ 
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              {/* Assignment Detail Screen için alternatif route (geriye dönük uyumluluk) */}
              <Stack.Screen 
                name="SpeechTask" 
                component={AssignmentDetailScreen}
                options={{ 
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              {/* Assignment Report Screen */}
              <Stack.Screen 
                name="AssignmentReport" 
                component={AssignmentReportScreen}
                options={{ 
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              {/* Scenario Report Screen */}
              <Stack.Screen
                name="ScenarioReport"
                component={ScenarioReportScreen}
                options={{
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              {/* Speech On Scenario Screen */}
              <Stack.Screen 
                name="SpeechOnScenarioStep1" 
                component={SpeechOnScenarioStep1Screen}
                options={{ 
                  headerShown: false,
                  presentation: 'card',
                }}
              />
              <Stack.Screen 
                name="SpeechOnScenarioStep2" 
                component={SpeechOnScenarioStep2Screen}
                options={{ 
                  headerShown: false,
                  presentation: 'card',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
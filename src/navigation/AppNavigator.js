import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from "react-redux";

import NotificationModal from "../components/NotificationModal";
import ThemedIcon from "../components/ThemedIcon";
import { useTheme } from "../theme/ThemeContext";

import AssignmentDetailScreen from "../screens/AssignmentDetailScreen";
import AssignmentReportScreen from "../screens/AssignmentReportScreen";
import ScenarioReportScreen from "../screens/ScenarioReportScreen";
import AssignmentsScreen from "../screens/AssignmentsScreen";
import CompletedScreen from "../screens/CompletedScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SpeechOnScenarioStep1Screen from "../screens/SpeechOnScenarioStep1Screen";
import SpeechOnScenarioStep2Screen from "../screens/SpeechOnScenarioStep2Screen";

import {
  selectIsAuthenticated,
} from "../store/slices/authSlice";

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

  // Styles'ı colors hook'undan sonra tanımla
  const tabBarStyles = StyleSheet.create({
    tabBarContainer: {
      position: "absolute",
      bottom: insets.bottom + basePadding,
      left: isTablet ? 192 : 32,
      right: isTablet ? 192 : 32,
      height: 56,
      backgroundColor: colors.primary,
      borderRadius: 28,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingLeft: 25,
      paddingRight: 25,
      zIndex: 10,
      ...shadows.dark,
    },
    tabItem: {
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
    },
  });

  // 🔹 Custom TabBar
  const CustomTabBar = ({ state, descriptors, navigation, notificationModalVisible, setNotificationModalVisible }) => {
    return (
      <View style={tabBarStyles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName = options.tabBarIconName || "tabAssignment";
          const opacity = isFocused ? 1 : 0.4;

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
            >
              <ThemedIcon 
                iconName={iconName} 
                size={24} 
                tintColor={colors.white}
                opacity={opacity}
              />
            </TouchableOpacity>
          );
        })}
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
            options={{ tabBarIconName: "tabHome" }}
          />
          <Tab.Screen
            name="Assignments"
            component={AssignmentsScreen}
            options={{ tabBarIconName: "tabAssignment" }}
          />
          <Tab.Screen
            name="Completed"
            component={CompletedScreen}
            options={{ tabBarIconName: "tabCompleted" }}
          />
          <Tab.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ tabBarIconName: "tabNotification" }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ tabBarIconName: "tabProfile" }}
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
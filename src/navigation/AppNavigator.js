import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSelector, useDispatch } from "react-redux";
import { TouchableOpacity, Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import colors from "../styles/colors";
import Icon from "../components/Icon";

import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import SpeakTasksScreen from "../screens/SpeakTasksScreen";
import SpeakRecordScreen from "../screens/SpeakRecordScreen";
import SpeakReportScreen from "../screens/SpeakReportScreen";
import SettingsScreen from "../screens/SettingsScreen";
import WritingTasksScreen from "../screens/WritingTasksScreen";
import WritingTaskDetailScreen from "../screens/WritingTaskDetailScreen";

import {
  selectIsAuthenticated,
  selectRefreshToken,
} from "../store/slices/authSlice";
import { handleLogout } from "../utils/logoutHelper";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const refreshToken = useSelector((state) => selectRefreshToken(state));

  const handleRefresh = (navigation) => {
    Alert.alert(
      "Restart",
      "Are you sure you want to start again?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("Dashboard");
          },
        },
      ]
    );
  };

  const handleLogoutPress = async () => {
    await handleLogout({
      dispatch,
      refreshToken,
      navigation: null,
    });
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerShadowVisible: false,
          headerBackTitle: "Back",
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              animation: "slide_from_left",
            }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              component={DashboardScreen}
              options={({ navigation }) => ({
                headerShown: true,
                headerTitle: "Choose Section",
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => navigation.navigate("SettingsScreen")}
                    style={{ padding: 8 }}
                  >
                    <Icon
                      iosName="gearshape.fill"
                      androidName="settings"
                      size={22}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                ),
                headerRight: () => (
                  <TouchableOpacity
                    onPress={handleLogoutPress}
                    style={{ padding: 8 }}
                  >
                    <Icon
                      iosName="power"
                      androidName="power-settings-new"
                      size={Platform.OS === "ios" ? 20 : 22}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="SettingsScreen"
              component={SettingsScreen}
              options={{
                headerShown: true,
                headerTitle: "Settings",
              }}
            />
            <Stack.Screen
              name="SpeakTasks"
              component={SpeakTasksScreen}
              options={{
                headerShown: true,
                title: ""
              }}
            />
            <Stack.Screen
              name="SpeakRecord"
              component={SpeakRecordScreen}
              options={{
                headerShown: true,
                title: "Speak Recording",
                headerLeft: null,
              }}
            />
            <Stack.Screen
              name="SpeakReport"
              component={SpeakReportScreen}
              options={({ navigation }) => ({
                headerShown: true,
                title: "Speak Report",
                headerLeft: null,
                headerRight: () => (
                  <TouchableOpacity
                    onPress={() => handleRefresh(navigation)}
                    style={{ padding: 8 }}
                  >
                    <Icon
                      iosName="arrow.clockwise"
                      androidName="refresh"
                      size={Platform.OS === "ios" ? 24 : 22}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="WritingTasks"
              component={WritingTasksScreen}
              options={{
                headerShown: true,
                title: ""
              }}
            />
            <Stack.Screen
              name="WritingTaskDetail"
              component={WritingTaskDetailScreen}
              options={{
                headerShown: true,
                title: "Writing Task Detail",
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { Redirect, Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Dimensions, DynamicColorIOS, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/src/store/slices/authSlice';
import CustomTabBar from '@/src/components/CustomTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isIPad = Platform.OS === 'ios' && SCREEN_WIDTH >= 744;

export default function TabsLayout() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // iPad: Custom TabBar (mavi zemin, altta)
  if (isIPad) {
    return (
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ title: 'Home' }}
        />
        <Tabs.Screen 
          name="assignments" 
          options={{ title: 'Assignments' }}
        />
        <Tabs.Screen 
          name="completed" 
          options={{ title: 'Completed' }}
        />
        <Tabs.Screen 
          name="notifications" 
          options={{ title: 'Notifications' }}
        />
        <Tabs.Screen 
          name="profile" 
          options={{ title: 'Profile' }}
        />
      </Tabs>
    );
  }

  // iPhone: NativeTabs (Liquid Glass)
  return (
    <NativeTabs
      tintColor={DynamicColorIOS({ dark: '#3E4EF0', light: '#3E4EF0' })}
    >
      <NativeTabs.Trigger name="index">
        <Icon src={require('../../assets/icons/tab-home.png')} />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="assignments">
        <Icon src={require('../../assets/icons/tab-assignments.png')} />
        <Label>Assignments</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="completed">
        <Icon src={require('../../assets/icons/tab-completed.png')} />
        <Label>Completed</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notifications">
        <Icon src={require('../../assets/icons/tab-notifications.png')} />
        <Label>Notifications</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon src={require('../../assets/icons/tab-profile.png')} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

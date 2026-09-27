import { Redirect, Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Dimensions, DynamicColorIOS, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/src/store/slices/authSlice';
import CustomTabBar from '@/src/components/CustomTabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isIPad = Platform.OS === 'ios' && SCREEN_WIDTH >= 744;
// NativeTabs (Liquid Glass) sadece iOS 26+ üzerinde düzgün çalışıyor; eski iPhone'larda
// custom PNG sekme ikonlarının arkasında istenmeyen gri bir kapsül görünüyor.
// Bu yüzden iOS 26 altındaki iPhone'larda da iPad'deki floating CustomTabBar'a düşülüyor.
const iosMajorVersion = Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) : 0;
const supportsLiquidGlassTabs = Platform.OS === 'ios' && iosMajorVersion >= 26;

export default function TabsLayout() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // iPad veya iOS 26 altındaki iPhone: Custom TabBar (mavi zemin, altta)
  if (isIPad || !supportsLiquidGlassTabs) {
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
        {/* Notifications sekmesi şimdilik kaldırıldı, yerine başka bir ikon/sekme gelecek.
        href:null ile route dosyası (app/(tabs)/notifications.tsx) korunuyor ama Expo Router'ın
        dosya tabanlı otomatik keşfiyle tab bar'a eklenmesi engelleniyor. */}
        <Tabs.Screen
          name="notifications"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="my-progress"
          options={{ title: 'My Progress' }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: 'Profile' }}
        />
      </Tabs>
    );
  }

  // iPhone (iOS 26+): NativeTabs (Liquid Glass)
  return (
    <NativeTabs
      tintColor={DynamicColorIOS({ dark: '#3E4EF0', light: '#3E4EF0' })}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon src={require('../../assets/icons/tab-home.png')} renderingMode="template" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="assignments">
        <NativeTabs.Trigger.Icon src={require('../../assets/icons/tab-assignments.png')} renderingMode="template" />
        <NativeTabs.Trigger.Label>Assignments</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="completed">
        <NativeTabs.Trigger.Icon src={require('../../assets/icons/tab-completed.png')} renderingMode="template" />
        <NativeTabs.Trigger.Label>Completed</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* Notifications sekmesi şimdilik kaldırıldı, yerine başka bir ikon/sekme gelecek
      <NativeTabs.Trigger name="notifications">
        <NativeTabs.Trigger.Icon src={require('../../assets/icons/tab-notifications.png')} renderingMode="template" />
        <NativeTabs.Trigger.Label>Notifications</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      */}

      <NativeTabs.Trigger name="my-progress">
        <NativeTabs.Trigger.Icon src={require('../../assets/icons/tab-my-progress.png')} renderingMode="template" />
        <NativeTabs.Trigger.Label>My Progress</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon src={require('../../assets/icons/tab-profile.png')} renderingMode="template" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

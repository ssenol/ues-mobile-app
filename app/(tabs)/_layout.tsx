import { Redirect, Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
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

      {/* Notifications sekmesi şimdilik kaldırıldı, yerine başka bir ikon/sekme gelecek
      <NativeTabs.Trigger name="notifications">
        <Icon src={require('../../assets/icons/tab-notifications.png')} />
        <Label>Notifications</Label>
      </NativeTabs.Trigger>
      */}

      <NativeTabs.Trigger name="my-progress">
        <Icon src={require('../../assets/icons/tab-my-progress.png')} />
        <Label>My Progress</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon src={require('../../assets/icons/tab-profile.png')} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

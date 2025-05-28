import AsyncStorage from '@react-native-async-storage/async-storage';

export default async function clearAsyncStorage() {
  try {
    await AsyncStorage.clear();
    console.log('AsyncStorage temizlendi!');
  } catch (e) {
    console.log('AsyncStorage temizlenirken hata oluştu:', e);
  }
}

# Expo Go Cache Temizleme Adımları

## 1. Metro Bundler Cache'ini Temizle

Terminal'de şu komutu çalıştırın:

```bash
# Metro bundler'ı durdurun (Ctrl+C)
# Sonra cache'i temizleyerek yeniden başlatın:
npx expo start --clear
```

veya

```bash
npm start -- --clear
```

## 2. Expo Go Uygulamasını Yeniden Başlat

1. Fiziksel cihazda Expo Go uygulamasını tamamen kapatın
2. Uygulamayı yeniden açın
3. QR kodu tekrar tarayın veya bağlantıyı yeniden kurun

## 3. AsyncStorage Cache'ini Temizle (Opsiyonel)

Eğer hala sorun devam ediyorsa, uygulama içinde AsyncStorage'ı temizleyebilirsiniz:

- Profile Screen'de "Clear All Data" butonuna basın
- Veya uygulamayı kaldırıp yeniden yükleyin

## 4. Watchman Cache'ini Temizle (Mac için)

```bash
watchman watch-del-all
```

## 5. Node Modules ve Cache'i Temizle (Son Çare)

```bash
# node_modules'ı sil
rm -rf node_modules

# npm cache'i temizle
npm cache clean --force

# node_modules'ı yeniden yükle
npm install

# Expo cache'i temizle
npx expo start --clear
```

## 6. Expo Go'yu Güncelleyin

Fiziksel cihazdaki Expo Go uygulamasının en son sürümde olduğundan emin olun.


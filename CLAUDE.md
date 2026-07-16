# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proje Özeti

BoostifySpeak (iç adı: UES Mobile App), öğrencilerin konuşma görevlerini (speech tasks) yönetmesini sağlayan bir React Native + Expo mobil uygulamasıdır. Öğrenciler atanan görevleri görüntüler, konuşma senaryolarını tamamlar, ses kaydı yapar ve ilerlemesini takip eder.

- **Versiyon:** 1.0.0 · **Expo SDK:** ~54 · **React Native:** 0.81.5 · **React:** 19.1.0
- **Test cihazı:** iPhone 16 (fiziksel cihaz, `npm run ios` bunu hedefler)
- **Backend:** `https://quizmaker-api.onrender.com/api/v0.0.1`

## Komutlar

```bash
npm start                              # Expo dev server (dev client gerekli, Expo Go DESTEKLENMİYOR)
npm run ios                            # iOS'ta çalıştır (iPhone 16 fiziksel cihaz, expo run:ios)
npm run android                        # Android'de çalıştır
npm run web                            # Web'de çalıştır
npm run lint                           # expo lint (eslint-config-expo/flat)
npx expo start --clear                 # Metro cache temizleyerek başlat
npx expo prebuild --clean              # Native projeleri (ios/android) yeniden üret
```

Bu projede birim/entegrasyon test altyapısı (Jest vb.) **yok** — `npm run lint` ve manuel/fiziksel cihaz testi mevcut doğrulama yoludur.

Native bağımlılık eklendiğinde veya `app.config.js`/plugin değişikliğinde `ios`/`android` klasörleri prebuild ile senkronize edilmeli (`expo-dev-client` kullanıldığı için Expo Go ile çalışmaz).

## Mimari

### Giriş noktası ve routing — Expo Router (dosya tabanlı), React Navigation DEĞİL

`package.json`'daki `main` alanı `index.js`'e işaret eder; `index.js` sadece `expo-router/entry`'i import eder. Gerçek uygulama ağacı **`app/`** klasöründeki dosya tabanlı route'lardan kurulur:

```
app/
├── _layout.tsx              # Root layout: Redux Provider, PersistGate, ThemeProvider, Stack((auth)|(tabs))
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx
├── (tabs)/
│   ├── _layout.tsx           # Auth kontrolü + platforma göre tab bar seçimi (aşağıya bakın)
│   ├── index.tsx              # Home
│   ├── assignments.tsx
│   ├── completed.tsx
│   ├── notifications.tsx
│   └── profile.tsx
├── assignment-detail.tsx
├── assignment-report.tsx
├── scenario-report.tsx
├── speech-step1.tsx
└── speech-step2.tsx
```

`app/**/*.tsx` dosyaları **ince sarmalayıcılardır** — gerçek ekran implementasyonu `src/screens/*.js`'te yaşar ve route dosyası sadece onu import edip render eder:

```tsx
// app/(tabs)/index.tsx
import HomeScreen from '../../src/screens/HomeScreen';
export default function Home() { return <HomeScreen />; }
```

Yeni bir ekran eklerken: (1) `src/screens/` altına implementasyonu yaz, (2) `app/` altında uygun konuma ince route dosyasını ekle. `app/` dosyaları TypeScript (`.tsx`, `@/*` path alias), `src/` dosyaları ise düz JavaScript (`.js`) — proje bu ikisini bilinçli olarak ayırıyor, karıştırmayın.

**Ölü kod uyarısı:** `App.js`, `src/AppContent.js` ve `src/navigation/AppNavigator.js` (React Navigation Stack+BottomTabs tabanlı eski mimari) hâlâ repoda duruyor ama **hiçbir yerden import edilmiyor** — Expo Router migration'ından kalan artık. Bunları örnek/referans olarak kullanmayın; gerçek navigasyon her zaman `app/_layout.tsx`'ten başlar.

### Tab bar: platforma göre iki farklı implementasyon

`app/(tabs)/_layout.tsx`, `Dimensions` ile ekran genişliğine bakıp iPad mi iPhone mu olduğuna karar verir:
- **iPad** (`SCREEN_WIDTH >= 744`): React Navigation'ın `Tabs` bileşeni + özel `tabBar={(props) => <CustomTabBar {...props} />}` (`src/components/CustomTabBar.js`) — mavi zeminli, floating custom tab bar.
- **iPhone**: `expo-router/unstable-native-tabs`'tan `NativeTabs` — iOS 26 Liquid Glass native tab bar, ikonlar `assets/icons/tab-*.png`'den.

Tab bar davranışını değiştirirken hangi platform dalını etkilediğinizi netleştirin; ikisi tamamen ayrı componentlerdir.

### Redux store

`src/store/index.js` dört slice'ı `redux-persist` ile ayrı ayrı `persistReducer`'a sarar (her biri kendi `whitelist`'iyle, AsyncStorage backend):

| Slice | Persist edilen alanlar |
|---|---|
| `authSlice` | `accessToken`, `refreshToken`, `currentUser`, `isAuthenticated`, `tokenAcquiredAt` |
| `speakSlice` | `speakResults`, `currentAssignment` |
| `assignmentSlice` | `cachedAssignments`, `cacheTimestamp`, `totalAssignments`, `completedAssignments` |
| `settingsSlice` | `ttsSpeed` |

Yeni bir slice eklerken `src/store/index.js`'e hem reducer'ı hem karşılık gelen `persistConfig`'i (whitelist ile) eklemeyi unutmayın.

### API katmanı ve token yönetimi

`src/config/api.js` tek bir axios instance'ı ve `API_ENDPOINTS` sözlüğünü tanımlar; tüm endpoint URL'leri buradan türetilir (dağınık string literal yerine). Request/response interceptor'lar:
- Access token 24 saatten eskiyse (`tokenAcquiredAt`) her istekten önce refresh token ile otomatik yeniler.
- 401 alan istekleri bir kez retry eder (`refreshToken` ile), başarısızsa Redux `logout()` dispatch eder.
- `config.skipAuthInterceptor` ile bazı istekler auth kontrolünden muaf tutulabilir.

Yeni bir endpoint eklerken `API_ENDPOINTS`'e ekleyin ve çağrıyı `src/services/` altındaki ilgili service dosyasından yapın (`auth.js`, `speak.js`, `biometricAuth.js`) — component'ler doğrudan axios/`api` çağırmaz.

### İkon sistemi: iki paralel sistem bir arada

- **SVG ikonlar:** `SvgIcon` component + `src/constants/svgIcons.json` (path tanımları).
- **Vector/PNG ikonlar:** `ThemedIcon` component + `@expo/vector-icons` + `src/constants/iconMap.js` (isim → ikon eşlemesi).

Halihazırda kısmi bir migration devam ediyor (bkz. `TODO.md` — Icon Migration Roadmap): eski `Icon` component'i kaldırılıp her yerin `ThemedIcon` + `iconMap` üzerinden çalışması hedefleniyor. Yeni ikon eklerken önce `iconMap.js`'te karşılığı olup olmadığını kontrol edin.

### Tema

`src/theme/ThemeContext.js` renkleri (`colors`), gölgeleri (`shadows`) ve font ailesini (Nunito ağırlıkları) tek bir `theme` objesinde tutar; `useTheme()` hook'u ile component'lerde okunur. Dark mode yok — `userInterfaceStyle: "light"` olarak sabitlenmiş (`app.config.js`).

### Build konfigürasyonu

- `app.config.js` (statik `app.json` değil) — `APP_VARIANT=development` env değişkenine göre dev/prod arasında icon, bundle identifier (`com.ues.boostifyspeak[.dev]`) ve isim değiştirir.
- `eas.json` build profilleri: `development` (internal, dev client, APK), `preview` (internal, APK), `production` (store, app-bundle/ios).
- iOS `buildNumber` her production build'de manuel artırılıyor (`app.config.js` içinde).

## Kod Kuralları (proje-özel)

- **Component yazımı:** Functional + hooks, PascalCase dosya adı (`HomeScreen.js`), camelCase fonksiyon/değişken.
- **Yorumlar ve iletişim Türkçe** (mevcut kod tabanı Türkçe yorum kullanıyor).
- Persist edilecek Redux state'leri her zaman `whitelist` ile açıkça belirtin (yukarıdaki tablo).
- API çağrıları service layer'da (`src/services/`) toplanır, component'lerden direkt axios çağrısı yapılmaz.
- Ses işlemleri için `expo-audio` kullanılır (react-native-sound değil); recording/playback sonrası her zaman unload/cleanup yapılır.
- Yeni ekran eklerken önce `src/screens/`, sonra `app/` altında ince route wrapper — asla tersi.

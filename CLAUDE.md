# UES Mobile App

## Proje Özeti

UES Mobile App, öğrencilerin konuşma görevlerini (speech tasks) yönetmesini sağlayan bir React Native mobil uygulamasıdır. Öğrenciler atanan görevleri görüntüleyebilir, konuşma senaryolarını tamamlayabilir, ses kayıtları yapabilir ve ilerlemelerini takip edebilir.

**Versiyon:** 1.0.0
**Platform:** iOS (iPhone 16 test cihazı)
**Geliştirme Ortamı:** Expo ~54

---

## Teknoloji Stack

### Core
- **React Native:** 0.81.5
- **React:** 19.1.0
- **Expo:** ~54.0.25
- **Expo Dev Client:** ~6.0.18

### State Management
- **Redux Toolkit:** ^2.8.2 (Modern Redux yaklaşımı)
- **Redux Persist:** ^6.0.0 (AsyncStorage ile persist)
- **React Redux:** ^9.2.0

### Navigation
- **React Navigation v7:**
  - `@react-navigation/native`: ^7.1.8
  - `@react-navigation/native-stack`: ^7.3.10
  - `@react-navigation/bottom-tabs`: ^7.4.0

### API & Network
- **Axios:** ^1.9.0
- **Base URL:** `https://quizmaker-api.onrender.com/api/v0.0.1`
- **NetInfo:** ^11.4.1 (Network durumu takibi)

### UI & Media
- **Expo Audio:** ~1.0.15 (Ses kaydı/çalma)
- **Expo Image:** ~3.0.10
- **Expo Haptics:** ~15.0.7
- **Expo Linear Gradient:** ~15.0.7
- **Expo Blur:** ~15.0.7
- **React Native Modal:** ^14.0.0-rc.1
- **React Native SVG:** 15.12.1
- **@expo/vector-icons:** ^15.0.3
- **@expo-google-fonts/nunito:** ^0.4.2

### Charts & Visualization
- **React Native Gifted Charts:** ^1.4.61
- **React Native Chart Kit:** ^6.12.0
- **Victory Native:** ^36.6.11
- **d3-shape:** ^3.2.0

### Storage & Security
- **AsyncStorage:** 2.2.0 (Yerel veri saklama)
- **Expo Secure Store:** ~15.0.7 (Güvenli veri saklama)
- **Expo Local Authentication:** ~17.0.7 (Biometric auth)

### Utilities
- **Expo File System:** ~19.0.17
- **DateTimePicker:** 8.4.4
- **Expo Constants:** ~18.0.10

---

## Proje Yapısı

```
/src
├── AppContent.js              # Ana uygulama container
├── components/                # Reusable UI bileşenleri
│   ├── ActionButton.js
│   ├── AssignmentCard.js
│   ├── AudioPlayer.js
│   ├── CircularProgress.js
│   ├── CompletedAssignmentCard.js
│   ├── ConfirmModal.js
│   ├── CustomInput.js
│   ├── EmptyStateCard.js
│   ├── GoalProgress.js
│   ├── InfoModal.js
│   ├── InlineCalendar.js
│   ├── LoadingOverlay.js
│   ├── NotificationModal.js
│   ├── ScenarioTaskDetails.js
│   ├── SvgIcon.js            # SVG icon renderer
│   ├── ThemedIcon.js         # Expo vector icons wrapper
│   └── ThemedText.js         # Themed text component
│
├── config/
│   └── api.js                # Axios instance, interceptors, endpoints
│
├── constants/
│   ├── iconMap.js            # Icon mapping
│   └── svgIcons.json         # SVG icon definitions
│
├── navigation/
│   └── AppNavigator.js       # Root navigation (Stack + BottomTabs)
│
├── screens/                  # Screen components
│   ├── AssignmentDetailScreen.js
│   ├── AssignmentReportScreen.js
│   ├── AssignmentsScreen.js
│   ├── CompletedScreen.js
│   ├── HomeScreen.js
│   ├── LoginScreen.js
│   ├── NotificationsScreen.js
│   ├── ProfileScreen.js
│   ├── ScenarioReportScreen.js
│   ├── SpeechOnScenarioStep1Screen.js
│   └── SpeechOnScenarioStep2Screen.js
│
├── services/                 # API service layer
│
├── store/                    # Redux store
│   ├── index.js             # Store configuration
│   └── slices/
│       ├── authSlice.js     # Authentication state
│       ├── speakSlice.js    # Speech results state
│       ├── assignmentSlice.js  # Assignment cache
│       └── settingsSlice.js    # App settings (TTS speed)
│
├── theme/                   # Theme configuration
│
└── utils/                   # Utility functions
```

---

## Redux Store Yapısı

### Slices

#### 1. **authSlice**
**Persist:** `accessToken`, `currentUser`, `refreshToken`, `isAuthenticated`, `tokenAcquiredAt`

```javascript
{
  accessToken: string,
  refreshToken: string,
  currentUser: object,
  isAuthenticated: boolean,
  tokenAcquiredAt: timestamp
}
```

#### 2. **speakSlice**
**Persist:** `speakResults`, `currentAssignment`

```javascript
{
  speakResults: array,
  currentAssignment: object
}
```

#### 3. **assignmentSlice**
**Persist:** `cachedAssignments`, `cacheTimestamp`, `totalAssignments`, `completedAssignments`

```javascript
{
  cachedAssignments: array,
  cacheTimestamp: timestamp,
  totalAssignments: number,
  completedAssignments: number
}
```

#### 4. **settingsSlice**
**Persist:** `ttsSpeed`

```javascript
{
  ttsSpeed: number  // Text-to-speech hız ayarı
}
```

---

## API Yapısı

### Base URL
```
https://quizmaker-api.onrender.com/api/v0.0.1
```

### Endpoints

#### Authentication
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/refresh-mobile-app-access-token` - Token yenileme

#### Student
- `GET /student/get-assigned-speech-tasks` - Atanan görevleri getir
- `POST /student/generate-exercise-auth-token` - Egzersiz token'ı oluştur
- `POST /student/submit-speech-task` - Konuşma görevi gönder
- `POST /student/save-speech-on-scenario-progress` - Senaryo ilerlemesini kaydet
- `GET /student/get-student-completed-exercises` - Tamamlanan egzersizler
- `GET /student/get-solved-exercise-detail` - Çözülen egzersiz detayı
- `DELETE /student/delete-solved-task` - Çözülmüş görevi sil

#### Speech Scenario
- `POST /question/speech-on-scenario-chat-response` - Senaryo chat yanıtı

#### Question/Audio
- `POST /question/text-to-speech` - Metin → Ses dönüşümü
- `POST /question/process-audio-to-text` - Ses → Metin dönüşümü

#### User
- `POST /user/set-user-profile` - Kullanıcı profili güncelle

### Token Management

**Otomatik Token Refresh:**
- Access token 24 saat sonra otomatik yenilenir
- Request interceptor ile kontrol edilir
- 401 hatası durumunda refresh token kullanılır
- Refresh başarısızsa otomatik logout

```javascript
// Token kontrolü: 24 saat geçtiyse yenile
if (now - tokenAcquiredAt > 24 * 60 * 60 * 1000) {
  // Refresh token ile yeni access token al
}
```

---

## Özellikler

### 1. **Authentication**
- Login ekranı
- Token-based auth (JWT)
- Otomatik token refresh (24 saat)
- Secure token storage (SecureStore)
- Biometric authentication desteği

### 2. **Assignment Management**
- Görev listesi (cache mekanizmalı)
- Görev detayları
- Görev filtreleme
- Görev tamamlama durumu

### 3. **Speech on Scenario**
- 2 adımlı konuşma senaryosu
- Gerçek zamanlı ses kaydı
- Speech-to-text dönüşüm
- Text-to-speech oynatma
- TTS hız ayarı (settingsSlice)
- Chat-based senaryo ilerlemesi

### 4. **Progress Tracking**
- Circular progress göstergeleri
- Goal progress takibi
- Tamamlanma grafikleri (Charts)
- Inline calendar görünümü

### 5. **Completed Exercises**
- Tamamlanan egzersiz listesi
- Egzersiz detay görüntüleme
- Çözülen görev silme

### 6. **Profile & Settings**
- Kullanıcı profili
- Versiyon bilgisi
- TTS hız ayarı

### 7. **Notifications**
- Bildirim ekranı
- Modal bildirimler

---

## Kod Kuralları

### Component Yazım
- **Functional components** kullan (hooks ile)
- **PascalCase:** Component dosya isimleri (`HomeScreen.js`)
- **camelCase:** Function ve değişken isimleri

### State Management
- Redux Toolkit'in **createSlice** pattern'ini kullan
- Async işlemler için **createAsyncThunk** kullan
- Persist edilecek state'leri `whitelist` ile belirt

### Navigation
- **Native Stack** ana navigation için
- **Bottom Tabs** ana ekranlar için
- Screen props: `navigation`, `route`

### API Calls
- **Axios instance** kullan (`src/config/api.js`)
- API çağrıları service layer'da olmalı
- Error handling her zaman yapılmalı
- Loading state'leri kullan

### Styling
- **Inline styles** veya StyleSheet kullan
- Themed components kullan (`ThemedText`, `ThemedIcon`)
- Linear gradient, blur gibi Expo bileşenleri tercih et

### Icon Kullanımı
- **SVG icons:** `SvgIcon` component + `svgIcons.json`
- **Vector icons:** `ThemedIcon` component + `@expo/vector-icons`
- Icon mapping: `iconMap.js`

### Audio/Media
- **Expo Audio** kullan (react-native-sound değil)
- Ses izinleri kontrol et
- Cleanup (unload) her zaman yap

### Error Handling
- Try-catch blokları kullan
- User-friendly error mesajları
- Modal ile hata göster (InfoModal, ConfirmModal)

---

## NPM Scripts

```bash
npm start          # Expo dev server başlat
npm run android    # Android'de çalıştır
npm run ios        # iOS'ta çalıştır (iPhone 16)
npm run web        # Web'de çalıştır
npm run lint       # ESLint kontrolü
```

---

## Development Workflow

### Branch Strategy
- **master:** Ana branch (production ready)
- Commit mesajları Türkçe
- Co-Authored-By: Claude Sonnet 4.5 ile commit

### Testing Device
- **iPhone 16** (fiziksel cihaz)
- iOS native build: `npm run ios --device "iPhone 16"`

### Common Tasks

**API değişiklikleri:**
1. `src/config/api.js` → Endpoint ekle/güncelle
2. Service layer → API call fonksiyonu
3. Redux slice → Async thunk oluştur
4. Component → useDispatch ile çağır

**Yeni ekran ekleme:**
1. `src/screens/` → Screen component oluştur
2. `src/navigation/AppNavigator.js` → Route ekle
3. Navigation props kullan (`navigation`, `route`)

**Yeni icon ekleme:**
1. SVG için: `src/constants/svgIcons.json` → SVG path ekle
2. Vector icon için: `ThemedIcon` ile kullan
3. Mapping: `src/constants/iconMap.js` → Mapping ekle

**Redux state ekleme:**
1. `src/store/slices/` → Yeni slice oluştur
2. `src/store/index.js` → Slice'ı import et ve reducer'a ekle
3. Persist config ekle (gerekirse)

---

## Önemli Notlar

### Cache Mekanizması
- Assignments cache edilir (`assignmentSlice`)
- Cache timestamp ile kontrol edilir
- Offline-first yaklaşım

### Token Security
- Access token: AsyncStorage (persist)
- Refresh token: AsyncStorage (persist)
- Secure Store kullanımı önerilir (gelecek)

### Performance
- Lazy loading kullan
- FlatList için `keyExtractor`, `getItemLayout` optimize et
- Image için Expo Image kullan (fast cache)
- Reanimated 2 için worklet kullan

### Audio Permissions
- iOS: `Info.plist` mikrophone izni
- Android: `AndroidManifest.xml` RECORD_AUDIO izni

### Network Durumu
- NetInfo ile online/offline kontrolü
- Offline durumda cache'ten göster
- Reconnection stratejisi

---

## Yakın Zamandaki Değişiklikler

*Git status'tan:*
- ✅ Profil ekranına versiyon bilgisi eklendi
- ✅ Logo ve ana ekran görselleri güncellendi
- ✅ TestFlight için production ayarlandı
- ✅ Filtre seçenekleri, cache mekanizması, yeni ikonlar eklendi
- ✅ Modal komponentleri ortak hale getirildi
- ✅ Task silme özelliği eklendi
- ✅ Senaryo rapor ekranı oluşturuldu (`ScenarioReportScreen.js`)
- ✅ Settings slice eklendi (`settingsSlice.js`)

---

## Troubleshooting

### iOS Build Hataları
```bash
# Pods temizle
cd ios && pod deintegrate && pod install
```

### Metro Cache Temizle
```bash
npm start -- --reset-cache
```

### AsyncStorage Temizle
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.clear();
```

### Token Refresh Sorunları
- `src/config/api.js` interceptor kontrol et
- Token timestamp doğru mu?
- Refresh token valid mi?

---

## İletişim & Dokümantasyon

- **API Dokümantasyon:** Backend takımından talep et
- **Design System:** Figma (varsa)
- **Git:** master branch üzerinde geliştirme

---

## TODO / Gelecek Geliştirmeler

- [ ] TypeScript entegrasyonu (`.ts`, `.tsx`)
- [ ] Unit test (Jest + React Native Testing Library)
- [ ] E2E test (Detox)
- [ ] Push notification (Expo Notifications)
- [ ] Analytics (Firebase/Amplitude)
- [ ] Error tracking (Sentry)
- [ ] Secure token storage (SecureStore migration)
- [ ] Dark mode desteği
- [ ] i18n (çoklu dil desteği)
- [ ] Accessibility (a11y) iyileştirmeleri

---

*Son güncelleme: 2026-02-06*

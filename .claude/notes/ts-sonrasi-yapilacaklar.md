# TS dönüşümü sonrası yapılacaklar

JS → TS dönüşümü (`ts/sdk57` branch'i) sırasında bulunan, dönüşümü davranış değiştirmeden bitirmek için
bilerek dokunulmayan konular. Kullanıcı 2026-09-27'de "dönüşümden sonra bakalım" dedi.

## 1. Şifreler düz metin saklanıyordu (güvenlik) — düzeltildi: `fix/secure-credentials`

- Eskiden `user_credentials` (biyometrik giriş) ve `last_login_credentials` (son giriş; Profil'den biyometrik
  sonradan açılınca kullanılıyor) AsyncStorage'a düz metin yazılıyordu.
- Artık ikisi de `BiometricAuthService` üzerinden `expo-secure-store`'da (Keychain/Keystore) tutuluyor.
  `ensureCredentialStorageReady()` açılışta eski kayıtları taşıyor; iOS Keychain yeniden kurulumda silinmediği için
  `secure_credentials_ready` işareti yoksa ve eski kayıt da yoksa Keychain artığı temizleniyor.
- Kalan: Redux `authSlice` `accessToken`/`refreshToken`'ı redux-persist ile AsyncStorage'da tutuyor (düz metin).
  Şifre kadar kritik değil ama refresh token uzun ömürlü; SecureStore tabanlı bir persist storage'a taşınabilir.

## 2. Görev sıralaması çalışmıyor

- `HomeScreen` ("Last Assignments") ve `AssignmentsScreen` görevleri `dueDate`'e göre sıralıyor.
  `transformTaskToAssignment` bu alanı üretmediği için tüm tarihler 0 çıkıyor ve sıralama etkisiz;
  liste API sırasında kalıyor.
- TS'te geçici olarak `AssignmentWithDueDate` tipiyle (`src/types/assignment.ts`) mevcut davranış korundu.
- Kod yorumuna göre niyet "en eski önce". Kartlarda gösterilen `startDate`'e göre sıralamak
  kullanıcıların gördüğü sırayı değiştirir, karar verilmeli. Düzeltilince `AssignmentWithDueDate` kaldırılmalı.

## 3. Completed filtresindeki Reset eski filtrelerle yükleniyor

- `CompletedScreen` → `resetFilters` state'leri (`selectedSubTaskTypes`, `completionDate`) sıfırlıyor ama
  hemen ardından çağırdığı `fetchCompletedExercises` eski closure'daki filtreleri kullanıyor. Liste bir sonraki
  yenilemeye kadar eski filtrelerle kalıyor.
- Çözüm: `fetchCompletedExercises`'e filtreleri parametre olarak geçmek (veya focus'taki gibi ref kullanmak).

## 4. Diğer küçük işler

- `SpeechOnScenarioStep2Screen` Retry butonu var olmayan `refresh` ikonunu kullanıyor, buton ikonsuz görünüyor.
  `src/constants/svgIcons.json`'a SVG eklenmeli.
- `src/utils/` altında kullanılmayan export'lar: `handleLogout`, `cleanHtmlAndBreaks`, `clearAllAppData`,
  `MICROPHONE_KEY`. `BIOMETRIC_PROMPT_SHOWN_KEY` `LoginScreen`'de ayrıca tanımlı.
- `speakSlice`'ın hiçbir action'ı dispatch edilmiyor ama `speakResults`/`currentAssignment` persist ediliyor.
  Kaldırılabilir; AsyncStorage'daki `persist:speak` anahtarı da temizlenmeli.
- `AssignmentsScreen`'deki `'Completed'` filtre dalı ölü kod.

## 5. Tablet rotasyonu (yapılıyor: `feature/tablet-rotation`)

iPad ve Android tablette dönme kilidi kaldırılacak, telefonlar portre kalacak. Ekran dönüşümünden sonra
ayrı branch'te (ör. `feature/tablet-rotation`) yapılacak. Ayrıntılar Claude hafızasında (`project_tablet_rotation`).

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

## 2. Görev sıralaması çalışmıyordu — düzeltildi: `fix/assignment-sorting`

- Home ("Last Assignments") ve Assignments `dueDate`'e göre sıralıyordu ama `transformTaskToAssignment` bu alanı
  karta taşımıyordu; sıralama etkisizdi (API sırası).
- Kullanıcı kararı (2026-09-27): teslim tarihi en yakın önce; teslim tarihi olmayanlar sonda, kendi aralarında
  başlangıç tarihi en yeni önce. `Assignment.dueDate` eklendi, karşılaştırma `compareAssignmentsByDueDate`
  (`src/utils/assignmentTransform.ts`). Önbellekteki eski kartlar için `originalTask.dueDate`'e düşülür.

## 3. Completed filtresindeki Reset eski filtrelerle yükleniyor

- `CompletedScreen` → `resetFilters` state'leri (`selectedSubTaskTypes`, `completionDate`) sıfırlıyor ama
  hemen ardından çağırdığı `fetchCompletedExercises` eski closure'daki filtreleri kullanıyor. Liste bir sonraki
  yenilemeye kadar eski filtrelerle kalıyor.
- Çözüm: `fetchCompletedExercises`'e filtreleri parametre olarak geçmek (veya focus'taki gibi ref kullanmak).

## 4. Küçük temizlikler — yapıldı: `chore/cleanup`

- `refresh` ikonu `svgIcons.json`/`iconMap.tsx`'e eklendi, senaryo sohbetindeki Retry butonunda artık görünüyor.
- Kullanılmayan kod silindi: `handleLogout`, `cleanHtmlAndBreaks`, `clearAllAppData`, `MICROPHONE_KEY`,
  `helpers.ts`'teki `USER_CREDENTIALS_KEY`; `BIOMETRIC_PROMPT_SHOWN_KEY` artık tek yerde (`helpers.ts`).
- `speakSlice` kaldırıldı; eski `persist:speak` kaydı açılışta AsyncStorage'dan siliniyor.
- `AssignmentsScreen`'deki ölü `'Completed'` dalı, stilleri ve yalnızca onun kullandığı `banner0.png` silindi.

## 5. Tablet rotasyonu (yapılıyor: `feature/tablet-rotation`)

iPad ve Android tablette dönme kilidi kaldırılacak, telefonlar portre kalacak. Ekran dönüşümünden sonra
ayrı branch'te (ör. `feature/tablet-rotation`) yapılacak. Ayrıntılar Claude hafızasında (`project_tablet_rotation`).

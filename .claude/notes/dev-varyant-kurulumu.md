# Dev varyantı kurulumu (store ve dev sürümü aynı cihazda)

BoostifySpeak'te 2026-10-23'te kuruldu (commit `3c17c5e` ve `b911dd7`). boostifywrite (BW) ve boostifyexam (BE)
için aynı tarif uygulanacak; o projelere geçildiğinde bu dosya referans verilir.

## Amaç

- Yerelde kurulan build, App Store / Google Play'deki sürümün **üzerine yazılmasın**, yanına ayrı uygulama olarak kurulsun.
- Dev sürümü ana ekranda ayırt edilsin (ad + ikon), ama dev ikonları elle ikinci kez tasarlanmasın.
- Geliştirici araçları (reset, kayıt silme vb.) store build'inde görünmesin.
- Store/TestFlight build'leri **yalnızca EAS `production` profiliyle** alınır; yerel ayarlar onları etkilemez.

## Parçalar

### 1. `app.config.js` — varyanta göre kimlik

```js
const IS_DEV = process.env.APP_VARIANT === 'development';
// name: IS_DEV ? "<Ad> DEV" : "<Ad>"
// ios.bundleIdentifier / android.package: IS_DEV ? "<id>.dev" : "<id>"
// icon / ios.icon {light, dark} / android.adaptiveIcon.foregroundImage: IS_DEV ? "*-dev.png" : "*.png"
// extra.appVariant: IS_DEV ? "development" : "production"   // çalışma anında okunur
```

- `app.json` statik olduğu için env okuyamaz → **`app.config.js`'e çevrilmeli** (BW şu an `app.json`). İkisi birlikte olmasın.
- Splash her iki varyantta **aynı** (dev splash gereksiz, kaldırıldı). `expo-splash-screen` plugin'i:
  `{ image, resizeMode: "cover", backgroundColor, enableFullScreenImage_legacy: true }`. Görsel 1242×2436 civarı,
  logo ortada (tablet yatayda üst/alt kırpılır). `enableFullScreenImage_legacy` yalnızca iOS'u etkiler.
- Eski kök `splash` anahtarı ve `adaptiveIcon.background` (doğrusu `backgroundColor`) BS'de yanlış yazılmıştı, sessizce yok sayılıyordu — kontrol et.

### 2. `eas.json`

`development` profilinde `"env": { "APP_VARIANT": "development" }`. `production`'da env yok.

### 3. `package.json` script'leri

```json
"start": "APP_VARIANT=development expo start",
"ios": "APP_VARIANT=development expo run:ios --device \"<cihaz>\"",
"android": "APP_VARIANT=development expo run:android",
"prebuild:dev": "APP_VARIANT=development expo prebuild",
"icons:dev": "node scripts/generate-dev-icons.js"
```

- Script adı `prebuild` **olmamalı**: npm bunu `build` öncesi hook sayar → `prebuild:dev`.
- `npx expo prebuild`'i script dışında çıplak çalıştırma: prod varyantı üretir, store uygulamasının üzerine kurulur.
- Dev adıyla prebuild olunca iOS projesi `ios/<Ad>DEV.xcworkspace` adını alır (Expo adı `name`'den türetir) —
  CLAUDE.md'deki workspace yolunu güncelle.
- Prebuild sonrası: Xcode'da Signing Team seç (otomatik imzalama `.dev` App ID'sini kaydeder),
  `xattr -w com.dropbox.ignored 1 ios android` (proje Dropbox'ta), gerekirse `cd ios && pod install`.

- İlk prebuild sonrası Xcode build'i Swift sürüm hatası verirse (JSI xcframework önbelleği): CLAUDE.md'deki
  "Xcode/Swift güncellemesi sonrası build hatası" maddesi. `node_modules` her projede ayrı olduğu için BW/BE'de de
  aynı temizlik gerekebilir. Xcode'un Node'u `ios/.xcode.env.local` → Node 22 olmalı (eski Node ile script phase'ler düşer).

### 4. Dev ikonlarını üretme — `scripts/generate-dev-icons.js`

- `assets/images/dev-badge.png` (367×172, şeffaf, sarı `#FFE100` zemin + siyah "DEV", köşe yarıçapı 30) normal
  ikonların üzerine `pngjs` ile alfa karışımıyla bindirilir. `pngjs` devDependency olarak eklenir.
- Konumlar 1024×1024'e göre: iOS açık/koyu → (327, 694) altta; Android adaptive → (327, 427) ortada (maske kenarları kırpar).
- Koyu ikonda badge parlaklığı 0.66 (Figma'daki koyu tasarımla eşleşiyor).
- BS'ten `scripts/generate-dev-icons.js` ve `assets/images/dev-badge.png` aynen kopyalanabilir; yalnızca
  `TARGETS` içindeki dosya adlarını o projenin ikon adlarına göre düzelt. Logo yerleşimi farklıysa badge
  konumunu ikonla bakarak ayarla.
- Normal ikon değişince: `npm run icons:dev` → `npm run prebuild:dev`.

### 5. Dev araçlarını gizleme — `src/config/env.ts`

```ts
import Constants from 'expo-constants';
export const IS_DEV_MODE: boolean =
  __DEV__ || Constants.expoConfig?.extra?.appVariant === 'development';
```

Reset / silme gibi butonlar `IS_DEV_MODE && (...)` ile sarılır; prop ile verilen aksiyonlarda (ör. kartın `onDelete`'i)
prop `undefined` geçilir, component prop yoksa butonu çizmez.

## Diğer projelerdeki durum (2026-10-23 itibarıyla)

| | BW (boostifywrite) | BE (boostifyexam) |
|---|---|---|
| Config | `app.json` → `app.config.js`'e çevrilmeli | `app.config.js` var, `IS_DEV` ile `.dev` bundle id zaten kurulu |
| Script'ler | `ios`/`android` = `expo start --ios` (Expo Go tarzı), APP_VARIANT yok | `ios` = `expo run:ios --device <udid>`, APP_VARIANT yok |
| Dev ikonları | yok | kontrol et |
| Splash | plugin + full-screen legacy (BS buradan örnek alındı) | kontrol et |

## İlgili

- Öğrenci olmayan hesapların girişini engelleme BS'te `authService.login` içinde (`NotStudentError`) + persist edilmiş
  oturum için `app/(tabs)/_layout.tsx`'te. BW'da login'de kontrol zaten var.

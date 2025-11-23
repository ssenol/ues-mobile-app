## Icon Migration Roadmap

- [ ] **Asset inventory**: Eksik olan bütün ikon görsellerini `assets/images/` altına PNG olarak ekle (ör. `iconMic`, `iconStop`, `iconPlay`, `iconArrowRight`, `iconPower`, `iconTrash`, `iconChart`, `iconInfo`, `iconClose`, vb.).
- [ ] **`iconMap.js`'i güncelle**: Her yeni ikon için `icons` sözlüğüne anahtar ekle (`mic`, `stop`, `arrowRight`, `power`, `trash`, `play`, `volume`, `chart`, `info`, `close`, vb.) ve isimlendirmeyi kodla eşleştir.
- [ ] **Bileşen refaktörü**: Tüm `Icon` bileşeni kullanımlarını `ThemedIcon` + `iconName` yapısına taşı (ör. kayıt butonları, rapor ekranları, ayarlar, menü kartları).
- [ ] **`Icon` bileşenini kaldır**: Referanslar temizlendikten sonra `src/components/Icon.js` dosyasını sil ve `@expo/vector-icons`, `expo-symbols` gibi bağımlılıkları `package.json` üzerinden kaldır.
- [ ] **Regresyon testi**: İkon kullanılan tüm ekranlarda görsellerin doğru yüklendiğini fiziksel cihazda/dev client üzerinde doğrula.


// Android 16 (targetSdk 36), büyük ekranlarda (sw >= 600dp, tabletler) android:screenOrientation ve
// resizeableActivity kısıtlamalarını yok sayıyor: tablette uygulama yatay dönüyor.
// Bu property ile bu davranıştan geçici olarak muaf olunur. Muafiyet sadece targetSdk 36'da geçerli,
// targetSdk 37 (Android 17) ile kaldırılacak; o noktada yatay yerleşim desteklenmeli.
// https://developer.android.com/about/versions/16/behavior-changes-16#adaptive-layouts

const { withAndroidManifest } = require('expo/config-plugins');

const PROPERTY = 'android.window.PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY';

module.exports = function withAllowRestrictedResizability(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) {
      throw new Error('withAllowRestrictedResizability: AndroidManifest içinde <application> bulunamadı');
    }
    app.property = (app.property ?? []).filter((p) => p.$['android:name'] !== PROPERTY);
    app.property.push({ $: { 'android:name': PROPERTY, 'android:value': 'true' } });
    return cfg;
  });
};

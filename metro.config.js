const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Kökteki ios/ ve android/ (prebuild çıktısı) izlenmez: Xcode ve Dropbox buradaki dosyalara
// sürekli dokunuyor, Metro da her seferinde "Refreshing..." ile HMR güncellemesi gönderiyor.
const escape = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nativeDirs = ['ios', 'android'].map(
  (dir) => new RegExp(`^${escape(path.join(__dirname, dir))}[\\\\/].*`),
);

config.resolver.blockList = [...[].concat(config.resolver.blockList ?? []), ...nativeDirs];

module.exports = config;

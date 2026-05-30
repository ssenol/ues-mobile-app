const { withAppDelegate } = require('@expo/config-plugins');

const withOrientationLock = (config) => {
  return withAppDelegate(config, (config) => {
    const appDelegate = config.modResults.contents;

    // Portrait-only lock ekle
    const orientationLockCode = `
- (UIInterfaceOrientationMask)application:(UIApplication *)application supportedInterfaceOrientationsForWindow:(UIWindow *)window {
  // iPad için portrait-only
  if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
    return UIInterfaceOrientationMaskPortrait;
  }
  // iPhone için portrait-only
  return UIInterfaceOrientationMaskPortrait;
}
`;

    // @end'den önce ekle
    if (!appDelegate.includes('supportedInterfaceOrientationsForWindow')) {
      config.modResults.contents = appDelegate.replace(
        /@end/,
        `${orientationLockCode}\n@end`
      );
    }

    return config;
  });
};

module.exports = withOrientationLock;

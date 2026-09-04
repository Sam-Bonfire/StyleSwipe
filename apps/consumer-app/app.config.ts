import { ConfigContext, ExpoConfig } from 'expo/config';

const appVersion = process.env.APP_VERSION || '1.0.0';
const buildNumber = process.env.GITHUB_RUN_NUMBER || '1';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "StyleSwipe",
  slug: "consumer-app",
  version: appVersion,
  scheme: "styleswipe",
  orientation: "portrait",
  icon: "../../assets/favicon/favicon.png",
  userInterfaceStyle: "light",
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    ...config.ios,
    icon: "../../assets/favicon/favicon.png",
    supportsTablet: true,
    bundleIdentifier: "com.styleswipe.app",
    buildNumber: buildNumber,
    associatedDomains: ['applinks:styleswipe.app', 'applinks:www.styleswipe.app'],
  },
  android: {
    ...config.android,
    adaptiveIcon: {
      foregroundImage: "../../assets/favicon/favicon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.styleswipe.app",
    versionCode: parseInt(buildNumber, 10),
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          { scheme: 'https', host: 'styleswipe.app' },
          { scheme: 'https', host: 'www.styleswipe.app' },
          { scheme: 'styleswipe' },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    ...config.web,
    favicon: "../../assets/favicon/favicon.png",
    output: "static",
    bundler: "metro"
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        icon: "../../assets/favicon/favicon.png",
        color: "#ffffff",
        sounds: [],
      },
    ],
  ]
});

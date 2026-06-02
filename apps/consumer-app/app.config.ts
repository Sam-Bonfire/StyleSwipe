import { ConfigContext, ExpoConfig } from 'expo/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const packageJson = require('./package.json');

const buildNumber = process.env.GITHUB_RUN_NUMBER || '1';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "StyleSwipe",
  slug: "consumer-app",
  version: packageJson.version,
  scheme: "styleswipe",
  orientation: "portrait",
  icon: "../../assets/favicon/favicon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    ...config.ios,
    icon: "../../assets/favicon/favicon.png",
    supportsTablet: true,
    bundleIdentifier: "com.styleswipe.app",
    buildNumber: buildNumber,
  },
  android: {
    ...config.android,
    adaptiveIcon: {
      foregroundImage: "../../assets/favicon/favicon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.styleswipe.app",
    versionCode: parseInt(buildNumber, 10),
  },
  web: {
    ...config.web,
    favicon: "../../assets/favicon/favicon.png",
    output: "static",
    bundler: "metro"
  },
  plugins: [
    "expo-router"
  ]
});

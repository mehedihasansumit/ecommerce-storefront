import type { ExpoConfig, ConfigContext } from "expo/config";

// White-label env vars — set per build profile in eas.json
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const STORE_DOMAIN = process.env.EXPO_PUBLIC_STORE_DOMAIN ?? "";
const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME ?? "mobile-app";
const APP_SLUG = process.env.EXPO_PUBLIC_APP_SLUG ?? "mobile-app";
const APP_SCHEME = process.env.EXPO_PUBLIC_APP_SCHEME ?? "mobile-app";
const BUNDLE_ID = process.env.EXPO_PUBLIC_BUNDLE_ID ?? "com.mycompany.mobileapp";
const PACKAGE_NAME = process.env.EXPO_PUBLIC_PACKAGE_NAME ?? "com.mycompany.mobileapp";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: APP_SCHEME,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic", // supports dark mode
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID,
  },
  android: {
    package: PACKAGE_NAME,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png",
  },
  extra: {
    apiBaseUrl: API_BASE_URL,
    storeDomain: STORE_DOMAIN,
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? "",
    },
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#ffffff",
      },
    ],
  ],
});

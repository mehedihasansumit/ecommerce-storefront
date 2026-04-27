import { Platform } from "react-native";
import Constants from "expo-constants";
import { apiClient } from "@/api/client";

const isExpoGo = Constants.executionEnvironment === "storeClient";

if (!isExpoGo) {
  const Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) return null;
  try {
    const Notifications = require("expo-notifications");
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    return (await Notifications.getExpoPushTokenAsync()).data;
  } catch {
    return null;
  }
}

export async function savePushTokenToServer(token: string): Promise<void> {
  try {
    await apiClient.post("/api/notifications/push-token", { token, platform: Platform.OS });
  } catch {}
}

export function addNotificationReceivedListener(handler: (n: any) => void) {
  if (isExpoGo) return { remove: () => {} };
  try {
    return require("expo-notifications").addNotificationReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
}

export function addNotificationResponseListener(handler: (r: any) => void) {
  if (isExpoGo) return { remove: () => {} };
  try {
    return require("expo-notifications").addNotificationResponseReceivedListener(handler);
  } catch {
    return { remove: () => {} };
  }
}

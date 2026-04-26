import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/store/auth.store";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { ThemeProvider } from "@/context/ThemeContext";
import { getMe } from "@/api/auth";
import {
  registerForPushNotifications,
  savePushTokenToServer,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from "@/lib/pushNotifications";

// Refetch on app focus (background → foreground)
AppState.addEventListener("change", (status: AppStateStatus) => {
  focusManager.setFocused(status === "active");
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 min fresh
      gcTime: 1000 * 60 * 60 * 24,   // 24h — keep cache for offline
      retry: 1,
      networkMode: "offlineFirst",    // show cached data instantly, refetch in bg
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const setUser = useAuthStore((s) => s.setUser);
  const token = useAuthStore((s) => s.token);
  const hydrateTenant = useTenantStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  const notifReceivedSub = useRef<any>(null);
  const notifResponseSub = useRef<any>(null);

  useEffect(() => {
    hydrateTenant();
    hydrateSettings();
    hydrateAuth();
  }, []);

  // Auto-login: verify token with server after hydration
  useEffect(() => {
    if (token) {
      getMe().then((user) => {
        if (user) setUser(user);
      });
    }
  }, [token]);

  // Push notifications: register + listen after auth
  useEffect(() => {
    if (!token) return;

    registerForPushNotifications().then((pushToken) => {
      if (pushToken) savePushTokenToServer(pushToken);
    });

    notifReceivedSub.current = addNotificationReceivedListener((notification) => {
      // Invalidate unread count so badge updates
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    });

    notifResponseSub.current = addNotificationResponseListener((response) => {
      // Navigate based on notification data
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.orderId) {
        // router.push is not accessible here — handled in tab navigator
      }
    });

    return () => {
      notifReceivedSub.current?.remove();
      notifResponseSub.current?.remove();
    };
  }, [token]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding/store-select" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="products/[slug]"
                options={{ headerShown: true, title: "" }}
              />
              <Stack.Screen
                name="orders/[id]"
                options={{ headerShown: true, title: "Order Detail" }}
              />
              <Stack.Screen
                name="checkout/index"
                options={{ headerShown: true, title: "Checkout" }}
              />
              <Stack.Screen
                name="account/addresses"
                options={{ headerShown: true, title: "My Addresses" }}
              />
              <Stack.Screen
                name="account/address-form"
                options={{ headerShown: true, title: "Add Address" }}
              />
              <Stack.Screen
                name="account/notifications"
                options={{ headerShown: true, title: "Notifications" }}
              />
              <Stack.Screen
                name="search"
                options={{ headerShown: false, presentation: "fullScreenModal" }}
              />
            </Stack>
            <Toast />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

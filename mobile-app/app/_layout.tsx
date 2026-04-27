import { useEffect, useRef } from "react";
import { AppState, View, Text, StyleSheet, type AppStateStatus } from "react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast, { type ToastConfig } from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
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

const toastConfig: ToastConfig = {
  success: ({ text1, text2, onPress }) => (
    <View style={toastStyles.wrap} accessible accessibilityRole="alert">
      <View style={[toastStyles.icon, { backgroundColor: "#22C55E18" }]}>
        <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
      </View>
      <View style={toastStyles.body}>
        <Text style={toastStyles.title} numberOfLines={1}>{text1}</Text>
        {!!text2 && <Text style={toastStyles.sub} numberOfLines={1}>{text2}</Text>}
        {!!onPress && <Text style={toastStyles.hint}>Tap to view cart →</Text>}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={toastStyles.wrap} accessible accessibilityRole="alert">
      <View style={[toastStyles.icon, { backgroundColor: "#EF444418" }]}>
        <Ionicons name="alert-circle" size={22} color="#EF4444" />
      </View>
      <View style={toastStyles.body}>
        <Text style={toastStyles.title} numberOfLines={1}>{text1}</Text>
        {!!text2 && <Text style={toastStyles.sub} numberOfLines={2}>{text2}</Text>}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={toastStyles.wrap} accessible accessibilityRole="alert">
      <View style={[toastStyles.icon, { backgroundColor: "#3B82F618" }]}>
        <Ionicons name="information-circle" size={22} color="#3B82F6" />
      </View>
      <View style={toastStyles.body}>
        <Text style={toastStyles.title} numberOfLines={1}>{text1}</Text>
        {!!text2 && <Text style={toastStyles.sub} numberOfLines={2}>{text2}</Text>}
      </View>
    </View>
  ),
};

const toastStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6B7280" },
  hint: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
});

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
    Promise.all([hydrateTenant(), hydrateSettings(), hydrateAuth()]);
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
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="products/[slug]"
                options={{ headerShown: false }}
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
            <Toast config={toastConfig} position="top" topOffset={56} visibilityTime={2500} />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

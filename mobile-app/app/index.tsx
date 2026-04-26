import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useTenantStore } from "@/store/tenant.store";
import { useAuthStore } from "@/store/auth.store";
import { BAKED_STORE_DOMAIN } from "@/config/env";

export default function Index() {
  const store = useTenantStore((s) => s.store);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!store) {
    return <Redirect href="/onboarding/store-select" />;
  }

  return <Redirect href="/(tabs)" />;
}

import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useTenantStore } from "@/store/tenant.store";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { resolveStore } from "@/api/stores";
import { BAKED_STORE_DOMAIN } from "@/config/env";

export default function Index() {
  const store = useTenantStore((s) => s.store);
  const setStore = useTenantStore((s) => s.setStore);
  const initCart = useCartStore((s) => s.initForStore);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (store || !BAKED_STORE_DOMAIN) return;
    setResolving(true);
    resolveStore(BAKED_STORE_DOMAIN)
      .then((resolved) => {
        setStore(resolved, BAKED_STORE_DOMAIN);
        initCart(resolved._id);
      })
      .catch((err) => setError(` ${err.message} Could not connect to store "${BAKED_STORE_DOMAIN}"`))
      .finally(() => setResolving(false));
  }, []);

  if (!BAKED_STORE_DOMAIN) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Misconfigured Build</Text>
        <Text style={styles.errorText}>EXPO_PUBLIC_STORE_DOMAIN is not set.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Connection Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (isLoading || resolving || !store) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32, backgroundColor: "#fff" },
  loadingText: { fontSize: 14, color: "#6B7280" },
  errorTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  errorText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
});

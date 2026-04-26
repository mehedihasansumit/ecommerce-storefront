import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTenantStore } from "@/store/tenant.store";
import { useCartStore } from "@/store/cart.store";
import { resolveStore } from "@/api/stores";
import { BAKED_STORE_DOMAIN } from "@/config/env";

// Example domains shown as quick-connect chips
const EXAMPLE_DOMAINS = ["shirts.localhost", "punjabi.localhost", "shoes.localhost"];

export default function StoreSelectScreen() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setStore = useTenantStore((s) => s.setStore);
  const initCart = useCartStore((s) => s.initForStore);

  // Fade-in animation
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Auto-connect if a domain is baked into the build
    if (BAKED_STORE_DOMAIN) {
      connect(BAKED_STORE_DOMAIN);
    }
  }, []);

  async function connect(targetDomain: string) {
    const trimmed = targetDomain.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    try {
      const store = await resolveStore(trimmed);
      setStore(store, trimmed);
      initCart(store._id);
      router.replace("/(tabs)");
    } catch {
      setError(`Could not find a store at "${trimmed}". Check the domain and try again.`);
    } finally {
      setLoading(false);
    }
  }

  // Auto-connecting — show minimal splash
  if (BAKED_STORE_DOMAIN && loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.splashText}>Loading store…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.content, { opacity }]}>
          {/* Logo / icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="storefront-outline" size={40} color="#3B82F6" />
            </View>
          </View>

          <Text style={styles.title}>Connect to Store</Text>
          <Text style={styles.subtitle}>
            Enter your store's domain to get started
          </Text>

          {/* Domain input */}
          <View style={[styles.inputWrap, error ? styles.inputError : null]}>
            <Ionicons name="globe-outline" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              value={domain}
              onChangeText={(v) => {
                setDomain(v);
                setError("");
              }}
              placeholder="mystore.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={() => connect(domain)}
              editable={!loading}
            />
            {domain.length > 0 && (
              <TouchableOpacity onPress={() => setDomain("")}>
                <Ionicons name="close-circle" size={16} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Connect button */}
          <TouchableOpacity
            style={[styles.button, (loading || !domain.trim()) && styles.buttonDisabled]}
            onPress={() => connect(domain)}
            disabled={loading || !domain.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Connect</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Quick-connect examples */}
          <View style={styles.examplesSection}>
            <Text style={styles.examplesLabel}>Demo stores</Text>
            <View style={styles.examplesRow}>
              {EXAMPLE_DOMAINS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.exampleChip}
                  onPress={() => connect(d)}
                  disabled={loading}
                >
                  <Text style={styles.exampleChipText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  splash: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, backgroundColor: "#fff" },
  splashText: { fontSize: 15, color: "#6B7280" },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
    paddingBottom: 40,
  },
  iconWrap: { alignItems: "center", marginBottom: 8 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "800", color: "#111827", textAlign: "center" },
  subtitle: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: "#F9FAFB",
    marginTop: 8,
  },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  errorText: { fontSize: 13, color: "#EF4444", textAlign: "center" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  examplesSection: { marginTop: 8, gap: 10 },
  examplesLabel: { fontSize: 12, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.6, textAlign: "center" },
  examplesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  exampleChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#EFF6FF",
  },
  exampleChipText: { fontSize: 12, color: "#3B82F6", fontWeight: "600" },
});

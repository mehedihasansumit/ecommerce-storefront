import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router, Link } from "expo-router";
import { useTenantStore } from "@/store/tenant.store";
import { useAuthStore } from "@/store/auth.store";
import { login } from "@/api/auth";

export default function LoginScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const setFullUser = useAuthStore((s) => s.setFullUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      setFullUser(user);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Invalid email or password";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (err?: string) => [
    styles.input,
    err ? styles.inputError : styles.inputNormal,
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={inputStyle(errors.email)}
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {errors.email && <Text style={styles.error}>{errors.email}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={inputStyle(errors.password)}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
              placeholder="••••••••"
              secureTextEntry
            />
            {errors.password && <Text style={styles.error}>{errors.password}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: primaryColor }, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <Link href="/(auth)/register" style={[styles.footerLink, { color: primaryColor }]}>
            Register
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingTop: 16, gap: 24 },
  subtitle: { fontSize: 15, color: "#6B7280" },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  inputNormal: { borderColor: "#E5E7EB", backgroundColor: "#fff" },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  error: { fontSize: 12, color: "#EF4444" },
  btn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  guestBtn: { alignItems: "center", paddingVertical: 8 },
  guestText: { fontSize: 14, color: "#6B7280" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, color: "#6B7280" },
  footerLink: { fontSize: 14, fontWeight: "600" },
});

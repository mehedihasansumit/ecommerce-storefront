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
import { register } from "@/api/auth";
import { normalizePhone } from "@/shared/lib/phone";

interface FormData {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const setFullUser = useAuthStore((s) => s.setFullUser);

  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else {
      const n = normalizePhone(form.phone.trim());
      if (!/^\+880\d{10}$/.test(n)) e.phone = "Enter valid Bangladeshi number (01XXXXXXXXX)";
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Min 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        password: form.password,
      });
      setFullUser(user);
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Registration failed. Try again.";
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  }

  const inp = (err?: string) => [
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
        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.form}>
          {(
            [
              { key: "name", label: "Full Name", placeholder: "Your name", required: true },
              { key: "phone", label: "Phone Number", placeholder: "01XXXXXXXXX", required: true, type: "phone-pad" },
              { key: "email", label: "Email (optional)", placeholder: "email@example.com", type: "email-address" },
              { key: "password", label: "Password", placeholder: "Min 6 characters", secure: true, required: true },
              { key: "confirmPassword", label: "Confirm Password", placeholder: "Repeat password", secure: true, required: true },
            ] as Array<{ key: keyof typeof form; label: string; placeholder: string; required?: boolean; type?: string; secure?: boolean }>
          ).map(({ key, label, placeholder, required, type, secure }) => (
            <View key={key} style={styles.field}>
              <Text style={styles.label}>
                {label}
                {required && <Text style={{ color: "#EF4444" }}> *</Text>}
              </Text>
              <TextInput
                style={inp(errors[key])}
                value={form[key]}
                onChangeText={(v) => set(key, v)}
                placeholder={placeholder}
                keyboardType={(type as any) ?? "default"}
                secureTextEntry={secure}
                autoCapitalize={secure || type === "email-address" ? "none" : "words"}
              />
              {errors[key] && <Text style={styles.error}>{errors[key]}</Text>}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: primaryColor }, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={[styles.footerLink, { color: primaryColor }]}>
            Sign In
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
  form: { gap: 14 },
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
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, color: "#6B7280" },
  footerLink: { fontSize: 14, fontWeight: "600" },
});

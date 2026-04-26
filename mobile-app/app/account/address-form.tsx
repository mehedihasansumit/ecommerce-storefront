import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTenantStore } from "@/store/tenant.store";
import { useAddresses, useCreateAddress, useUpdateAddress } from "@/hooks/useAddresses";
import type { IAddress } from "@/shared/types/auth";

interface FormData {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const INITIAL: FormData = {
  label: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Bangladesh",
  isDefault: false,
};

export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const { data: addresses = [] } = useAddresses();
  const { mutateAsync: createAddr } = useCreateAddress();
  const { mutateAsync: updateAddr } = useUpdateAddress();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const existing = addresses.find((a) => a._id === id);
      if (existing) {
        setForm({
          label: existing.label ?? "",
          street: existing.street,
          city: existing.city,
          state: existing.state ?? "",
          postalCode: existing.postalCode ?? "",
          country: existing.country ?? "Bangladesh",
          isDefault: existing.isDefault,
        });
      }
    }
  }, [id, addresses]);

  function set(key: keyof FormData, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (!form.street.trim()) e.street = "Street address is required";
    if (!form.city.trim()) e.city = "City is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        street: form.street.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim() || "Bangladesh",
        isDefault: form.isDefault,
      };

      if (id) {
        await updateAddr({ id, data: payload });
      } else {
        await createAddr(payload as Omit<IAddress, "_id">);
      }
      router.back();
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to save address";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  }

  const inp = (err?: string) => [
    styles.input,
    err ? styles.inputError : styles.inputNormal,
  ];

  const fields: Array<{
    key: keyof FormData;
    label: string;
    placeholder: string;
    required?: boolean;
  }> = [
    { key: "label", label: "Label (e.g. Home, Office)", placeholder: "Home" },
    { key: "street", label: "Street Address", placeholder: "House #, Road, Area", required: true },
    { key: "city", label: "City", placeholder: "Dhaka", required: true },
    { key: "state", label: "State / Division", placeholder: "Dhaka Division" },
    { key: "postalCode", label: "Postal Code", placeholder: "1234" },
    { key: "country", label: "Country", placeholder: "Bangladesh" },
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
        {fields.map(({ key, label, placeholder, required }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.label}>
              {label}
              {required && <Text style={{ color: "#EF4444" }}> *</Text>}
            </Text>
            <TextInput
              style={inp(errors[key] as string | undefined)}
              value={form[key] as string}
              onChangeText={(v) => set(key, v)}
              placeholder={placeholder}
            />
            {errors[key] && <Text style={styles.error}>{errors[key] as string}</Text>}
          </View>
        ))}

        {/* Default toggle */}
        <TouchableOpacity
          style={styles.defaultRow}
          onPress={() => set("isDefault", !form.isDefault)}
        >
          <View
            style={[
              styles.checkbox,
              form.isDefault && { backgroundColor: primaryColor, borderColor: primaryColor },
            ]}
          >
            {form.isDefault && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
          <Text style={styles.defaultLabel}>Set as default address</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: primaryColor }, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{id ? "Update Address" : "Save Address"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, gap: 14 },
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
  defaultRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  defaultLabel: { fontSize: 15, color: "#374151" },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useCartStore } from "@/store/cart.store";
import { useTenantStore } from "@/store/tenant.store";
import { useAuthStore } from "@/store/auth.store";
import { useAddresses } from "@/hooks/useAddresses";
import { createOrder } from "@/api/orders";
import { normalizePhone } from "@/shared/lib/phone";
import type { IAddress } from "@/shared/types/auth";

interface FormData {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
}

const INITIAL: FormData = {
  name: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  postalCode: "",
  country: "Bangladesh",
  notes: "",
};

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={{ color: "#EF4444" }}> *</Text>}
      </Text>
      {children}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function CheckoutScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const { items, total, subtotal, discount, coupon, clearCart } = useCartStore();
  const fullUser = useAuthStore((s) => s.fullUser);
  const { data: addresses } = useAddresses();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Pre-fill name + phone from logged-in user on mount
  useEffect(() => {
    if (fullUser) {
      setForm((f) => ({
        ...f,
        name: f.name || fullUser.name || "",
        phone: f.phone || fullUser.phone || "",
      }));
    }
  }, [fullUser]);

  function applyAddress(addr: IAddress) {
    setSelectedAddressId(addr._id);
    setForm((f) => ({
      ...f,
      street: addr.street,
      city: addr.city,
      postalCode: addr.postalCode || "",
      country: addr.country || "Bangladesh",
    }));
    setErrors((e) => ({ ...e, street: undefined, city: undefined }));
  }

  function set(key: keyof FormData, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<FormData> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (!/^(\+?880)?0?\d{10}$/.test(form.phone.replace(/[\s\-()]/g, "")))
      errs.phone = "Enter a valid Bangladeshi phone number";
    if (!form.street.trim()) errs.street = "Address is required";
    if (!form.city.trim()) errs.city = "City is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          variantSelections: i.variantSelections,
        })),
        shippingAddress: {
          name: form.name.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          state: "",
          postalCode: form.postalCode.trim(),
          country: form.country.trim() || "Bangladesh",
          phone: normalizePhone(form.phone.trim()),
        },
        paymentMethod: "cod",
        couponCode: coupon?.code,
        notes: form.notes.trim(),
        guestEmail: form.email.trim() || undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearCart();
      router.replace(`/orders/${order._id}?confirmed=1`);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Failed to place order. Please try again.";
      Alert.alert("Order Failed", msg);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = (hasError?: string) => [
    styles.input,
    hasError ? styles.inputError : styles.inputNormal,
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Saved addresses (logged-in users only) */}
          {addresses && addresses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Saved Addresses</Text>
              {addresses.map((addr) => {
                const selected = selectedAddressId === addr._id;
                return (
                  <TouchableOpacity
                    key={addr._id}
                    style={[
                      styles.addrCard,
                      selected && { borderColor: primaryColor, backgroundColor: "#F0F7FF" },
                    ]}
                    onPress={() => applyAddress(addr)}
                  >
                    <View style={styles.addrRadio}>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: selected ? primaryColor : "#D1D5DB" },
                        ]}
                      >
                        {selected && (
                          <View style={[styles.radioInner, { backgroundColor: primaryColor }]} />
                        )}
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addrLabel}>
                        {addr.label}
                        {addr.isDefault ? (
                          <Text style={{ color: primaryColor }}> · Default</Text>
                        ) : null}
                      </Text>
                      <Text style={styles.addrText}>
                        {addr.street}, {addr.city}
                        {addr.postalCode ? ` ${addr.postalCode}` : ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Delivery info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Information</Text>

            <Field label="Full Name" required error={errors.name}>
              <TextInput
                style={inputStyle(errors.name)}
                value={form.name}
                onChangeText={(v) => set("name", v)}
                placeholder="Your full name"
              />
            </Field>

            <Field label="Phone Number" required error={errors.phone}>
              <TextInput
                style={inputStyle(errors.phone)}
                value={form.phone}
                onChangeText={(v) => set("phone", v)}
                placeholder="01XXXXXXXXX"
                keyboardType="phone-pad"
              />
            </Field>

            <Field label="Email (optional)" error={errors.email}>
              <TextInput
                style={inputStyle(errors.email)}
                value={form.email}
                onChangeText={(v) => set("email", v)}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Field>

            <Field label="Address" required error={errors.street}>
              <TextInput
                style={inputStyle(errors.street)}
                value={form.street}
                onChangeText={(v) => set("street", v)}
                placeholder="Street address"
              />
            </Field>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="City" required error={errors.city}>
                  <TextInput
                    style={inputStyle(errors.city)}
                    value={form.city}
                    onChangeText={(v) => set("city", v)}
                    placeholder="Dhaka"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Postal Code" error={errors.postalCode}>
                  <TextInput
                    style={inputStyle(errors.postalCode)}
                    value={form.postalCode}
                    onChangeText={(v) => set("postalCode", v)}
                    placeholder="1234"
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            <Field label="Order Notes (optional)">
              <TextInput
                style={[inputStyle(), { minHeight: 72, textAlignVertical: "top" }]}
                value={form.notes}
                onChangeText={(v) => set("notes", v)}
                placeholder="Special instructions..."
                multiline
              />
            </Field>
          </View>

          {/* Payment method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.paymentOption}>
              <View
                style={[styles.radioOuter, { borderColor: primaryColor }]}
              >
                <View style={[styles.radioInner, { backgroundColor: primaryColor }]} />
              </View>
              <Text style={styles.paymentLabel}>Cash on Delivery</Text>
            </View>
          </View>

          {/* Order summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>৳{subtotal.toLocaleString()}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: "#22C55E" }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: "#22C55E" }]}>
                  -৳{discount.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={[styles.summaryValue, { color: "#22C55E" }]}>Free</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={[styles.totalValue, { color: primaryColor }]}>
                ৳{total.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Place order */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.placeBtn, { backgroundColor: primaryColor }, submitting && styles.disabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.placeBtnText}>Place Order · ৳{total.toLocaleString()}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scroll: { flex: 1 },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  row: { flexDirection: "row", gap: 12 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  fieldError: { fontSize: 12, color: "#EF4444" },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
  },
  inputNormal: { borderColor: "#E5E7EB", backgroundColor: "#fff" },
  inputError: { borderColor: "#EF4444", backgroundColor: "#FFF5F5" },
  addrCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
  },
  addrRadio: { paddingTop: 2 },
  addrLabel: { fontSize: 13, fontWeight: "700", color: "#111827" },
  addrText: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  paymentOption: { flexDirection: "row", alignItems: "center", gap: 10 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  paymentLabel: { fontSize: 14, color: "#111827", fontWeight: "500" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14, color: "#6B7280" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 18, fontWeight: "800" },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  placeBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  placeBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

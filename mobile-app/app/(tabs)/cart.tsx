import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/store/cart.store";
import { useTenantStore } from "@/store/tenant.store";
import { validateCoupon } from "@/api/coupons";
import type { ICartItem } from "@/shared/types/cart";

function CartItemRow({ item }: { item: ICartItem }) {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const variantLabel = Object.entries(item.variantSelections)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return (
    <View style={styles.itemRow}>
      <Image
        source={item.thumbnail}
        style={styles.itemImage}
        contentFit="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
        {variantLabel ? <Text style={styles.itemVariant}>{variantLabel}</Text> : null}
        <Text style={[styles.itemPrice, { color: primaryColor }]}>
          ৳{(item.priceAtAdd * item.quantity).toLocaleString()}
        </Text>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.productId, item.variantSelections, item.quantity - 1)}
          >
            <Ionicons name="remove" size={14} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQuantity(item.productId, item.variantSelections, item.quantity + 1)}
          >
            <Ionicons name="add" size={14} color="#374151" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() =>
              Alert.alert("Remove Item", "Remove this item from cart?", [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => removeItem(item.productId, item.variantSelections) },
              ])
            }
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const { items, subtotal, coupon, discount, total, setCoupon, removeCoupon } = useCartStore();

  const [couponCode, setCouponCode] = useState(coupon?.code ?? "");
  const [couponLoading, setCouponLoading] = useState(false);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponCode.trim(), subtotal);
      if (result.valid) {
        setCoupon({ ...result, code: couponCode.trim() });
        Alert.alert("Coupon Applied", `Discount: ৳${result.discount.toLocaleString()}`);
      } else {
        Alert.alert("Invalid Coupon", result.reason ?? "Coupon not valid.");
      }
    } catch {
      Alert.alert("Error", "Failed to validate coupon.");
    } finally {
      setCouponLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add products to get started</Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: primaryColor }]}
            onPress={() => router.push("/(tabs)/products")}
          >
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Cart ({items.length})</Text>

      <ScrollView style={styles.scroll}>
        {items.map((item, i) => (
          <CartItemRow key={`${item.productId}-${JSON.stringify(item.variantSelections)}-${i}`} item={item} />
        ))}

        {/* Coupon */}
        <View style={styles.couponSection}>
          <Text style={styles.sectionLabel}>Coupon Code</Text>
          {coupon ? (
            <View style={styles.appliedCoupon}>
              <Ionicons name="pricetag" size={16} color="#22C55E" />
              <Text style={styles.appliedCode}>{coupon.code}</Text>
              <Text style={styles.appliedDiscount}>-৳{discount.toLocaleString()}</Text>
              <TouchableOpacity onPress={removeCoupon}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <TextInput
                style={styles.couponInput}
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Enter coupon code"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.couponBtn, { backgroundColor: primaryColor }]}
                onPress={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
              >
                {couponLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.couponBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order summary */}
        <View style={styles.summary}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout button */}
      <SafeAreaView edges={["bottom"]} style={styles.checkoutBar}>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: primaryColor }]}
          onPress={() => router.push("/checkout")}
        >
          <Ionicons name="lock-closed-outline" size={18} color="#fff" />
          <Text style={styles.checkoutBtnText}>Proceed to Checkout · ৳{total.toLocaleString()}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", padding: 20, paddingBottom: 8, backgroundColor: "#fff" },
  scroll: { flex: 1 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  emptySubtitle: { fontSize: 14, color: "#6B7280" },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  shopBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },

  itemRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemImage: { width: 80, height: 80, borderRadius: 8 },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  itemVariant: { fontSize: 12, color: "#6B7280" },
  itemPrice: { fontSize: 15, fontWeight: "700" },
  itemActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  qtyText: { fontSize: 14, fontWeight: "700", color: "#111827", minWidth: 24, textAlign: "center" },
  removeBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },

  couponSection: { margin: 16, backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  couponBtn: {
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
  },
  couponBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  appliedCoupon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0FDF4",
    padding: 10,
    borderRadius: 8,
  },
  appliedCode: { flex: 1, fontSize: 14, fontWeight: "600", color: "#15803D" },
  appliedDiscount: { fontSize: 14, fontWeight: "700", color: "#15803D" },

  summary: { margin: 16, marginTop: 0, backgroundColor: "#fff", borderRadius: 12, padding: 16, gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14, color: "#6B7280" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 18, fontWeight: "800" },

  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  checkoutBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

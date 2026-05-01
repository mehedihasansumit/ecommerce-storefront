import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useCartStore } from "@/store/cart.store";
import { useTheme } from "@/context/ThemeContext";
import { validateCoupon } from "@/api/coupons";
import { resolveImageUrl } from "@/shared/lib/image";
import { EmptyState } from "@/components/ui";
import type { ICartItem } from "@/shared/types/cart";


const SCREEN_WIDTH = Dimensions.get("window").width;
const DELETE_THRESHOLD = 80;

function CartItemRow({ item }: { item: ICartItem }) {
  const theme = useTheme();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const dragX = useRef(new Animated.Value(0)).current;

  const variantLabel = Object.entries(item.variantSelections)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  function handleRemove() {
    removeItem(item.productId, item.variantSelections);
    Toast.show({ type: "success", text1: "Item removed", visibilityTime: 1500 });
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx <= 0) dragX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -DELETE_THRESHOLD) {
          Animated.timing(dragX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(handleRemove);
        } else {
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const deleteOpacity = dragX.interpolate({
    inputRange: [-DELETE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View style={[styles.deleteActionBg, { opacity: deleteOpacity }]}>
        <TouchableOpacity style={styles.deleteAction} onPress={handleRemove} activeOpacity={0.8}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.deleteText}>Remove</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.itemRow,
          { backgroundColor: theme.cardBg, borderBottomColor: theme.border },
          { transform: [{ translateX: dragX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Image source={resolveImageUrl(item.thumbnail)} style={styles.itemImage} contentFit="cover" />
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.textColor }]} numberOfLines={2}>
            {item.productName}
          </Text>
          {variantLabel ? (
            <Text style={[styles.itemVariant, { color: theme.textSecondary }]}>{variantLabel}</Text>
          ) : null}
          <Text style={[styles.itemPrice, { color: theme.primaryColor }]}>
            ৳{(item.priceAtAdd * item.quantity).toLocaleString()}
          </Text>

          <View style={styles.itemActions}>
            <TouchableOpacity
              style={[styles.qtyBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
              onPress={() => updateQuantity(item.productId, item.variantSelections, item.quantity - 1)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="remove" size={18} color={theme.textColor} />
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: theme.textColor }]}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
              onPress={() => updateQuantity(item.productId, item.variantSelections, item.quantity + 1)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="add" size={18} color={theme.textColor} />
            </TouchableOpacity>

            <Text style={[styles.unitPrice, { color: theme.textTertiary }]}>
              ৳{item.priceAtAdd.toLocaleString()} each
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

export default function CartScreen() {
  const theme = useTheme();
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
        Toast.show({ type: "success", text1: "Coupon applied!", text2: `Saved ৳${result.discount.toLocaleString()}` });
      } else {
        Toast.show({ type: "error", text1: "Invalid coupon", text2: result.reason ?? "Coupon not valid." });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to validate coupon." });
    } finally {
      setCouponLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          description="Add products to get started"
          actionLabel="Browse Products"
          onAction={() => router.push("/(tabs)/products")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
      <View style={[styles.titleBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.textColor }]}>
          My Cart
        </Text>
        <View style={[styles.itemCountBadge, { backgroundColor: theme.primaryColor + "18" }]}>
          <Text style={[styles.itemCountText, { color: theme.primaryColor }]}>
            {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
        </View>
      </View>
      <View style={[styles.swipeHintBar, { backgroundColor: theme.surface }]}>
        <Ionicons name="arrow-back-outline" size={12} color={theme.textTertiary} />
        <Text style={[styles.swipeHint, { color: theme.textTertiary }]}>Swipe item to remove</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {items.map((item, i) => (
          <CartItemRow
            key={`${item.productId}-${JSON.stringify(item.variantSelections)}-${i}`}
            item={item}
          />
        ))}

        {/* Coupon */}
        <View style={[styles.couponSection, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionLabel, { color: theme.textColor }]}>Coupon Code</Text>
          {coupon ? (
            <View style={[styles.appliedCoupon, { backgroundColor: theme.success + "18" }]}>
              <Ionicons name="pricetag" size={16} color={theme.success} />
              <Text style={[styles.appliedCode, { color: theme.success }]}>{coupon.code}</Text>
              <Text style={[styles.appliedDiscount, { color: theme.success }]}>
                -৳{discount.toLocaleString()}
              </Text>
              <TouchableOpacity onPress={removeCoupon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={20} color={theme.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponRow}>
              <TextInput
                style={[styles.couponInput, { borderColor: theme.border, color: theme.textColor, backgroundColor: theme.surface }]}
                value={couponCode}
                onChangeText={setCouponCode}
                placeholder="Enter coupon code"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[
                  styles.couponBtn,
                  { backgroundColor: couponCode.trim() ? theme.primaryColor : theme.border },
                ]}
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
        <View style={[styles.summary, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionLabel, { color: theme.textColor }]}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: theme.textColor }]}>
              ৳{subtotal.toLocaleString()}
            </Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: theme.success }]}>
                -৳{discount.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Shipping</Text>
            <Text style={[styles.summaryValue, { color: theme.success }]}>Free</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.textColor }]}>Total</Text>
            <Text style={[styles.totalValue, { color: theme.primaryColor }]}>
              ৳{total.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Checkout button */}
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.checkoutBar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}
      >
        <View style={styles.checkoutRow}>
          <View>
            <Text style={[styles.checkoutLabel, { color: theme.textTertiary }]}>Total</Text>
            <Text style={[styles.checkoutTotal, { color: theme.textColor }]}>৳{total.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, { backgroundColor: theme.primaryColor }]}
            onPress={() => router.push("/checkout")}
          >
            <Ionicons name="lock-closed-outline" size={16} color="#fff" />
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "700" },
  itemCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  itemCountText: { fontSize: 12, fontWeight: "700" },
  swipeHintBar: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 20, paddingVertical: 5 },
  swipeHint: { fontSize: 11 },
  scroll: { flex: 1 },
  itemRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  itemImage: { width: 80, height: 80, borderRadius: 8 },
  itemInfo: { flex: 1, gap: 4 },
  itemName: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  itemVariant: { fontSize: 12 },
  itemPrice: { fontSize: 15, fontWeight: "700" },
  itemActions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontSize: 14, fontWeight: "700", minWidth: 24, textAlign: "center" },
  unitPrice: { fontSize: 11, marginLeft: 4 },

  deleteActionBg: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteAction: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  deleteText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  couponSection: { margin: 16, borderRadius: 12, padding: 16, gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: "600" },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
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
    padding: 12,
    borderRadius: 8,
  },
  appliedCode: { flex: 1, fontSize: 14, fontWeight: "600" },
  appliedDiscount: { fontSize: 14, fontWeight: "700" },

  summary: { margin: 16, marginTop: 0, borderRadius: 12, padding: 16, gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  totalRow: { borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "800" },

  checkoutBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  checkoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  checkoutLabel: { fontSize: 12, fontWeight: "500" },
  checkoutTotal: { fontSize: 20, fontWeight: "800" },
  checkoutBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  checkoutBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

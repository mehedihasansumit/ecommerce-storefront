import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useOrder } from "@/hooks/useOrders";
import { useTenantStore } from "@/store/tenant.store";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/shared/lib/constants";
import type { OrderStatus } from "@/shared/types/order";

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_ICONS: Record<string, string> = {
  pending: "time-outline",
  confirmed: "checkmark-circle-outline",
  processing: "construct-outline",
  shipped: "bicycle-outline",
  delivered: "home-outline",
  cancelled: "close-circle-outline",
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#FEF3C7", text: "#92400E" },
    confirmed: { bg: "#DBEAFE", text: "#1E40AF" },
    processing: { bg: "#EDE9FE", text: "#5B21B6" },
    shipped: { bg: "#CFFAFE", text: "#0E7490" },
    delivered: { bg: "#D1FAE5", text: "#065F46" },
    cancelled: { bg: "#FEE2E2", text: "#991B1B" },
  };
  const c = colors[status] ?? { bg: "#F3F4F6", text: "#374151" };

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>
        {ORDER_STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id, confirmed } = useLocalSearchParams<{ id: string; confirmed?: string }>();
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const currentStep = STATUS_ORDER.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === "cancelled";

  return (
    <ScrollView style={styles.container}>
      {/* Order confirmed banner */}
      {confirmed === "1" && (
        <View style={[styles.confirmedBanner, { backgroundColor: primaryColor }]}>
          <Ionicons name="checkmark-circle" size={32} color="#fff" />
          <View>
            <Text style={styles.confirmedTitle}>Order Placed!</Text>
            <Text style={styles.confirmedSub}>
              Order #{order.orderNumber} confirmed
            </Text>
          </View>
        </View>
      )}

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <StatusBadge status={order.status} />
          </View>
          <Text style={styles.orderDate}>
            {new Date(order.createdAt).toLocaleDateString("en-BD", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Status timeline */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Progress</Text>
            {STATUS_ORDER.map((status, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <View key={status} style={styles.timelineStep}>
                  <View style={styles.timelineLeft}>
                    <View
                      style={[
                        styles.timelineDot,
                        done
                          ? { backgroundColor: primaryColor, borderColor: primaryColor }
                          : { borderColor: "#E5E7EB" },
                      ]}
                    >
                      {done && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                    {i < STATUS_ORDER.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          { backgroundColor: done && i < currentStep ? primaryColor : "#E5E7EB" },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timelineLabel,
                      active && { color: primaryColor, fontWeight: "700" },
                      !done && { color: "#9CA3AF" },
                    ]}
                  >
                    {ORDER_STATUS_LABELS[status]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Items ({order.items.length})</Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.productName}
                </Text>
                {Object.keys(item.variantSelections).length > 0 && (
                  <Text style={styles.itemVariant}>
                    {Object.entries(item.variantSelections)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </Text>
                )}
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={[styles.itemPrice, { color: primaryColor }]}>
                ৳{item.totalPrice.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>৳{order.subtotal.toLocaleString()}</Text>
          </View>
          {order.discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: "#22C55E" }]}>
                Discount {order.couponCode && `(${order.couponCode})`}
              </Text>
              <Text style={[styles.priceValue, { color: "#22C55E" }]}>
                -৳{order.discount.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping</Text>
            <Text style={[styles.priceValue, { color: "#22C55E" }]}>Free</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, { color: primaryColor }]}>
              ৳{order.total.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Shipping address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Address</Text>
          <Text style={styles.addressText}>{order.shippingAddress.name}</Text>
          <Text style={styles.addressText}>{order.shippingAddress.street}</Text>
          <Text style={styles.addressText}>
            {order.shippingAddress.city}
            {order.shippingAddress.postalCode
              ? `, ${order.shippingAddress.postalCode}`
              : ""}
          </Text>
          <Text style={styles.addressText}>{order.shippingAddress.phone}</Text>
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.cardRow}>
            <Text style={styles.priceLabel}>Method</Text>
            <Text style={styles.priceValue}>{order.paymentMethod?.toUpperCase()}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.priceLabel}>Status</Text>
            <Text style={styles.priceValue}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.shopBtn, { borderColor: primaryColor }]}
          onPress={() => router.push("/(tabs)/products")}
        >
          <Text style={[styles.shopBtnText, { color: primaryColor }]}>
            Continue Shopping
          </Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, color: "#9CA3AF" },

  confirmedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    paddingTop: 28,
  },
  confirmedTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  confirmedSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  orderNumber: { fontSize: 18, fontWeight: "700", color: "#111827" },
  orderDate: { fontSize: 13, color: "#6B7280" },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  timelineStep: { flexDirection: "row", alignItems: "flex-start", gap: 12, minHeight: 32 },
  timelineLeft: { alignItems: "center", width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  timelineLine: { width: 2, flex: 1, minHeight: 16, marginTop: 2 },
  timelineLabel: { fontSize: 13, color: "#374151", paddingTop: 2 },

  itemRow: { flexDirection: "row", gap: 10, paddingVertical: 4 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: "600", color: "#111827" },
  itemVariant: { fontSize: 12, color: "#6B7280" },
  itemQty: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "700" },

  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { fontSize: 14, color: "#6B7280" },
  priceValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 18, fontWeight: "800" },

  addressText: { fontSize: 14, color: "#374151", lineHeight: 22 },

  shopBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  shopBtnText: { fontSize: 15, fontWeight: "600" },
});

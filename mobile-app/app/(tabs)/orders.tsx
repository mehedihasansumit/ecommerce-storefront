import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/auth.store";
import { useTenantStore } from "@/store/tenant.store";
import { ORDER_STATUS_LABELS } from "@/shared/lib/constants";
import type { IOrder } from "@/shared/types/order";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  confirmed: { bg: "#DBEAFE", text: "#1E40AF" },
  processing: { bg: "#EDE9FE", text: "#5B21B6" },
  shipped: { bg: "#CFFAFE", text: "#0E7490" },
  delivered: { bg: "#D1FAE5", text: "#065F46" },
  cancelled: { bg: "#FEE2E2", text: "#991B1B" },
};

function OrderCard({ order }: { order: IOrder }) {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const c = STATUS_COLORS[order.status] ?? { bg: "#F3F4F6", text: "#374151" };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/orders/${order._id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <Text style={styles.orderNum}>#{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
          <Text style={[styles.badgeText, { color: c.text }]}>
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Text>
        </View>
      </View>
      <Text style={styles.date}>
        {new Date(order.createdAt).toLocaleDateString("en-BD", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </Text>
      <Text style={styles.itemSummary} numberOfLines={1}>
        {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={[styles.total, { color: primaryColor }]}>
          ৳{order.total.toLocaleString()}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const user = useAuthStore((s) => s.user);
  const { data: orders = [], isLoading } = useOrders();

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Sign in to view orders</Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: primaryColor }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>My Orders</Text>
      {orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: primaryColor }]}
            onPress={() => router.push("/(tabs)/products")}
          >
            <Text style={styles.signInText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(o) => o._id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", padding: 20, paddingBottom: 8, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyTitle: { fontSize: 16, color: "#6B7280" },
  signInBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  signInText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNum: { fontSize: 15, fontWeight: "700", color: "#111827" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  date: { fontSize: 12, color: "#9CA3AF" },
  itemSummary: { fontSize: 13, color: "#6B7280" },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  total: { fontSize: 16, fontWeight: "800" },
});

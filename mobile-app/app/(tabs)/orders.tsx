import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useOrders } from "@/hooks/useOrders";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/context/ThemeContext";
import { useSettingsStore } from "@/store/settings.store";
import { SkeletonOrderRow } from "@/components/ui/Skeleton";
import { ORDER_STATUS_LABELS } from "@/shared/lib/constants";
import type { IOrder } from "@/shared/types/order";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function getStatusColor(
  status: string,
  theme: ReturnType<typeof useTheme>
): { bg: string; text: string } {
  switch (status) {
    case "pending":    return { bg: "#FEF3C7", text: "#92400E" };
    case "confirmed":  return { bg: "#DBEAFE", text: "#1E40AF" };
    case "processing": return { bg: "#EDE9FE", text: "#5B21B6" };
    case "shipped":    return { bg: "#CFFAFE", text: "#0E7490" };
    case "delivered":  return { bg: theme.success + "22", text: theme.success };
    case "cancelled":  return { bg: theme.error + "18", text: theme.error };
    default:           return { bg: theme.surface, text: theme.textSecondary };
  }
}

function OrderCard({ order }: { order: IOrder }) {
  const theme = useTheme();
  const locale = useSettingsStore((s) => s.locale);
  const c = getStatusColor(order.status, theme);

  const dateLocale = locale === "bn" ? "bn-BD" : "en-US";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
      onPress={() => router.push(`/orders/${order._id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.orderNum, { color: theme.textColor }]}>#{order.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: c.bg }]}>
          <Text style={[styles.badgeText, { color: c.text }]}>
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Text>
        </View>
      </View>
      <Text style={[styles.date, { color: theme.textTertiary }]}>
        {new Date(order.createdAt).toLocaleDateString(dateLocale, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </Text>
      <Text style={[styles.itemSummary, { color: theme.textSecondary }]} numberOfLines={1}>
        {order.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={[styles.total, { color: theme.primaryColor }]}>
          ৳{order.total.toLocaleString()}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const { data: orders = [], isLoading, isError, refetch } = useOrders();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = useMemo(
    () => statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color={theme.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            Sign in to view orders
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primaryColor }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.actionBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
        <View style={[styles.titleBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textColor }]}>My Orders</Text>
        </View>
        <View style={{ padding: 16, gap: 0 }}>
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonOrderRow key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
        <View style={[styles.titleBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textColor }]}>My Orders</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            Failed to load orders
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.primaryColor }]}
            onPress={() => refetch()}
          >
            <Text style={styles.actionBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
      <View style={[styles.titleBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.textColor }]}>My Orders</Text>
        {orders.length > 0 && (
          <View style={[styles.orderCountBadge, { backgroundColor: theme.primaryColor + "18" }]}>
            <Text style={[styles.orderCountText, { color: theme.primaryColor }]}>{orders.length}</Text>
          </View>
        )}
      </View>

      {/* Status filter chips */}
      {orders.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.filterScroll, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}
          contentContainerStyle={styles.filterContent}
        >
          {STATUS_FILTERS.map((f) => {
            const active = f.value === statusFilter;
            const count = f.value === "all" ? orders.length : orders.filter((o) => o.status === f.value).length;
            if (f.value !== "all" && count === 0) return null;
            return (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterChip,
                  { borderColor: active ? theme.primaryColor : theme.border, backgroundColor: active ? theme.primaryColor : theme.cardBg },
                ]}
                onPress={() => setStatusFilter(f.value)}
              >
                <Text style={[styles.filterChipText, { color: active ? "#fff" : theme.textSecondary }]}>
                  {f.label}
                </Text>
                <Text style={[styles.filterChipCount, { color: active ? "rgba(255,255,255,0.8)" : theme.textTertiary }]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color={theme.textTertiary} />
          <Text style={[styles.emptyTitle, { color: theme.textSecondary }]}>
            {orders.length === 0 ? "No orders yet" : "No orders in this status"}
          </Text>
          {orders.length === 0 ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.primaryColor }]}
              onPress={() => router.push("/(tabs)/products")}
            >
              <Text style={styles.actionBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setStatusFilter("all")}>
              <Text style={[styles.clearFilter, { color: theme.primaryColor }]}>Show all orders</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlashList
          data={filteredOrders}
          keyExtractor={(o) => o._id}
          renderItem={({ item }) => <OrderCard order={item} />}
          contentContainerStyle={styles.list}
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primaryColor}
              colors={[theme.primaryColor]}
            />
          }
        />
      )}
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
  orderCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  orderCountText: { fontSize: 12, fontWeight: "700" },
  filterScroll: { maxHeight: 50, borderBottomWidth: 1 },
  filterContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  filterChipCount: { fontSize: 11, fontWeight: "500" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyTitle: { fontSize: 16 },
  clearFilter: { fontSize: 14, fontWeight: "600" },
  actionBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  actionBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  list: { padding: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNum: { fontSize: 15, fontWeight: "700" },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  date: { fontSize: 12 },
  itemSummary: { fontSize: 13 },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  total: { fontSize: 16, fontWeight: "800" },
});

import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { useTenantStore } from "@/store/tenant.store";
import type { INotification } from "@/shared/types/notification";

const TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  order_update: "receipt-outline",
  promotion: "pricetag-outline",
  account: "person-outline",
};

function NotificationItem({ notification }: { notification: INotification }) {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const { mutate: markRead } = useMarkAsRead();

  return (
    <TouchableOpacity
      style={[styles.item, !notification.isRead && styles.itemUnread]}
      onPress={() => !notification.isRead && markRead(notification._id)}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.iconBox,
          !notification.isRead && { backgroundColor: `${primaryColor}15` },
        ]}
      >
        <Ionicons
          name={TYPE_ICONS[notification.type] ?? "notifications-outline"}
          size={20}
          color={notification.isRead ? "#9CA3AF" : primaryColor}
        />
      </View>
      <View style={styles.itemContent}>
        <Text style={[styles.itemTitle, !notification.isRead && { color: "#111827" }]}>
          {notification.title}
        </Text>
        <Text style={styles.itemMessage} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.itemTime}>
          {new Date(notification.createdAt).toLocaleDateString("en-BD", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      {!notification.isRead && <View style={[styles.dot, { backgroundColor: primaryColor }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markAll } = useMarkAllAsRead();

  const unread = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {unread > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={() => markAll()}>
          <Text style={[styles.markAllText, { color: primaryColor }]}>
            Mark all as read ({unread})
          </Text>
        </TouchableOpacity>
      )}

      {notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlashList
          data={notifications}
          keyExtractor={(n) => n._id}
          renderItem={({ item }) => <NotificationItem notification={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, color: "#9CA3AF" },
  markAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "flex-end",
  },
  markAllText: { fontSize: 14, fontWeight: "600" },
  item: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
    alignItems: "flex-start",
  },
  itemUnread: { backgroundColor: "#FAFBFF" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemContent: { flex: 1, gap: 3 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#374151" },
  itemMessage: { fontSize: 13, color: "#6B7280", lineHeight: 18 },
  itemTime: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
});

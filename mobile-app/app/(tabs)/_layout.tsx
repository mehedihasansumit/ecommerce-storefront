import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTenantStore } from "@/store/tenant.store";
import { useCartStore } from "@/store/cart.store";
import { useUnreadCount } from "@/hooks/useNotifications";
import { View, Text, StyleSheet } from "react-native";

function CartBadge() {
  const itemCount = useCartStore((s) => s.itemCount);
  if (itemCount === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{itemCount > 99 ? "99+" : String(itemCount)}</Text>
    </View>
  );
}

function NotifBadge() {
  const { data } = useUnreadCount();
  const count = data ?? 0;
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? "9+" : String(count)}</Text>
    </View>
  );
}

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focused: boolean, outline: IoniconsName, filled: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={focused ? filled : outline} color={color} size={size} />
  );
}

export default function TabsLayout() {
  const store = useTenantStore((s) => s.store);
  const primaryColor = store?.theme?.primaryColor ?? "#3B82F6";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: { borderTopColor: "#F3F4F6" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) =>
            tabIcon(focused, "home-outline", "home")(({ color, size })),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "bag" : "bag-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
                color={color}
                size={size}
              />
              <CartBadge />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "receipt" : "receipt-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={color}
                size={size}
              />
              <NotifBadge />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});

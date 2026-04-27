import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTenantStore } from "@/store/tenant.store";
import { useTheme } from "@/context/ThemeContext";
import { useCartStore } from "@/store/cart.store";
import { useUnreadCount } from "@/hooks/useNotifications";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : String(count)}</Text>
    </View>
  );
}

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function TabsLayout() {
  const theme = useTheme();
  const primaryColor = theme.primaryColor;
  const cartCount = useCartStore((s) => s.itemCount);
  const { data: notifCount = 0 } = useUnreadCount();
  const insets = useSafeAreaInsets();

  function tabIcon(outline: IoniconsName, filled: IoniconsName) {
    return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <Ionicons name={focused ? filled : outline} color={color} size={size} />
    );
  }

  function onTabPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          borderTopColor: theme.border,
          borderTopWidth: 1,
          backgroundColor: theme.cardBg,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: -2,
        },
      }}
      screenListeners={{ tabPress: onTabPress }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: tabIcon("home-outline", "home"),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: tabIcon("bag-outline", "bag"),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <Ionicons name={focused ? "cart" : "cart-outline"} color={color} size={size} />
              <Badge count={cartCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: tabIcon("receipt-outline", "receipt"),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size, focused }) => (
            <View>
              <Ionicons name={focused ? "person" : "person-outline"} color={color} size={size} />
              <Badge count={notifCount} />
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

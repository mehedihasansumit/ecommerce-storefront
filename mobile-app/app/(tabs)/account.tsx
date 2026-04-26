import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { useUnreadCount } from "@/hooks/useNotifications";
import { logout } from "@/api/auth";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function MenuItem({
  icon,
  label,
  badge,
  onPress,
  danger,
}: {
  icon: IoniconsName;
  label: string;
  badge?: number;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && { backgroundColor: "#FEE2E2" }]}>
        <Ionicons name={icon} size={20} color={danger ? "#EF4444" : "#374151"} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: "#EF4444" }]}>{label}</Text>
      {badge != null && badge > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
      {!danger && (
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: "auto" }} />
      )}
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const { data: unreadCount = 0 } = useUnreadCount();

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          await logoutStore();
        },
      },
    ]);
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.guestContainer}>
          <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={styles.guestTitle}>Sign in to your account</Text>
          <Text style={styles.guestSub}>
            Track orders, manage addresses, and more
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: primaryColor }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={[styles.registerBtnText, { color: primaryColor }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        {/* Profile header */}
        <View style={[styles.profileHeader, { backgroundColor: primaryColor }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user.name ?? "Customer"}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders</Text>
          <MenuItem
            icon="receipt-outline"
            label="My Orders"
            onPress={() => router.push("/(tabs)/orders")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <MenuItem
            icon="location-outline"
            label="My Addresses"
            onPress={() => router.push("/account/addresses")}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            badge={unreadCount}
            onPress={() => router.push("/account/notifications")}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => setLocale(locale === "en" ? "bn" : "en")} activeOpacity={0.7}>
            <View style={styles.menuIcon}>
              <Ionicons name="language-outline" size={20} color="#374151" />
            </View>
            <Text style={styles.menuLabel}>Language</Text>
            <View style={styles.langBadge}>
              <Text style={[styles.langBadgeText, { color: primaryColor }]}>
                {locale === "en" ? "English" : "বাংলা"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  guestContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  guestTitle: { fontSize: 20, fontWeight: "700", color: "#111827", textAlign: "center" },
  guestSub: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  signInBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  signInBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  registerBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  registerBtnText: { fontSize: 16, fontWeight: "600" },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    paddingTop: 24,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "700", color: "#fff" },
  profileName: { fontSize: 18, fontWeight: "700", color: "#fff" },
  profileEmail: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  section: {
    backgroundColor: "#fff",
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F9FAFB",
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, color: "#111827", fontWeight: "500", flex: 1 },
  menuBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: "auto",
  },
  menuBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  langBadge: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  langBadgeText: { fontSize: 12, fontWeight: "700" },
});

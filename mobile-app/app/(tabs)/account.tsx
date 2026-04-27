import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuthStore } from "@/store/auth.store";
import { useTheme } from "@/context/ThemeContext";
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
  right,
}: {
  icon: IoniconsName;
  label: string;
  badge?: number;
  onPress: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderTopColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? theme.error + "18" : theme.surface }]}>
        <Ionicons name={icon} size={20} color={danger ? theme.error : theme.textSecondary} />
      </View>
      <Text style={[styles.menuLabel, { color: danger ? theme.error : theme.textColor }]}>{label}</Text>
      {badge != null && badge > 0 && (
        <View style={[styles.menuBadge, { backgroundColor: theme.error }]}>
          <Text style={styles.menuBadgeText}>{badge > 99 ? "99+" : badge}</Text>
        </View>
      )}
      {right ?? (
        !danger && <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} style={{ marginLeft: "auto" }} />
      )}
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const logoutStore = useAuthStore((s) => s.logout);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const colorScheme = useSettingsStore((s) => s.colorScheme);
  const setColorScheme = useSettingsStore((s) => s.setColorScheme);
  const { data: unreadCount = 0 } = useUnreadCount();

  const isDark = theme.isDark;

  function toggleDarkMode() {
    const next = isDark ? "light" : "dark";
    setColorScheme(next);
  }

  function toggleLocale() {
    const next = locale === "en" ? "bn" : "en";
    setLocale(next);
    Toast.show({
      type: "success",
      text1: next === "en" ? "Language: English" : "ভাষা: বাংলা",
      visibilityTime: 1500,
    });
  }

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
      <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
        <View style={styles.guestContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryColor }]}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={[styles.guestTitle, { color: theme.textColor }]}>Sign in to your account</Text>
          <Text style={[styles.guestSub, { color: theme.textSecondary }]}>
            Track orders, manage addresses, and more
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: theme.primaryColor }]}
            onPress={() => router.push("/(auth)/login")}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.registerBtn, { borderColor: theme.border, backgroundColor: theme.cardBg }]}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={[styles.registerBtnText, { color: theme.primaryColor }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (user.name ?? user.email)
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={[styles.profileHeader, { backgroundColor: theme.primaryColor }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user.name ?? "Customer"}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Orders */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Orders</Text>
          <MenuItem
            icon="receipt-outline"
            label="My Orders"
            onPress={() => router.push("/(tabs)/orders")}
          />
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Account</Text>
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

        {/* Preferences */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>Preferences</Text>

          {/* Language */}
          <TouchableOpacity
            style={[styles.menuItem, { borderTopColor: theme.surface }]}
            onPress={toggleLocale}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: theme.surface }]}>
              <Ionicons name="language-outline" size={20} color={theme.textSecondary} />
            </View>
            <Text style={[styles.menuLabel, { color: theme.textColor }]}>Language</Text>
            <View style={[styles.langBadge, { backgroundColor: theme.primaryColor + "18" }]}>
              <Text style={[styles.langBadgeText, { color: theme.primaryColor }]}>
                {locale === "en" ? "EN" : "বাং"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Dark mode */}
          <View style={[styles.menuItem, { borderTopColor: theme.surface }]}>
            <View style={[styles.menuIcon, { backgroundColor: theme.surface }]}>
              <Ionicons name={isDark ? "moon" : "moon-outline"} size={20} color={theme.textSecondary} />
            </View>
            <Text style={[styles.menuLabel, { color: theme.textColor }]}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.border, true: theme.primaryColor + "88" }}
              thumbColor={isDark ? theme.primaryColor : theme.textTertiary}
              style={{ marginLeft: "auto" }}
            />
          </View>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  guestTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  guestSub: { fontSize: 14, textAlign: "center" },
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
  },
  registerBtnText: { fontSize: 16, fontWeight: "600" },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    paddingTop: 24,
    paddingBottom: 28,
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
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
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
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "500", flex: 1 },
  menuBadge: {
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
  },
  langBadgeText: { fontSize: 12, fontWeight: "700" },
});

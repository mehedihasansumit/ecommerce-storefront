import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from "@/hooks/useAddresses";
import { useTenantStore } from "@/store/tenant.store";
import type { IAddress } from "@/shared/types/auth";

function AddressCard({ address }: { address: IAddress }) {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const { mutate: deleteAddr, isPending: deleting } = useDeleteAddress();
  const { mutate: setDefault, isPending: settingDefault } = useSetDefaultAddress();

  function handleDelete() {
    Alert.alert("Delete Address", "Remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAddr(address._id),
      },
    ]);
  }

  return (
    <View style={[styles.card, address.isDefault && { borderColor: primaryColor, borderWidth: 1.5 }]}>
      <View style={styles.cardTop}>
        <View style={styles.labelRow}>
          {address.label ? (
            <Text style={styles.label}>{address.label}</Text>
          ) : null}
          {address.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: primaryColor }]}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/account/address-form", params: { id: address._id } })}
        >
          <Ionicons name="create-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Text style={styles.addressText}>{address.street}</Text>
      <Text style={styles.addressText}>
        {address.city}
        {address.postalCode ? `, ${address.postalCode}` : ""}
      </Text>
      <Text style={styles.addressText}>{address.country}</Text>

      <View style={styles.actions}>
        {!address.isDefault && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setDefault(address._id)}
            disabled={settingDefault}
          >
            <Text style={[styles.actionText, { color: primaryColor }]}>
              {settingDefault ? "Setting..." : "Set as Default"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Text style={[styles.actionText, { color: "#EF4444" }]}>
            {deleting ? "Deleting..." : "Delete"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AddressesScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const { data: addresses = [], isLoading } = useAddresses();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : addresses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={56} color="#D1D5DB" />
          <Text style={styles.emptyText}>No saved addresses</Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: primaryColor }]}
            onPress={() => router.push("/account/address-form")}
          >
            <Text style={styles.addBtnText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={addresses}
          keyExtractor={(a) => a._id}
          renderItem={({ item }) => <AddressCard address={item} />}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            <TouchableOpacity
              style={[styles.addNewBtn, { borderColor: primaryColor }]}
              onPress={() => router.push("/account/address-form")}
            >
              <Ionicons name="add" size={20} color={primaryColor} />
              <Text style={[styles.addNewText, { color: primaryColor }]}>Add New Address</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  emptyText: { fontSize: 16, color: "#6B7280" },
  addBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 14, fontWeight: "700", color: "#111827" },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  defaultText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  addressText: { fontSize: 14, color: "#374151", lineHeight: 22 },
  actions: { flexDirection: "row", gap: 16, marginTop: 8 },
  actionBtn: { paddingVertical: 4 },
  actionText: { fontSize: 13, fontWeight: "600" },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 4,
    backgroundColor: "#fff",
  },
  addNewText: { fontSize: 15, fontWeight: "600" },
});

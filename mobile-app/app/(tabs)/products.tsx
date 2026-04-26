import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductCard } from "@/components/product/ProductCard";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { t } from "@/shared/lib/i18n";
import { Ionicons } from "@expo/vector-icons";

type SortOption = "default" | "price_asc" | "price_desc" | "newest" | "rating";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export default function ProductsScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const locale = useSettingsStore((s) => s.locale);

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<SortOption>("default");
  const [showSort, setShowSort] = useState(false);

  const { data: categoriesData } = useCategories();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useProducts({ categoryId: selectedCategory, sort });

  const products = useMemo(
    () => data?.pages.flatMap((p) => p.products) ?? [],
    [data]
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const activeSort = SORT_OPTIONS.find((o) => o.value === sort)!;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top bar: search + sort */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.searchBox}
          onPress={() => router.push("/search" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search products...</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortBtn, sort !== "default" && { borderColor: primaryColor }]}
          onPress={() => setShowSort(true)}
        >
          <Ionicons
            name="funnel-outline"
            size={16}
            color={sort !== "default" ? primaryColor : "#6B7280"}
          />
          <Text style={[styles.sortBtnText, sort !== "default" && { color: primaryColor }]}>
            Sort
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      {(categoriesData?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              !selectedCategory && { backgroundColor: primaryColor, borderColor: primaryColor },
            ]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text style={[styles.chipText, !selectedCategory && { color: "#fff" }]}>All</Text>
          </TouchableOpacity>

          {categoriesData?.map((cat) => {
            const active = selectedCategory === cat._id;
            return (
              <TouchableOpacity
                key={cat._id}
                style={[
                  styles.chip,
                  active && { backgroundColor: primaryColor, borderColor: primaryColor },
                ]}
                onPress={() => setSelectedCategory(active ? undefined : cat._id)}
              >
                <Text style={[styles.chipText, active && { color: "#fff" }]}>
                  {t(cat.name, locale)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Products grid */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <FlashList
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item, index }) => (
            <View style={[styles.gridItem, index % 2 === 0 && styles.gridItemLeft]}>
              <ProductCard product={item} />
            </View>
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={primaryColor} style={{ paddingVertical: 16 }} />
            ) : null
          }
        />
      )}

      {/* Sort bottom sheet */}
      <Modal
        visible={showSort}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSort(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSort(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Sort By</Text>
          {SORT_OPTIONS.map((opt) => {
            const active = opt.value === sort;
            return (
              <TouchableOpacity
                key={opt.value}
                style={styles.sheetOption}
                onPress={() => {
                  setSort(opt.value);
                  setShowSort(false);
                }}
              >
                <Text style={[styles.sheetOptionText, active && { color: primaryColor, fontWeight: "700" }]}>
                  {opt.label}
                </Text>
                {active && <Ionicons name="checkmark" size={18} color={primaryColor} />}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 20 }} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchPlaceholder: { fontSize: 14, color: "#9CA3AF" },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  sortBtnText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  chipScroll: { maxHeight: 48, backgroundColor: "#fff" },
  chipContent: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  chipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15, color: "#9CA3AF" },
  gridContent: { padding: 8 },
  gridItem: { flex: 1, paddingHorizontal: 4 },
  gridItemLeft: { paddingLeft: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  sheetOptionText: { fontSize: 15, color: "#374151" },
});

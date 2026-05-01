import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  RefreshControl,
  Dimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductCard } from "@/components/product/ProductCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useTheme } from "@/context/ThemeContext";
import { useSettingsStore } from "@/store/settings.store";
import { t } from "@/shared/lib/i18n";
import { Ionicons } from "@expo/vector-icons";

const { width: SW } = Dimensions.get("window");
type SortOption = "default" | "price_asc" | "price_desc" | "newest" | "rating";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "default", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export default function ProductsScreen() {
  const theme = useTheme();
  const locale = useSettingsStore((s) => s.locale);

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<SortOption>("default");
  const [showSort, setShowSort] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: categoriesData } = useCategories();

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useProducts({ categoryId: selectedCategory, sort });

  const products = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.searchBox} onPress={() => router.push("/search" as any)}>
            <Ionicons name="search-outline" size={16} color={theme.textTertiary} />
            <Text style={[styles.searchPlaceholder, { color: theme.textTertiary }]}>
              Search products...
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.errorTitle, { color: theme.textColor }]}>Failed to load products</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primaryColor }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.surface }]} edges={["top"]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.searchBox, { backgroundColor: theme.surface }]}
          onPress={() => router.push("/search" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={16} color={theme.textTertiary} />
          <Text style={[styles.searchPlaceholder, { color: theme.textTertiary }]}>
            Search products...
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortBtn,
            { borderColor: sort !== "default" ? theme.primaryColor : theme.border, backgroundColor: theme.cardBg },
          ]}
          onPress={() => setShowSort(true)}
        >
          <Ionicons
            name="funnel-outline"
            size={16}
            color={sort !== "default" ? theme.primaryColor : theme.textSecondary}
          />
          <Text style={[styles.sortBtnText, { color: sort !== "default" ? theme.primaryColor : theme.textSecondary }]}>
            Sort
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category chips */}
      {(categoriesData?.length ?? 0) > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.chipScroll, { backgroundColor: theme.cardBg }]}
          contentContainerStyle={styles.chipContent}
        >
          <TouchableOpacity
            style={[
              styles.chip,
              { borderColor: theme.border, backgroundColor: theme.cardBg },
              !selectedCategory && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor },
            ]}
            onPress={() => setSelectedCategory(undefined)}
          >
            <Text style={[styles.chipText, { color: theme.textColor }, !selectedCategory && { color: "#fff" }]}>
              All
            </Text>
          </TouchableOpacity>

          {categoriesData?.map((cat) => {
            const active = selectedCategory === cat._id;
            return (
              <TouchableOpacity
                key={cat._id}
                style={[
                  styles.chip,
                  { borderColor: theme.border, backgroundColor: theme.cardBg },
                  active && { backgroundColor: theme.primaryColor, borderColor: theme.primaryColor },
                ]}
                onPress={() => setSelectedCategory(active ? undefined : cat._id)}
              >
                <Text style={[styles.chipText, { color: theme.textColor }, active && { color: "#fff" }]}>
                  {t(cat.name, locale)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Products grid */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.skeletonGrid}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{ width: (SW - 24) / 2 }}>
              <SkeletonCard />
            </View>
          ))}
        </ScrollView>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={48} color={theme.textTertiary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No products found</Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory(undefined)}>
              <Text style={[styles.clearFilter, { color: theme.primaryColor }]}>Clear filter</Text>
            </TouchableOpacity>
          )}
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
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primaryColor}
              colors={[theme.primaryColor]}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.loadMore}>
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.textTertiary} />
              </View>
            ) : !hasNextPage && products.length > 0 ? (
              <Text style={[styles.endText, { color: theme.textTertiary }]}>All products loaded</Text>
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
        <View style={[styles.sheet, { backgroundColor: theme.cardBg }]}>
          <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
          <Text style={[styles.sheetTitle, { color: theme.textColor }]}>Sort By</Text>
          {SORT_OPTIONS.map((opt) => {
            const active = opt.value === sort;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sheetOption, { borderBottomColor: theme.surface }]}
                onPress={() => {
                  setSort(opt.value);
                  setShowSort(false);
                }}
              >
                <Text style={[
                  styles.sheetOptionText,
                  { color: active ? theme.primaryColor : theme.textColor },
                  active && { fontWeight: "700" },
                ]}>
                  {opt.label}
                </Text>
                {active && <Ionicons name="checkmark" size={18} color={theme.primaryColor} />}
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
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchPlaceholder: { flex: 1, fontSize: 14 },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  sortBtnText: { fontSize: 13, fontWeight: "600" },
  chipScroll: { maxHeight: 52 },
  chipContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 8, alignItems: "center" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "500" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  clearFilter: { fontSize: 14, fontWeight: "600" },
  errorTitle: { fontSize: 16, fontWeight: "600" },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridContent: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 20 },
  gridItem: { flex: 1, paddingHorizontal: 8 },
  gridItemLeft: { paddingLeft: 8 },
  loadMore: { alignItems: "center", paddingVertical: 16 },
  endText: { textAlign: "center", fontSize: 13, paddingVertical: 16 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetOptionText: { fontSize: 15 },
});

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/product/ProductCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { IProduct } from "@/shared/types/product";

const { width: SW } = Dimensions.get("window");
const HISTORY_KEY = "search:recent";
const MAX_HISTORY = 8;

async function loadHistory(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveToHistory(query: string) {
  if (!query.trim()) return;
  const prev = await loadHistory();
  const next = [query, ...prev.filter((q) => q !== query)].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export default function SearchScreen() {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    loadHistory().then(setHistory);
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useProducts({ search: activeQuery });

  const products = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  );

  const totalCount = data?.pages[0]?.total ?? 0;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  async function submit() {
    const q = query.trim();
    if (!q) return;
    setActiveQuery(q);
    await saveToHistory(q);
    setHistory(await loadHistory());
    inputRef.current?.blur();
  }

  function applyHistory(q: string) {
    setQuery(q);
    setActiveQuery(q);
  }

  async function removeHistory(q: string) {
    const next = history.filter((h) => h !== q);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  }

  async function clear() {
    await AsyncStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }

  function clearSearch() {
    setQuery("");
    setActiveQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const showHistory = !activeQuery && history.length > 0;
  const showResults = !!activeQuery;
  const showSkeleton = showResults && (isLoading || (isFetching && products.length === 0));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.cardBg }]} edges={["top"]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={theme.textColor} />
        </TouchableOpacity>
        <View style={[styles.inputWrap, { backgroundColor: theme.surface }]}>
          <Ionicons name="search-outline" size={16} color={theme.textTertiary} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.textColor }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products..."
            placeholderTextColor={theme.textTertiary}
            returnKeyType="search"
            onSubmitEditing={submit}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        {query.trim().length > 0 && (
          <TouchableOpacity onPress={submit} style={[styles.searchGoBtn, { backgroundColor: theme.primaryColor }]}>
            <Text style={styles.searchGoBtnText}>Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent searches */}
      {showHistory && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: theme.textSecondary }]}>Recent</Text>
            <TouchableOpacity onPress={clear}>
              <Text style={[styles.clearBtn, { color: theme.error }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {history.map((q) => (
            <View key={q} style={[styles.historyRow, { borderBottomColor: theme.surface }]}>
              <TouchableOpacity style={styles.historyItem} onPress={() => applyHistory(q)}>
                <Ionicons name="time-outline" size={15} color={theme.textTertiary} />
                <Text style={[styles.historyText, { color: theme.textColor }]}>{q}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => removeHistory(q)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={14} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Loading skeleton */}
      {showSkeleton && (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{ width: (SW - 40) / 2 }}>
              <SkeletonCard />
            </View>
          ))}
        </View>
      )}

      {/* Results */}
      {showResults && !showSkeleton && (
        <>
          <View style={[styles.resultHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.resultCount, { color: theme.textSecondary }]}>
              {totalCount > 0
                ? `${totalCount} result${totalCount === 1 ? "" : "s"} for "${activeQuery}"`
                : `No results for "${activeQuery}"`}
            </Text>
          </View>
          <FlatList<IProduct>
            data={products}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={{ gap: 12 }}
            keyExtractor={(p) => p._id}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={theme.textTertiary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No results for "{activeQuery}"
                </Text>
                <Text style={[styles.emptyHint, { color: theme.textTertiary }]}>
                  Try different keywords
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={{ flex: 1 }}>
                <ProductCard product={item} />
              </View>
            )}
          />
        </>
      )}

      {/* Idle state */}
      {!showHistory && !showResults && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={theme.border} />
          <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
            Search for products
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: { padding: 4 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  input: { flex: 1, fontSize: 15 },
  searchGoBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchGoBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  historySection: { paddingHorizontal: 16, paddingTop: 12 },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  historyTitle: { fontSize: 13, fontWeight: "700" },
  clearBtn: { fontSize: 13, fontWeight: "600" },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  historyItem: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  historyText: { fontSize: 14 },
  resultHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  resultCount: { fontSize: 13 },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
  },
  grid: { padding: 16 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 32,
  },
  emptyStateText: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  emptyHint: { fontSize: 13, textAlign: "center" },
});

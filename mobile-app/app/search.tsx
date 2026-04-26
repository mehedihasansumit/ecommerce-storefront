import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createMMKV } from "react-native-mmkv";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/product/ProductCard";
import type { IProduct } from "@/shared/types/product";

const searchStorage = createMMKV({ id: "search-history" });
const HISTORY_KEY = "recent";
const MAX_HISTORY = 8;

function loadHistory(): string[] {
  try {
    const raw = searchStorage.getString(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHistory(query: string) {
  if (!query.trim()) return;
  const prev = loadHistory();
  const next = [query, ...prev.filter((q) => q !== query)].slice(0, MAX_HISTORY);
  searchStorage.set(HISTORY_KEY, JSON.stringify(next));
}

function clearHistory() {
  searchStorage.remove(HISTORY_KEY);
}

export default function SearchScreen() {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const locale = useSettingsStore((s) => s.locale);

  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [history, setHistory] = useState<string[]>(loadHistory);

  useEffect(() => {
    // auto-focus on mount
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useProducts(
    { search: activeQuery },
    // only fetch when there's an active query
  );

  const products = useMemo(
    () => data?.pages.flatMap((p) => p.products) ?? [],
    [data]
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function submit() {
    const q = query.trim();
    if (!q) return;
    setActiveQuery(q);
    saveToHistory(q);
    setHistory(loadHistory());
  }

  function applyHistory(q: string) {
    setQuery(q);
    setActiveQuery(q);
  }

  function removeHistory(q: string) {
    const next = history.filter((h) => h !== q);
    searchStorage.set(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  }

  function clear() {
    clearHistory();
    setHistory([]);
  }

  const showHistory = !activeQuery && history.length > 0;
  const showResults = !!activeQuery;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products..."
            returnKeyType="search"
            onSubmitEditing={submit}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setActiveQuery("");
              }}
            >
              <Ionicons name="close-circle" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent searches */}
      {showHistory && (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent</Text>
            <TouchableOpacity onPress={clear}>
              <Text style={styles.clearBtn}>Clear</Text>
            </TouchableOpacity>
          </View>
          {history.map((q) => (
            <View key={q} style={styles.historyRow}>
              <TouchableOpacity style={styles.historyItem} onPress={() => applyHistory(q)}>
                <Ionicons name="time-outline" size={15} color="#9CA3AF" />
                <Text style={styles.historyText}>{q}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeHistory(q)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={14} color="#D1D5DB" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Results */}
      {showResults && (
        <FlatList<IProduct>
          data={products}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          keyExtractor={(p) => p._id}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            isLoading ? null : (
              <Text style={styles.empty}>No results for "{activeQuery}"</Text>
            )
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ProductCard product={item} />
            </View>
          )}
        />
      )}

      {!showHistory && !showResults && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#E5E7EB" />
          <Text style={styles.emptyStateText}>Search for products</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 8,
  },
  backBtn: { padding: 4 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  historySection: { paddingHorizontal: 16, paddingTop: 12 },
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  historyTitle: { fontSize: 13, fontWeight: "700", color: "#374151" },
  clearBtn: { fontSize: 13, color: "#EF4444" },
  historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F9FAFB" },
  historyItem: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  historyText: { fontSize: 14, color: "#374151" },
  grid: { padding: 16 },
  empty: { textAlign: "center", color: "#9CA3AF", paddingTop: 40, fontSize: 14 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyStateText: { fontSize: 15, color: "#9CA3AF" },
});

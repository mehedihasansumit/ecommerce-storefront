import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/product/ProductCard";
import { t } from "@/shared/lib/i18n";
import type { IHeroBanner } from "@/shared/types/store";
import type { ICategory } from "@/shared/types/category";

const { width: SW } = Dimensions.get("window");
const HERO_HEIGHT = SW * 0.55;

function HeroCarousel({ banners, primaryColor }: { banners: IHeroBanner[]; primaryColor: string }) {
  const locale = useSettingsStore((s) => s.locale);
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onScroll = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
    setActive(idx);
  }, []);

  if (banners.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            style={{ width: SW, height: HERO_HEIGHT }}
            onPress={() => item.linkUrl && router.push(item.linkUrl as any)}
          >
            <Image
              source={item.image}
              style={{ width: SW, height: HERO_HEIGHT }}
              contentFit="cover"
            />
            <View style={styles.heroOverlay}>
              <Text style={styles.heroTitle}>{t(item.title, locale)}</Text>
              {item.subtitle && (
                <Text style={styles.heroSubtitle}>{t(item.subtitle, locale)}</Text>
              )}
              {item.linkText && (
                <View style={[styles.heroCta, { backgroundColor: primaryColor }]}>
                  <Text style={styles.heroCtaText}>{item.linkText}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === active ? primaryColor : "#D1D5DB" },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function CategoryChips({
  categories,
  primaryColor,
  locale,
}: {
  categories: ICategory[];
  primaryColor: string;
  locale: string;
}) {
  if (categories.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              style={[styles.categoryChip, { borderColor: primaryColor }]}
              onPress={() => router.push(`/categories/${cat.slug}` as any)}
            >
              {cat.image ? (
                <Image
                  source={cat.image}
                  style={styles.categoryImg}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.categoryImg, { backgroundColor: primaryColor + "22" }]} />
              )}
              <Text style={styles.categoryName} numberOfLines={1}>
                {t(cat.name, locale)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FloatingCallButton({ phone, primaryColor }: { phone: string; primaryColor: string }) {
  if (!phone) return null;

  function call() {
    Linking.openURL(`tel:${phone}`);
  }

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: primaryColor }]}
      onPress={call}
      activeOpacity={0.85}
    >
      <Ionicons name="call" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const store = useTenantStore((s) => s.store);
  const locale = useSettingsStore((s) => s.locale);
  const primaryColor = store?.theme?.primaryColor ?? "#3B82F6";
  const phone = store?.contact?.phone ?? "";

  const { data: categoriesData } = useCategories();
  const { data: featuredData, isLoading: featuredLoading } = useProducts({ limit: 6 });

  const categories = categoriesData ?? [];
  const featured = featuredData?.pages[0]?.products ?? [];

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: store?.theme?.headerBg ?? "#fff" }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: store?.theme?.headerBg ?? "#fff" }]}>
          {store?.logo ? (
            <Image source={store.logo} style={styles.logo} contentFit="contain" />
          ) : (
            <Text style={[styles.storeName, { color: store?.theme?.headerText ?? "#111827" }]}>
              {store?.name ?? "Store"}
            </Text>
          )}
          <TouchableOpacity onPress={() => router.push("/search" as any)} style={styles.searchBtn}>
            <Ionicons name="search-outline" size={22} color={store?.theme?.headerText ?? "#111827"} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Hero banners */}
        <HeroCarousel banners={store?.heroBanners ?? []} primaryColor={primaryColor} />

        {/* WhatsApp social ordering */}
        {store?.socialOrdering?.whatsapp?.enabled && (
          <TouchableOpacity
            style={[styles.whatsappBanner, { borderColor: "#25D366" }]}
            onPress={() => {
              const num = store.socialOrdering.whatsapp.phoneNumber.replace(/\D/g, "");
              const msg = encodeURIComponent(
                store.socialOrdering.whatsapp.messageTemplate || "Hi, I'd like to place an order!"
              );
              Linking.openURL(`https://wa.me/${num}?text=${msg}`);
            }}
          >
            <Text style={{ fontSize: 18 }}>💬</Text>
            <Text style={styles.whatsappText}>Order via WhatsApp</Text>
            <Ionicons name="chevron-forward" size={16} color="#25D366" />
          </TouchableOpacity>
        )}

        {/* Categories */}
        <CategoryChips categories={categories} primaryColor={primaryColor} locale={locale} />

        {/* Featured products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/products")}>
              <Text style={[styles.seeAll, { color: primaryColor }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {featuredLoading ? (
            <ActivityIndicator color={primaryColor} style={{ paddingVertical: 24 }} />
          ) : (
            <View style={styles.productGrid}>
              {featured.map((product) => (
                <View key={product._id} style={{ width: (SW - 48) / 2 }}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Facebook ordering */}
        {store?.socialOrdering?.facebook?.enabled && store.socialOrdering.facebook.pageUrl && (
          <TouchableOpacity
            style={[styles.whatsappBanner, { borderColor: "#1877F2" }]}
            onPress={() => Linking.openURL(store.socialOrdering.facebook.pageUrl)}
          >
            <Text style={{ fontSize: 18 }}>📘</Text>
            <Text style={[styles.whatsappText, { color: "#1877F2" }]}>Order via Facebook</Text>
            <Ionicons name="chevron-forward" size={16} color="#1877F2" />
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingCallButton phone={phone} primaryColor={primaryColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: { height: 36, width: 120 },
  storeName: { fontSize: 18, fontWeight: "800" },
  searchBtn: { padding: 4 },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
    backgroundColor: "rgba(0,0,0,0.35)",
    gap: 6,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.85)" },
  heroCta: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 4,
  },
  heroCtaText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  seeAll: { fontSize: 13, fontWeight: "600" },
  categoryRow: { flexDirection: "row", gap: 12, paddingRight: 4 },
  categoryChip: {
    alignItems: "center",
    gap: 6,
    width: 72,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  categoryImg: { width: 48, height: 48, borderRadius: 8 },
  categoryName: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  whatsappBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  whatsappText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#25D366" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
});

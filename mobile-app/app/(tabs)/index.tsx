import { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Linking,
  RefreshControl,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { useTheme } from "@/context/ThemeContext";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cart.store";
import { ProductCard } from "@/components/product/ProductCard";
import { SkeletonCard, SkeletonHero, Skeleton } from "@/components/ui/Skeleton";
import { t } from "@/shared/lib/i18n";
import { resolveImageUrl } from "@/shared/lib/image";
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

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % banners.length;
        listRef.current?.scrollToOffset({ offset: next * SW, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <View style={{ position: "relative" }}>
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
              source={resolveImageUrl(item.image)}
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
                i === active
                  ? { backgroundColor: "#fff", width: 18 }
                  : { backgroundColor: "rgba(255,255,255,0.45)", width: 7 },
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
  loading,
  theme,
}: {
  categories: ICategory[];
  primaryColor: string;
  locale: string;
  loading: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Categories</Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/products" as any)}>
          <Text style={[styles.seeAll, { color: primaryColor }]}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryRow}>
          {loading
            ? Array.from({ length: 5 }, (_, i) => (
                <View key={i} style={styles.categoryChipSkeleton}>
                  <Skeleton width={60} height={60} borderRadius={30} />
                  <Skeleton width={52} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                </View>
              ))
            : categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={styles.categoryChip}
                  onPress={() => router.push(`/(tabs)/products` as any)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.categoryImgWrap, {
                    backgroundColor: primaryColor + "18",
                    shadowColor: primaryColor,
                  }]}>
                    {cat.image ? (
                      <Image
                        source={resolveImageUrl(cat.image)}
                        style={styles.categoryImg}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons name="grid-outline" size={26} color={primaryColor} />
                    )}
                  </View>
                  <Text style={[styles.categoryName, { color: theme.textSecondary }]} numberOfLines={1}>
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
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: primaryColor }]}
      onPress={() => Linking.openURL(`tel:${phone}`)}
      activeOpacity={0.85}
    >
      <Ionicons name="call" size={22} color="#fff" />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const store = useTenantStore((s) => s.store);
  const storeId = useTenantStore((s) => s.store?._id);
  const locale = useSettingsStore((s) => s.locale);
  const theme = useTheme();
  const queryClient = useQueryClient();
  const primaryColor = theme.primaryColor;
  const phone = store?.contact?.phone ?? "";
  const cartCount = useCartStore((s) => s.itemCount);

  const [refreshing, setRefreshing] = useState(false);

  const { data: categoriesData, isLoading: catsLoading } = useCategories();
  const { data: featuredData, isLoading: featuredLoading, refetch: refetchFeatured } = useProducts({ limit: 6 });

  const categories = categoriesData ?? [];
  const featured = featuredData?.pages[0]?.data ?? [];

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [storeId, "categories"] }),
      refetchFeatured(),
    ]);
    setRefreshing(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bgColor }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.headerBg }}>
        <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
          {store?.logo ? (
            <Image source={resolveImageUrl(store.logo)} style={styles.logo} contentFit="contain" />
          ) : (
            <Text style={[styles.storeName, { color: theme.headerText }]}>
              {store?.name ?? "Store"}
            </Text>
          )}
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push("/search" as any)} style={styles.headerBtn}>
              <Ionicons name="search-outline" size={22} color={theme.headerText} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/cart" as any)}
              style={styles.headerBtn}
            >
              <Ionicons name="cart-outline" size={22} color={theme.headerText} />
              {cartCount > 0 && (
                <View style={[styles.cartBadge, { backgroundColor: theme.error }]}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? "9+" : cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={primaryColor}
            colors={[primaryColor]}
          />
        }
      >
        {/* Hero */}
        {store?.heroBanners?.length ? (
          <HeroCarousel banners={store.heroBanners} primaryColor={primaryColor} />
        ) : featuredLoading ? (
          <SkeletonHero />
        ) : null}

        {/* Social ordering banners */}
        {(store?.socialOrdering?.whatsapp?.enabled || store?.socialOrdering?.facebook?.enabled) && (
          <View style={styles.socialSection}>
            {store?.socialOrdering?.whatsapp?.enabled && (
              <TouchableOpacity
                style={[styles.socialCard, { backgroundColor: "#25D36612", borderColor: "#25D36630" }]}
                onPress={() => {
                  const num = store.socialOrdering.whatsapp.phoneNumber.replace(/\D/g, "");
                  const msg = encodeURIComponent(
                    store.socialOrdering.whatsapp.messageTemplate || "Hi, I'd like to place an order!"
                  );
                  Linking.openURL(`https://wa.me/${num}?text=${msg}`);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.socialIconWrap, { backgroundColor: "#25D366" }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.socialCardTitle, { color: "#1a8a43" }]}>Order via WhatsApp</Text>
                  <Text style={[styles.socialCardSub, { color: "#25D36699" }]}>Chat to place order</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={22} color="#25D366" />
              </TouchableOpacity>
            )}
            {store?.socialOrdering?.facebook?.enabled && store.socialOrdering.facebook.pageUrl && (
              <TouchableOpacity
                style={[styles.socialCard, { backgroundColor: "#1877F212", borderColor: "#1877F230" }]}
                onPress={() => Linking.openURL(store.socialOrdering.facebook.pageUrl)}
                activeOpacity={0.8}
              >
                <View style={[styles.socialIconWrap, { backgroundColor: "#1877F2" }]}>
                  <Ionicons name="logo-facebook" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.socialCardTitle, { color: "#1254a4" }]}>Order via Facebook</Text>
                  <Text style={[styles.socialCardSub, { color: "#1877F299" }]}>Message our page</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={22} color="#1877F2" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Categories */}
        <CategoryChips
          categories={categories}
          primaryColor={primaryColor}
          locale={locale}
          loading={catsLoading}
          theme={theme}
        />

        {/* Featured products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Featured Products</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/products")}>
              <Text style={[styles.seeAll, { color: primaryColor }]}>See All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productGrid}>
            {featuredLoading
              ? Array.from({ length: 4 }, (_, i) => (
                  <View key={i} style={{ width: (SW - 48) / 2 }}>
                    <SkeletonCard />
                  </View>
                ))
              : featured.map((product) => (
                  <View key={product._id} style={{ width: (SW - 48) / 2 }}>
                    <ProductCard product={product} />
                  </View>
                ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <FloatingCallButton phone={phone} primaryColor={primaryColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  logo: { height: 36, width: 120 },
  storeName: { fontSize: 18, fontWeight: "800" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerBtn: { padding: 6, position: "relative" },
  cartBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 28,
    backgroundColor: "rgba(0,0,0,0.32)",
    gap: 6,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff", textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  heroCta: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 6,
  },
  heroCtaText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  dots: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  dot: { height: 6, borderRadius: 3 },
  section: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 13, fontWeight: "600" },
  categoryRow: { flexDirection: "row", gap: 16, paddingRight: 4, paddingLeft: 2 },
  categoryChip: { alignItems: "center", gap: 8, width: 72 },
  categoryChipSkeleton: { alignItems: "center", width: 72 },
  categoryImgWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  categoryImg: { width: 62, height: 62, borderRadius: 31 },
  categoryName: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  socialSection: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  socialCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  socialIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  socialCardTitle: { fontSize: 14, fontWeight: "700" },
  socialCardSub: { fontSize: 12, marginTop: 1 },
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

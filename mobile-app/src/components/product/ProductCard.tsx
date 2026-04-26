import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { t } from "@/shared/lib/i18n";
import type { IProduct } from "@/shared/types/product";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function ProductCard({ product }: { product: IProduct }) {
  const primaryColor = useTenantStore((s) => s.store?.theme.primaryColor ?? "#3B82F6");
  const locale = useSettingsStore((s) => s.locale);
  const name = t(product.name, locale);

  const hasDiscount = product.compareAtPrice > 0 && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isNew =
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < FOURTEEN_DAYS_MS;
  const isOutOfStock = product.stock <= 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/products/${product.slug}`)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={product.thumbnail || product.images[0]?.url}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {/* Badges */}
        <View style={styles.badges}>
          {hasDiscount && (
            <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
              <Text style={styles.badgeText}>-{discountPct}%</Text>
            </View>
          )}
          {isNew && !hasDiscount && (
            <View style={[styles.badge, { backgroundColor: "#F59E0B" }]}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
        </View>

        {/* Out of stock */}
        {isOutOfStock && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>

        {product.averageRating > 0 && (
          <Text style={styles.rating}>
            {"★".repeat(Math.round(product.averageRating))}
            {"☆".repeat(5 - Math.round(product.averageRating))}
            {"  "}
            <Text style={styles.reviewCount}>({product.reviewCount})</Text>
          </Text>
        )}

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: primaryColor }]}>
            ৳{product.price.toLocaleString()}
          </Text>
          {hasDiscount && (
            <Text style={styles.comparePrice}>
              ৳{product.compareAtPrice.toLocaleString()}
            </Text>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <Text style={styles.lowStock}>Only {product.stock} left</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginBottom: 12,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: "#F9FAFB",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badges: {
    position: "absolute",
    top: 8,
    left: 8,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  outOfStock: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockText: {
    backgroundColor: "#111827",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 11,
    fontWeight: "600",
  },
  info: {
    padding: 12,
    gap: 4,
  },
  name: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    lineHeight: 18,
  },
  rating: {
    fontSize: 12,
    color: "#FBBF24",
  },
  reviewCount: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
  },
  comparePrice: {
    fontSize: 12,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
  },
  lowStock: {
    fontSize: 10,
    color: "#F97316",
    fontWeight: "600",
  },
});

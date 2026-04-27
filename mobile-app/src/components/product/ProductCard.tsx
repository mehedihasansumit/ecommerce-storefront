import { useState } from "react";
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useSettingsStore } from "@/store/settings.store";
import { useCartStore } from "@/store/cart.store";
import { t } from "@/shared/lib/i18n";
import { resolveImageUrl } from "@/shared/lib/image";
import { StarRating } from "@/components/ui/StarRating";
import type { IProduct } from "@/shared/types/product";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function ProductCard({ product }: { product: IProduct }) {
  const theme = useTheme();
  const locale = useSettingsStore((s) => s.locale);
  const addItem = useCartStore((s) => s.addItem);
  const name = t(product.name, locale);

  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const hasDiscount = product.compareAtPrice > 0 && product.compareAtPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const isNew =
    product.createdAt &&
    Date.now() - new Date(product.createdAt).getTime() < FOURTEEN_DAYS_MS;
  const isOutOfStock = product.stock <= 0;
  const hasVariants = (product.options?.length ?? 0) > 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/products/${product.slug}`);
  }

  function handleAddToCart() {
    if (hasVariants || isOutOfStock) {
      router.push(`/products/${product.slug}`);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem({
      productId: product._id,
      productSlug: product.slug,
      productName: name,
      thumbnail: resolveImageUrl(product.thumbnail || product.images?.[0]?.url || ""),
      priceAtAdd: product.price,
      quantity: 1,
      variantSelections: {},
    });
    Toast.show({ type: "success", text1: "Added to cart", text2: name, visibilityTime: 1800 });
  }

  const imgSource = imgError
    ? null
    : resolveImageUrl(product.thumbnail || product.images?.[0]?.url);

  const imgBg = theme.isDark ? "#1a1a1a" : "#F8F8F8";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
      activeOpacity={0.92}
      onPress={handlePress}
    >
      {/* Image area */}
      <View style={[styles.imageContainer, { backgroundColor: imgBg }]}>
        {imgSource ? (
          <Image
            source={imgSource}
            style={styles.image}
            contentFit="contain"
            transition={250}
            onLoadStart={() => setImgLoading(true)}
            onLoad={() => setImgLoading(false)}
            onError={() => { setImgLoading(false); setImgError(true); }}
          />
        ) : (
          <View style={[styles.image, styles.imgFallback]}>
            <Ionicons name="image-outline" size={32} color={theme.textTertiary} />
          </View>
        )}

        {/* Skeleton shimmer while loading */}
        {imgLoading && imgSource && (
          <View style={[styles.imgLoader, { backgroundColor: imgBg }]}>
            <ActivityIndicator size="small" color={theme.primaryColor} />
          </View>
        )}

        {/* Bottom fade — softens image → info transition */}
        {!isOutOfStock && (
          <View
            style={[styles.imgGradient, { backgroundColor: theme.isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.06)" }]}
            pointerEvents="none"
          />
        )}

        {/* Top-left badges */}
        <View style={styles.badgesLeft}>
          {hasDiscount && (
            <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
              <Text style={styles.badgeText}>−{discountPct}%</Text>
            </View>
          )}
          {isNew && !hasDiscount && (
            <View style={[styles.badge, { backgroundColor: theme.primaryColor }]}>
              <Text style={styles.badgeText}>NEW</Text>
            </View>
          )}
        </View>

        {/* Sold out overlay */}
        {isOutOfStock && (
          <View style={styles.outOfStockOverlay}>
            <View style={styles.outOfStockPill}>
              <Ionicons name="close-circle-outline" size={14} color="#fff" />
              <Text style={styles.outOfStockText}>Sold Out</Text>
            </View>
          </View>
        )}

        {/* Add to cart FAB */}
        {!isOutOfStock && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primaryColor }]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name={hasVariants ? "arrow-forward" : "add"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.textColor }]} numberOfLines={2}>
          {name}
        </Text>

        {product.averageRating > 0 && (
          <View style={styles.ratingRow}>
            <StarRating
              rating={product.averageRating}
              count={product.reviewCount}
              size={10}
              showCount
            />
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: theme.primaryColor }]}>
            ৳{product.price.toLocaleString()}
          </Text>
          {hasDiscount && (
            <Text style={[styles.comparePrice, { color: theme.textTertiary }]}>
              ৳{product.compareAtPrice.toLocaleString()}
            </Text>
          )}
        </View>

        {isLowStock && (
          <View style={styles.lowStockRow}>
            <View style={[styles.lowStockDot, { backgroundColor: theme.warning }]} />
            <Text style={[styles.lowStockText, { color: theme.warning }]}>
              Only {product.stock} left
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.75,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  /* Image */
  imageContainer: {
    aspectRatio: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imgFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  imgLoader: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  imgGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
  },

  /* Badges */
  badgesLeft: {
    position: "absolute",
    top: 8,
    left: 8,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  /* Out of stock */
  outOfStockOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.52)",
    alignItems: "center",
    justifyContent: "center",
  },
  outOfStockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  outOfStockText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  /* Add to cart */
  addBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  /* Info section */
  info: {
    paddingHorizontal: 10,
    paddingTop: 9,
    paddingBottom: 11,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  ratingRow: {
    marginTop: -1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    flexWrap: "wrap",
    marginTop: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  comparePrice: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  lowStockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  lowStockDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useProduct } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cart.store";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { t } from "@/shared/lib/i18n";
import type { IProductVariant } from "@/shared/types/product";
import { Ionicons } from "@expo/vector-icons";
import { ReviewSection } from "@/components/reviews/ReviewSection";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug);
  const store = useTenantStore((s) => s.store);
  const primaryColor = store?.theme.primaryColor ?? "#3B82F6";
  const locale = useSettingsStore((s) => s.locale);
  const addItem = useCartStore((s) => s.addItem);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  if (!product || error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const name = t(product.name, locale);
  const description = t(product.description, locale);
  const images = product.images.length > 0 ? product.images : [];

  // Find matching variant based on selected options
  const selectedVariant: IProductVariant | undefined =
    product.variants.length > 0
      ? product.variants.find((v) =>
          Object.entries(selectedOptions).every(
            ([key, val]) => v.optionValues[key] === val
          )
        )
      : undefined;

  const price = selectedVariant?.price ?? product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const stock = selectedVariant?.stock ?? product.stock;
  const hasDiscount = compareAtPrice > 0 && compareAtPrice > price;

  async function handleAddToCart() {
    if (product!.variants.length > 0 && Object.keys(selectedOptions).length < product!.options.length) {
      Alert.alert("Select Options", "Please select all product options before adding to cart.");
      return;
    }

    setAdding(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addItem({
      productId: product!._id,
      productName: name,
      productSlug: product!.slug,
      thumbnail: product!.thumbnail || images[0]?.url || "",
      variantSelections: selectedOptions,
      quantity,
      priceAtAdd: price,
    });

    setAdding(false);
    Alert.alert("Added to Cart", `${name} added successfully.`, [
      { text: "Continue Shopping" },
      { text: "View Cart", onPress: () => router.push("/(tabs)/cart") },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View style={styles.galleryContainer}>
          <Image
            source={images[selectedImage]?.url || product.thumbnail}
            style={styles.mainImage}
            contentFit="cover"
            transition={150}
          />

          {/* Discount badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}%
              </Text>
            </View>
          )}
        </View>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailScroll}
            contentContainerStyle={styles.thumbnailContent}
          >
            {images.map((img, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedImage(i)}
                style={[
                  styles.thumbnail,
                  i === selectedImage && { borderColor: primaryColor, borderWidth: 2 },
                ]}
              >
                <Image
                  source={img.url}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          {/* Name + price */}
          <Text style={styles.name}>{name}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: primaryColor }]}>
              ৳{price.toLocaleString()}
            </Text>
            {hasDiscount && (
              <Text style={styles.comparePrice}>
                ৳{compareAtPrice.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Rating */}
          {product.averageRating > 0 && (
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>
                {"★".repeat(Math.round(product.averageRating))}
                {"☆".repeat(5 - Math.round(product.averageRating))}
              </Text>
              <Text style={styles.reviewCount}>({product.reviewCount} reviews)</Text>
            </View>
          )}

          {/* Stock */}
          <Text style={[styles.stockText, stock <= 0 && { color: "#EF4444" }]}>
            {stock <= 0 ? "Out of Stock" : stock <= 5 ? `Only ${stock} left` : "In Stock"}
          </Text>

          {/* Variant options */}
          {product.options.map((option) => (
            <View key={option.name} style={styles.optionSection}>
              <Text style={styles.optionLabel}>{option.name}</Text>
              <View style={styles.optionValues}>
                {option.values.map((val) => {
                  const selected = selectedOptions[option.name] === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.optionChip,
                        selected && { backgroundColor: primaryColor, borderColor: primaryColor },
                      ]}
                      onPress={() =>
                        setSelectedOptions((prev) => ({ ...prev, [option.name]: val }))
                      }
                    >
                      <Text
                        style={[styles.optionChipText, selected && { color: "#fff" }]}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={styles.optionLabel}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={18} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.min(stock, quantity + 1))}
              >
                <Ionicons name="add" size={18} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {description && (
            <View style={styles.descSection}>
              <Text style={styles.descLabel}>Description</Text>
              <Text style={styles.desc}>{description}</Text>
            </View>
          )}

          {/* WhatsApp order */}
          {store?.socialOrdering?.whatsapp?.enabled && (
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={() => {
                const num = store.socialOrdering.whatsapp.phoneNumber.replace(/\D/g, "");
                const msg = encodeURIComponent(
                  `Hi! I want to order: ${name} (৳${price.toLocaleString()})\nhttps://${store.domains[0]}/products/${product!.slug}`
                );
                Linking.openURL(`https://wa.me/${num}?text=${msg}`);
              }}
            >
              <Text style={styles.whatsappBtnText}>💬  Order via WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reviews */}
        <ReviewSection productId={product._id} primaryColor={primaryColor} />
      </ScrollView>

      {/* Sticky add to cart */}
      <SafeAreaView edges={["bottom"]} style={styles.stickyBar}>
        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: primaryColor },
            (stock <= 0 || adding) && styles.btnDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={stock <= 0 || adding}
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="#fff" />
              <Text style={styles.addBtnText}>
                {stock <= 0 ? "Out of Stock" : "Add to Cart"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, color: "#9CA3AF" },
  galleryContainer: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, backgroundColor: "#F9FAFB" },
  mainImage: { width: "100%", height: "100%" },
  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  thumbnailScroll: { backgroundColor: "#fff" },
  thumbnailContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  thumbnailImage: { width: "100%", height: "100%" },
  content: { padding: 20, gap: 12 },
  name: { fontSize: 20, fontWeight: "700", color: "#111827", lineHeight: 26 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  price: { fontSize: 22, fontWeight: "800" },
  comparePrice: { fontSize: 15, color: "#9CA3AF", textDecorationLine: "line-through" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stars: { fontSize: 14, color: "#FBBF24" },
  reviewCount: { fontSize: 13, color: "#9CA3AF" },
  stockText: { fontSize: 13, fontWeight: "600", color: "#22C55E" },
  optionSection: { gap: 8 },
  optionLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  optionValues: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  optionChipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  quantitySection: { gap: 8 },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 0 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  qtyText: {
    width: 48,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  descSection: { gap: 6 },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#25D366",
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
    marginBottom: 120,
  },
  whatsappBtnText: { fontSize: 14, fontWeight: "700", color: "#25D366" },
  descLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  desc: { fontSize: 14, color: "#6B7280", lineHeight: 22 },
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  btnDisabled: { opacity: 0.5 },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

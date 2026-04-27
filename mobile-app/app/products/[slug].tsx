import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useProduct } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cart.store";
import { resolveImageUrl } from "@/shared/lib/image";
import { useTenantStore } from "@/store/tenant.store";
import { useSettingsStore } from "@/store/settings.store";
import { useTheme } from "@/context/ThemeContext";
import { t } from "@/shared/lib/i18n";
import type { IProductVariant } from "@/shared/types/product";
import { Ionicons } from "@expo/vector-icons";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { StarRating } from "@/components/ui/StarRating";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug);
  const store = useTenantStore((s) => s.store);
  const theme = useTheme();
  const primaryColor = theme.primaryColor;
  const locale = useSettingsStore((s) => s.locale);
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.itemCount);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const Header = () => (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: theme.headerBg }}>
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/cart")}
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
    </SafeAreaView>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={primaryColor} />
        </View>
      </View>
    );
  }

  if (!product || error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
        <Header />
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color={theme.textTertiary} />
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>Product not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.goBackBtn, { borderColor: theme.border }]}>
            <Text style={[styles.goBackText, { color: theme.textColor }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const name = t(product.name, locale);
  const description = t(product.description, locale);
  const images = product.images.length > 0 ? product.images : [];

  const selectedVariant: IProductVariant | undefined =
    product.variants.length > 0
      ? product.variants.find((v) =>
          Object.entries(selectedOptions).every(([key, val]) => v.optionValues[key] === val)
        )
      : undefined;

  const price = selectedVariant?.price ?? product.price;
  const compareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;
  const stock = selectedVariant?.stock ?? product.stock;
  const hasDiscount = compareAtPrice > 0 && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  async function handleAddToCart() {
    if (product!.variants.length > 0 && Object.keys(selectedOptions).length < product!.options.length) {
      Toast.show({ type: "error", text1: "Select options", text2: "Please select all product options." });
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
    Toast.show({
      type: "success",
      text1: "Added to cart",
      text2: name,
      visibilityTime: 2000,
      onPress: () => router.push("/(tabs)/cart"),
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image gallery */}
        <View style={[styles.galleryContainer, { backgroundColor: theme.surface }]}>
          <Image
            source={resolveImageUrl(images[selectedImage]?.url || product.thumbnail)}
            style={styles.mainImage}
            contentFit="cover"
            transition={150}
          />
          {hasDiscount && (
            <View style={[styles.discountBadge, { backgroundColor: theme.error }]}>
              <Text style={styles.discountText}>-{discountPct}%</Text>
            </View>
          )}
        </View>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.thumbnailScroll, { backgroundColor: theme.cardBg }]}
            contentContainerStyle={styles.thumbnailContent}
          >
            {images.map((img, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedImage(i)}
                style={[
                  styles.thumbnail,
                  {
                    borderColor: i === selectedImage ? primaryColor : theme.border,
                    borderWidth: i === selectedImage ? 2 : 1,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <Image
                  source={resolveImageUrl(img.url)}
                  style={styles.thumbnailImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.content}>
          {/* Name */}
          <Text style={[styles.name, { color: theme.textColor }]}>{name}</Text>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: primaryColor }]}>
              ৳{price.toLocaleString()}
            </Text>
            {hasDiscount && (
              <Text style={[styles.comparePrice, { color: theme.textTertiary }]}>
                ৳{compareAtPrice.toLocaleString()}
              </Text>
            )}
          </View>

          {/* Rating */}
          {product.averageRating > 0 && (
            <StarRating
              rating={product.averageRating}
              count={product.reviewCount}
              size={14}
              showCount
            />
          )}

          {/* Stock */}
          <Text style={[
            styles.stockText,
            { color: stock <= 0 ? theme.error : stock <= 5 ? theme.warning : theme.success },
          ]}>
            {stock <= 0 ? "Out of Stock" : stock <= 5 ? `Only ${stock} left` : "In Stock"}
          </Text>

          {/* Variant options */}
          {product.options.map((option) => (
            <View key={option.name} style={styles.optionSection}>
              <Text style={[styles.optionLabel, { color: theme.textColor }]}>{option.name}</Text>
              <View style={styles.optionValues}>
                {option.values.map((val) => {
                  const selected = selectedOptions[option.name] === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.optionChip,
                        {
                          borderColor: selected ? primaryColor : theme.border,
                          backgroundColor: selected ? primaryColor : theme.cardBg,
                        },
                      ]}
                      onPress={() =>
                        setSelectedOptions((prev) => ({ ...prev, [option.name]: val }))
                      }
                    >
                      <Text style={[styles.optionChipText, { color: selected ? "#fff" : theme.textColor }]}>
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
            <Text style={[styles.optionLabel, { color: theme.textColor }]}>Quantity</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={[styles.qtyBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="remove" size={18} color={theme.textColor} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, { color: theme.textColor }]}>{quantity}</Text>
              <TouchableOpacity
                style={[styles.qtyBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => setQuantity(Math.min(stock, quantity + 1))}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="add" size={18} color={theme.textColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {!!description && (
            <View style={styles.descSection}>
              <Text style={[styles.descLabel, { color: theme.textColor }]}>Description</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>{description}</Text>
            </View>
          )}

          {/* WhatsApp order */}
          {store?.socialOrdering?.whatsapp?.enabled && (
            <TouchableOpacity
              style={[styles.whatsappBtn, { borderColor: "#25D366" }]}
              onPress={() => {
                const num = store.socialOrdering.whatsapp.phoneNumber.replace(/\D/g, "");
                const msg = encodeURIComponent(
                  `Hi! I want to order: ${name} (৳${price.toLocaleString()})\nhttps://${store.domains[0]}/products/${product!.slug}`
                );
                Linking.openURL(`https://wa.me/${num}?text=${msg}`);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <Text style={styles.whatsappBtnText}>Order via WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reviews */}
        <ReviewSection productId={product._id} primaryColor={primaryColor} />
      </ScrollView>

      {/* Sticky add-to-cart bar */}
      <SafeAreaView
        edges={["bottom"]}
        style={[styles.stickyBar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}
      >
        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: stock <= 0 ? theme.textTertiary : primaryColor },
          ]}
          onPress={handleAddToCart}
          disabled={stock <= 0 || adding}
          activeOpacity={0.85}
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
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  errorText: { fontSize: 16 },
  goBackBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  goBackText: { fontSize: 15, fontWeight: "600" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
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
  galleryContainer: { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
  mainImage: { width: "100%", height: "100%" },
  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  thumbnailScroll: {},
  thumbnailContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
  },
  thumbnailImage: { width: "100%", height: "100%" },
  content: { padding: 20, gap: 12 },
  name: { fontSize: 20, fontWeight: "700", lineHeight: 28 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  price: { fontSize: 22, fontWeight: "800" },
  comparePrice: { fontSize: 15, textDecorationLine: "line-through" },
  stockText: { fontSize: 13, fontWeight: "600" },
  optionSection: { gap: 8 },
  optionLabel: { fontSize: 14, fontWeight: "600" },
  optionValues: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  optionChipText: { fontSize: 13, fontWeight: "500" },
  quantitySection: { gap: 8 },
  quantityRow: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    width: 48,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
  descSection: { gap: 6 },
  descLabel: { fontSize: 14, fontWeight: "600" },
  desc: { fontSize: 14, lineHeight: 22 },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 4,
  },
  whatsappBtnText: { fontSize: 14, fontWeight: "700", color: "#25D366" },
  stickyBar: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

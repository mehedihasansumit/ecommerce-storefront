import "dotenv/config";
import bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";
import { db } from "./client";
import {
  stores,
  roles,
  adminUsers,
  categories,
  products,
  productVariants,
} from "./schema";

type StoreSeed = typeof stores.$inferInsert;
type CategorySeed = typeof categories.$inferInsert;
type ProductSeed = typeof products.$inferInsert;
type VariantSeed = typeof productVariants.$inferInsert;

async function main() {
  console.log("Truncating tables…");
  // CASCADE clears all dependent rows; restart identity for any serials.
  await db.execute(sql`
    TRUNCATE
      stores, roles, admin_users, users, addresses,
      categories, products, product_variants, product_images,
      orders, order_items, order_status_history, order_refunds,
      carts, cart_items, reviews, coupons, coupon_usages,
      notifications, announcements, activity_events,
      point_transactions, subscribers
    RESTART IDENTITY CASCADE
  `);

  console.log("Roles…");
  const [superAdminRole] = await db
    .insert(roles)
    .values({
      name: "Super Admin",
      description: "Unrestricted access to everything",
      permissions: [],
      isSuperAdmin: true,
    })
    .returning();

  console.log("Admin user…");
  const passwordHash = await bcrypt.hash("admin123", 12);
  await db.insert(adminUsers).values({
    name: "Super Admin",
    email: "admin@example.com",
    passwordHash,
    roleId: superAdminRole.id,
    assignedStores: [],
  });

  console.log("Stores…");
  const storeSeeds: StoreSeed[] = [
    {
      slug: "shirts-hub",
      name: "Shirts Hub",
      domains: ["shirts.localhost", "www.lourhaus.com"],
      theme: {
        primaryColor: "#2563EB",
        secondaryColor: "#3B82F6",
        accentColor: "#DBEAFE",
        backgroundColor: "#FFFFFF",
        textColor: "#1E293B",
        headerBg: "#1E3A5F",
        headerText: "#FFFFFF",
        fontFamily: "Inter",
        borderRadius: "0.5rem",
        layoutStyle: "grid",
      },
      heroBanners: [
        {
          image: "",
          title: { en: "Premium Shirts Collection" },
          subtitle: { en: "Find the perfect shirt for every occasion" },
          linkUrl: "/products",
          linkText: "Shop Shirts",
        },
      ],
      seo: {
        title: { en: "Shirts Hub - Premium Shirt Collection" },
        description: {
          en: "Shop the best shirts online. Casual, formal, and designer shirts for men and women.",
        },
        keywords: ["shirts", "formal shirts", "casual shirts", "designer shirts"],
      },
      payment: { provider: "stripe", currency: "USD" },
      contact: {
        email: "info@shirts.com",
        phone: "+1-555-0100",
        address: "123 Fashion Street, NY 10001",
      },
      supportedLanguages: ["en", "bn"],
      defaultLanguage: "en",
    },
    {
      slug: "punjabi-palace",
      name: "Punjabi Palace",
      domains: ["punjabi.localhost", "www.punjabi.com"],
      theme: {
        primaryColor: "#D97706",
        secondaryColor: "#B45309",
        accentColor: "#FEF3C7",
        backgroundColor: "#FFFBEB",
        textColor: "#1C1917",
        headerBg: "#7C2D12",
        headerText: "#FFFFFF",
        fontFamily: "Playfair Display",
        borderRadius: "0.75rem",
        layoutStyle: "grid",
      },
      heroBanners: [
        {
          image: "",
          title: { en: "Elegant Punjabi Collection" },
          subtitle: { en: "Handcrafted traditional wear for every celebration" },
          linkUrl: "/products",
          linkText: "Shop Punjabis",
        },
      ],
      seo: {
        title: { en: "Punjabi Palace - Traditional Clothing" },
        description: {
          en: "Discover beautiful punjabi, kurta, and traditional clothing for men and women.",
        },
        keywords: ["punjabi", "kurta", "traditional wear", "ethnic clothing"],
      },
      payment: { provider: "sslcommerz", currency: "BDT" },
      contact: {
        email: "info@punjabi.com",
        phone: "+880-1700-000000",
        address: "45 Gulshan Avenue, Dhaka 1212",
      },
      supportedLanguages: ["en", "bn"],
      defaultLanguage: "en",
    },
    {
      slug: "shoes-world",
      name: "Shoes World",
      domains: ["shoes.localhost", "www.shoes.com"],
      theme: {
        primaryColor: "#059669",
        secondaryColor: "#10B981",
        accentColor: "#D1FAE5",
        backgroundColor: "#FFFFFF",
        textColor: "#111827",
        headerBg: "#064E3B",
        headerText: "#FFFFFF",
        fontFamily: "Poppins",
        borderRadius: "1rem",
        layoutStyle: "grid",
      },
      heroBanners: [
        {
          image: "",
          title: { en: "Step Into Style" },
          subtitle: { en: "Premium footwear for every step of your journey" },
          linkUrl: "/products",
          linkText: "Shop Shoes",
        },
      ],
      seo: {
        title: { en: "Shoes World - Premium Footwear" },
        description: {
          en: "Find the best shoes, sneakers, boots, and sandals for men and women.",
        },
        keywords: ["shoes", "sneakers", "boots", "footwear", "sandals"],
      },
      payment: { provider: "stripe", currency: "USD" },
      contact: {
        email: "info@shoes.com",
        phone: "+1-555-0200",
        address: "789 Shoe Lane, LA 90001",
      },
      supportedLanguages: ["en", "bn"],
      defaultLanguage: "en",
    },
  ];

  const insertedStores = await db.insert(stores).values(storeSeeds).returning({ id: stores.id, slug: stores.slug });
  const storeIdBySlug = Object.fromEntries(insertedStores.map((s) => [s.slug, s.id]));

  const shirtsId = storeIdBySlug["shirts-hub"];
  const punjabiId = storeIdBySlug["punjabi-palace"];
  const shoesId = storeIdBySlug["shoes-world"];

  console.log("Categories…");
  const categorySeeds: CategorySeed[] = [
    { storeId: shirtsId, slug: "casual-shirts", name: { en: "Casual Shirts" }, description: { en: "Everyday comfortable shirts" }, sortOrder: 1 },
    { storeId: shirtsId, slug: "formal-shirts", name: { en: "Formal Shirts" }, description: { en: "Professional and elegant shirts" }, sortOrder: 2 },
    { storeId: shirtsId, slug: "t-shirts", name: { en: "T-Shirts" }, description: { en: "Casual t-shirts and graphic tees" }, sortOrder: 3 },
    { storeId: punjabiId, slug: "cotton-punjabi", name: { en: "Cotton Punjabi" }, description: { en: "Comfortable cotton punjabis" }, sortOrder: 1 },
    { storeId: punjabiId, slug: "silk-punjabi", name: { en: "Silk Punjabi" }, description: { en: "Premium silk punjabis" }, sortOrder: 2 },
    { storeId: punjabiId, slug: "designer-punjabi", name: { en: "Designer Punjabi" }, description: { en: "Exclusive designer collection" }, sortOrder: 3 },
    { storeId: shoesId, slug: "sneakers", name: { en: "Sneakers" }, description: { en: "Casual and sport sneakers" }, sortOrder: 1 },
    { storeId: shoesId, slug: "boots", name: { en: "Boots" }, description: { en: "Durable and stylish boots" }, sortOrder: 2 },
    { storeId: shoesId, slug: "sandals", name: { en: "Sandals" }, description: { en: "Comfortable sandals and flip-flops" }, sortOrder: 3 },
  ];
  const insertedCats = await db
    .insert(categories)
    .values(categorySeeds)
    .returning({ id: categories.id, storeId: categories.storeId, slug: categories.slug });
  const catId = (storeId: string, slug: string) =>
    insertedCats.find((c) => c.storeId === storeId && c.slug === slug)!.id;

  console.log("Products + variants…");
  type ProductPlan = ProductSeed & { variantSizes?: { value: string; stock: number; priceMod?: number }[] };
  const productPlans: ProductPlan[] = [
    {
      storeId: shirtsId,
      categoryId: catId(shirtsId, "formal-shirts"),
      slug: "classic-white-oxford",
      name: { en: "Classic White Oxford" },
      description: { en: "A timeless white oxford shirt made from premium cotton." },
      shortDescription: { en: "Premium cotton oxford shirt" },
      price: "49.99",
      compareAtPrice: "69.99",
      costPrice: "20",
      sku: "SH-OX-001",
      stock: 50,
      tags: ["formal", "white", "oxford"],
      options: [{ name: "Size", values: ["S", "M", "L", "XL"] }],
      isFeatured: true,
      averageRating: "4.5",
      reviewCount: 12,
      variantSizes: [
        { value: "S", stock: 10 },
        { value: "M", stock: 15 },
        { value: "L", stock: 15 },
        { value: "XL", stock: 10, priceMod: 5 },
      ],
    },
    {
      storeId: shirtsId,
      categoryId: catId(shirtsId, "casual-shirts"),
      slug: "blue-denim-casual",
      name: { en: "Blue Denim Casual Shirt" },
      description: { en: "Stylish denim shirt for a casual look." },
      shortDescription: { en: "Casual denim shirt" },
      price: "39.99",
      costPrice: "15",
      sku: "SH-DN-001",
      stock: 30,
      tags: ["casual", "denim", "blue"],
      options: [{ name: "Size", values: ["M", "L", "XL"] }],
      isFeatured: true,
      averageRating: "4.2",
      reviewCount: 8,
      variantSizes: [
        { value: "M", stock: 10 },
        { value: "L", stock: 10 },
        { value: "XL", stock: 10 },
      ],
    },
    {
      storeId: shirtsId,
      categoryId: catId(shirtsId, "t-shirts"),
      slug: "graphic-print-tshirt",
      name: { en: "Graphic Print T-Shirt" },
      description: { en: "Cool graphic tee for everyday wear." },
      shortDescription: { en: "Graphic print cotton tee" },
      price: "24.99",
      compareAtPrice: "34.99",
      costPrice: "8",
      sku: "SH-GT-001",
      stock: 100,
      tags: ["t-shirt", "graphic", "casual"],
      options: [{ name: "Size", values: ["S", "M", "L", "XL"] }],
      isFeatured: true,
      averageRating: "4.0",
      reviewCount: 20,
      variantSizes: [
        { value: "S", stock: 25 },
        { value: "M", stock: 25 },
        { value: "L", stock: 25 },
        { value: "XL", stock: 25 },
      ],
    },
    {
      storeId: punjabiId,
      categoryId: catId(punjabiId, "cotton-punjabi"),
      slug: "royal-blue-cotton-punjabi",
      name: { en: "Royal Blue Cotton Punjabi" },
      description: { en: "Comfortable royal blue cotton punjabi for daily wear and occasions." },
      shortDescription: { en: "Premium cotton punjabi" },
      price: "1200",
      compareAtPrice: "1500",
      costPrice: "500",
      sku: "PJ-CT-001",
      stock: 30,
      tags: ["cotton", "blue", "daily"],
      options: [{ name: "Size", values: ["38", "40", "42"] }],
      isFeatured: true,
      averageRating: "4.7",
      reviewCount: 15,
      variantSizes: [
        { value: "38", stock: 10 },
        { value: "40", stock: 10 },
        { value: "42", stock: 10, priceMod: 50 },
      ],
    },
    {
      storeId: punjabiId,
      categoryId: catId(punjabiId, "silk-punjabi"),
      slug: "embroidered-silk-punjabi",
      name: { en: "Embroidered Silk Punjabi" },
      description: { en: "Elegant embroidered silk punjabi for special occasions." },
      shortDescription: { en: "Hand-embroidered silk punjabi" },
      price: "3500",
      compareAtPrice: "4500",
      costPrice: "1500",
      sku: "PJ-SK-001",
      stock: 15,
      tags: ["silk", "embroidered", "wedding"],
      options: [{ name: "Size", values: ["38", "40", "42"] }],
      isFeatured: true,
      averageRating: "4.9",
      reviewCount: 7,
      variantSizes: [
        { value: "38", stock: 5 },
        { value: "40", stock: 5 },
        { value: "42", stock: 5, priceMod: 100 },
      ],
    },
    {
      storeId: shoesId,
      categoryId: catId(shoesId, "sneakers"),
      slug: "air-runner-pro",
      name: { en: "Air Runner Pro" },
      description: { en: "Lightweight running shoes with advanced cushioning." },
      shortDescription: { en: "Performance running sneakers" },
      price: "129.99",
      compareAtPrice: "159.99",
      costPrice: "55",
      sku: "SH-RN-001",
      stock: 60,
      tags: ["running", "sneakers", "sport"],
      options: [{ name: "Size", values: ["8", "9", "10", "11"] }],
      isFeatured: true,
      averageRating: "4.6",
      reviewCount: 28,
      variantSizes: [
        { value: "8", stock: 15 },
        { value: "9", stock: 15 },
        { value: "10", stock: 15 },
        { value: "11", stock: 15 },
      ],
    },
    {
      storeId: shoesId,
      categoryId: catId(shoesId, "boots"),
      slug: "classic-leather-boot",
      name: { en: "Classic Leather Boot" },
      description: { en: "Handcrafted leather boots for a rugged look." },
      shortDescription: { en: "Premium leather boots" },
      price: "189.99",
      costPrice: "80",
      sku: "SH-BT-001",
      stock: 25,
      tags: ["boots", "leather", "classic"],
      options: [{ name: "Size", values: ["8", "9", "10"] }],
      isFeatured: true,
      averageRating: "4.8",
      reviewCount: 11,
      variantSizes: [
        { value: "8", stock: 5 },
        { value: "9", stock: 10 },
        { value: "10", stock: 10 },
      ],
    },
    {
      storeId: shoesId,
      categoryId: catId(shoesId, "sandals"),
      slug: "summer-breeze-sandals",
      name: { en: "Summer Breeze Sandals" },
      description: { en: "Comfortable open-toe sandals for summer." },
      shortDescription: { en: "Comfortable summer sandals" },
      price: "39.99",
      compareAtPrice: "54.99",
      costPrice: "12",
      sku: "SH-SD-001",
      stock: 80,
      tags: ["sandals", "summer", "casual"],
      options: [{ name: "Size", values: ["7", "8", "9", "10"] }],
      isFeatured: true,
      averageRating: "4.1",
      reviewCount: 15,
      variantSizes: [
        { value: "7", stock: 20 },
        { value: "8", stock: 20 },
        { value: "9", stock: 20 },
        { value: "10", stock: 20 },
      ],
    },
  ];

  for (const plan of productPlans) {
    const { variantSizes, ...productRow } = plan;
    const [inserted] = await db.insert(products).values(productRow).returning({ id: products.id, price: products.price });
    if (variantSizes?.length) {
      const variantRows: VariantSeed[] = variantSizes.map((v) => ({
        productId: inserted.id,
        optionValues: { Size: v.value },
        price: v.priceMod ? (Number(inserted.price) + v.priceMod).toFixed(2) : null,
        stock: v.stock,
      }));
      await db.insert(productVariants).values(variantRows);
    }
  }

  console.log("\nSeed complete.\n");
  console.log("Stores:");
  console.log("  - Shirts Hub     → http://shirts.localhost:3000");
  console.log("  - Punjabi Palace → http://punjabi.localhost:3000");
  console.log("  - Shoes World    → http://shoes.localhost:3000");
  console.log("\nAdmin panel → http://localhost:3000/admin");
  console.log("Admin login: admin@example.com / admin123\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

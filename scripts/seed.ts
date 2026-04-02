import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-multitenant";

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const db = mongoose.connection.db!;

  // Clear existing data
  const collections = ["stores", "products", "categories", "adminusers", "users", "carts", "orders", "reviews"];
  for (const col of collections) {
    try {
      await db.collection(col).drop();
    } catch {
      // Collection might not exist
    }
  }
  console.log("Cleared existing data.");

  // ── Admin User ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  const [admin] = await db.collection("adminusers").insertMany([
    {
      name: "Super Admin",
      email: "admin@example.com",
      passwordHash,
      role: "superadmin",
      assignedStores: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log("Created admin: admin@example.com / admin123");

  // ── Stores ──────────────────────────────────────────────────
  const stores = await db.collection("stores").insertMany([
    {
      name: "Shirts Hub",
      slug: "shirts-hub",
      domains: ["shirts.localhost", "www.shirts.com"],
      isActive: true,
      logo: "",
      favicon: "",
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
          title: "Premium Shirts Collection",
          subtitle: "Find the perfect shirt for every occasion",
          linkUrl: "/products",
          linkText: "Shop Shirts",
        },
      ],
      seo: {
        title: "Shirts Hub - Premium Shirt Collection",
        description: "Shop the best shirts online. Casual, formal, and designer shirts for men and women.",
        keywords: ["shirts", "formal shirts", "casual shirts", "designer shirts"],
        ogImage: "",
      },
      payment: {
        provider: "stripe",
        stripePublicKey: "",
        stripeSecretKey: "",
        sslcommerzStoreId: "",
        sslcommerzStorePassword: "",
        currency: "USD",
      },
      contact: {
        email: "info@shirts.com",
        phone: "+1-555-0100",
        address: "123 Fashion Street, NY 10001",
      },
      socialLinks: { facebook: "", instagram: "", twitter: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Punjabi Palace",
      slug: "punjabi-palace",
      domains: ["punjabi.localhost", "www.punjabi.com"],
      isActive: true,
      logo: "",
      favicon: "",
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
          title: "Elegant Punjabi Collection",
          subtitle: "Handcrafted traditional wear for every celebration",
          linkUrl: "/products",
          linkText: "Shop Punjabis",
        },
      ],
      seo: {
        title: "Punjabi Palace - Traditional Clothing",
        description: "Discover beautiful punjabi, kurta, and traditional clothing for men and women.",
        keywords: ["punjabi", "kurta", "traditional wear", "ethnic clothing"],
        ogImage: "",
      },
      payment: {
        provider: "sslcommerz",
        stripePublicKey: "",
        stripeSecretKey: "",
        sslcommerzStoreId: "",
        sslcommerzStorePassword: "",
        currency: "BDT",
      },
      contact: {
        email: "info@punjabi.com",
        phone: "+880-1700-000000",
        address: "45 Gulshan Avenue, Dhaka 1212",
      },
      socialLinks: { facebook: "", instagram: "", twitter: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Shoes World",
      slug: "shoes-world",
      domains: ["shoes.localhost", "www.shoes.com"],
      isActive: true,
      logo: "",
      favicon: "",
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
          title: "Step Into Style",
          subtitle: "Premium footwear for every step of your journey",
          linkUrl: "/products",
          linkText: "Shop Shoes",
        },
      ],
      seo: {
        title: "Shoes World - Premium Footwear",
        description: "Find the best shoes, sneakers, boots, and sandals for men and women.",
        keywords: ["shoes", "sneakers", "boots", "footwear", "sandals"],
        ogImage: "",
      },
      payment: {
        provider: "stripe",
        stripePublicKey: "",
        stripeSecretKey: "",
        sslcommerzStoreId: "",
        sslcommerzStorePassword: "",
        currency: "USD",
      },
      contact: {
        email: "info@shoes.com",
        phone: "+1-555-0200",
        address: "789 Shoe Lane, LA 90001",
      },
      socialLinks: { facebook: "", instagram: "", twitter: "" },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const storeIds = Object.values(stores.insertedIds);
  console.log(`Created ${storeIds.length} stores.`);

  // ── Categories ──────────────────────────────────────────────
  const shirtsId = storeIds[0];
  const punjabiId = storeIds[1];
  const shoesId = storeIds[2];

  const shirtCategories = await db.collection("categories").insertMany([
    { storeId: shirtsId, name: "Casual Shirts", slug: "casual-shirts", description: "Everyday comfortable shirts", image: "", parentId: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shirtsId, name: "Formal Shirts", slug: "formal-shirts", description: "Professional and elegant shirts", image: "", parentId: null, sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shirtsId, name: "T-Shirts", slug: "t-shirts", description: "Casual t-shirts and graphic tees", image: "", parentId: null, sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);

  const punjabiCategories = await db.collection("categories").insertMany([
    { storeId: punjabiId, name: "Cotton Punjabi", slug: "cotton-punjabi", description: "Comfortable cotton punjabis", image: "", parentId: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { storeId: punjabiId, name: "Silk Punjabi", slug: "silk-punjabi", description: "Premium silk punjabis", image: "", parentId: null, sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { storeId: punjabiId, name: "Designer Punjabi", slug: "designer-punjabi", description: "Exclusive designer collection", image: "", parentId: null, sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);

  const shoeCategories = await db.collection("categories").insertMany([
    { storeId: shoesId, name: "Sneakers", slug: "sneakers", description: "Casual and sport sneakers", image: "", parentId: null, sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shoesId, name: "Boots", slug: "boots", description: "Durable and stylish boots", image: "", parentId: null, sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shoesId, name: "Sandals", slug: "sandals", description: "Comfortable sandals and flip-flops", image: "", parentId: null, sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log("Created categories.");

  // ── Products ────────────────────────────────────────────────
  const shirtCatIds = Object.values(shirtCategories.insertedIds);
  const punjabiCatIds = Object.values(punjabiCategories.insertedIds);
  const shoeCatIds = Object.values(shoeCategories.insertedIds);

  await db.collection("products").insertMany([
    // Shirts Hub products
    { storeId: shirtsId, name: "Classic White Oxford", slug: "classic-white-oxford", description: "A timeless white oxford shirt made from premium cotton.", shortDescription: "Premium cotton oxford shirt", price: 49.99, compareAtPrice: 69.99, costPrice: 20, sku: "SH-OX-001", barcode: "", stock: 50, trackInventory: true, images: [], thumbnail: "", categoryId: shirtCatIds[1], tags: ["formal", "white", "oxford"], variants: [{ name: "Size", options: [{ value: "S", priceModifier: 0, stock: 10, sku: "SH-OX-001-S" }, { value: "M", priceModifier: 0, stock: 15, sku: "SH-OX-001-M" }, { value: "L", priceModifier: 0, stock: 15, sku: "SH-OX-001-L" }, { value: "XL", priceModifier: 5, stock: 10, sku: "SH-OX-001-XL" }] }], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.5, reviewCount: 12, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shirtsId, name: "Blue Denim Casual Shirt", slug: "blue-denim-casual", description: "Stylish denim shirt for a casual look.", shortDescription: "Casual denim shirt", price: 39.99, compareAtPrice: 0, costPrice: 15, sku: "SH-DN-001", barcode: "", stock: 30, trackInventory: true, images: [], thumbnail: "", categoryId: shirtCatIds[0], tags: ["casual", "denim", "blue"], variants: [{ name: "Size", options: [{ value: "M", priceModifier: 0, stock: 10, sku: "" }, { value: "L", priceModifier: 0, stock: 10, sku: "" }, { value: "XL", priceModifier: 0, stock: 10, sku: "" }] }], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.2, reviewCount: 8, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shirtsId, name: "Graphic Print T-Shirt", slug: "graphic-print-tshirt", description: "Cool graphic tee for everyday wear.", shortDescription: "Graphic print cotton tee", price: 24.99, compareAtPrice: 34.99, costPrice: 8, sku: "SH-GT-001", barcode: "", stock: 100, trackInventory: true, images: [], thumbnail: "", categoryId: shirtCatIds[2], tags: ["t-shirt", "graphic", "casual"], variants: [{ name: "Size", options: [{ value: "S", priceModifier: 0, stock: 25, sku: "" }, { value: "M", priceModifier: 0, stock: 25, sku: "" }, { value: "L", priceModifier: 0, stock: 25, sku: "" }, { value: "XL", priceModifier: 0, stock: 25, sku: "" }] }], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.0, reviewCount: 20, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shirtsId, name: "Slim Fit Check Shirt", slug: "slim-fit-check-shirt", description: "Modern slim fit check pattern shirt.", shortDescription: "Slim fit check pattern", price: 44.99, compareAtPrice: 0, costPrice: 18, sku: "SH-CF-001", barcode: "", stock: 40, trackInventory: true, images: [], thumbnail: "", categoryId: shirtCatIds[0], tags: ["casual", "check", "slim-fit"], variants: [], isActive: true, isFeatured: false, seo: { title: "", description: "" }, averageRating: 0, reviewCount: 0, createdAt: new Date(), updatedAt: new Date() },

    // Punjabi Palace products
    { storeId: punjabiId, name: "Royal Blue Cotton Punjabi", slug: "royal-blue-cotton-punjabi", description: "Comfortable royal blue cotton punjabi for daily wear and occasions.", shortDescription: "Premium cotton punjabi", price: 1200, compareAtPrice: 1500, costPrice: 500, sku: "PJ-CT-001", barcode: "", stock: 30, trackInventory: true, images: [], thumbnail: "", categoryId: punjabiCatIds[0], tags: ["cotton", "blue", "daily"], variants: [{ name: "Size", options: [{ value: "38", priceModifier: 0, stock: 10, sku: "" }, { value: "40", priceModifier: 0, stock: 10, sku: "" }, { value: "42", priceModifier: 50, stock: 10, sku: "" }] }], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.7, reviewCount: 15, createdAt: new Date(), updatedAt: new Date() },
    { storeId: punjabiId, name: "Embroidered Silk Punjabi", slug: "embroidered-silk-punjabi", description: "Elegant embroidered silk punjabi for special occasions.", shortDescription: "Hand-embroidered silk punjabi", price: 3500, compareAtPrice: 4500, costPrice: 1500, sku: "PJ-SK-001", barcode: "", stock: 15, trackInventory: true, images: [], thumbnail: "", categoryId: punjabiCatIds[1], tags: ["silk", "embroidered", "wedding"], variants: [{ name: "Size", options: [{ value: "38", priceModifier: 0, stock: 5, sku: "" }, { value: "40", priceModifier: 0, stock: 5, sku: "" }, { value: "42", priceModifier: 100, stock: 5, sku: "" }] }], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.9, reviewCount: 7, createdAt: new Date(), updatedAt: new Date() },
    { storeId: punjabiId, name: "White Cotton Punjabi", slug: "white-cotton-punjabi", description: "Classic white cotton punjabi, perfect for everyday wear.", shortDescription: "Classic white cotton", price: 999, compareAtPrice: 0, costPrice: 400, sku: "PJ-CT-002", barcode: "", stock: 50, trackInventory: true, images: [], thumbnail: "", categoryId: punjabiCatIds[0], tags: ["cotton", "white", "classic"], variants: [], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.3, reviewCount: 22, createdAt: new Date(), updatedAt: new Date() },
    { storeId: punjabiId, name: "Designer Black Punjabi", slug: "designer-black-punjabi", description: "Exclusive designer black punjabi with intricate detailing.", shortDescription: "Designer collection", price: 5500, compareAtPrice: 7000, costPrice: 2500, sku: "PJ-DS-001", barcode: "", stock: 10, trackInventory: true, images: [], thumbnail: "", categoryId: punjabiCatIds[2], tags: ["designer", "black", "premium"], variants: [], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 5.0, reviewCount: 3, createdAt: new Date(), updatedAt: new Date() },

    // Shoes World products
    { storeId: shoesId, name: "Air Runner Pro", slug: "air-runner-pro", description: "Lightweight running shoes with advanced cushioning.", shortDescription: "Performance running sneakers", price: 129.99, compareAtPrice: 159.99, costPrice: 55, sku: "SH-RN-001", barcode: "", stock: 60, trackInventory: true, images: [], thumbnail: "", categoryId: shoeCatIds[0], tags: ["running", "sneakers", "sport"], variants: [{ name: "Size", options: [{ value: "8", priceModifier: 0, stock: 15, sku: "" }, { value: "9", priceModifier: 0, stock: 15, sku: "" }, { value: "10", priceModifier: 0, stock: 15, sku: "" }, { value: "11", priceModifier: 0, stock: 15, sku: "" }] }, { name: "Color", options: [{ value: "Black", priceModifier: 0, stock: 30, sku: "" }, { value: "White", priceModifier: 0, stock: 30, sku: "" }] }], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.6, reviewCount: 28, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shoesId, name: "Classic Leather Boot", slug: "classic-leather-boot", description: "Handcrafted leather boots for a rugged look.", shortDescription: "Premium leather boots", price: 189.99, compareAtPrice: 0, costPrice: 80, sku: "SH-BT-001", barcode: "", stock: 25, trackInventory: true, images: [], thumbnail: "", categoryId: shoeCatIds[1], tags: ["boots", "leather", "classic"], variants: [{ name: "Size", options: [{ value: "8", priceModifier: 0, stock: 5, sku: "" }, { value: "9", priceModifier: 0, stock: 10, sku: "" }, { value: "10", priceModifier: 0, stock: 10, sku: "" }] }], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.8, reviewCount: 11, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shoesId, name: "Summer Breeze Sandals", slug: "summer-breeze-sandals", description: "Comfortable open-toe sandals for summer.", shortDescription: "Comfortable summer sandals", price: 39.99, compareAtPrice: 54.99, costPrice: 12, sku: "SH-SD-001", barcode: "", stock: 80, trackInventory: true, images: [], thumbnail: "", categoryId: shoeCatIds[2], tags: ["sandals", "summer", "casual"], variants: [{ name: "Size", options: [{ value: "7", priceModifier: 0, stock: 20, sku: "" }, { value: "8", priceModifier: 0, stock: 20, sku: "" }, { value: "9", priceModifier: 0, stock: 20, sku: "" }, { value: "10", priceModifier: 0, stock: 20, sku: "" }] }], isActive: true, isFeatured: true, seo: { title: "", description: "" }, averageRating: 4.1, reviewCount: 15, createdAt: new Date(), updatedAt: new Date() },
    { storeId: shoesId, name: "Urban Street Sneaker", slug: "urban-street-sneaker", description: "Trendy street-style sneakers.", shortDescription: "Urban style sneakers", price: 89.99, compareAtPrice: 0, costPrice: 35, sku: "SH-SN-002", barcode: "", stock: 45, trackInventory: true, images: [], thumbnail: "", categoryId: shoeCatIds[0], tags: ["sneakers", "street", "urban"], variants: [], isActive: true, isFeatured: false, seo: { title: "", description: "" }, averageRating: 0, reviewCount: 0, createdAt: new Date(), updatedAt: new Date() },
  ]);

  console.log("Created products.");
  console.log("\n✅ Seed complete!\n");
  console.log("Stores created:");
  console.log("  - Shirts Hub     → http://shirts.localhost:3000");
  console.log("  - Punjabi Palace → http://punjabi.localhost:3000");
  console.log("  - Shoes World    → http://shoes.localhost:3000");
  console.log("\nAdmin panel → http://localhost:3000/admin");
  console.log("Admin login: admin@example.com / admin123\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-multitenant";

// Color presets with light and dark modes
const COLOR_PRESETS = {
  // Modern Blue (Tech/SaaS)
  "blue-modern": {
    name: "Modern Blue",
    theme: {
      primaryColor: "#2563EB",
      secondaryColor: "#0EA5E9",
      accentColor: "#F59E0B",
      backgroundColor: "#FFFFFF",
      textColor: "#111827",
      headerBg: "#1E3A5F",
      headerText: "#FFFFFF",
      fontFamily: "Inter",
      borderRadius: "0.5rem",
      layoutStyle: "grid",
      dark: {
        backgroundColor: "#0F172A",
        textColor: "#F1F5F9",
        surfaceColor: "#1E293B",
        borderColor: "#334155",
        headerBg: "#030712",
        headerText: "#F1F5F9",
      },
    },
  },

  // Premium Purple (Fashion/Luxury)
  "purple-premium": {
    name: "Premium Purple",
    theme: {
      primaryColor: "#7C3AED",
      secondaryColor: "#EC4899",
      accentColor: "#06B6D4",
      backgroundColor: "#FAFAF9",
      textColor: "#1C1917",
      headerBg: "#5B21B6",
      headerText: "#FFFFFF",
      fontFamily: "Playfair Display",
      borderRadius: "0.75rem",
      layoutStyle: "grid",
      dark: {
        backgroundColor: "#1F1917",
        textColor: "#F5F5F4",
        surfaceColor: "#292524",
        borderColor: "#44403C",
        headerBg: "#3F0F5C",
        headerText: "#F5F5F4",
      },
    },
  },

  // Vibrant Green (Health/Wellness)
  "green-vibrant": {
    name: "Vibrant Green",
    theme: {
      primaryColor: "#059669",
      secondaryColor: "#06B6D4",
      accentColor: "#F59E0B",
      backgroundColor: "#F0FDFA",
      textColor: "#134E4A",
      headerBg: "#065F46",
      headerText: "#ECFDF5",
      fontFamily: "Poppins",
      borderRadius: "0.5rem",
      layoutStyle: "grid",
      dark: {
        backgroundColor: "#051F1A",
        textColor: "#CCFBF1",
        surfaceColor: "#0D433D",
        borderColor: "#134E4A",
        headerBg: "#0F2F2B",
        headerText: "#CCFBF1",
      },
    },
  },

  // Warm Orange (Food/Retail)
  "orange-warm": {
    name: "Warm Orange",
    theme: {
      primaryColor: "#EA580C",
      secondaryColor: "#DC2626",
      accentColor: "#EAB308",
      backgroundColor: "#FFFBEB",
      textColor: "#78350F",
      headerBg: "#92400E",
      headerText: "#FFFBEB",
      fontFamily: "Inter",
      borderRadius: "0.5rem",
      layoutStyle: "grid",
      dark: {
        backgroundColor: "#1F0605",
        textColor: "#FEF3C7",
        surfaceColor: "#3F1308",
        borderColor: "#78350F",
        headerBg: "#431407",
        headerText: "#FEF3C7",
      },
    },
  },

  // Professional Gray (Corporate/B2B)
  "gray-professional": {
    name: "Professional Gray",
    theme: {
      primaryColor: "#374151",
      secondaryColor: "#4B5563",
      accentColor: "#3B82F6",
      backgroundColor: "#F9FAFB",
      textColor: "#111827",
      headerBg: "#1F2937",
      headerText: "#FFFFFF",
      fontFamily: "Inter",
      borderRadius: "0.5rem",
      layoutStyle: "grid",
      dark: {
        backgroundColor: "#030712",
        textColor: "#F3F4F6",
        surfaceColor: "#111827",
        borderColor: "#374151",
        headerBg: "#000000",
        headerText: "#F3F4F6",
      },
    },
  },

  // Bold Rose (Beauty/Cosmetics)
  "rose-bold": {
    name: "Bold Rose",
    theme: {
      primaryColor: "#BE185D",
      secondaryColor: "#EC4899",
      accentColor: "#F43F5E",
      backgroundColor: "#FFF1F2",
      textColor: "#500724",
      headerBg: "#831843",
      headerText: "#FFF1F2",
      fontFamily: "Poppins",
      borderRadius: "0.5rem",
      layoutStyle: "grid",
      dark: {
        backgroundColor: "#1F0819",
        textColor: "#FFE4E6",
        surfaceColor: "#3D0E2A",
        borderColor: "#831843",
        headerBg: "#200810",
        headerText: "#FFE4E6",
      },
    },
  },
};

async function seedColors() {
  console.log("🎨 Seeding store colors...\n");

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB\n");

    const db = mongoose.connection.db!;
    const storesCollection = db.collection("stores");

    // Get all stores
    const stores = await storesCollection.find({}).toArray();
    console.log(`Found ${stores.length} stores\n`);

    if (stores.length === 0) {
      console.log("❌ No stores found. Run seed.ts first.");
      return;
    }

    // Apply presets to stores by index
    const presetKeys = Object.keys(COLOR_PRESETS);
    const presets = Object.values(COLOR_PRESETS);

    for (let i = 0; i < stores.length && i < presets.length; i++) {
      const store = stores[i];
      const preset = presets[i];
      const presetKey = presetKeys[i];

      console.log(`📦 Store: ${store.name}`);
      console.log(`   Preset: ${preset.name} (${presetKey})`);
      console.log(`   Colors: Primary: ${preset.theme.primaryColor}, Secondary: ${preset.theme.secondaryColor}`);
      console.log(`   Dark Mode: BG: ${preset.theme.dark.backgroundColor}, Text: ${preset.theme.dark.textColor}\n`);

      await storesCollection.updateOne(
        { _id: store._id },
        {
          $set: {
            theme: preset.theme,
            updatedAt: new Date(),
          },
        }
      );
    }

    console.log(`✓ Successfully seeded colors for ${Math.min(stores.length, presets.length)} stores`);

    // Print color reference
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                    SEEDED COLOR PRESETS                       ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");

    for (let i = 0; i < stores.length && i < presets.length; i++) {
      const store = stores[i];
      const preset = presets[i];
      console.log(`${i + 1}. ${store.name}`);
      console.log(`   Preset: ${preset.name}`);
      console.log(`   Primary: ${preset.theme.primaryColor} | Secondary: ${preset.theme.secondaryColor}`);
      console.log(`   Light BG: ${preset.theme.backgroundColor} | Dark BG: ${preset.theme.dark.backgroundColor}\n`);
    }

    await mongoose.disconnect();
    console.log("✓ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

seedColors();

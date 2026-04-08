/**
 * Migration script: wrap plain-string dynamic fields into LocalizedString objects.
 *
 * Run ONCE after deploying the multi-language update:
 *   npx tsx scripts/migrate-i18n.ts
 *
 * Safe to run multiple times — already-migrated documents are skipped.
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env.local");
  process.exit(1);
}

/** Wrap a value in { en: value } if it's a plain string; leave objects unchanged. */
function wrap(value: unknown): Record<string, string> {
  if (typeof value === "string") return { en: value };
  if (value && typeof value === "object" && !Array.isArray(value))
    return value as Record<string, string>;
  return { en: "" };
}

async function migrateProducts(db: mongoose.Connection) {
  const col = db.collection("products");
  const cursor = col.find({});
  let updated = 0;

  for await (const doc of cursor) {
    const update: Record<string, unknown> = {};

    if (typeof doc.name === "string") update.name = wrap(doc.name);
    if (typeof doc.description === "string") update.description = wrap(doc.description);
    if (typeof doc.shortDescription === "string") update.shortDescription = wrap(doc.shortDescription);
    if (doc.seo) {
      if (typeof doc.seo.title === "string") update["seo.title"] = wrap(doc.seo.title);
      if (typeof doc.seo.description === "string") update["seo.description"] = wrap(doc.seo.description);
    }

    if (Object.keys(update).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      updated++;
    }
  }

  console.log(`Products: migrated ${updated} documents`);
}

async function migrateCategories(db: mongoose.Connection) {
  const col = db.collection("categories");
  const cursor = col.find({});
  let updated = 0;

  for await (const doc of cursor) {
    const update: Record<string, unknown> = {};

    if (typeof doc.name === "string") update.name = wrap(doc.name);
    if (typeof doc.description === "string") update.description = wrap(doc.description);

    if (Object.keys(update).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      updated++;
    }
  }

  console.log(`Categories: migrated ${updated} documents`);
}

async function migrateStores(db: mongoose.Connection) {
  const col = db.collection("stores");
  const cursor = col.find({});
  let updated = 0;

  for await (const doc of cursor) {
    const update: Record<string, unknown> = {};

    if (doc.seo) {
      if (typeof doc.seo.title === "string") update["seo.title"] = wrap(doc.seo.title);
      if (typeof doc.seo.description === "string") update["seo.description"] = wrap(doc.seo.description);
    }

    if (Array.isArray(doc.heroBanners)) {
      const migratedBanners = doc.heroBanners.map((banner: Record<string, unknown>) => ({
        ...banner,
        title: wrap(banner.title),
        subtitle: banner.subtitle ? wrap(banner.subtitle) : { en: "" },
      }));
      update.heroBanners = migratedBanners;
    }

    if (Object.keys(update).length > 0) {
      await col.updateOne({ _id: doc._id }, { $set: update });
      updated++;
    }
  }

  console.log(`Stores: migrated ${updated} documents`);
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection;
  console.log("Connected. Starting migration...\n");

  await migrateProducts(db);
  await migrateCategories(db);
  await migrateStores(db);

  console.log("\nMigration complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

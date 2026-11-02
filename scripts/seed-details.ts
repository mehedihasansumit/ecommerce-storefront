/**
 * Fill demo "Details" rows and size charts into an existing database, without reseeding.
 * Only touches rows that are still empty (details = [] / size_guide IS NULL), so anything
 * an admin already wrote is left alone.
 *
 *   npx tsx scripts/seed-details.ts
 */
import "dotenv/config";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "../src/db/client";
import { categories, products } from "../src/db/schema";
import { DEMO_DETAILS, DEMO_SIZE_GUIDES } from "../src/db/seed-details";

async function main() {
  let productCount = 0;
  for (const [slug, details] of Object.entries(DEMO_DETAILS)) {
    const rows = await db
      .update(products)
      .set({ details })
      .where(and(eq(products.slug, slug), sql`${products.details} = '[]'::jsonb`))
      .returning({ id: products.id });
    productCount += rows.length;
  }

  let categoryCount = 0;
  for (const [slug, sizeGuide] of Object.entries(DEMO_SIZE_GUIDES)) {
    const rows = await db
      .update(categories)
      .set({ sizeGuide })
      .where(and(eq(categories.slug, slug), isNull(categories.sizeGuide)))
      .returning({ id: categories.id });
    categoryCount += rows.length;
  }

  console.log(`Filled details on ${productCount} product(s), size charts on ${categoryCount} category(ies).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

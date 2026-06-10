import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { products, productImages } from "@/db/schema/products";
import { stores } from "@/db/schema/stores";
import { categories } from "@/db/schema/categories";
import { campaigns } from "@/db/schema/campaigns";

/**
 * Maintenance repository. Crosses table boundaries by design — it is the single
 * place that reads every blob-bearing column so the service can build the set of
 * object-storage keys that are still referenced by the database.
 *
 * Returns a flat array of raw string values (URLs, bare keys, and JSON-stringified
 * jsonb blobs). The service normalizes these into storage keys.
 */
export const MaintenanceRepository = {
  async collectReferencedValues(storeId?: string): Promise<string[]> {
    const values: string[] = [];
    const push = (v: unknown) => {
      if (v == null) return;
      if (typeof v === "string") {
        if (v) values.push(v);
      } else {
        // jsonb (variants, seo, heroBanners, localized descriptions, etc.)
        values.push(JSON.stringify(v));
      }
    };

    // products: thumbnail, seo, description, shortDescription
    const productRows = await db
      .select({
        thumbnail: products.thumbnail,
        seo: products.seo,
        description: products.description,
        shortDescription: products.shortDescription,
      })
      .from(products)
      .where(storeId ? eq(products.storeId, storeId) : undefined);
    for (const r of productRows) {
      push(r.thumbnail);
      push(r.seo);
      push(r.description);
      push(r.shortDescription);
    }

    // product_images: url, key, variants (filtered by store via join on products)
    const imageRows = storeId
      ? await db
          .select({
            url: productImages.url,
            key: productImages.key,
            variants: productImages.variants,
          })
          .from(productImages)
          .innerJoin(products, eq(productImages.productId, products.id))
          .where(eq(products.storeId, storeId))
      : await db
          .select({
            url: productImages.url,
            key: productImages.key,
            variants: productImages.variants,
          })
          .from(productImages);
    for (const r of imageRows) {
      push(r.url);
      push(r.key);
      push(r.variants);
    }

    // stores: logos, favicons, heroBanners, seo
    const storeRows = await db
      .select({
        logo: stores.logo,
        logoDark: stores.logoDark,
        favicon: stores.favicon,
        faviconDark: stores.faviconDark,
        heroBanners: stores.heroBanners,
        seo: stores.seo,
      })
      .from(stores)
      .where(storeId ? eq(stores.id, storeId) : undefined);
    for (const r of storeRows) {
      push(r.logo);
      push(r.logoDark);
      push(r.favicon);
      push(r.faviconDark);
      push(r.heroBanners);
      push(r.seo);
    }

    // categories: image, description
    const categoryRows = await db
      .select({
        image: categories.image,
        description: categories.description,
      })
      .from(categories)
      .where(storeId ? eq(categories.storeId, storeId) : undefined);
    for (const r of categoryRows) {
      push(r.image);
      push(r.description);
    }

    // campaigns: bannerImage, description
    const campaignRows = await db
      .select({
        bannerImage: campaigns.bannerImage,
        description: campaigns.description,
      })
      .from(campaigns)
      .where(storeId ? eq(campaigns.storeId, storeId) : undefined);
    for (const r of campaignRows) {
      push(r.bannerImage);
      push(r.description);
    }

    return values;
  },
};

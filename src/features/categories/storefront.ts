import { cache } from "react";
import { CategoryService } from "./service";
import { cachedForStore, storeTag } from "@/shared/lib/data-cache";

/**
 * Storefront category reads, cached per store across requests (expired by every
 * category, product and store write) and memoised per request, so a page and its
 * loading.tsx skeleton run each query at most once.
 */
export const getStoreCategories = cachedForStore(
  "store-categories",
  (storeId: string) => CategoryService.getByStore(storeId),
  { tags: (storeId) => [storeTag(storeId)] }
);

/** Top-level categories with active products (home tiles, /products chip row). */
export const getTopLevelCategoriesWithProducts = cachedForStore(
  "top-level-categories-with-products",
  async (storeId: string) =>
    CategoryService.getTopLevelWithProducts(storeId, await getStoreCategories(storeId)),
  { tags: (storeId) => [storeTag(storeId)] }
);

/** One lookup per request for generateMetadata and the page. */
export const getCategoryBySlug = cache((storeId: string, slug: string) =>
  CategoryService.getBySlug(storeId, slug)
);

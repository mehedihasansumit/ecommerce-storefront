import { cache } from "react";
import { CategoryService } from "./service";

/**
 * Per-request memoised category reads for storefront Server Components. A page and
 * its loading.tsx skeleton render in the same request, so routing both through these
 * runs each query once instead of twice.
 */
export const getStoreCategories = cache((storeId: string) =>
  CategoryService.getByStore(storeId)
);

/** Top-level categories with active products (home tiles, /products chip row). */
export const getTopLevelCategoriesWithProducts = cache(async (storeId: string) =>
  CategoryService.getTopLevelWithProducts(storeId, await getStoreCategories(storeId))
);

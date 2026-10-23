import { cache } from "react";
import { ProductService } from "./service";
import { cachedForStore, storeTag } from "@/shared/lib/data-cache";

/**
 * Storefront product reads. The home rows are cached per store across requests
 * (expired by product, review, order-stock and store writes). Product detail is
 * only memoised per request: stock and price there must be live.
 */
export const getFeaturedProducts = cachedForStore(
  "featured-products",
  (storeId: string) => ProductService.getFeatured(storeId, undefined),
  { tags: (storeId) => [storeTag(storeId)] }
);

export const getNewArrivalProducts = cachedForStore(
  "new-arrival-products",
  (storeId: string) => ProductService.getNewArrivals(storeId, undefined),
  { tags: (storeId) => [storeTag(storeId)] }
);

/** One lookup per request for generateMetadata and the page. */
export const getProductBySlug = cache((storeId: string, slug: string) =>
  ProductService.getBySlug(storeId, slug)
);

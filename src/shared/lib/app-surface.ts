/**
 * Request header set by src/proxy.ts on /admin requests. The root layout reads it
 * (via isAdminSurface() in tenant.ts) to render the admin brand-neutral even when it
 * is served from a store's domain. Edge-safe: no imports.
 */
export const APP_SURFACE_HEADER = "x-app-surface";

/**
 * Request header set by src/proxy.ts on storefront requests: the original path
 * and query as the shopper asked for it (with any /bn prefix). Lets the
 * storefront layout redirect a store's other domains to the same page on its
 * primary domain. Always overwritten by the proxy, so a client can't set it.
 */
export const STOREFRONT_PATH_HEADER = "x-storefront-path";

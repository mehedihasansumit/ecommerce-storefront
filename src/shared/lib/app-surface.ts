/**
 * Request header set by src/proxy.ts on /admin requests. The root layout reads it
 * (via isAdminSurface() in tenant.ts) to render the admin brand-neutral even when it
 * is served from a store's domain. Edge-safe: no imports.
 */
export const APP_SURFACE_HEADER = "x-app-surface";

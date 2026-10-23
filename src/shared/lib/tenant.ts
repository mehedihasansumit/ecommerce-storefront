import { headers } from "next/headers";
import { StoreRepository } from "@/features/stores/repository";
import type { IStore } from "@/features/stores/types";
import { toPublicStore } from "@/features/stores/public-store";
import { APP_SURFACE_HEADER } from "./app-surface";
import { cachedForStore, STORE_DOMAINS_TAG } from "./data-cache";

const findStoreByHost = cachedForStore(
  "store-by-domain",
  async (hostname: string): Promise<IStore | null> => {
    const store = await StoreRepository.findByDomain(hostname);
    return store ? toPublicStore(store) : null;
  },
  { tags: () => [STORE_DOMAINS_TAG] }
);

/**
 * Store for the current request's Host. Cached across requests (expired by every
 * store write) and memoised per request, so layout, loading and page share one lookup.
 */
export async function getTenant(): Promise<IStore | null> {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const hostname = host.split(":")[0];
  if (!hostname || hostname === "localhost") return null;
  return findStoreByHost(hostname).catch(() => null);
}

export async function getStoreId(): Promise<string | null> {
  const tenant = await getTenant();
  return tenant?._id ?? null;
}

/** True for /admin requests (flagged by middleware). The admin never takes tenant theming. */
export async function isAdminSurface(): Promise<boolean> {
  const headerList = await headers();
  return headerList.get(APP_SURFACE_HEADER) === "admin";
}

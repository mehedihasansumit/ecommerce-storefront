import { cache } from "react";
import { headers } from "next/headers";
import { StoreRepository } from "@/features/stores/repository";
import type { IStore } from "@/features/stores/types";
import { APP_SURFACE_HEADER } from "./app-surface";

const findStoreByHost = cache(async (hostname: string): Promise<IStore | null> => {
  try {
    return await StoreRepository.findByDomain(hostname);
  } catch {
    return null;
  }
});

/** Store for the current request's Host. Memoised per request (layout, loading and page share one lookup). */
export async function getTenant(): Promise<IStore | null> {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const hostname = host.split(":")[0];
  if (!hostname || hostname === "localhost") return null;
  return findStoreByHost(hostname);
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

import { headers } from "next/headers";
import { StoreRepository } from "@/features/stores/repository";
import type { IStore } from "@/features/stores/types";

export async function getTenant(): Promise<IStore | null> {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const hostname = host.split(":")[0];
  if (!hostname || hostname === "localhost") return null;
  try {
    return await StoreRepository.findByDomain(hostname);
  } catch {
    return null;
  }
}

export async function getStoreId(): Promise<string | null> {
  const tenant = await getTenant();
  return tenant?._id ?? null;
}

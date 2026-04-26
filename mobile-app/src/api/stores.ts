import { apiClient } from "./client";
import type { IStore } from "@/shared/types/store";

export async function resolveStore(domain: string): Promise<IStore> {
  const { data } = await apiClient.get<IStore>("/api/stores/resolve", {
    params: { domain },
    headers: { Host: domain },
  });
  return data;
}

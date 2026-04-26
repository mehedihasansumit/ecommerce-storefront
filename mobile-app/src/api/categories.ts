import { apiClient } from "./client";
import type { ICategory } from "@/shared/types/category";

export async function getCategories(): Promise<ICategory[]> {
  const { data } = await apiClient.get<{ categories: ICategory[] }>("/api/categories");
  return data.categories ?? data as unknown as ICategory[];
}

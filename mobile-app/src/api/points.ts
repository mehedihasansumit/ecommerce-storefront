import { apiClient } from "./client";
import type { IPointTransaction } from "@/shared/types/points";

export async function getPointsBalance(): Promise<number> {
  const { data } = await apiClient.get<{ balance: number }>("/api/points");
  return data.balance ?? 0;
}

export async function getPointsHistory(): Promise<IPointTransaction[]> {
  const { data } = await apiClient.get<{ transactions: IPointTransaction[] }>("/api/points/history");
  return data.transactions ?? (data as unknown as IPointTransaction[]);
}

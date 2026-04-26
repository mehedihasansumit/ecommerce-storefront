import { apiClient } from "./client";
import type { IAddress } from "@/shared/types/auth";

export async function getAddresses(): Promise<IAddress[]> {
  const { data } = await apiClient.get<{ addresses: IAddress[] }>("/api/addresses");
  return data.addresses ?? (data as unknown as IAddress[]);
}

export async function createAddress(
  address: Omit<IAddress, "_id">
): Promise<IAddress> {
  const { data } = await apiClient.post<IAddress>("/api/addresses", address);
  return data;
}

export async function updateAddress(
  id: string,
  address: Partial<Omit<IAddress, "_id">>
): Promise<IAddress> {
  const { data } = await apiClient.put<IAddress>(`/api/addresses/${id}`, address);
  return data;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/api/addresses/${id}`);
}

export async function setDefaultAddress(id: string): Promise<void> {
  await apiClient.put(`/api/addresses/${id}/default`);
}

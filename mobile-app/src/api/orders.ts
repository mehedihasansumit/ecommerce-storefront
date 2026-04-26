import { apiClient } from "./client";
import type { IOrder } from "@/shared/types/order";
import type { ICartItem } from "@/shared/types/cart";
import type { IShippingAddress } from "@/shared/types/order";

interface CreateOrderPayload {
  items: Array<{
    productId: string;
    quantity: number;
    variantSelections: Record<string, string>;
  }>;
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
  guestEmail?: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<IOrder> {
  const { data } = await apiClient.post<IOrder>("/api/orders", payload);
  return data;
}

export async function getOrders(): Promise<IOrder[]> {
  const { data } = await apiClient.get<{ orders: IOrder[] }>("/api/orders");
  return data.orders ?? (data as unknown as IOrder[]);
}

export async function getOrder(id: string): Promise<IOrder> {
  const { data } = await apiClient.get<IOrder>(`/api/orders/${id}`);
  return data;
}

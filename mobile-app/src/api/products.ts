import { apiClient } from "./client";
import type { IProduct } from "@/shared/types/product";

interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sort?: string;
  featured?: boolean;
}

interface ProductListResponse {
  data: IProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
  const { data } = await apiClient.get<ProductListResponse>("/api/products", { params });
  return data;
}

export async function getProduct(slug: string): Promise<IProduct> {
  const { data } = await apiClient.get<IProduct>(`/api/products/${slug}`);
  return data;
}

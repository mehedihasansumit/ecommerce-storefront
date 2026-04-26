import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getProducts, getProduct } from "@/api/products";
import { useTenantStore } from "@/store/tenant.store";

interface ProductFilters {
  search?: string;
  categoryId?: string;
  sort?: string;
  limit?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  const storeId = useTenantStore((s) => s.store?._id);

  return useInfiniteQuery({
    queryKey: [storeId, "products", filters],
    queryFn: ({ pageParam }) =>
      getProducts({ page: pageParam as number, limit: 12, ...filters }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.pages ? last.page + 1 : undefined,
    enabled: !!storeId,
  });
}

export function useProduct(slug: string) {
  const storeId = useTenantStore((s) => s.store?._id);

  return useQuery({
    queryKey: [storeId, "product", slug],
    queryFn: () => getProduct(slug),
    enabled: !!storeId && !!slug,
  });
}

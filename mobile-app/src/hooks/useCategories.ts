import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/api/categories";
import { useTenantStore } from "@/store/tenant.store";

export function useCategories() {
  const storeId = useTenantStore((s) => s.store?._id);

  return useQuery({
    queryKey: [storeId, "categories"],
    queryFn: getCategories,
    enabled: !!storeId,
    staleTime: 1000 * 60 * 10,
  });
}

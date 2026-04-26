import { useQuery } from "@tanstack/react-query";
import { getOrders, getOrder } from "@/api/orders";
import { useTenantStore } from "@/store/tenant.store";
import { useAuthStore } from "@/store/auth.store";

export function useOrders() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);

  return useQuery({
    queryKey: [storeId, "orders", userId],
    queryFn: getOrders,
    enabled: !!storeId && !!userId,
  });
}

export function useOrder(id: string) {
  const storeId = useTenantStore((s) => s.store?._id);

  return useQuery({
    queryKey: [storeId, "order", id],
    queryFn: () => getOrder(id),
    // Allow guest order lookup (no userId required)
    enabled: !!storeId && !!id,
  });
}

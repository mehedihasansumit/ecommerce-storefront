import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "@/api/addresses";
import { useTenantStore } from "@/store/tenant.store";
import { useAuthStore } from "@/store/auth.store";
import type { IAddress } from "@/shared/types/auth";

export function useAddresses() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);

  return useQuery({
    queryKey: [storeId, "addresses", userId],
    queryFn: getAddresses,
    enabled: !!storeId && !!userId,
  });
}

export function useCreateAddress() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: [storeId, "addresses", userId] }),
  });
}

export function useUpdateAddress() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<IAddress, "_id">> }) =>
      updateAddress(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [storeId, "addresses", userId] }),
  });
}

export function useDeleteAddress() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: [storeId, "addresses", userId] }),
  });
}

export function useSetDefaultAddress() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: [storeId, "addresses", userId] }),
  });
}

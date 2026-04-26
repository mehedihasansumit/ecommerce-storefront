import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/api/notifications";
import { useTenantStore } from "@/store/tenant.store";
import { useAuthStore } from "@/store/auth.store";

export function useNotifications() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);

  return useQuery({
    queryKey: [storeId, "notifications", userId],
    queryFn: getNotifications,
    enabled: !!storeId && !!userId,
  });
}

export function useUnreadCount() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);

  return useQuery({
    queryKey: [storeId, "notifications-unread", userId],
    queryFn: getUnreadCount,
    enabled: !!storeId && !!userId,
    refetchInterval: 60_000, // poll every 60s
    staleTime: 30_000,
  });
}

export function useMarkAsRead() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [storeId, "notifications", userId] });
      qc.invalidateQueries({ queryKey: [storeId, "notifications-unread", userId] });
    },
  });
}

export function useMarkAllAsRead() {
  const storeId = useTenantStore((s) => s.store?._id);
  const userId = useAuthStore((s) => s.user?.userId);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [storeId, "notifications", userId] });
      qc.invalidateQueries({ queryKey: [storeId, "notifications-unread", userId] });
    },
  });
}

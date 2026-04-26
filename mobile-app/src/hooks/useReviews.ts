import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviews, createReview, checkReviewEligibility } from "@/api/reviews";
import { useTenantStore } from "@/store/tenant.store";

export function useReviews(productId: string) {
  const storeId = useTenantStore((s) => s.store?._id);

  return useQuery({
    queryKey: [storeId, "reviews", productId],
    queryFn: () => getReviews(productId),
    enabled: !!storeId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useReviewEligibility(productId: string) {
  const storeId = useTenantStore((s) => s.store?._id);

  return useQuery({
    queryKey: [storeId, "review-eligibility", productId],
    queryFn: () => checkReviewEligibility(productId),
    enabled: !!storeId && !!productId,
  });
}

export function useCreateReview(productId: string) {
  const storeId = useTenantStore((s) => s.store?._id);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { rating: number; title: string; comment: string }) =>
      createReview({ productId, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [storeId, "reviews", productId] });
      qc.invalidateQueries({ queryKey: [storeId, "review-eligibility", productId] });
    },
  });
}

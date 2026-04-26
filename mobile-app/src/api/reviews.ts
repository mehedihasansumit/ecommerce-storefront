import { apiClient } from "./client";
import type { IReview } from "@/shared/types/review";

export async function getReviews(productId: string): Promise<IReview[]> {
  const { data } = await apiClient.get<{ reviews: IReview[] }>("/api/reviews", {
    params: { productId },
  });
  return data.reviews ?? (data as unknown as IReview[]);
}

export async function checkReviewEligibility(
  productId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const { data } = await apiClient.get<{ eligible: boolean; reason?: string }>(
    "/api/reviews/eligibility",
    { params: { productId } }
  );
  return data;
}

export async function createReview(payload: {
  productId: string;
  rating: number;
  title: string;
  comment: string;
}): Promise<IReview> {
  const { data } = await apiClient.post<IReview>("/api/reviews", payload);
  return data;
}

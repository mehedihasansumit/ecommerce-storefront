import { ReviewRepository } from "./repository";
import { ProductRepository } from "@/features/products/repository";
import { OrderRepository } from "@/features/orders/repository";
import { PointService } from "@/features/points/service";
import type { IReview } from "./types";
import type { CreateReviewInput } from "./schemas";

async function syncProductRating(storeId: string, productId: string): Promise<void> {
  const stats = await ReviewRepository.getProductRatingStats(storeId, productId);
  await ProductRepository.updateRatingStats(productId, stats.averageRating, stats.reviewCount);
}

export const ReviewService = {
  async create(
    storeId: string,
    userId: string,
    reviewerName: string,
    input: CreateReviewInput,
  ): Promise<IReview> {
    const existing = await ReviewRepository.findByUserAndProduct(storeId, userId, input.productId);
    if (existing) {
      throw new Error("You have already reviewed this product");
    }

    const purchased = await OrderRepository.userHasPurchased(storeId, userId, input.productId);
    if (!purchased) {
      throw new Error("You must purchase this product before reviewing it");
    }

    return ReviewRepository.create({
      storeId,
      userId,
      productId: input.productId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      images: input.images,
      reviewerName,
      isApproved: false,
    } as Partial<IReview>);
  },

  async approve(storeId: string, reviewId: string): Promise<IReview> {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new Error("Review not found");
    if (review.storeId !== storeId) throw new Error("Forbidden");

    const updated = await ReviewRepository.setApproved(reviewId, true);
    if (!updated) throw new Error("Failed to approve review");

    await syncProductRating(storeId, review.productId);
    await PointService.awardReviewPoints(storeId, review.userId, reviewId);

    return updated;
  },

  async reject(storeId: string, reviewId: string): Promise<IReview> {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new Error("Review not found");
    if (review.storeId !== storeId) throw new Error("Forbidden");

    const updated = await ReviewRepository.setApproved(reviewId, false);
    if (!updated) throw new Error("Failed to reject review");

    await syncProductRating(storeId, review.productId);

    return updated;
  },

  async getApprovedForProduct(
    storeId: string,
    productId: string,
    page: number,
    limit: number,
  ): Promise<{ reviews: IReview[]; total: number; totalPages: number }> {
    const { reviews, total } = await ReviewRepository.findApprovedByProduct(storeId, productId, {
      page,
      limit,
    });
    return { reviews, total, totalPages: Math.ceil(total / limit) };
  },

  async getEligibility(
    storeId: string,
    userId: string,
    productId: string,
  ): Promise<{ canReview: boolean; alreadyReviewed: boolean; hasPurchased: boolean }> {
    const [existing, hasPurchased] = await Promise.all([
      ReviewRepository.findByUserAndProduct(storeId, userId, productId),
      OrderRepository.userHasPurchased(storeId, userId, productId),
    ]);
    const alreadyReviewed = !!existing;
    const canReview = hasPurchased && !alreadyReviewed;
    return { canReview, alreadyReviewed, hasPurchased };
  },

  async getByStore(
    storeId: string,
    options: { page: number; limit: number; isApproved?: boolean },
  ): Promise<{ reviews: IReview[]; total: number; totalPages: number }> {
    const { reviews, total } = await ReviewRepository.findByStore(storeId, options);
    return { reviews, total, totalPages: Math.ceil(total / options.limit) };
  },

  async delete(storeId: string, reviewId: string): Promise<boolean> {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new Error("Review not found");
    if (review.storeId !== storeId) throw new Error("Forbidden");

    const wasApproved = review.isApproved;
    const deleted = await ReviewRepository.delete(reviewId);

    if (deleted && wasApproved) {
      await syncProductRating(storeId, review.productId);
    }

    return deleted;
  },
};

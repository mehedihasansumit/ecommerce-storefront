"use client";

import { useState } from "react";
import { ReviewStars } from "./ReviewStars";
import type { IReview } from "../types";

interface ReviewListProps {
  productId: string;
  initialReviews: IReview[];
  initialTotal: number;
}

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return "Just now";
}

export function ReviewList({ productId, initialReviews, initialTotal }: ReviewListProps) {
  const [reviews, setReviews] = useState<IReview[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const hasMore = reviews.length < total;

  async function loadMore() {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/reviews?productId=${productId}&page=${nextPage}&limit=10`);
      if (!res.ok) return;
      const data = await res.json() as { reviews: IReview[]; total: number };
      setReviews((prev) => [...prev, ...data.reviews]);
      setTotal(data.total);
      setPage(nextPage);
    } finally {
      setLoading(false);
    }
  }

  if (total === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">
        No reviews yet. Be the first to review this product!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{total} review{total !== 1 ? "s" : ""}</p>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <ReviewStars rating={review.rating} size="sm" />
                  {review.title && (
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {review.title}
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <span className="font-medium text-gray-600">{review.reviewerName || "Customer"}</span>
              <span>·</span>
              <span>{timeAgo(review.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="text-sm font-medium disabled:opacity-60 transition-opacity"
          style={{ color: "var(--color-primary)" }}
        >
          {loading ? "Loading…" : `Load more reviews (${total - reviews.length} remaining)`}
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ReviewStars } from "./ReviewStars";
import { Avatar } from "@/shared/components/ui";
import { imageGuardProps } from "@/shared/lib/imageGuard";
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
  const [lightbox, setLightbox] = useState<string | null>(null);

  const hasMore = reviews.length < total;

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

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
      <p className="text-sm text-text-secondary py-4">
        No reviews yet. Be the first to review this product!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">{total} review{total !== 1 ? "s" : ""}</p>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="border border-border-subtle rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <ReviewStars rating={review.rating} size="sm" />
                  {review.title && (
                    <span className="text-sm font-medium text-[var(--color-text)] truncate">
                      {review.title}
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    {review.comment}
                  </p>
                )}
                {review.images && review.images.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.images.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setLightbox(url)}
                        className="w-16 h-16 rounded-lg overflow-hidden border border-border-subtle focus:outline-none focus-visible:ring-2"
                        style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
                        aria-label="View review photo"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="Review photo" loading="lazy" className="w-full h-full object-cover" {...imageGuardProps} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
              <Avatar
                src={review.reviewerAvatarUrl}
                position={review.reviewerAvatarPosition}
                name={review.reviewerName || "Customer"}
                size="sm"
              />
              <span className="font-medium text-text-secondary">{review.reviewerName || "Customer"}</span>
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

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in-up"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Review photo"
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            {...imageGuardProps}
          />
        </div>
      )}
    </div>
  );
}

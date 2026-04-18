"use client";

import { useState } from "react";
import { Star, Check, X } from "lucide-react";
import type { IReview } from "@/features/reviews/types";

interface ReviewModerationTableProps {
  reviews: IReview[];
  storeId: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          style={{
            color: i <= rating ? "#facc15" : "#e5e7eb",
            fill: i <= rating ? "#facc15" : "#e5e7eb",
          }}
        />
      ))}
    </div>
  );
}

export function ReviewModerationTable({
  reviews: initialReviews,
  storeId,
}: ReviewModerationTableProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleModerate(reviewId: string, isApproved: boolean) {
    setLoading(reviewId);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, isApproved }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update review");
        return;
      }
      setReviews((prev) =>
        prev.map((r) =>
          r._id === reviewId ? { ...r, isApproved: (data.review as IReview).isApproved } : r
        )
      );
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(reviewId: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setLoading(reviewId);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}?storeId=${storeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete review");
        return;
      }
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-16 text-admin-text-subtle text-sm">
        No reviews found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-admin-border bg-admin-surface">
        <table className="w-full text-sm">
          <thead className="bg-admin-surface-raised border-b border-admin-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                Reviewer
              </th>
              <th className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                Rating
              </th>
              <th className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                Review
              </th>
              <th className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                Date
              </th>
              <th className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {reviews.map((review) => {
              const isLoading = loading === review._id;
              return (
                <tr key={review._id} className="hover:bg-admin-surface-hover transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 text-sm">
                      {review.reviewerName || "Customer"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StarDisplay rating={review.rating} />
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    {review.title && (
                      <p className="font-medium text-gray-800 truncate">{review.title}</p>
                    )}
                    {review.comment && (
                      <p className="text-admin-text-muted text-xs truncate mt-0.5">{review.comment}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-admin-text-muted text-xs whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                        review.isApproved
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {review.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {!review.isApproved && (
                        <button
                          onClick={() => handleModerate(review._id, true)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-60 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}
                      {review.isApproved && (
                        <button
                          onClick={() => handleModerate(review._id, false)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg disabled:opacity-60 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review._id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-60 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

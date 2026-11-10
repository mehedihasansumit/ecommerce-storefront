"use client";

import { useState } from "react";
import { Star, Check, X, Trash2, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState } from "@/shared/components/ui";
import type { IReview } from "@/features/reviews/types";

interface ReviewModerationTableProps {
  reviews: IReview[];
  storeId: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={`w-3.5 h-3.5 ${
            i <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-200 fill-gray-200 dark:text-gray-600 dark:fill-gray-600"
          }`}
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
  const [pendingDelete, setPendingDelete] = useState<IReview | null>(null);

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
    setLoading(reviewId);
    setError(null);
    try {
      const res = await fetch(`/api/reviews/${reviewId}?storeId=${storeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete review");
        return;
      }
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success("Review deleted");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  if (reviews.length === 0) {
    return (
      <Card padding="none">
        <EmptyState icon={MessageSquare} title="No reviews found." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <Alert tone="error">{error}</Alert>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-175 text-sm">
            <thead className="bg-admin-surface-raised border-b border-admin-border">
              <tr>
                <th scope="col" className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                  Reviewer
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                  Rating
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                  Review
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                  Date
                </th>
                <th scope="col" className="text-left px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
                  Status
                </th>
                <th scope="col" className="text-right px-4 py-3 font-medium text-admin-text-muted text-xs uppercase tracking-wide">
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
                      <p className="font-medium text-admin-text-primary text-sm">
                        {review.reviewerName || "Customer"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StarDisplay rating={review.rating} />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {review.title && (
                        <p className="font-medium text-admin-text-primary truncate">{review.title}</p>
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
                      <Badge tone={review.isApproved ? "success" : "warning"}>
                        {review.isApproved ? "Approved" : "Pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {!review.isApproved && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleModerate(review._id, true)}
                            disabled={isLoading}
                            leftIcon={<Check aria-hidden className="w-3.5 h-3.5" />}
                          >
                            Approve
                          </Button>
                        )}
                        {review.isApproved && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleModerate(review._id, false)}
                            disabled={isLoading}
                            leftIcon={<X aria-hidden className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>
                        )}
                        <Button
                          variant="danger-outline"
                          size="sm"
                          onClick={() => setPendingDelete(review)}
                          disabled={isLoading}
                          leftIcon={<Trash2 aria-hidden className="w-3.5 h-3.5" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await handleDelete(pendingDelete._id);
        }}
        tone="danger"
        title="Delete review?"
        description={`The review by ${pendingDelete?.reviewerName || "this customer"} will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}

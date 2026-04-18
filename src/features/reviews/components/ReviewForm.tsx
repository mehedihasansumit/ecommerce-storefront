"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a title for your review");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, title, comment }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit review");
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-100 p-4 text-sm text-green-800">
        Thank you! Your review has been submitted and is pending approval.
      </div>
    );
  }

  const displayRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-admin-text-primary">Write a Review</h3>

      {/* Star rating input */}
      <div>
        <label className="block text-sm text-admin-text-secondary mb-1.5">Your Rating <span className="text-red-500">*</span></label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              className="focus:outline-none"
              aria-label={`Rate ${i} out of 5`}
            >
              <Star
                className="w-7 h-7 transition-colors"
                style={{
                  color: i <= displayRating ? "var(--color-primary)" : "#e5e7eb",
                  fill: i <= displayRating ? "var(--color-primary)" : "#e5e7eb",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm text-admin-text-secondary mb-1.5" htmlFor="review-title">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="Summarize your review"
          required
          className="w-full border border-admin-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
        />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm text-admin-text-secondary mb-1.5" htmlFor="review-comment">
          Review <span className="text-admin-text-subtle">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Share your experience with this product..."
          className="w-full border border-admin-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-opacity"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}

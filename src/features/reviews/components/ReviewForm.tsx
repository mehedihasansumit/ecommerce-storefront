"use client";

import { useRef, useState } from "react";
import { Star, ImagePlus, X, Loader2 } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

const MAX_IMAGES = 5;

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`You can attach at most ${MAX_IMAGES} photos`);
      return;
    }
    const selected = files.slice(0, room);
    setError(null);

    for (const file of selected) {
      setUploading((n) => n + 1);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/reviews/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to upload image");
          continue;
        }
        setImages((prev) => [...prev, data.url as string]);
      } catch {
        setError("Failed to upload image. Please try again.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

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
        body: JSON.stringify({ productId, rating, title, comment, images }),
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
      <div className="rounded-lg bg-green-50 border border-green-100 p-4 text-sm text-green-800 dark:bg-green-950/30 dark:border-green-900 dark:text-green-300">
        Thank you! Your review has been submitted and is pending approval.
      </div>
    );
  }

  const displayRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-[var(--color-text)]">Write a Review</h3>

      {/* Star rating input */}
      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Your Rating <span className="text-red-500">*</span></label>
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
                  color: i <= displayRating ? "var(--color-primary)" : "var(--color-border-subtle)",
                  fill: i <= displayRating ? "var(--color-primary)" : "var(--color-border-subtle)",
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm text-text-secondary mb-1.5" htmlFor="review-title">
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
          className="w-full bg-bg border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
        />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm text-text-secondary mb-1.5" htmlFor="review-comment">
          Review <span className="text-text-tertiary">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Share your experience with this product..."
          className="w-full bg-bg border border-border-subtle rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ "--tw-ring-color": "var(--color-primary)" } as React.CSSProperties}
        />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm text-text-secondary mb-1.5">
          Photos <span className="text-text-tertiary">(optional, up to {MAX_IMAGES})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative w-16 h-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Review photo"
                className="w-16 h-16 object-cover rounded-lg border border-border-subtle"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove photo"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {uploading > 0 && (
            <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-border-subtle bg-bg">
              <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
            </div>
          )}

          {images.length + uploading < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add photos"
              className="w-16 h-16 flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-subtle text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || uploading > 0}
        className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-opacity"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        {submitting ? "Submitting…" : uploading > 0 ? "Uploading photos…" : "Submit Review"}
      </button>
    </form>
  );
}

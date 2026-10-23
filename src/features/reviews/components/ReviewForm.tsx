"use client";

import { useRef, useState } from "react";
import { Star, ImagePlus, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert, Button, Field, Input, Textarea } from "@/shared/components/ui";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

const MAX_IMAGES = 5;

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const tr = useTranslations("reviewForm");
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
      setError(tr("maxPhotos", { max: MAX_IMAGES }));
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
          setError(data.error ?? tr("uploadFailed"));
          continue;
        }
        setImages((prev) => [...prev, data.url as string]);
      } catch {
        setError(tr("uploadFailed"));
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
      setError(tr("ratingRequired"));
      return;
    }
    if (!title.trim()) {
      setError(tr("titleRequired"));
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
        setError(data.error ?? tr("submitFailed"));
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setError(tr("genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Alert tone="success">{tr("success")}</Alert>
    );
  }

  const displayRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-[var(--color-text)]">{tr("title")}</h3>

      {/* Star rating input */}
      <div>
        <p id="review-rating-label" className="block text-sm font-medium text-[var(--ui-label,#374151)] mb-1.5">
          {tr("yourRating")} <span className="text-error">*</span>
        </p>
        <div className="flex gap-1" role="group" aria-labelledby="review-rating-label">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              className="focus-ring rounded-lg p-1.5"
              aria-label={tr("rateN", { n: i })}
              aria-pressed={rating === i}
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
      <Field label={tr("titleLabel")} required>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder={tr("titlePlaceholder")}
          required
        />
      </Field>

      {/* Comment */}
      <Field label={tr("commentLabel")} optional>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder={tr("commentPlaceholder")}
        />
      </Field>

      {/* Photos */}
      <div>
        <p className="block text-sm font-medium text-[var(--ui-label,#374151)] mb-1.5">
          {tr("photosLabel")}{" "}
          <span className="text-text-tertiary font-normal">({tr("photosHint", { max: MAX_IMAGES })})</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative w-16 h-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={tr("photoAlt")}
                className="w-16 h-16 object-cover rounded-lg border border-border-subtle"
              />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label={tr("removePhoto")}
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
              aria-label={tr("addPhotos")}
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

      {error && <Alert tone="error">{error}</Alert>}

      <Button type="submit" variant="brand" loading={submitting} disabled={uploading > 0}>
        {uploading > 0 ? tr("uploading") : tr("submit")}
      </Button>
    </form>
  );
}

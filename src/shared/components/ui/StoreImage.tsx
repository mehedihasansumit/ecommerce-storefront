"use client";

import Image from "next/image";
import type { ImageProps } from "next/image";

type Variants = Record<string, string>;

interface StoreImageProps
  extends Omit<ImageProps, "src" | "loader" | "placeholder"> {
  src: string;
  variants?: Variants;
  alt: string;
}

/**
 * Wrapper around next/image that uses pre-generated variants (w400/w800/w1200)
 * when available. Falls back to Next's built-in image optimizer otherwise.
 *
 * Upload-time responsive variants are free to serve (static), so we prefer
 * them over the on-demand optimizer whenever they exist.
 */
export function StoreImage({
  src,
  variants,
  alt,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 85,
  ...rest
}: StoreImageProps) {
  const hasVariants = variants && Object.keys(variants).length > 0;

  if (!hasVariants) {
    return (
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        quality={quality}
        decoding="async"
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      quality={quality}
      decoding="async"
      loader={({ width }) => pickVariant(src, variants, width)}
      {...rest}
    />
  );
}

function pickVariant(src: string, variants: Variants, targetWidth: number): string {
  const sorted = Object.entries(variants)
    .map(([k, v]) => [parseInt(k.replace(/\D/g, ""), 10), v] as const)
    .filter(([w]) => Number.isFinite(w))
    .sort((a, b) => a[0] - b[0]);

  if (sorted.length === 0) return src;

  for (const [w, url] of sorted) {
    if (w >= targetWidth) return url;
  }
  return src;
}

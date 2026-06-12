"use client";

import { useCallback, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import type { ImageProps } from "next/image";
import { imageGuardProps } from "@/shared/lib/imageGuard";

type Variants = Record<string, string>;

interface StoreImageProps
  extends Omit<ImageProps, "src" | "loader" | "placeholder" | "blurDataURL"> {
  src: string;
  variants?: Variants;
  alt: string;
  blurDataURL?: string;
  /**
   * Zoomable image (hover-zoom / lightbox). Loads the full-res source instead of a
   * downscaled responsive variant, so CSS magnification stays sharp.
   */
  fullRes?: boolean;
}

/**
 * Image wrapper for store-owned uploads.
 *
 * When pre-generated variants (w400/w800/w1200/w2000) exist we render a plain
 * responsive <img> with a native `srcSet`, so small surfaces (thumbnails, cards)
 * download a small file. This works whether or not Next's image optimizer is on —
 * in `unoptimized` mode (media-proxy serving) next/image ignores custom loaders, so
 * relying on it would always ship the full original.
 *
 * Falls back to next/image for sources without variants (favicons, external URLs).
 */
export function StoreImage({
  src,
  variants,
  alt,
  blurDataURL,
  fullRes,
  fill,
  priority,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  quality = 85,
  className,
  style,
  width,
  height,
  onLoad,
  ...rest
}: StoreImageProps) {
  const hasVariants = variants && Object.keys(variants).length > 0;

  const [loaded, setLoaded] = useState(false);
  // Skeleton only when there's no blur placeholder to cover the loading state.
  const showSkeleton = Boolean(fill) && !blurDataURL && !loaded;

  const markLoaded = useCallback(() => setLoaded(true), []);
  const handleLoad = useCallback<NonNullable<ImageProps["onLoad"]>>(
    (e) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad]
  );
  // Catch already-cached images: onLoad may not fire if complete on mount.
  const imgRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete) setLoaded(true);
    },
    []
  );

  const skeleton = showSkeleton ? (
    <span
      aria-hidden
      className="absolute inset-0 shimmer"
      style={{ borderRadius: "inherit" }}
    />
  ) : null;

  // ── No variants: keep next/image (external URLs, favicons, legacy uploads) ──
  if (!hasVariants) {
    const placeholderProps = blurDataURL
      ? ({ placeholder: "blur" as const, blurDataURL })
      : {};
    return (
      <>
        {skeleton}
        <Image
          ref={imgRef}
          src={src}
          alt={alt}
          fill={fill}
          priority={priority}
          sizes={sizes}
          quality={quality}
          decoding="async"
          className={className}
          style={style}
          width={width}
          height={height}
          onLoad={handleLoad}
          {...imageGuardProps}
          {...placeholderProps}
          {...rest}
        />
      </>
    );
  }

  // ── Variants present: plain responsive <img> ──
  // fullRes → load the capped original (sharp under zoom), no srcSet downgrade.
  // otherwise → srcSet so the browser picks the smallest sufficient variant.
  const srcSet = fullRes
    ? undefined
    : Object.entries(variants!)
        .map(([k, url]) => [parseInt(k.replace(/\D/g, ""), 10), url] as const)
        .filter(([w]) => Number.isFinite(w))
        .sort((a, b) => a[0] - b[0])
        .map(([w, url]) => `${url} ${w}w`)
        .join(", ");

  const fillStyle: CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
    : {};
  const blurStyle: CSSProperties =
    blurDataURL && !loaded
      ? {
          backgroundImage: `url(${blurDataURL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {};

  return (
    <>
      {skeleton}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        className={className}
        style={{ ...fillStyle, ...blurStyle, ...style }}
        width={width as number | undefined}
        height={height as number | undefined}
        onLoad={markLoaded}
        {...imageGuardProps}
      />
    </>
  );
}

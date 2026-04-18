"use client";

import { useState } from "react";
import type { IProductImage } from "../types";
import { StoreImage } from "@/shared/components/ui";

interface ProductImageGalleryProps {
  images: IProductImage[];
  thumbnail?: string;
  productName: string;
}

export function ProductImageGallery({
  images,
  thumbnail,
  productName,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const current = images[selectedIndex];
  const currentSrc =
    selectedIndex === 0 && thumbnail
      ? thumbnail
      : current?.url || thumbnail || images[0]?.url;

  return (
    <div className="space-y-4 animate-fade-in">
      <div
        className="relative aspect-square bg-surface overflow-hidden group cursor-crosshair"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        {currentSrc ? (
          <StoreImage
            src={currentSrc}
            variants={current?.variants}
            alt={current?.alt || productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
            No Image
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative aspect-square overflow-hidden transition-all duration-200 ${
                i === selectedIndex
                  ? "ring-2 ring-offset-2 opacity-100"
                  : "opacity-50 hover:opacity-100"
              }`}
              style={{
                borderRadius: "var(--border-radius)",
                ["--tw-ring-color" as string]: "var(--color-primary)",
              }}
            >
              <StoreImage
                src={img.url}
                variants={img.variants}
                alt={img.alt || productName}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

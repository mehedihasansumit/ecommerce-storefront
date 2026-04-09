"use client";

import { useState } from "react";
import type { IProductImage } from "../types";

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
  const mainImage = thumbnail || images[0]?.url;
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentImage =
    selectedIndex === 0 && thumbnail
      ? thumbnail
      : images[selectedIndex]?.url || mainImage;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main image */}
      <div
        className="relative aspect-square bg-gray-50 overflow-hidden group cursor-crosshair"
        style={{ borderRadius: "var(--border-radius)" }}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={images[selectedIndex]?.alt || productName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
            No Image
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2.5">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`aspect-square overflow-hidden transition-all duration-200 ${
                i === selectedIndex
                  ? "ring-2 ring-offset-2 opacity-100"
                  : "opacity-50 hover:opacity-100"
              }`}
              style={{
                borderRadius: "var(--border-radius)",
                ringColor: "var(--color-primary)",
              }}
            >
              <img
                src={img.url}
                alt={img.alt || productName}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import type { IProductImage } from "../types";
import { StoreImage } from "@/shared/components/ui";

interface ProductImageGalleryProps {
  images: IProductImage[];
  thumbnail?: string;
  productName: string;
  /** Controlled active index. When provided the parent owns selection. */
  selectedIndex?: number;
  /** Called whenever the active image changes (thumbnail click, lightbox nav, keys). */
  onSelect?: (index: number) => void;
}

export function ProductImageGallery({
  images,
  thumbnail,
  productName,
  selectedIndex: controlledIndex,
  onSelect,
}: ProductImageGalleryProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const selectedIndex = controlledIndex ?? internalIndex;
  const setIndex = useCallback(
    (index: number) => {
      onSelect?.(index);
      if (controlledIndex == null) setInternalIndex(index);
    },
    [onSelect, controlledIndex]
  );
  const [isHovering, setIsHovering] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbZoom, setLbZoom] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0 });
  const lbContainerRef = useRef<HTMLDivElement>(null);

  const current = images[selectedIndex];
  const currentSrc =
    selectedIndex === 0 && thumbnail
      ? thumbnail
      : current?.url || thumbnail || images[0]?.url;

  const openLightbox = useCallback(() => {
    setLightboxOpen(true);
    setLbZoom(1);
    setPanPos({ x: 0, y: 0 });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setLbZoom(1);
    setPanPos({ x: 0, y: 0 });
  }, []);

  const changeImage = useCallback((index: number) => {
    setIndex(index);
    setLbZoom(1);
    setPanPos({ x: 0, y: 0 });
  }, [setIndex]);

  // Wheel zoom in lightbox — passive: false so we can preventDefault
  useEffect(() => {
    if (!lightboxOpen) return;
    const el = lbContainerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setLbZoom(prev => Math.min(5, Math.max(1, prev * (1 - e.deltaY * 0.002))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [lightboxOpen]);

  // Reset pan when zoom resets to 1
  useEffect(() => {
    if (lbZoom <= 1) setPanPos({ x: 0, y: 0 });
  }, [lbZoom]);

  // Prevent body scroll while lightbox open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  // Keyboard: Esc, +/-, arrow navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape": closeLightbox(); break;
        case "+": case "=": setLbZoom(p => Math.min(5, p + 0.5)); break;
        case "-": setLbZoom(p => Math.max(1, p - 0.5)); break;
        case "ArrowLeft": changeImage(Math.max(0, selectedIndex - 1)); break;
        case "ArrowRight": changeImage(Math.min(images.length - 1, selectedIndex + 1)); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, selectedIndex, images.length, closeLightbox, changeImage]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (lbZoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: panPos.x, panY: panPos.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPos({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    });
  };

  const onMouseUp = () => setIsDragging(false);

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lbZoom > 1) {
      setLbZoom(1);
      setPanPos({ x: 0, y: 0 });
    } else {
      setLbZoom(2.5);
    }
  };

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        {/* Main image — hover to zoom 2.5x, click for lightbox */}
        <div
          className="relative aspect-square bg-surface overflow-hidden group cursor-zoom-in"
          style={{ borderRadius: "var(--border-radius)" }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setCursorPos({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={openLightbox}
        >
          {currentSrc ? (
            <StoreImage
              src={currentSrc}
              variants={current?.variants}
              blurDataURL={current?.blurDataURL}
              alt={current?.alt || productName}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              style={{
                transformOrigin: `${cursorPos.x}% ${cursorPos.y}%`,
                transform: isHovering ? "scale(2.5)" : "scale(1)",
                transition: "transform 0.15s ease-out",
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
              No Image
            </div>
          )}

          {/* Expand icon — top-right on hover */}
          <button
            onClick={(e) => { e.stopPropagation(); openLightbox(); }}
            className="absolute top-3 right-3 bg-black/40 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
            aria-label="Open fullscreen view"
          >
            <Maximize2 size={16} />
          </button>

          {/* Bottom label — visible when not hovering */}
          <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 group-hover:opacity-0 transition-opacity duration-200 pointer-events-none select-none">
            <ZoomIn size={12} />
            Hover to zoom · Click to expand
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2.5">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
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
                  blurDataURL={img.blurDataURL}
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

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-4 text-white/50 text-sm z-10 select-none">
              {selectedIndex + 1} / {images.length}
            </div>
          )}

          {/* Top-right controls */}
          <div
            className="absolute top-4 right-4 flex items-center gap-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/50 text-sm font-mono tabular-nums">
              {Math.round(lbZoom * 100)}%
            </span>
            <button
              onClick={() => setLbZoom(p => Math.min(5, p + 0.5))}
              className="bg-white/10 hover:bg-white/25 text-white p-2 rounded-lg transition-colors"
              aria-label="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setLbZoom(p => Math.max(1, p - 0.5))}
              className="bg-white/10 hover:bg-white/25 text-white p-2 rounded-lg transition-colors"
              aria-label="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => { setLbZoom(1); setPanPos({ x: 0, y: 0 }); }}
              className="bg-white/10 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              Reset
            </button>
            <button
              onClick={closeLightbox}
              className="bg-white/10 hover:bg-white/25 text-white p-2 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); changeImage(Math.max(0, selectedIndex - 1)); }}
                disabled={selectedIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors disabled:opacity-20 z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); changeImage(Math.min(images.length - 1, selectedIndex + 1)); }}
                disabled={selectedIndex === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white p-3 rounded-full transition-colors disabled:opacity-20 z-10"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Zoomable / pannable image area */}
          <div
            ref={lbContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onDoubleClick={onDoubleClick}
            style={{ cursor: lbZoom > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in" }}
          >
            {currentSrc && (
              <div
                style={{
                  position: "relative",
                  width: "min(85vw, 85vh)",
                  height: "min(85vw, 85vh)",
                  flexShrink: 0,
                  transform: `translate(${panPos.x}px, ${panPos.y}px) scale(${lbZoom})`,
                  transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <StoreImage
                  src={currentSrc}
                  variants={current?.variants}
                  blurDataURL={current?.blurDataURL}
                  alt={current?.alt || productName}
                  fill
                  sizes="85vw"
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>

          {/* Bottom: thumbnail strip + keyboard hints */}
          <div
            className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => changeImage(i)}
                    className={`relative w-12 h-12 overflow-hidden rounded-lg shrink-0 transition-all duration-200 ${
                      i === selectedIndex
                        ? "ring-2 ring-white scale-110 opacity-100"
                        : "opacity-40 hover:opacity-80"
                    }`}
                  >
                    <StoreImage
                      src={img.url}
                      variants={img.variants}
                      alt={img.alt || productName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="text-white/30 text-xs flex gap-4 select-none">
              <span>Scroll to zoom</span>
              <span>Double-click toggle</span>
              <span>Drag to pan</span>
              {images.length > 1 && <span>← → navigate</span>}
              <span>Esc close</span>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

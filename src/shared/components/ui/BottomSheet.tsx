"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Accessible name of the close button; pass a translated string. */
  closeLabel?: string;
  children: ReactNode;
}

/**
 * Mobile bottom sheet. Slides up from the bottom edge with a dimmed backdrop.
 * Mirrors the pattern in MobileBottomNav, lifted into a reusable primitive.
 * Closes on Escape / backdrop tap, locks body scroll while open, moves focus into
 * the sheet and hands it back to the opener on close.
 */
export function BottomSheet({ open, onClose, title, closeLabel = "Close", children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = prev;
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal to <body> so a transformed or animated ancestor can't trap the fixed layer.
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "bottom-sheet-title" : undefined}
      className="fixed inset-0 z-[60]"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 rounded-t-2xl animate-slide-up max-h-[88vh] flex flex-col pb-[calc(env(safe-area-inset-bottom)+1rem)] outline-none"
        style={{ backgroundColor: "var(--color-card-bg)", color: "var(--color-text)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>

        {title && (
          <div className="flex items-center justify-between gap-3 ps-5 pe-3 pt-1 pb-2 border-b border-border-subtle shrink-0">
            <h2
              id="bottom-sheet-title"
              className="text-base font-semibold text-[var(--color-text)]"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="focus-ring shrink-0 p-2.5 rounded-lg text-text-tertiary hover:bg-surface transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="px-5 pt-4 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

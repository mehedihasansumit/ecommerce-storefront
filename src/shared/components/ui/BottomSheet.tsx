"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}

/**
 * Mobile bottom sheet. Slides up from the bottom edge with a dimmed backdrop.
 * Mirrors the pattern in MobileBottomNav, lifted into a reusable primitive.
 * Closes on Escape / backdrop tap and locks body scroll while open.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
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
        className="absolute inset-x-0 bottom-0 rounded-t-2xl animate-slide-up max-h-[88vh] flex flex-col pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        style={{ backgroundColor: "var(--color-card-bg)", color: "var(--color-text)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>

        {title && (
          <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 border-b border-border-subtle shrink-0">
            <h2
              id="bottom-sheet-title"
              className="text-base font-semibold text-[var(--color-text)]"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 p-1.5 rounded-lg text-text-tertiary hover:bg-surface transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="px-5 pt-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

type Size = "sm" | "md" | "lg" | "xl";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: Size;
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
}

const SIZES: Record<Size, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={() => closeOnBackdrop && onClose()}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "relative w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg animate-scale-in flex flex-col max-h-[90vh]",
          SIZES[size],
        ].join(" ")}
      >
        {title && (
          <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="min-w-0">
              <h2 id="modal-title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl dark:border-gray-800 dark:bg-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

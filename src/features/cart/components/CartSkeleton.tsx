"use client";

import { useTranslations } from "next-intl";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/shared/components/ui";

const PANEL_STYLE = {
  backgroundColor: "var(--color-card-bg)",
  borderRadius: "calc(var(--border-radius) * 1.5)",
} as const;

/** One CartItemRow: thumbnail, name, option chip, qty stepper + line total. */
function CartRowSkeleton() {
  return (
    <div className="flex gap-4 py-5 border-b border-border-subtle last:border-0">
      <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <SkeletonText className="text-sm sm:text-base leading-snug flex-1" width="w-3/4" />
          <div className="shrink-0 -mr-2 -mt-2 h-10 w-10" />
        </div>
        <Skeleton radius="full" className="h-[22px] w-20" />
        <div className="flex items-center justify-between gap-3 mt-auto">
          <Skeleton className="h-[42px] w-[7.75rem]" />
          <SkeletonText className="text-sm" width="w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Cart page while the localStorage cart is read. Same container, header, items
 * panel and order-summary panel as the loaded page, so nothing shifts on swap.
 */
export function CartSkeleton({ rows = 2 }: { rows?: number }) {
  const t = useTranslations("common");
  return (
    <SkeletonRegion
      label={t("loading")}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14"
    >
      <div aria-hidden>
        <div className="flex items-center justify-between mb-8">
          <SkeletonText className="text-2xl sm:text-3xl" width="w-48" />
          <div className="hidden sm:flex min-h-10 items-center">
            <SkeletonText className="text-sm" width="w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-3">
            <div className="border border-border-subtle shadow-sm overflow-hidden" style={PANEL_STYLE}>
              <div className="px-5 sm:px-6">
                {Array.from({ length: rows }).map((_, i) => (
                  <CartRowSkeleton key={i} />
                ))}
              </div>
            </div>
            {/* Delivery note */}
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-border-subtle text-sm">
              <Skeleton radius="full" className="size-[15px] shrink-0" />
              {/* The delivery sentence wraps to two lines on phones */}
              <SkeletonText
                className="flex-1"
                width="w-full sm:w-4/5"
                lines={2}
                lastWidth="w-1/2"
                lastLineClassName="sm:hidden"
              />
            </div>
            <div className="sm:hidden min-h-10 flex items-center">
              <SkeletonText className="text-sm" width="w-32" />
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="border border-border-subtle shadow-sm p-5" style={PANEL_STYLE}>
              <SkeletonText className="text-base mb-5" width="w-32" />
              <div className="mb-5 flex gap-2">
                <Skeleton radius="lg" className="flex-1 h-10" />
                <Skeleton radius="lg" className="w-20 h-10" />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <SkeletonText width="w-28" />
                  <SkeletonText width="w-16" />
                </div>
                <div className="flex justify-between gap-3">
                  <SkeletonText width="w-16" />
                  <SkeletonText width="w-24" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between gap-3">
                <SkeletonText className="text-base" width="w-12" />
                <SkeletonText className="text-xl" width="w-24" />
              </div>
              <Skeleton className="mt-5 w-full h-[52px]" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

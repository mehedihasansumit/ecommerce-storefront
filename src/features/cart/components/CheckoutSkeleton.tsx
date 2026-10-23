"use client";

import { useTranslations } from "next-intl";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/shared/components/ui";

const PANEL_RADIUS = { borderRadius: "calc(var(--border-radius) * 1.5)" } as const;

/** Label + 40px control, as FieldWrap / LevelField render them. */
function FieldSkeleton({ label = "w-24" }: { label?: string }) {
  return (
    <div>
      <SkeletonText className="text-sm mb-1.5" width={label} />
      <Skeleton radius="lg" className="h-10 w-full" />
    </div>
  );
}

/** Step card header (number badge + title) over a p-5 body. */
function SectionSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-bg border border-border-subtle shadow-[var(--shadow-xs)] overflow-hidden"
      style={PANEL_RADIUS}
    >
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
        <Skeleton radius="full" className="size-6 shrink-0" />
        <SkeletonText className="text-sm" width="w-32" />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/**
 * Checkout page while the localStorage cart is read: same header, delivery and
 * payment step cards and order-summary panel as the loaded form.
 */
export function CheckoutSkeleton({ rows = 2 }: { rows?: number }) {
  const t = useTranslations("common");
  return (
    <SkeletonRegion
      label={t("loading")}
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12"
    >
      <div aria-hidden>
        <div className="mb-8">
          <div className="min-h-10 flex items-center mb-2">
            <SkeletonText className="text-sm" width="w-28" />
          </div>
          <SkeletonText className="text-2xl sm:text-3xl" width="w-40" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          <div className="space-y-4">
            <SectionSkeleton>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldSkeleton />
                  <FieldSkeleton label="w-28" />
                </div>
                <FieldSkeleton label="w-32" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldSkeleton label="w-20" />
                  <FieldSkeleton label="w-20" />
                  <FieldSkeleton label="w-24" />
                </div>
                <FieldSkeleton label="w-24" />
                <FieldSkeleton label="w-28" />
                <FieldSkeleton label="w-16" />
                <div className="min-h-10 flex items-center">
                  <SkeletonText className="text-sm" width="w-40" />
                </div>
              </div>
            </SectionSkeleton>

            <SectionSkeleton>
              <Skeleton radius="none" className="h-[72px] w-full rounded-xl" />
            </SectionSkeleton>
          </div>

          {/* Order summary */}
          <div
            className="bg-bg border border-border-subtle shadow-[var(--shadow-sm)] overflow-hidden"
            style={PANEL_RADIUS}
          >
            <div className="px-5 pt-5 pb-4 border-b border-border-subtle">
              <SkeletonText className="text-base" width="w-32" />
            </div>
            <div className="px-5 py-4 space-y-3">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <Skeleton className="size-12 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <SkeletonText className="text-xs leading-snug" width="w-3/4" />
                    <SkeletonText className="text-[11px]" width="w-12" />
                  </div>
                  <SkeletonText className="text-xs" width="w-14" />
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 pt-3 border-t border-border-subtle space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <SkeletonText width="w-20" />
                <SkeletonText width="w-16" />
              </div>
              <div className="flex justify-between gap-3">
                <SkeletonText width="w-20" />
                <SkeletonText width="w-24" />
              </div>
              <div className="pt-3 mt-1 border-t border-border-subtle flex items-center justify-between gap-3">
                <SkeletonText width="w-12" />
                <SkeletonText className="text-xl" width="w-24" />
              </div>
            </div>
            <div className="px-5 pb-5">
              <Skeleton className="w-full h-[52px]" />
              <SkeletonText className="mt-2.5 text-xs text-center" width="w-40" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

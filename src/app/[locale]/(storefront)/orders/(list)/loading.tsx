import { getTranslations } from "next-intl/server";
import { Card, Skeleton, SkeletonRegion, SkeletonText } from "@/shared/components/ui";

// Loading state for /orders. Mirrors page.tsx: back button + title/count, then
// order cards (number + badge, date line, total, item preview row).
export default async function OrdersLoading() {
  const tc = await getTranslations("common");
  return (
    <SkeletonRegion label={tc("loading")} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div aria-hidden className="flex items-center gap-3 mb-6">
        <Skeleton radius="lg" className="size-9 shrink-0" />
        <div>
          <SkeletonText className="text-xl" width="w-32" />
          <SkeletonText className="text-xs mt-0.5" width="w-20" />
        </div>
      </div>
      <div aria-hidden className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} padding="none">
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SkeletonText className="text-sm" width="w-24" />
                    <Skeleton radius="full" className="h-5 w-16" />
                  </div>
                  <SkeletonText className="text-xs mt-1" width="w-36" />
                </div>
                <SkeletonText className="text-base shrink-0" width="w-16" />
              </div>
              <div className="mt-3 pt-3 border-t border-border-subtle">
                <SkeletonText className="text-xs" width="w-3/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </SkeletonRegion>
  );
}

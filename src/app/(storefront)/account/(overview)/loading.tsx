import { getTranslations } from "next-intl/server";
import { Card, Skeleton, SkeletonRegion, SkeletonText } from "@/shared/components/ui";

// Loading state for /account. Mirrors page.tsx: profile card (avatar, name, info
// grid, two stat tiles), points card with its redeem hint, the two quick-nav tiles.
export default async function AccountLoading() {
  const tc = await getTranslations("common");
  return (
    <SkeletonRegion
      label={tc("loading")}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4"
    >
      <Card padding="lg" aria-hidden>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton radius="full" className="size-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <SkeletonText className="text-lg sm:text-xl leading-tight" width="w-40" />
              <SkeletonText className="text-sm mt-0.5" width="w-48 max-w-full" />
              {/* "Member since: <date>" wraps to two lines in the narrow phone column */}
              <SkeletonText
                className="text-xs mt-0.5"
                width="w-28"
                lines={2}
                lastWidth="w-16"
                lastLineClassName="sm:hidden"
              />
            </div>
          </div>
          <Skeleton radius="none" className="h-[34px] w-20 shrink-0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-5 border-t border-border-subtle text-sm">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <SkeletonText className="text-xs mb-1" width="w-16" />
              <SkeletonText width="w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg px-4 py-3.5 border border-border-subtle">
              <SkeletonText className="text-xs mb-1" width="w-20" />
              <SkeletonText className="text-2xl" width="w-16" />
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg" aria-hidden>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton radius="lg" className="size-8" />
            <SkeletonText className="text-base" width="w-36" />
          </div>
          <Skeleton radius="lg" className="h-6 w-20" />
        </div>
        <SkeletonText className="text-3xl sm:text-4xl" width="w-24" />
        <SkeletonText className="text-xs mt-1" width="w-24" />
        {/* "N more points needed" hint (shown until the balance can be redeemed) */}
        <div className="mt-3 p-3 rounded-lg border border-border-subtle">
          <SkeletonText className="text-xs" width="w-full" lines={2} lastWidth="w-1/2" lastLineClassName="sm:hidden" />
        </div>
      </Card>

      <div aria-hidden className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border border-border-subtle rounded-lg p-4 sm:p-5">
            <Skeleton radius="lg" className="size-10 shrink-0" />
            <div className="flex-1">
              <SkeletonText className="text-sm" width="w-32" />
              <SkeletonText className="text-xs mt-0.5" width="w-16" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

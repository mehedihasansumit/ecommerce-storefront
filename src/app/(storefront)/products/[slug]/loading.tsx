import { getTranslations } from "next-intl/server";
import { getTenant } from "@/shared/lib/tenant";
import { getStoreTrustFacts } from "@/features/stores/trust";
import { StoreTrustInfo } from "@/shared/components/storefront/StoreTrustInfo";
import { ProductRailSkeleton } from "@/features/products/components/ProductSkeletons";
import { Skeleton, SkeletonRegion, SkeletonText } from "@/shared/components/ui";

// Loading state for the product page. Mirrors page.tsx + ProductDetailClient:
// breadcrumb, full-bleed square gallery on phones (square + 5-up thumbs from md),
// two columns from lg, then the inline buy box (title, price, stock, sizes, the
// store's real delivery/COD/exchange rows, quantity + add to cart) and the rail.
export default async function ProductDetailLoading() {
  const [tenant, tc] = await Promise.all([
    getTenant(),
    getTranslations("common"),
  ]);
  // Same conditions as SocialOrderButtons: one 46px button per configured channel.
  const social = tenant?.socialOrdering;
  const socialCount =
    (social?.whatsapp?.enabled && social.whatsapp.phoneNumber ? 1 : 0) +
    (social?.facebook?.enabled && social.facebook.pageUrl ? 1 : 0);

  return (
    <SkeletonRegion label={tc("loading")}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6 md:py-8">
        {/* Breadcrumb: Home › Products › Name */}
        <div
          aria-hidden
          className="flex items-center gap-2 text-sm min-h-10 mb-2 md:mb-6"
        >
          <Skeleton radius="lg" className="h-[0.7em] w-10" />
          <Skeleton radius="lg" className="h-[0.7em] w-16" />
          <Skeleton radius="lg" className="h-[0.7em] w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-10 lg:gap-16">
          {/* Gallery */}
          <div aria-hidden>
            <Skeleton
              radius="none"
              className="md:hidden -mx-4 sm:-mx-6 aspect-square"
            />
            <div className="hidden md:block space-y-4">
              <Skeleton className="aspect-square" />
              <div className="grid grid-cols-5 gap-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            </div>
          </div>

          {/* Info + buy box */}
          <div>
            <div aria-hidden>
              {/* Name: two lines on phones/tablets, one in the wide desktop column */}
              <SkeletonText
                className="text-3xl md:text-4xl leading-tight mb-2 md:mb-4"
                width="w-11/12 lg:w-3/4"
                lines={2}
                lastWidth="w-1/2"
                lastLineClassName="lg:hidden"
              />
              <Skeleton radius="lg" className="h-4 w-36 mb-3 md:mb-5" />
              <SkeletonText
                className="text-2xl md:text-3xl mb-3 md:mb-6"
                width="w-32"
              />
              <SkeletonText
                className="leading-relaxed mb-3 md:mb-6"
                width="w-2/3"
              />
            </div>

            <div className="border-t border-border-subtle pt-4 md:pt-6 space-y-4 md:space-y-6">
              <SkeletonText className="text-sm" width="w-28" />
              <div className="space-y-6">
                <div className="space-y-6">
                  {/* Size chips */}
                  <div aria-hidden>
                    <SkeletonText className="text-xs mb-2.5" width="w-12" />
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-[42px] w-14" />
                      ))}
                    </div>
                  </div>
                  {/* Store config, not product data: real delivery / COD / exchange rows */}
                  {tenant && (
                    <StoreTrustInfo
                      facts={getStoreTrustFacts(tenant)}
                      layout="rows"
                    />
                  )}
                  {/* Quantity + add to cart */}
                  <div aria-hidden className="flex flex-col sm:flex-row gap-3">
                    <Skeleton className="self-start h-[46px] w-[8.5rem] shrink-0" />
                    <Skeleton className="h-[52px] sm:flex-1" />
                  </div>
                </div>
                {/* WhatsApp / Messenger order buttons */}
                {socialCount > 0 && (
                  <div
                    aria-hidden
                    className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {Array.from({ length: socialCount }).map((_, i) => (
                      <Skeleton key={i} className="h-[46px]" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-4 md:mt-0">
        <ProductRailSkeleton />
      </div>

      {/* Description (keeps the footer below the fold until the page arrives) */}
      <div aria-hidden className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 md:pb-8">
        <div className="mt-20 border-t border-border-subtle pt-14">
          <div className="max-w-3xl">
            <SkeletonText className="text-xl mb-6" width="w-32" />
            <SkeletonText className="leading-relaxed" width="w-full" lines={3} lastWidth="w-1/2" />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

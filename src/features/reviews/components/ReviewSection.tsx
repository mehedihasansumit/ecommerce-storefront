import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { formatNumber } from "@/shared/lib/i18n";
import { getCustomerToken } from "@/shared/lib/auth";
import { ReviewService } from "../service";
import { ReviewList } from "./ReviewList";
import { ReviewForm } from "./ReviewForm";
import { ReviewStars } from "./ReviewStars";
import type { JwtCustomerPayload } from "@/features/auth/types";

interface ReviewSectionProps {
  productId: string;
  storeId: string;
  averageRating?: number;
  reviewCount?: number;
}

export async function ReviewSection({
  productId,
  storeId,
  averageRating = 0,
  reviewCount = 0,
}: ReviewSectionProps) {
  const [tr, locale, payload, { reviews, total }] = await Promise.all([
    getTranslations("reviews"),
    getLocale(),
    getCustomerToken(),
    ReviewService.getApprovedForProduct(storeId, productId, 1, 10),
  ]);

  let eligibility: { canReview: boolean; alreadyReviewed: boolean; hasPurchased: boolean } | null =
    null;

  const isCustomer = payload?.type === "customer";
  if (isCustomer) {
    const customerPayload = payload as JwtCustomerPayload;
    eligibility = await ReviewService.getEligibility(
      storeId,
      customerPayload.userId,
      productId
    );
  }

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">{tr("title")}</h2>
        {/* Only summarise ratings that are actually listed below; a stored average with
            no approved reviews read as "4.9 out of 5 … No reviews yet". */}
        {reviewCount > 0 && total > 0 && (
          <div className="flex items-center gap-2">
            <ReviewStars rating={averageRating} size="md" />
            <span className="text-sm text-text-secondary">
              {tr("outOf5", {
                rating: formatNumber(averageRating, locale, {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                }),
              })}
            </span>
          </div>
        )}
      </div>

      {/* Review form area */}
      {!isCustomer && (
        <div className="bg-surface rounded-lg p-5 mb-8 text-sm text-text-secondary">
          <Link
            href="/account/login"
            className="focus-ring font-medium underline-offset-2 hover:underline"
            style={{ color: "var(--color-link)" }}
          >
            {tr("logIn")}
          </Link>{" "}
          {tr("loginToReview")}
        </div>
      )}

      {isCustomer && eligibility && (
        <div className="mb-8">
          {eligibility.alreadyReviewed && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-300">
              {tr("alreadyReviewed")}
            </div>
          )}
          {!eligibility.hasPurchased && !eligibility.alreadyReviewed && (
            <div className="bg-surface border border-border-subtle rounded-lg p-4 text-sm text-text-secondary">
              {tr("purchasersOnly")}
            </div>
          )}
          {eligibility.canReview && (
            <div className="border border-border-subtle rounded-lg p-5">
              <ReviewForm productId={productId} />
            </div>
          )}
        </div>
      )}

      {/* Reviews list */}
      <ReviewList
        productId={productId}
        initialReviews={reviews}
        initialTotal={total}
      />
    </section>
  );
}

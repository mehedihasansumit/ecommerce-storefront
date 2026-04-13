import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ReviewService } from "@/features/reviews/service";
import { ReviewModerationTable } from "./ReviewModerationTable";

const PAGE_SIZE = 20;

export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (!adminUser) redirect("/admin/login");

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");

  const canView = hasPermission(adminUser, PERMISSIONS.REVIEWS_VIEW) ||
    hasPermission(adminUser, PERMISSIONS.REVIEWS_MODERATE);
  if (!canView) redirect(`/admin/stores/${storeId}`);

  const { page: pageStr, filter } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1"));

  let isApproved: boolean | undefined;
  if (filter === "approved") isApproved = true;
  else if (filter === "pending") isApproved = false;

  const { reviews, total, totalPages } = await ReviewService.getByStore(storeId, {
    page,
    limit: PAGE_SIZE,
    isApproved,
  });

  const pendingCount = await ReviewService.getByStore(storeId, {
    page: 1,
    limit: 1,
    isApproved: false,
  }).then((r) => r.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/stores/${storeId}`}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} review{total !== 1 ? "s" : ""} total
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { label: "All", value: undefined },
          { label: "Pending", value: "pending" },
          { label: "Approved", value: "approved" },
        ].map((tab) => {
          const active = filter === tab.value || (!filter && tab.value === undefined);
          return (
            <Link
              key={tab.label}
              href={`/admin/stores/${storeId}/reviews${tab.value ? `?filter=${tab.value}` : ""}`}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <ReviewModerationTable reviews={reviews} storeId={storeId} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            {/* Previous */}
            {page > 1 ? (
              <Link
                href={`/admin/stores/${storeId}/reviews?page=${page - 1}${filter ? `&filter=${filter}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                ‹
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-gray-300 cursor-default">
                ‹
              </span>
            )}

            {/* Page numbers */}
            {(() => {
              const pages: (number | "…")[] = [];
              if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) pages.push(i);
              } else {
                pages.push(1);
                if (page > 4) pages.push("…");
                for (
                  let i = Math.max(2, page - 2);
                  i <= Math.min(totalPages - 1, page + 2);
                  i++
                ) {
                  pages.push(i);
                }
                if (page < totalPages - 3) pages.push("…");
                pages.push(totalPages);
              }
              return pages.map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-gray-400">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={`/admin/stores/${storeId}/reviews?page=${p}${filter ? `&filter=${filter}` : ""}`}
                    className={`min-w-8 px-2.5 py-1.5 rounded-lg border text-center transition-colors ${
                      p === page
                        ? "border-gray-900 bg-gray-900 text-white font-medium"
                        : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    {p}
                  </Link>
                )
              );
            })()}

            {/* Next */}
            {page < totalPages ? (
              <Link
                href={`/admin/stores/${storeId}/reviews?page=${page + 1}${filter ? `&filter=${filter}` : ""}`}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                ›
              </Link>
            ) : (
              <span className="px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-gray-300 cursor-default">
                ›
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

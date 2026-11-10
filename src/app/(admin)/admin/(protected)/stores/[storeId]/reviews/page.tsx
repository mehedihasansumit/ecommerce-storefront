import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, PageHeader } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "@/app/(admin)/admin/_components/AdminBreadcrumbs";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ReviewService } from "@/features/reviews/service";
import { StoreService } from "@/features/stores/service";
import { ReviewModerationTable } from "./ReviewModerationTable";

const PAGE_SIZE = 20;

const PAGE_BTN =
  "focus-ring min-w-10 h-10 flex items-center justify-center rounded-lg border transition-colors";

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

  const [{ reviews, total, totalPages }, pendingResult, store] = await Promise.all([
    ReviewService.getByStore(storeId, {
      page,
      limit: PAGE_SIZE,
      isApproved,
    }),
    ReviewService.getByStore(storeId, {
      page: 1,
      limit: 1,
      isApproved: false,
    }),
    StoreService.getById(storeId),
  ]);

  if (!store) notFound();

  const pendingCount = pendingResult.total;

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Customer Reviews"
        description={
          <>
            {total} review{total !== 1 ? "s" : ""} total
            {pendingCount > 0 && (
              <Badge tone="warning" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </>
        }
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Reviews" },
            ]}
          />
        }
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter reviews">
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
              aria-current={active ? "page" : undefined}
              className={`focus-ring px-3 py-1.5 text-sm rounded-lg font-medium border transition-colors ${
                active
                  ? "bg-admin-text-primary text-admin-surface border-admin-text-primary"
                  : "bg-admin-surface border-admin-border-md text-admin-text-secondary hover:bg-admin-surface-hover"
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
        <nav aria-label="Pagination" className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-admin-text-muted">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {/* Previous */}
            {page > 1 ? (
              <Link
                href={`/admin/stores/${storeId}/reviews?page=${page - 1}${filter ? `&filter=${filter}` : ""}`}
                aria-label="Previous page"
                className={`${PAGE_BTN} border-admin-border-md bg-admin-surface text-admin-text-secondary hover:bg-admin-surface-hover`}
              >
                <ChevronLeft aria-hidden className="w-4 h-4" />
              </Link>
            ) : (
              <span aria-hidden className={`${PAGE_BTN} border-admin-border bg-admin-surface-raised text-admin-text-subtle opacity-50 cursor-default`}>
                <ChevronLeft className="w-4 h-4" />
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
                  <span key={`ellipsis-${idx}`} aria-hidden className="px-2 py-1.5 text-admin-text-muted">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={`/admin/stores/${storeId}/reviews?page=${p}${filter ? `&filter=${filter}` : ""}`}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? "page" : undefined}
                    className={`${PAGE_BTN} px-2.5 ${
                      p === page
                        ? "border-admin-text-primary bg-admin-text-primary text-admin-surface font-medium"
                        : "border-admin-border-md bg-admin-surface hover:bg-admin-surface-hover text-admin-text-secondary"
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
                aria-label="Next page"
                className={`${PAGE_BTN} border-admin-border-md bg-admin-surface text-admin-text-secondary hover:bg-admin-surface-hover`}
              >
                <ChevronRight aria-hidden className="w-4 h-4" />
              </Link>
            ) : (
              <span aria-hidden className={`${PAGE_BTN} border-admin-border bg-admin-surface-raised text-admin-text-subtle opacity-50 cursor-default`}>
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

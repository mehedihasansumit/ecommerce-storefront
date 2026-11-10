import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Package, ChevronLeft, ChevronRight, Star, Plus } from "lucide-react";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { StoreService } from "@/features/stores/service";
import { tAdmin } from "@/shared/lib/i18n";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ProductsSearch } from "./ProductsSearch";
import { CategoryFilter } from "./CategoryFilter";
import { DeleteProductButton } from "./DeleteProductButton";
import { FilterChip } from "@/shared/components/admin/FilterChip";
import { Badge, Card, EmptyState, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../_components/AdminBreadcrumbs";

const PAGE_SIZE = 20;
type Status = "all" | "active" | "inactive";

function buildHref(
  storeId: string,
  overrides: { q?: string; category?: string; status?: string; page?: number }
) {
  const p = new URLSearchParams();
  if (overrides.q) p.set("q", overrides.q);
  if (overrides.category) p.set("category", overrides.category);
  if (overrides.status && overrides.status !== "all") p.set("status", overrides.status);
  if (overrides.page && overrides.page > 1) p.set("page", String(overrides.page));
  const qs = p.toString();
  return `/admin/stores/${storeId}/products${qs ? `?${qs}` : ""}`;
}

export default async function StoreProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>;
}) {
  const adminUser = await getAdminDbUser();
  if (
    !adminUser ||
    (!hasPermission(adminUser, PERMISSIONS.PRODUCTS_CREATE) &&
      !hasPermission(adminUser, PERMISSIONS.PRODUCTS_EDIT) &&
      !hasPermission(adminUser, PERMISSIONS.PRODUCTS_DELETE))
  ) {
    redirect("/admin");
  }

  const { storeId } = await params;
  if (!canAccessStore(adminUser, storeId)) redirect("/admin");

  const { q, category, status: rawStatus, page: pageStr } = await searchParams;
  const status: Status =
    rawStatus === "active" || rawStatus === "inactive" ? rawStatus : "all";
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const [result, categories, store] = await Promise.all([
    ProductService.getByStore(storeId, {
      page,
      limit: PAGE_SIZE,
      search: q || undefined,
      categoryId: category || undefined,
      status,
    }),
    CategoryService.getByStore(storeId),
    StoreService.getById(storeId),
  ]);

  if (!store) notFound();

  const { data: products, total, totalPages } = result;
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const categoryMap = new Map(categories.map((c) => [c._id, tAdmin(c.name)]));
  const canDelete = hasPermission(adminUser, PERMISSIONS.PRODUCTS_DELETE);

  const categoryOptions = categories.map((c) => ({
    _id: c._id,
    label: tAdmin(c.name),
  }));

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total} ${total === 1 ? "product" : "products"}`}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Products" },
            ]}
          />
        }
        actions={
          <Link
            href={`/admin/stores/${storeId}/products/new`}
            className={buttonClassName({ variant: "primary", size: "md" })}
          >
            <Plus aria-hidden size={16} />
            New Product
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <ProductsSearch storeId={storeId} defaultValue={q} />

        {categoryOptions.length > 0 && (
          <CategoryFilter
            storeId={storeId}
            categories={categoryOptions}
            defaultCategory={category}
          />
        )}

        {/* Status tabs */}
        <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-1 sm:ml-auto">
          {(["all", "active", "inactive"] as Status[]).map((s) => (
            <FilterChip
              key={s}
              href={buildHref(storeId, { q, category, status: s })}
              selected={status === s}
              className="capitalize"
            >
              {s}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* Table / Empty state */}
      {products.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={Package}
            title="No products found"
            description={
              q
                ? `No products match "${q}".`
                : status !== "all"
                  ? `No ${status} products.`
                  : "Add your first product to get started."
            }
            action={
              !q && status === "all" ? (
                <Link
                  href={`/admin/stores/${storeId}/products/new`}
                  className={buttonClassName({ variant: "primary", size: "md" })}
                >
                  <Plus aria-hidden size={16} />
                  New Product
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <Card padding="none" className="overflow-hidden">
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-175">
                <thead className="bg-admin-surface-raised border-b border-admin-border-md">
                  <tr>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Product
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      SKU
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Category
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Price
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Stock
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Status
                    </th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Added
                    </th>
                    <th scope="col" className="px-5 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {products.map((product) => {
                    const name = tAdmin(product.name);
                    const categoryName = product.categoryId
                      ? (categoryMap.get(product.categoryId) ?? "—")
                      : "—";
                    const hasDiscount =
                      product.compareAtPrice > 0 &&
                      product.compareAtPrice > product.price;
                    const isLowStock =
                      product.trackInventory &&
                      product.stock > 0 &&
                      product.stock <= 5;

                    return (
                      <tr
                        key={product._id}
                        className="hover:bg-admin-surface-raised/60 transition-colors group"
                      >
                        {/* Product */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {product.thumbnail ? (
                              <img
                                src={product.thumbnail}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover border border-admin-border shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-admin-chip flex items-center justify-center shrink-0">
                                <Package aria-hidden className="w-4 h-4 text-admin-text-muted" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-admin-text-primary truncate max-w-45">
                                {name}
                              </p>
                              {product.isFeatured && (
                                <Badge tone="warning" size="sm" className="mt-0.5">
                                  <Star aria-hidden className="w-2.5 h-2.5 fill-current" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-admin-text-muted">
                            {product.sku || "—"}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4 text-sm text-admin-text-secondary">
                          {categoryName}
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-admin-text-primary">
                              ৳{product.price.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-admin-text-muted line-through">
                                ৳{product.compareAtPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="px-5 py-4">
                          <span
                            className={`text-sm font-medium ${product.stock === 0
                                ? "text-red-600 dark:text-red-400"
                                : isLowStock
                                  ? "text-amber-700 dark:text-amber-400"
                                  : "text-admin-text-secondary"
                              }`}
                          >
                            {product.stock}
                          </span>
                          {product.stock === 0 && (
                            <span className="ml-1.5 text-[10px] font-medium text-red-600 dark:text-red-400">
                              Out
                            </span>
                          )}
                          {isLowStock && (
                            <span className="ml-1.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                              Low
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <Badge tone={product.isActive ? "success" : "neutral"}>
                            <span
                              aria-hidden
                              className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-emerald-500" : "bg-gray-400"
                                }`}
                            />
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-xs text-admin-text-muted whitespace-nowrap">
                          {new Date(product.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/stores/${storeId}/products/${product._id}`}
                              className={buttonClassName({ variant: "secondary", size: "sm" })}
                              aria-label={`Edit ${name}`}
                            >
                              Edit
                            </Link>
                            {canDelete && (
                              <DeleteProductButton
                                productId={product._id}
                                productName={name}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, category, status, page: currentPage - 1 })}
                  aria-disabled={currentPage <= 1}
                  aria-label="Previous page"
                  tabIndex={currentPage <= 1 ? -1 : undefined}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors focus-ring ${currentPage <= 1
                      ? "opacity-40 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                    }`}
                >
                  <ChevronLeft aria-hidden className="w-4 h-4" />
                </Link>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        aria-hidden
                        className="w-10 h-10 flex items-center justify-center text-xs text-admin-text-muted"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(storeId, { q, category, status, page: item as number })}
                        aria-label={`Page ${item}`}
                        aria-current={currentPage === item ? "page" : undefined}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg text-xs font-medium transition-colors focus-ring ${currentPage === item
                            ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                            : "border border-admin-border-md text-admin-text-secondary hover:bg-admin-chip"
                          }`}
                      >
                        {item}
                      </Link>
                    )
                  )}

                <Link
                  href={buildHref(storeId, { q, category, status, page: currentPage + 1 })}
                  aria-disabled={currentPage >= totalPages}
                  aria-label="Next page"
                  tabIndex={currentPage >= totalPages ? -1 : undefined}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors focus-ring ${currentPage >= totalPages
                      ? "opacity-40 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                    }`}
                >
                  <ChevronRight aria-hidden className="w-4 h-4" />
                </Link>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

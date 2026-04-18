import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { tAdmin } from "@/shared/lib/i18n";
import { getAdminDbUser } from "@/shared/lib/auth";
import { hasPermission, canAccessStore, PERMISSIONS } from "@/shared/lib/permissions";
import { ProductsSearch } from "./ProductsSearch";
import { CategoryFilter } from "./CategoryFilter";
import { DeleteProductButton } from "./DeleteProductButton";

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

  const [result, categories] = await Promise.all([
    ProductService.getByStore(storeId, {
      page,
      limit: PAGE_SIZE,
      search: q || undefined,
      categoryId: category || undefined,
      status,
    }),
    CategoryService.getByStore(storeId),
  ]);

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-admin-text-primary">Products</h1>
          <p className="text-sm text-admin-text-muted mt-0.5">{total} {total === 1 ? "product" : "products"}</p>
        </div>
        <Link
          href={`/admin/stores/${storeId}/products/new`}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + New Product
        </Link>
      </div>

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
        <div className="flex items-center gap-1 ml-auto">
          {(["all", "active", "inactive"] as Status[]).map((s) => (
            <Link
              key={s}
              href={buildHref(storeId, { q, category, status: s })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
                status === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-admin-surface text-admin-text-secondary border-admin-border-md hover:border-gray-400"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {/* Table / Empty state */}
      {products.length === 0 ? (
        <div className="text-center py-20 bg-admin-surface rounded-xl border border-admin-border-md">
          <div className="w-14 h-14 bg-admin-chip rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-admin-text-subtle" />
          </div>
          <h3 className="text-base font-semibold text-admin-text-primary mb-1">No products found</h3>
          <p className="text-sm text-admin-text-muted mb-4">
            {q
              ? `No products match "${q}".`
              : status !== "all"
              ? `No ${status} products.`
              : "Add your first product to get started."}
          </p>
          {!q && status === "all" && (
            <Link
              href={`/admin/stores/${storeId}/products/new`}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              + New Product
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="bg-admin-surface rounded-xl border border-admin-border-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-admin-surface-raised border-b border-admin-border-md">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Product
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      SKU
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Category
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Price
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Stock
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                      Added
                    </th>
                    <th className="px-5 py-3" />
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
                                alt={name}
                                className="w-10 h-10 rounded-lg object-cover border border-admin-border shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-admin-chip flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-admin-text-subtle" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-admin-text-primary truncate max-w-[180px]">
                                {name}
                              </p>
                              {product.isFeatured && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-admin-text-muted">
                            {product.sku || "—"}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-5 py-4 text-sm text-admin-text-secondary">
                          {categoryName}
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-semibold text-admin-text-primary">
                              ৳{product.price.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-admin-text-subtle line-through">
                                ৳{product.compareAtPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="px-5 py-4">
                          <span
                            className={`text-sm font-medium ${
                              product.stock === 0
                                ? "text-red-600"
                                : isLowStock
                                ? "text-amber-600"
                                : "text-admin-text-secondary"
                            }`}
                          >
                            {product.stock}
                          </span>
                          {product.stock === 0 && (
                            <span className="ml-1.5 text-[10px] font-medium text-red-500">
                              Out
                            </span>
                          )}
                          {isLowStock && (
                            <span className="ml-1.5 text-[10px] font-medium text-amber-500">
                              Low
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              product.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-admin-chip text-admin-text-muted"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                product.isActive ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                            {product.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-4 text-xs text-admin-text-subtle whitespace-nowrap">
                          {new Date(product.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/stores/${storeId}/products/${product._id}`}
                              className="px-3 py-1.5 text-xs font-medium text-admin-text-secondary bg-admin-chip hover:bg-admin-surface-hover rounded-lg transition-colors"
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-admin-text-muted">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-1">
                <Link
                  href={buildHref(storeId, { q, category, status, page: currentPage - 1 })}
                  aria-disabled={currentPage <= 1}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    currentPage <= 1
                      ? "opacity-30 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
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
                        className="w-8 h-8 flex items-center justify-center text-xs text-admin-text-subtle"
                      >
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildHref(storeId, { q, category, status, page: item as number })}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          currentPage === item
                            ? "bg-gray-900 text-white"
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
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-admin-text-muted transition-colors ${
                    currentPage >= totalPages
                      ? "opacity-30 pointer-events-none border-admin-border-md"
                      : "border-admin-border-md hover:bg-admin-chip"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

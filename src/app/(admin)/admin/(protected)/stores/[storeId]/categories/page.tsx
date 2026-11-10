import Link from "next/link";
import { notFound } from "next/navigation";
import { FolderOpen, Package, ChevronRight, Plus } from "lucide-react";
import { CategoryService } from "@/features/categories/service";
import { ProductService } from "@/features/products/service";
import { StoreService } from "@/features/stores/service";
import { tAdmin } from "@/shared/lib/i18n";
import { FilterChip } from "@/shared/components/admin/FilterChip";
import { Badge, Card, EmptyState, PageHeader, buttonClassName } from "@/shared/components/ui";
import { AdminBreadcrumbs } from "../../../../_components/AdminBreadcrumbs";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

type Status = "all" | "active" | "inactive";

function buildHref(storeId: string, status: Status) {
  const base = `/admin/stores/${storeId}/categories`;
  return status === "all" ? base : `${base}?status=${status}`;
}

export default async function StoreCategoriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { storeId } = await params;
  const { status: rawStatus } = await searchParams;
  const status: Status =
    rawStatus === "active" || rawStatus === "inactive" ? rawStatus : "all";

  const [categories, store] = await Promise.all([
    CategoryService.getByStore(storeId, status),
    StoreService.getById(storeId),
  ]);

  if (!store) notFound();

  // Product counts per category
  const categoryIds = categories.map((c) => c._id);
  const productCounts =
    categoryIds.length > 0
      ? await ProductService.getCountsByCategoryIds(storeId, categoryIds)
      : {};

  // Build parent name map
  const nameMap = new Map(categories.map((c) => [c._id, tAdmin(c.name)]));

  const total = categories.length;

  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${total} ${total === 1 ? "category" : "categories"}`}
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Stores", href: "/admin/stores" },
              { label: store.name, href: `/admin/stores/${storeId}` },
              { label: "Categories" },
            ]}
          />
        }
        actions={
          <Link
            href={`/admin/stores/${storeId}/categories/new`}
            className={buttonClassName({ variant: "primary", size: "md" })}
          >
            <Plus aria-hidden size={16} />
            New Category
          </Link>
        }
      />

      {/* Status filter tabs */}
      <div role="group" aria-label="Filter by status" className="flex flex-wrap items-center gap-1 mb-5">
        {(["all", "active", "inactive"] as Status[]).map((s) => (
          <FilterChip
            key={s}
            href={buildHref(storeId, s)}
            selected={status === s}
            className="capitalize"
          >
            {s}
          </FilterChip>
        ))}
      </div>

      {categories.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon={FolderOpen}
            title="No categories found"
            description={
              status !== "all"
                ? `No ${status} categories.`
                : "Create categories to organize your products."
            }
            action={
              status === "all" ? (
                <Link
                  href={`/admin/stores/${storeId}/categories/new`}
                  className={buttonClassName({ variant: "primary", size: "md" })}
                >
                  <Plus aria-hidden size={16} />
                  New Category
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-150">
              <thead className="bg-admin-surface-raised border-b border-admin-border-md">
                <tr>
                  <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                    Category
                  </th>
                  <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                    Slug
                  </th>
                  <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                    Parent
                  </th>
                  <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                    Products
                  </th>
                  <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                    Order
                  </th>
                  <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {categories.map((cat) => {
                  const name = tAdmin(cat.name);
                  const parentName = cat.parentId ? (nameMap.get(cat.parentId) ?? null) : null;
                  const count = productCounts[cat._id] ?? 0;

                  return (
                    <tr
                      key={cat._id}
                      className="hover:bg-admin-surface-raised/60 transition-colors group"
                    >
                      {/* Category name + image */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt=""
                              className="w-9 h-9 rounded-lg object-cover border border-admin-border shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-admin-chip flex items-center justify-center shrink-0">
                              <FolderOpen aria-hidden className="w-4 h-4 text-admin-text-muted" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-admin-text-primary">
                            {name}
                          </span>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-admin-text-muted">
                          {cat.slug}
                        </span>
                      </td>

                      {/* Parent */}
                      <td className="px-5 py-4 text-sm text-admin-text-muted">
                        {parentName ? (
                          <span className="inline-flex items-center gap-1 text-xs text-admin-text-muted">
                            <ChevronRight aria-hidden className="w-3 h-3 text-admin-text-muted" />
                            {parentName}
                          </span>
                        ) : (
                          <span className="text-xs text-admin-text-muted">—</span>
                        )}
                      </td>

                      {/* Product count */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Package aria-hidden className="w-3.5 h-3.5 text-admin-text-muted" />
                          <span className="font-medium text-admin-text-secondary">{count}</span>
                        </div>
                      </td>

                      {/* Sort order */}
                      <td className="px-5 py-4 text-sm text-admin-text-muted">
                        {cat.sortOrder}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <Badge tone={cat.isActive ? "success" : "neutral"}>
                          <span
                            aria-hidden
                            className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                          />
                          {cat.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/stores/${storeId}/categories/${cat._id}`}
                            className={buttonClassName({ variant: "secondary", size: "sm" })}
                            aria-label={`Edit ${name}`}
                          >
                            Edit
                          </Link>
                          <DeleteCategoryButton
                            categoryId={cat._id}
                            categoryName={name}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

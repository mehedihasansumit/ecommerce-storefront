import Link from "next/link";
import { FolderOpen, Package, ChevronRight } from "lucide-react";
import { CategoryService } from "@/features/categories/service";
import { ProductService } from "@/features/products/service";
import { tAdmin } from "@/shared/lib/i18n";
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

  const categories = await CategoryService.getByStore(storeId, status);

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} {total === 1 ? "category" : "categories"}
          </p>
        </div>
        <Link
          href={`/admin/stores/${storeId}/categories/new`}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + New Category
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 mb-5">
        {(["all", "active", "inactive"] as Status[]).map((s) => (
          <Link
            key={s}
            href={buildHref(storeId, s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-colors ${
              status === s
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-7 h-7 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No categories found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {status !== "all"
              ? `No ${status} categories.`
              : "Create categories to organize your products."}
          </p>
          {status === "all" && (
            <Link
              href={`/admin/stores/${storeId}/categories/new`}
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              + New Category
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Slug
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Parent
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Products
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Order
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat) => {
                  const name = tAdmin(cat.name);
                  const parentName = cat.parentId ? (nameMap.get(cat.parentId) ?? null) : null;
                  const count = productCounts[cat._id] ?? 0;

                  return (
                    <tr
                      key={cat._id}
                      className="hover:bg-gray-50/60 transition-colors group"
                    >
                      {/* Category name + image */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={name}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <FolderOpen className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {name}
                          </span>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-gray-500">
                          {cat.slug}
                        </span>
                      </td>

                      {/* Parent */}
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {parentName ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            {parentName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>

                      {/* Product count */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-gray-700">{count}</span>
                        </div>
                      </td>

                      {/* Sort order */}
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {cat.sortOrder}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            cat.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/stores/${storeId}/categories/${cat._id}`}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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
        </div>
      )}
    </div>
  );
}

import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { createStoreMetadata } from "@/shared/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";
import { ITEMS_PER_PAGE } from "@/shared/lib/constants";
import { getTranslations } from "next-intl/server";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) return { title: "Products" };
  return createStoreMetadata(tenant, {
    title: "All Products",
    description: `Browse all products at ${tenant.name}`,
    path: "/products",
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; search?: string }>;
}) {
  const tenant = await getTenant();
  const t = await getTranslations("products");
  if (!tenant) return null;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const categorySlug = params.category;
  const search = params.search;

  let categoryId: string | undefined;
  if (categorySlug) {
    const category = await CategoryService.getBySlug(tenant._id, categorySlug);
    if (category) categoryId = category._id;
  }

  const [result, categories] = await Promise.all([
    ProductService.getByStore(tenant._id, {
      page,
      limit: ITEMS_PER_PAGE,
      categoryId,
      search,
    }),
    CategoryService.getByStore(tenant._id),
  ]);

  const buildUrl = (p: number) => {
    const parts = [`/products?page=${p}`];
    if (categorySlug) parts.push(`category=${categorySlug}`);
    if (search) parts.push(`search=${search}`);
    return parts.join("&");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {categorySlug
            ? t("categoryFilter", { category: categorySlug })
            : t("allProducts")}
        </h1>
        {search && (
          <p className="text-gray-500">
            {t("searchResults") || "Search results for"}: &ldquo;{search}&rdquo;
          </p>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar - Categories */}
        {categories.length > 0 && (
          <aside className="w-full lg:w-60 shrink-0">
            <div
              className="lg:sticky lg:top-24 p-5 bg-gray-50 border border-gray-100"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={16} className="text-gray-500" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-700">
                  {t("categories")}
                </h3>
              </div>

              {/* Search input */}
              <form method="get" action="/products" className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    name="search"
                    defaultValue={search || ""}
                    placeholder={t("searchPlaceholder") || "Search..."}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    style={{ borderRadius: "var(--border-radius)" }}
                  />
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </form>

              <ul className="space-y-1">
                <li>
                  <Link
                    href="/products"
                    className={`block px-3 py-2 text-sm rounded-lg transition-all ${
                      !categorySlug
                        ? "font-semibold text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    style={
                      !categorySlug
                        ? {
                            backgroundColor: "var(--color-primary)",
                            borderRadius: "var(--border-radius)",
                          }
                        : { borderRadius: "var(--border-radius)" }
                    }
                  >
                    {t("all")}
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat._id}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      className={`block px-3 py-2 text-sm rounded-lg transition-all ${
                        categorySlug === cat.slug
                          ? "font-semibold text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      style={
                        categorySlug === cat.slug
                          ? {
                              backgroundColor: "var(--color-primary)",
                              borderRadius: "var(--border-radius)",
                            }
                          : { borderRadius: "var(--border-radius)" }
                      }
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {/* Results count */}
          <p className="text-sm text-gray-500 mb-6">
            {t("showing") || "Showing"}{" "}
            <span className="font-medium text-gray-900">
              {result.data.length}
            </span>{" "}
            {t("of") || "of"}{" "}
            <span className="font-medium text-gray-900">{result.total}</span>{" "}
            {t("productsLabel") || "products"}
          </p>

          <ProductGrid products={result.data} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              {/* Previous */}
              {page > 1 && (
                <Link
                  href={buildUrl(page - 1)}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </Link>
              )}

              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <Link
                    key={p}
                    href={buildUrl(p)}
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                      p === page
                        ? "text-white shadow-sm"
                        : "border border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                    style={
                      p === page
                        ? {
                            backgroundColor: "var(--color-primary)",
                          }
                        : undefined
                    }
                  >
                    {p}
                  </Link>
                )
              )}

              {/* Next */}
              {page < result.totalPages && (
                <Link
                  href={buildUrl(page + 1)}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

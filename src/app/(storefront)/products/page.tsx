import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { createStoreMetadata } from "@/shared/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";
import { ITEMS_PER_PAGE } from "@/shared/lib/constants";

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {categorySlug ? `Category: ${categorySlug}` : "All Products"}
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar - Categories */}
        {categories.length > 0 && (
          <aside className="w-full md:w-56 shrink-0">
            <h3 className="font-semibold mb-3">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className={`text-sm ${!categorySlug ? "font-bold" : "text-gray-600 hover:text-gray-900"}`}
                >
                  All
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat._id}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className={`text-sm ${categorySlug === cat.slug ? "font-bold" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          <ProductGrid products={result.data} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <Link
                    key={p}
                    href={`/products?page=${p}${categorySlug ? `&category=${categorySlug}` : ""}${search ? `&search=${search}` : ""}`}
                    className={`px-4 py-2 text-sm border ${
                      p === page
                        ? "font-bold border-gray-900"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                    style={{ borderRadius: "var(--border-radius)" }}
                  >
                    {p}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { createStoreMetadata } from "@/shared/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ITEMS_PER_PAGE } from "@/shared/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) return { title: "Category" };

  const { slug } = await params;
  const category = await CategoryService.getBySlug(tenant._id, slug);
  if (!category) return { title: "Category Not Found" };

  return createStoreMetadata(tenant, {
    title: category.name,
    description: category.description || `Browse ${category.name} products`,
    path: `/categories/${category.slug}`,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const tenant = await getTenant();
  if (!tenant) return null;

  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  const category = await CategoryService.getBySlug(tenant._id, slug);
  if (!category) notFound();

  const page = parseInt(pageParam || "1", 10);
  const result = await ProductService.getByStore(tenant._id, {
    page,
    limit: ITEMS_PER_PAGE,
    categoryId: category._id,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{category.name}</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      {category.description && (
        <p className="text-gray-600 mb-8">{category.description}</p>
      )}

      <ProductGrid products={result.data} />

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <Link
                key={p}
                href={`/categories/${slug}?page=${p}`}
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
  );
}

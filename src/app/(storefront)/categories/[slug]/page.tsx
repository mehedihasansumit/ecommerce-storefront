import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { createStoreMetadata } from "@/shared/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { ITEMS_PER_PAGE } from "@/shared/lib/constants";
import { getLocale, getTranslations } from "next-intl/server";
import { t } from "@/shared/lib/i18n";

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

  const locale = await getLocale();
  const catName = t(category.name, locale);
  return createStoreMetadata(tenant, {
    title: catName,
    description: t(category.description, locale) || `Browse ${catName} products`,
    path: `/categories/${category.slug}`,
  }, locale);
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

  const locale = await getLocale();
  const th = await getTranslations("header");
  const category = await CategoryService.getBySlug(tenant._id, slug);
  if (!category) notFound();

  const catName = t(category.name, locale);
  const catDesc = t(category.description, locale);

  const page = parseInt(pageParam || "1", 10);
  const result = await ProductService.getByStore(tenant._id, {
    page,
    limit: ITEMS_PER_PAGE,
    categoryId: category._id,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      <nav aria-label={th("home")} className="flex items-center gap-2 text-sm text-text-secondary mb-2 md:mb-4">
        <Link href="/" className="focus-ring inline-flex min-h-10 items-center hover:text-[var(--color-text)] transition-colors">
          {th("home")}
        </Link>
        <ChevronRight size={14} aria-hidden className="text-text-tertiary" />
        <span className="text-[var(--color-text)] font-medium truncate" aria-current="page">{catName}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-2">{catName}</h1>
      {catDesc && (
        <p className="text-text-secondary mb-6 md:mb-8 max-w-2xl">{catDesc}</p>
      )}

      <ProductGrid products={result.data} />

      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <Link
                key={p}
                href={`/categories/${slug}?page=${p}`}
                aria-current={p === page ? "page" : undefined}
                className={`focus-ring inline-flex min-h-10 min-w-10 items-center justify-center px-4 text-sm border transition-colors ${
                  p === page
                    ? "font-semibold border-[var(--color-text)]"
                    : "border-border-subtle text-text-secondary hover:border-text-secondary"
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

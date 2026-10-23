import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import {
  getStoreCategories,
  getTopLevelCategoriesWithProducts,
} from "@/features/categories/storefront";
import { ProductGrid } from "@/features/products/components/ProductGrid";
import { SortDropdown } from "@/features/products/components/SortDropdown";
import { ActiveFilters } from "@/features/products/components/ActiveFilters";
import { createStoreMetadata } from "@/shared/lib/seo";
import Link from "next/link";
import type { Metadata } from "next";
import { ITEMS_PER_PAGE } from "@/shared/lib/constants";
import { getTranslations, getLocale, getFormatter } from "next-intl/server";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { SearchFormWithTracking } from "@/features/products/components/SearchFormWithTracking";
import { formatNumber, t as tl } from "@/shared/lib/i18n";
import { ScrollCurrentIntoView } from "@/features/categories/components/ScrollCurrentIntoView";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  if (!tenant) return { title: "Products" };
  const locale = await getLocale();
  return createStoreMetadata(tenant, {
    title: "All Products",
    description: `Browse all products at ${tenant.name}`,
    path: "/products",
  }, locale);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const tenant = await getTenant();
  const t = await getTranslations("products");
  const locale = await getLocale();
  const format = await getFormatter();
  if (!tenant) return null;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const categorySlug = params.category;
  const search = params.search;
  const sort = params.sort;
  const order = (params.order === "asc" || params.order === "desc") ? params.order : undefined;

  let categoryId: string | undefined;
  let categoryName: string | undefined;
  let categoryParentId: string | null = null;
  if (categorySlug) {
    const category = await CategoryService.getBySlug(tenant._id, categorySlug);
    if (category) {
      categoryId = category._id;
      categoryName = tl(category.name, locale);
      categoryParentId = category.parentId;
    }
  }

  const [result, categories, allCount] = await Promise.all([
    ProductService.getByStore(tenant._id, {
      page,
      limit: ITEMS_PER_PAGE,
      categoryId,
      search,
      sort,
      order,
    }),
    getStoreCategories(tenant._id),
    // Get the true store-wide total regardless of active filters
    ProductService.getByStore(tenant._id, { page: 1, limit: 1 }).then((r) => r.total),
  ]);

  // Product counts per category for the sidebar, and the top-level categories
  // with active products for the phone/tablet chip row (same set as the home tiles).
  const [categoryCounts, chipCategories] = categories.length > 0
    ? await Promise.all([
        ProductService.getCountsByCategoryIds(
          tenant._id,
          categories.map((c) => c._id)
        ),
        getTopLevelCategoriesWithProducts(tenant._id),
      ])
    : [{} as Record<string, number>, []];
  // A sub-category highlights its top-level parent chip.
  const activeChipId = categoryParentId ?? categoryId;

  const buildUrl = (p: number) => {
    const parts = [`/products?page=${p}`];
    if (categorySlug) parts.push(`category=${categorySlug}`);
    if (search) parts.push(`search=${encodeURIComponent(search)}`);
    if (sort) parts.push(`sort=${sort}`);
    if (order) parts.push(`order=${order}`);
    return parts.join("&");
  };

  // Pagination range: show at most 5 page numbers with ellipsis logic
  const pageNumbers: (number | "...")[] = [];
  if (result.totalPages <= 7) {
    for (let i = 1; i <= result.totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(result.totalPages - 1, page + 1); i++) {
      pageNumbers.push(i);
    }
    if (page < result.totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(result.totalPages);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Page Header */}
      <div className="mb-4 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-1">
          {categoryName
            ? categoryName
            : t("allProducts")}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("countLabel", { count: result.total })}
          {search && (
            <> · {t("searchResults")} &ldquo;<span className="text-[var(--color-text)] font-medium">{search}</span>&rdquo;</>
          )}
        </p>
      </div>

      {/* Phones/tablets: one horizontally scrollable chip row of the top-level
          categories (same set and order as the home tiles), then a compact search,
          so the first products still land on the first screen at 390px. Desktop
          uses the sidebar below. */}
      {categories.length > 0 && (
        <div className="lg:hidden mb-5 space-y-3">
          {chipCategories.length > 0 && (
            <nav aria-label={t("categories")}>
              <ul
                id="products-category-chips"
                className="-mx-4 px-4 sm:-mx-6 sm:px-6 flex gap-2 overflow-x-auto overscroll-x-contain snap-x scroll-px-4 sm:scroll-px-6 no-scrollbar py-0.5"
              >
                {[{ key: "all", href: "/products", label: t("all"), active: !categorySlug },
                  ...chipCategories.map(({ category: cat }) => ({
                    key: cat._id,
                    href: `/products?category=${cat.slug}`,
                    label: tl(cat.name, locale),
                    active: activeChipId === cat._id,
                  })),
                ].map((chip) => (
                  <li key={chip.key} className="shrink-0 snap-start">
                    <Link
                      href={chip.href}
                      aria-current={chip.active ? "page" : undefined}
                      className={`focus-ring inline-flex min-h-10 items-center whitespace-nowrap rounded-full border px-4 text-sm transition-[color,background-color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${
                        chip.active
                          ? "font-semibold"
                          : "border-border-subtle text-text-secondary hover:bg-surface hover:text-[var(--color-text)]"
                      }`}
                      style={
                        chip.active
                          ? {
                              backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                              borderColor: "color-mix(in srgb, var(--color-primary) 35%, transparent)",
                              color: "var(--color-link)",
                            }
                          : undefined
                      }
                    >
                      {chip.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ScrollCurrentIntoView
                targetId="products-category-chips"
                activeKey={activeChipId ?? "all"}
              />
            </nav>
          )}
          <SearchFormWithTracking
            defaultValue={search || ""}
            placeholder={t("searchPlaceholder")}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar - Categories (desktop) */}
        {categories.length > 0 && (
          <aside className="hidden lg:block w-60 shrink-0">
            <div
              className="lg:sticky lg:top-24 p-5 bg-bg shadow-[var(--shadow-xs)] border border-border-subtle"
              style={{ borderRadius: "var(--border-radius)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal size={16} className="text-text-secondary" />
                <h3 className="font-semibold text-sm uppercase tracking-wide text-[var(--color-text)]">
                  {t("categories")}
                </h3>
              </div>

              {/* Search input */}
              <SearchFormWithTracking
                defaultValue={search || ""}
                placeholder={t("searchPlaceholder")}
              />

              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/products"
                    className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${
                      !categorySlug
                        ? "font-semibold"
                        : "text-text-secondary hover:bg-surface hover:text-[var(--color-text)]"
                    }`}
                    style={
                      !categorySlug
                        ? {
                            backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                            color: "var(--color-link)",
                            borderRadius: "var(--border-radius)",
                          }
                        : { borderRadius: "var(--border-radius)" }
                    }
                  >
                    <span>{t("all")}</span>
                    <span className="text-xs text-text-tertiary tabular-nums">
                      {allCount}
                    </span>
                  </Link>
                </li>
                {categories.map((cat) => {
                  const count = categoryCounts[cat._id] ?? 0;
                  return (
                    <li key={cat._id}>
                      <Link
                        href={`/products?category=${cat.slug}`}
                        className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${
                          categorySlug === cat.slug
                            ? "font-semibold"
                            : "text-text-secondary hover:bg-surface hover:text-[var(--color-text)]"
                        }`}
                        style={
                          categorySlug === cat.slug
                            ? {
                                backgroundColor: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                                color: "var(--color-link)",
                                borderRadius: "var(--border-radius)",
                              }
                            : { borderRadius: "var(--border-radius)" }
                        }
                      >
                        <span>{tl(cat.name, locale)}</span>
                        {count > 0 && (
                          <span className="text-xs text-text-tertiary tabular-nums">{formatNumber(count, locale)}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1 min-w-0">
          {/* Results bar */}
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2 sm:gap-4">
            <p className="text-xs text-text-tertiary shrink-0">
              {t("showing")}{" "}
              <span className="font-medium text-[var(--color-text)]">
                {format.number((page - 1) * ITEMS_PER_PAGE + 1)}–{format.number(Math.min(page * ITEMS_PER_PAGE, result.total))}
              </span>{" "}
              {t("of")}{" "}
              <span className="font-medium text-[var(--color-text)]">{format.number(result.total)}</span>
            </p>
            <SortDropdown currentSort={sort} currentOrder={order} />
          </div>

          {/* Active filter chips */}
          <ActiveFilters
            search={search}
            categorySlug={categorySlug}
            categoryName={categoryName}
          />

          <ProductGrid products={result.data} />

          {/* Pagination */}
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-10">
              {page > 1 && (
                <Link
                  href={buildUrl(page - 1)}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </Link>
              )}

              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-sm text-text-tertiary">
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={buildUrl(p)}
                    className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                      p === page
                        ? "text-white shadow-sm"
                        : "border border-border-subtle hover:bg-surface text-text-secondary"
                    }`}
                    style={
                      p === page
                        ? { backgroundColor: "var(--color-primary)" }
                        : undefined
                    }
                    aria-current={p === page ? "page" : undefined}
                  >
                    {format.number(p)}
                  </Link>
                )
              )}

              {page < result.totalPages && (
                <Link
                  href={buildUrl(page + 1)}
                  className="flex items-center gap-1 px-3 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface transition-colors"
                  aria-label="Next page"
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

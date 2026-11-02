import type { MetadataRoute } from "next";
import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";
import {
  buildSitemapEntries,
  hasBanglaContent,
  hasBanglaText,
  type SitemapPage,
} from "@/shared/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getTenant();
  if (!tenant) return [];

  const [products, categories] = await Promise.all([
    ProductService.getByStore(tenant._id, { page: 1, limit: 1000 }),
    CategoryService.getByStore(tenant._id),
  ]);

  const now = new Date();
  const pages: SitemapPage[] = [
    { path: "/", lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { path: "/products", lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...products.data.map((p) => ({
      path: `/products/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      hasBanglaContent: hasBanglaContent(p),
      images: (p.images ?? []).map((img) => img.url).slice(0, 5),
    })),
    ...categories.map((c) => ({
      path: `/categories/${c.slug}`,
      lastModified: new Date(c.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      hasBanglaContent: hasBanglaText(c.name),
    })),
  ];

  return buildSitemapEntries(tenant, pages);
}

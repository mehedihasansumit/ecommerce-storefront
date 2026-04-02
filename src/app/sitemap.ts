import type { MetadataRoute } from "next";
import { getTenant } from "@/shared/lib/tenant";
import { ProductService } from "@/features/products/service";
import { CategoryService } from "@/features/categories/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getTenant();
  if (!tenant) return [];

  const domain = tenant.domains[0] || "localhost:3000";
  const baseUrl = `https://${domain}`;

  const [products, categories] = await Promise.all([
    ProductService.getByStore(tenant._id, { page: 1, limit: 1000 }),
    CategoryService.getByStore(tenant._id),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.data.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes, ...categoryRoutes];
}

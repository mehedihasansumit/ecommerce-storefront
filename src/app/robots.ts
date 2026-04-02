import type { MetadataRoute } from "next";
import { getTenant } from "@/shared/lib/tenant";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const tenant = await getTenant();
  const domain = tenant?.domains[0] || "localhost:3000";
  const baseUrl = `https://${domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/checkout/", "/account/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

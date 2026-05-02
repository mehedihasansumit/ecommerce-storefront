import type { MetadataRoute } from "next";
import { getTenant } from "@/shared/lib/tenant";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const tenant = await getTenant();

  const name = tenant?.name ?? "Shop";
  const shortName = name.split(/\s+/)[0].slice(0, 12);
  const themeColor = tenant?.theme?.primaryColor ?? "#3B82F6";
  const bgColor = tenant?.theme?.backgroundColor ?? "#FFFFFF";

  return {
    id: "/",
    name,
    short_name: shortName,
    description: `Shop at ${name}`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: bgColor,
    theme_color: themeColor,
    orientation: "portrait-primary",
    categories: ["shopping"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import type { Metadata } from "next";
import type { IStore } from "@/features/stores/types";
import type { IProduct } from "@/features/products/types";
import { t } from "@/shared/lib/i18n";

interface PageMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
}

export function createStoreMetadata(
  store: IStore,
  options: PageMetaOptions = {},
  locale = "en"
): Metadata {
  const domain = store.domains[0] || "localhost:3000";
  const baseUrl = `https://${domain}`;
  const storeTitle = t(store.seo.title, locale) || store.name;
  const title = options.title
    ? `${options.title} | ${store.name}`
    : storeTitle;
  const description =
    options.description ||
    t(store.seo.description, locale) ||
    `Shop at ${store.name}`;
  const image = options.image || store.seo.ogImage || store.logo;
  const url = options.path ? `${baseUrl}${options.path}` : baseUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: store.name,
      images: image ? [{ url: image }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: url,
    },
    robots: options.noIndex ? { index: false, follow: false } : undefined,
  };
}

export function buildProductJsonLd(product: IProduct, storeUrl: string, locale = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: t(product.name, locale),
    description: t(product.shortDescription, locale) || t(product.description, locale),
    image: product.images.map((img) => img.url),
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${storeUrl}/products/${product.slug}`,
    },
    aggregateRating:
      product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.averageRating,
            reviewCount: product.reviewCount,
          }
        : undefined,
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildOrganizationJsonLd(store: IStore) {
  const domain = store.domains[0] || "localhost:3000";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: `https://${domain}`,
    logo: store.logo,
    contactPoint: store.contact.email
      ? {
          "@type": "ContactPoint",
          email: store.contact.email,
          telephone: store.contact.phone,
        }
      : undefined,
    sameAs: [
      store.socialLinks.facebook,
      store.socialLinks.instagram,
      store.socialLinks.twitter,
    ].filter(Boolean),
  };
}

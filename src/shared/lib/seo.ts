import type { Metadata, MetadataRoute } from "next";
import type { IStore } from "@/features/stores/types";
import type { IProduct } from "@/features/products/types";
import type { LocalizedString } from "@/shared/types/i18n";
import { t } from "@/shared/lib/i18n";
import { DEFAULT_CURRENCY } from "@/shared/lib/constants";
import { DELIVERY_CURRENCY } from "@/shared/lib/delivery";

interface PageMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
  noIndex?: boolean;
  /**
   * False when the page's own content has no Bangla (e.g. a product with only
   * an English name). Its /bn URL is then kept out of the index and out of
   * hreflang: translated buttons around English text is what Google calls a
   * poor experience. Defaults to true.
   */
  hasBanglaContent?: boolean;
}

/** URL of `path` in a language: English unprefixed, Bangla under /bn (ADR 0004). */
export function localizedUrl(baseUrl: string, path: string, locale: string): string {
  const clean = path === "/" ? "" : path;
  return locale === "bn" ? `${baseUrl}/bn${clean}` : `${baseUrl}${clean}`;
}

/** Whether the store offers Bangla at all. */
export function storeOffersBangla(store: Pick<IStore, "supportedLanguages">): boolean {
  return store.supportedLanguages?.includes("bn") ?? false;
}

/** The field has a non-empty Bangla value. */
export function hasBanglaText(field: LocalizedString | string | null | undefined): boolean {
  return typeof field === "object" && field !== null && Boolean(field.bn?.trim());
}

/** A product has real Bangla content: a Bangla name and a Bangla description. */
export function hasBanglaContent(item: {
  name?: LocalizedString | string | null;
  description?: LocalizedString | string | null;
}): boolean {
  return hasBanglaText(item.name) && hasBanglaText(item.description);
}

/**
 * hreflang map for a page, or undefined when it has only one language.
 * Shared by page metadata and the sitemap so the two never disagree.
 */
export function languageAlternates(
  store: Pick<IStore, "supportedLanguages" | "domains">,
  path: string,
  hasBangla = true,
): Record<string, string> | undefined {
  if (!storeOffersBangla(store) || !hasBangla) return undefined;
  const baseUrl = storeBaseUrl(store);
  const en = localizedUrl(baseUrl, path, "en");
  return { en, bn: localizedUrl(baseUrl, path, "bn"), "x-default": en };
}

export interface SitemapPage {
  path: string;
  lastModified: Date;
  changeFrequency: "daily" | "weekly";
  priority: number;
  /** See PageMetaOptions.hasBanglaContent. Defaults to true. */
  hasBanglaContent?: boolean;
  /** Image URLs (absolute or upload paths) shown on the page. */
  images?: string[];
}

/**
 * Sitemap rows for a store's pages: the English URL always, plus the /bn URL
 * when the page has Bangla, each carrying the same hreflang set as the page.
 */
export function buildSitemapEntries(
  store: Pick<IStore, "supportedLanguages" | "domains">,
  pages: SitemapPage[],
): MetadataRoute.Sitemap {
  const baseUrl = storeBaseUrl(store);
  return pages.flatMap((page) => {
    const languages = languageAlternates(store, page.path, page.hasBanglaContent !== false);
    const images = page.images?.length
      ? page.images.map((url) => absoluteUrl(baseUrl, url))
      : undefined;
    const locales = languages ? ["en", "bn"] : ["en"];
    return locales.map((locale) => ({
      url: localizedUrl(baseUrl, page.path, locale),
      lastModified: page.lastModified,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      ...(languages && { alternates: { languages } }),
      ...(images && { images }),
    }));
  });
}

export function createStoreMetadata(
  store: IStore,
  options: PageMetaOptions = {},
  locale = "en"
): Metadata {
  const baseUrl = storeBaseUrl(store);
  const storeTitle = t(store.seo.title, locale) || store.name;
  const title = options.title
    ? `${options.title} | ${store.name}`
    : storeTitle;
  const description =
    options.description ||
    t(store.seo.description, locale) ||
    `Shop at ${store.name}`;
  const image = options.image || store.seo.ogImage || store.logo;
  const path = options.path ?? "/";
  const url = localizedUrl(baseUrl, path, locale);
  const hasBangla = options.hasBanglaContent !== false;
  const languages = languageAlternates(store, path, hasBangla);
  const thinBangla = locale === "bn" && !hasBangla;

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
      locale: locale === "bn" ? "bn_BD" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: languages ? { canonical: url, languages } : { canonical: url },
    robots: options.noIndex
      ? { index: false, follow: false }
      : thinBangla
        ? { index: false, follow: true }
        : undefined,
  };
}

/** Every store sells in Bangladesh (BDT, Dhaka-based delivery). */
const STORE_COUNTRY = "BD";
const SCHEMA = "https://schema.org/";

/** `https://<primary domain>`, the one URL Google should index the store under. */
export function storeBaseUrl(store: Pick<IStore, "domains">): string {
  return `https://${store.domains?.[0] || "localhost:3000"}`;
}

/** Google needs absolute image URLs; uploads are often served as `/api/media/…`. */
export function absoluteUrl(baseUrl: string, url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Where a request on one of the store's other domains should go: the same
 * path on the primary domain (`domains[0]`), the one the canonical tags name.
 * Null on the primary domain, or for a host the store doesn't list. A redirect
 * is a stronger signal to Google than canonical tags alone.
 */
export function primaryDomainRedirect(
  store: Pick<IStore, "domains">,
  host: string,
  pathWithQuery: string,
): string | null {
  const hostname = host.split(":")[0].toLowerCase();
  const domains = (store.domains ?? []).map((d) => d.toLowerCase());
  const primary = domains[0];
  if (!primary || hostname === primary || !domains.includes(hostname)) return null;
  const path = pathWithQuery.startsWith("/") ? pathWithQuery : `/${pathWithQuery}`;
  return `https://${primary}${path}`;
}

/** schema.org properties Google accepts in a ProductGroup's `variesBy`. */
const VARIES_BY: Record<string, "size" | "color" | "material" | "pattern"> = {
  size: "size", "সাইজ": "size",
  color: "color", colour: "color", "রং": "color", "রঙ": "color",
  material: "material", fabric: "material", "কাপড়": "material",
  pattern: "pattern",
};

function variesByProperty(optionName: string) {
  return VARIES_BY[optionName.trim().toLowerCase()];
}

/**
 * One Bangladesh-wide shipping offer. Google only accepts shipping regions for
 * the US, Australia and Japan, so inside/outside Dhaka can't be told apart: the
 * outside-Dhaka charge is given as the most a shopper pays. Google requires a
 * delivery time, so nothing is emitted until the store has stated one.
 */
function buildShippingDetails(store: IStore) {
  const config = store.deliveryConfig;
  const min = Number(config?.minDeliveryDays);
  const max = Number(config?.maxDeliveryDays);
  if (!config || !Number.isFinite(min) || !Number.isFinite(max) || config.minDeliveryDays == null || config.maxDeliveryDays == null || min > max) {
    return undefined;
  }
  const highest = Math.max(Number(config.insideDhakaCharge) || 0, Number(config.outsideDhakaCharge) || 0);
  const shippingRate = config.enabled && highest > 0
    ? { "@type": "MonetaryAmount", maxValue: highest, currency: DELIVERY_CURRENCY }
    : { "@type": "MonetaryAmount", value: 0, currency: DELIVERY_CURRENCY };
  return {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: STORE_COUNTRY },
    shippingRate,
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      transitTime: { "@type": "QuantitativeValue", minValue: min, maxValue: max, unitCode: "DAY" },
    },
  };
}

function buildOffer(
  price: number,
  stock: number,
  url: string,
  shippingDetails: ReturnType<typeof buildShippingDetails>,
) {
  return {
    "@type": "Offer",
    price,
    priceCurrency: DEFAULT_CURRENCY,
    itemCondition: `${SCHEMA}NewCondition`,
    availability: stock > 0 ? `${SCHEMA}InStock` : `${SCHEMA}OutOfStock`,
    url,
    ...(shippingDetails && { shippingDetails }),
  };
}

/**
 * Product structured data for the product page. A product with variants becomes
 * a ProductGroup whose variants each link to their own preselect URL
 * (`?Size=M`, read by useProductSelection), as Google's variant docs ask.
 * The return policy lives on the store's OnlineStore markup, not here.
 */
export function buildProductJsonLd(product: IProduct, store: IStore, locale = "en") {
  const baseUrl = storeBaseUrl(store);
  const productUrl = localizedUrl(baseUrl, `/products/${product.slug}`, locale);
  const name = t(product.name, locale);
  const shippingDetails = buildShippingDetails(store);
  const images = (product.images ?? []).map((img) => absoluteUrl(baseUrl, img.url));

  const common = {
    "@context": "https://schema.org",
    name,
    description: t(product.shortDescription, locale) || t(product.description, locale),
    image: images,
    brand: { "@type": "Brand", name: store.name },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.averageRating,
        reviewCount: product.reviewCount,
      },
    }),
  };

  const variants = product.variants ?? [];
  if (variants.length === 0) {
    return {
      ...common,
      "@type": "Product",
      ...(product.sku && { sku: product.sku }),
      offers: buildOffer(product.price, product.stock, productUrl, shippingDetails),
    };
  }

  const variesBy = [
    ...new Set(
      (product.options ?? [])
        .map((o) => variesByProperty(o.name))
        .filter((p): p is NonNullable<typeof p> => Boolean(p)),
    ),
  ].map((p) => `${SCHEMA}${p}`);

  const hasVariant = variants.map((v) => {
    const query = new URLSearchParams(v.optionValues).toString();
    const props: Record<string, string> = {};
    for (const [option, value] of Object.entries(v.optionValues)) {
      const prop = variesByProperty(option);
      if (prop) props[prop] = value;
    }
    const label = Object.values(v.optionValues).join(" / ");
    return {
      "@type": "Product",
      name: label ? `${name} - ${label}` : name,
      sku: v.sku || undefined,
      ...(v.images?.[0]?.url && { image: v.images.map((img) => absoluteUrl(baseUrl, img.url)) }),
      ...props,
      offers: buildOffer(
        v.price ?? product.price,
        v.stock ?? 0,
        query ? `${productUrl}?${query}` : productUrl,
        shippingDetails,
      ),
    };
  });

  return {
    ...common,
    "@type": "ProductGroup",
    url: productUrl,
    productGroupID: product.sku || product.slug,
    ...(variesBy.length > 0 && { variesBy }),
    hasVariant,
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

/**
 * Store-level structured data for the home page: an OnlineStore in Bangladesh,
 * with the store-wide return window. Google prefers the return policy here when
 * one policy covers every product. A store with the policy switched off makes
 * no claim at all (off may mean "not set up", not "no returns").
 */
/** The store's other spellings: trimmed, blanks, repeats and the store's own name dropped. */
function storeAlternateNames(store: Pick<IStore, "name" | "seo">): string[] {
  const seen = new Set([store.name.trim().toLowerCase()]);
  const names: string[] = [];
  for (const raw of store.seo?.alternateNames ?? []) {
    const name = raw.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

/**
 * Home-page WebSite structured data: tells Google the site's name (shown above
 * the link in results) and the other spellings people search for it by.
 */
export function buildWebSiteJsonLd(store: IStore) {
  const alternateName = storeAlternateNames(store);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: store.name,
    ...(alternateName.length && { alternateName }),
    url: storeBaseUrl(store),
  };
}

export function buildOrganizationJsonLd(store: IStore) {
  const baseUrl = storeBaseUrl(store);
  const alternateName = storeAlternateNames(store);
  const logo = store.logo ? absoluteUrl(baseUrl, store.logo) : undefined;

  const sameAs = [
    store.socialLinks?.facebook,
    store.socialLinks?.instagram,
    store.socialLinks?.twitter,
  ].filter(Boolean);

  const phone = store.contact?.phone?.trim();
  const address = store.contact?.address?.trim();
  const returnDays = Number(store.refundPolicy?.windowDays) || 0;

  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: store.name,
    ...(alternateName.length && { alternateName }),
    url: baseUrl,
    ...(logo && { logo }),
    ...(store.contact?.email && { email: store.contact.email }),
    ...(phone && { telephone: phone }),
    ...(address && {
      address: { "@type": "PostalAddress", streetAddress: address, addressCountry: STORE_COUNTRY },
    }),
    ...(store.contact?.email && {
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: store.contact.email,
        ...(phone && { telephone: phone }),
      },
    }),
    ...(sameAs.length && { sameAs }),
    ...(store.refundPolicy?.enabled && returnDays > 0 && {
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: STORE_COUNTRY,
        returnPolicyCategory: `${SCHEMA}MerchantReturnFiniteReturnWindow`,
        merchantReturnDays: returnDays,
      },
    }),
  };
}

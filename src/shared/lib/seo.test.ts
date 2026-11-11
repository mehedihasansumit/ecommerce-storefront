import { describe, expect, it } from "vitest";
import type { IStore } from "@/features/stores/types";
import type { IProduct } from "@/features/products/types";
import { buildOrganizationJsonLd, buildProductJsonLd, buildWebSiteJsonLd, buildSitemapEntries, createStoreMetadata, hasBanglaContent, primaryDomainRedirect } from "./seo";

/** What the page actually ships: JSON, with undefined keys dropped. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (value: unknown): any => JSON.parse(JSON.stringify(value));

function makeStore(overrides: Partial<IStore> = {}): IStore {
  return {
    _id: "s1",
    name: "Punjabi House",
    slug: "punjabi",
    domains: ["punjabi.example"],
    logo: "/logo.png",
    seo: { title: {}, description: {}, keywords: [], ogImage: "" },
    contact: { email: "hi@punjabi.example", phone: "+8801700000000", address: "Road 5, Dhanmondi, Dhaka" },
    socialLinks: { facebook: "https://facebook.com/punjabi", instagram: "", twitter: "" },
    refundPolicy: { enabled: true, windowDays: 7, description: "", autoApprove: false },
    deliveryConfig: { enabled: true, insideDhakaCharge: 70, outsideDhakaCharge: 130, minDeliveryDays: 1, maxDeliveryDays: 5 },
    supportedLanguages: ["en", "bn"],
    defaultLanguage: "en",
    ...overrides,
  } as IStore;
}

function makeProduct(overrides: Partial<IProduct> = {}): IProduct {
  return {
    _id: "p1",
    storeId: "s1",
    name: { en: "White Cotton Punjabi", bn: "সাদা সুতি পাঞ্জাবি" },
    slug: "white-cotton-punjabi",
    description: { en: "Soft cotton." },
    shortDescription: { en: "Eid ready." },
    price: 2450,
    sku: "PJ-101",
    stock: 4,
    images: [{ url: "https://cdn.example/a.webp", alt: "" }],
    options: [],
    variants: [],
    averageRating: 0,
    reviewCount: 0,
    ...overrides,
  } as IProduct;
}

describe("buildProductJsonLd", () => {
  it("names the store as brand, marks the item new and prices in BDT", () => {
    const ld = asJson(buildProductJsonLd(makeProduct(), makeStore(), "en"));
    expect(ld["@type"]).toBe("Product");
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Punjabi House" });
    expect(ld.offers.itemCondition).toBe("https://schema.org/NewCondition");
    expect(ld.offers.priceCurrency).toBe("BDT");
    expect(ld.offers.url).toBe("https://punjabi.example/products/white-cotton-punjabi");
  });

  it("turns relative upload paths into absolute image URLs and drops an empty sku", () => {
    const product = makeProduct({ sku: "", images: [{ url: "/api/media/s1/a.webp", alt: "" }] });
    const ld = asJson(buildProductJsonLd(product, makeStore(), "en"));
    expect(ld.image).toEqual(["https://punjabi.example/api/media/s1/a.webp"]);
    expect(ld).not.toHaveProperty("sku");
  });

  it("gives one Bangladesh-wide shipping rate capped at the outside-Dhaka charge", () => {
    const ld = asJson(buildProductJsonLd(makeProduct(), makeStore(), "en"));
    expect(ld.offers.shippingDetails).toEqual({
      "@type": "OfferShippingDetails",
      shippingDestination: { "@type": "DefinedRegion", addressCountry: "BD" },
      shippingRate: { "@type": "MonetaryAmount", maxValue: 130, currency: "BDT" },
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 5, unitCode: "DAY" },
      },
    });
  });

  it("says shipping is free when the store charges no delivery", () => {
    const store = makeStore({
      deliveryConfig: { enabled: false, insideDhakaCharge: 0, outsideDhakaCharge: 0, minDeliveryDays: 2, maxDeliveryDays: 3 },
    });
    const ld = asJson(buildProductJsonLd(makeProduct(), store, "en"));
    expect(ld.offers.shippingDetails?.shippingRate).toEqual({ "@type": "MonetaryAmount", value: 0, currency: "BDT" });
  });

  it("leaves shipping out when the store has not said how long delivery takes", () => {
    const store = makeStore({
      deliveryConfig: { enabled: true, insideDhakaCharge: 70, outsideDhakaCharge: 130 },
    });
    const ld = asJson(buildProductJsonLd(makeProduct(), store, "en"));
    expect(ld.offers.shippingDetails).toBeUndefined();
  });

  it("describes sizes as a ProductGroup with one preselect URL per variant", () => {
    const product = makeProduct({
      options: [{ name: "Size", values: ["M", "L"] }],
      variants: [
        { optionValues: { Size: "M" }, stock: 3, sku: "PJ-101-M", images: [] },
        { optionValues: { Size: "L" }, price: 2600, stock: 0, sku: "PJ-101-L", images: [] },
      ],
    });
    const ld = asJson(buildProductJsonLd(product, makeStore(), "en"));
    expect(ld["@type"]).toBe("ProductGroup");
    expect(ld.productGroupID).toBe("PJ-101");
    expect(ld.variesBy).toEqual(["https://schema.org/size"]);
    expect(ld.hasVariant).toHaveLength(2);
    const [m, l] = ld.hasVariant;
    expect(m.size).toBe("M");
    expect(m.offers.price).toBe(2450);
    expect(m.offers.url).toBe("https://punjabi.example/products/white-cotton-punjabi?Size=M");
    expect(m.offers.availability).toBe("https://schema.org/InStock");
    expect(l.offers.price).toBe(2600);
    expect(l.offers.availability).toBe("https://schema.org/OutOfStock");
  });
});

describe("buildProductJsonLd on the Bangla page", () => {
  it("points the offer at the /bn product URL", () => {
    const ld = asJson(buildProductJsonLd(makeProduct(), makeStore(), "bn"));
    expect(ld.name).toBe("সাদা সুতি পাঞ্জাবি");
    expect(ld.offers.url).toBe("https://punjabi.example/bn/products/white-cotton-punjabi");
  });
});

describe("buildOrganizationJsonLd", () => {
  it("is an OnlineStore in Bangladesh with the store's return window", () => {
    const ld = asJson(buildOrganizationJsonLd(makeStore()));
    expect(ld["@type"]).toBe("OnlineStore");
    expect(ld.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Road 5, Dhanmondi, Dhaka",
      addressCountry: "BD",
    });
    expect(ld.telephone).toBe("+8801700000000");
    expect(ld.hasMerchantReturnPolicy).toEqual({
      "@type": "MerchantReturnPolicy",
      applicableCountry: "BD",
      returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: 7,
    });
  });

  it("claims no return policy when the store has none configured", () => {
    const store = makeStore({
      refundPolicy: { enabled: false, windowDays: 0, description: "", autoApprove: false },
    });
    expect(asJson(buildOrganizationJsonLd(store)).hasMerchantReturnPolicy).toBeUndefined();
  });

  it("lists the store's other spellings as alternateName, trimmed and de-duplicated", () => {
    const store = makeStore({
      seo: { title: {}, description: {}, keywords: [], ogImage: "", alternateNames: [" Lor House ", "লর হাউস", "", "Lor House", "Punjabi House"] },
    });
    expect(asJson(buildOrganizationJsonLd(store)).alternateName).toEqual(["Lor House", "লর হাউস"]);
  });

  it("has no alternateName when the store lists none", () => {
    expect(asJson(buildOrganizationJsonLd(makeStore())).alternateName).toBeUndefined();
  });
});

describe("buildWebSiteJsonLd", () => {
  it("names the site and its other spellings at the store's home URL", () => {
    const store = makeStore({
      seo: { title: {}, description: {}, keywords: [], ogImage: "", alternateNames: ["Panjabi House"] },
    });
    expect(asJson(buildWebSiteJsonLd(store))).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Punjabi House",
      alternateName: ["Panjabi House"],
      url: "https://punjabi.example",
    });
  });
});

describe("createStoreMetadata hreflang", () => {
  it("links the English and Bangla URLs of a page and canonicalises each to itself", () => {
    const en = createStoreMetadata(makeStore(), { path: "/products/x" }, "en");
    const bn = createStoreMetadata(makeStore(), { path: "/products/x" }, "bn");
    const languages = {
      en: "https://punjabi.example/products/x",
      bn: "https://punjabi.example/bn/products/x",
      "x-default": "https://punjabi.example/products/x",
    };
    expect(en.alternates).toEqual({ canonical: languages.en, languages });
    expect(bn.alternates).toEqual({ canonical: languages.bn, languages });
    expect(bn.openGraph).toMatchObject({ url: languages.bn, locale: "bn_BD" });
    expect(en.openGraph).toMatchObject({ locale: "en_US" });
    expect(bn.robots).toBeUndefined();
  });

  it("puts the Bangla home page at /bn, not /bn/", () => {
    const bn = createStoreMetadata(makeStore(), { path: "/" }, "bn");
    expect(bn.alternates?.canonical).toBe("https://punjabi.example/bn");
  });

  it("lists no Bangla alternate for a store that only offers English", () => {
    const store = makeStore({ supportedLanguages: ["en"] });
    const en = createStoreMetadata(store, { path: "/products/x" }, "en");
    expect(en.alternates).toEqual({ canonical: "https://punjabi.example/products/x" });
  });

  it("keeps a Bangla page without Bangla content out of the index", () => {
    const opts = { path: "/products/x", hasBanglaContent: false };
    const en = createStoreMetadata(makeStore(), opts, "en");
    const bn = createStoreMetadata(makeStore(), opts, "bn");
    expect(en.alternates).toEqual({ canonical: "https://punjabi.example/products/x" });
    expect(bn.robots).toEqual({ index: false, follow: true });
  });
});

describe("hasBanglaContent", () => {
  it("needs a Bangla name and a Bangla description", () => {
    expect(hasBanglaContent({ name: { en: "A", bn: "ক" }, description: { bn: "খ" } })).toBe(true);
    expect(hasBanglaContent({ name: { en: "A", bn: "ক" }, description: { en: "B" } })).toBe(false);
    expect(hasBanglaContent({ name: { en: "A" }, description: { bn: "খ" } })).toBe(false);
    expect(hasBanglaContent({ name: { en: "A", bn: "  " }, description: { bn: "খ" } })).toBe(false);
  });
});

describe("buildSitemapEntries", () => {
  const when = new Date("2026-11-01");

  it("lists the Bangla URL next to the English one with the same hreflang set", () => {
    const rows = buildSitemapEntries(makeStore(), [
      { path: "/products/x", lastModified: when, changeFrequency: "weekly", priority: 0.8, images: ["/api/media/a.webp"] },
    ]);
    expect(rows.map((r) => r.url)).toEqual([
      "https://punjabi.example/products/x",
      "https://punjabi.example/bn/products/x",
    ]);
    expect(rows[1].alternates?.languages).toEqual({
      en: "https://punjabi.example/products/x",
      bn: "https://punjabi.example/bn/products/x",
      "x-default": "https://punjabi.example/products/x",
    });
    expect(rows[0].images).toEqual(["https://punjabi.example/api/media/a.webp"]);
  });

  it("lists only English for pages without Bangla content or stores without Bangla", () => {
    const page = { path: "/products/x", lastModified: when, changeFrequency: "weekly" as const, priority: 0.8 };
    expect(buildSitemapEntries(makeStore(), [{ ...page, hasBanglaContent: false }])).toHaveLength(1);
    const rows = buildSitemapEntries(makeStore({ supportedLanguages: ["en"] }), [page]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).not.toHaveProperty("alternates");
  });
});

describe("primaryDomainRedirect", () => {
  const store = makeStore({ domains: ["www.lourhaus.com", "lourhaus.com"] });

  it("sends a secondary domain to the primary one, keeping path and query", () => {
    expect(primaryDomainRedirect(store, "lourhaus.com", "/bn/products/x?Size=M")).toBe(
      "https://www.lourhaus.com/bn/products/x?Size=M",
    );
  });

  it("ignores port and letter case", () => {
    expect(primaryDomainRedirect(store, "LourHaus.com:443", "/")).toBe("https://www.lourhaus.com/");
    expect(primaryDomainRedirect(store, "WWW.lourhaus.com:5000", "/")).toBeNull();
  });

  it("does nothing on the primary domain or for a host the store does not own", () => {
    expect(primaryDomainRedirect(store, "www.lourhaus.com", "/")).toBeNull();
    expect(primaryDomainRedirect(store, "evil.example", "/")).toBeNull();
  });
});

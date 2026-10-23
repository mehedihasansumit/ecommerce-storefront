import { z } from "zod";
import { PINNABLE_DERIVED_TOKENS, THEME_TOKENS } from "./theme-tokens";
import {
  CATEGORY_STYLES,
  FOOTER_STYLES,
  HERO_STYLES,
  NEWSLETTER_STYLES,
  PRODUCT_CARD_STYLES,
} from "./styles";
import { THEME_PRESET_IDS } from "./presets";

/** Accepts { en: "...", bn: "..." } or a plain string (wrapped to { en: value }). */
const localizedStringSchema = z
  .union([
    z.record(z.string(), z.string()),
    z.string().transform((s) => ({ en: s })),
  ])
  .optional()
  .default({});

/** App media path from storage.publicUrlFor without a CDN: /api/media/<storeId>/<key…>. */
const MEDIA_PATH = /^\/api\/media\/[0-9a-f-]{36}\/[^\s?#\\]+$/i;

/**
 * Hero background video: an absolute http(s) URL (external host or the S3/CDN
 * public URL) or an app media path. Anything else (`javascript:`, `data:`,
 * protocol-relative or other relative paths) is rejected.
 */
export function isAllowedHeroVideoUrl(value: string): boolean {
  if (MEDIA_PATH.test(value)) {
    return !value.split("/").some((seg) => seg === ".." || seg === ".");
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const heroVideoSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || isAllowedHeroVideoUrl(v), {
    message: "Video must be an http(s) URL or an uploaded media path (/api/media/...)",
  });

const themeColorFields = Object.fromEntries(
  [...THEME_TOKENS, ...PINNABLE_DERIVED_TOKENS, { key: "heroScrim" }].map((t) => [
    t.key,
    z.string().optional(),
  ])
);

/** Style Switch choices; each one optional (unset = the preset's, else the base layout). */
export const storeStylesSchema = z.object({
  heroStyle: z.enum(HERO_STYLES).optional(),
  categoryStyle: z.enum(CATEGORY_STYLES).optional(),
  footerStyle: z.enum(FOOTER_STYLES).optional(),
  newsletterStyle: z.enum(NEWSLETTER_STYLES).optional(),
  productCardStyle: z.enum(PRODUCT_CARD_STYLES).optional(),
});

export const storeThemeSchema = z.object({
  ...themeColorFields,
  fontFamily: z.string().optional(),
  headingFont: z.string().optional(),
  borderRadius: z.string().optional(),
  backgroundPattern: z.enum(["grid", "none"]).optional(),
  layoutStyle: z.enum(["grid", "list", "masonry"]).optional(),
  dark: z.object(themeColorFields).optional(),
  preset: z.enum(THEME_PRESET_IDS).optional(),
  styles: storeStylesSchema.optional(),
});

export const createStoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  domains: z.array(z.string()).min(1, "At least one domain is required"),
  theme: storeThemeSchema.optional(),
  seo: z
    .object({
      title: localizedStringSchema,
      description: localizedStringSchema,
      keywords: z.array(z.string()).optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
  payment: z
    .object({
      provider: z.enum(["stripe", "sslcommerz"]).optional(),
      currency: z.string().optional(),
    })
    .optional(),
  supportedLanguages: z.array(z.string()).optional(),
  defaultLanguage: z.string().optional(),
});

export const updateStoreSchema = z.object({
  name: z.string().min(1).optional(),
  domains: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  logo: z.string().optional(),
  logoDark: z.string().optional(),
  favicon: z.string().optional(),
  faviconDark: z.string().optional(),
  theme: storeThemeSchema.optional(),
  heroLayout: z.enum(["slider", "split", "centered", "grid", "minimal", "image"]).optional(),
  heroContained: z.boolean().optional(),
  heroBorderRadius: z.string().optional(),
  heroBanners: z
    .array(
      z.object({
        image: z.string().min(1, "Image URL is required"),
        variants: z.record(z.string(), z.string()).optional(),
        blurDataURL: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        title: localizedStringSchema,
        subtitle: localizedStringSchema,
        linkUrl: z.string().optional(),
        linkText: z.string().optional(),
        showOverlay: z.boolean().optional(),
        video: heroVideoSchema.optional(),
      })
    )
    .optional(),
  seo: z
    .object({
      title: localizedStringSchema,
      description: localizedStringSchema,
      keywords: z.array(z.string()).optional(),
      ogImage: z.string().optional(),
    })
    .optional(),
  payment: z
    .object({
      provider: z.enum(["stripe", "sslcommerz"]).optional(),
      stripePublicKey: z.string().optional(),
      stripeSecretKey: z.string().optional(),
      sslcommerzStoreId: z.string().optional(),
      sslcommerzStorePassword: z.string().optional(),
      currency: z.string().optional(),
    })
    .optional(),
  contact: z
    .object({
      email: z.string().optional(),
      phone: z.string().optional(),
      phones: z.array(z.string()).optional(),
      address: z.string().optional(),
    })
    .optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
    })
    .optional(),
  socialOrdering: z
    .object({
      whatsapp: z
        .object({
          enabled: z.boolean().optional(),
          phoneNumber: z.string().optional(),
          messageTemplate: z.string().optional(),
        })
        .optional(),
      facebook: z
        .object({
          enabled: z.boolean().optional(),
          pageUrl: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  pointsConfig: z
    .object({
      enabled: z.boolean().optional(),
      pointsPerReview: z.number().int().min(0).optional(),
      minRedemptionPoints: z.number().int().min(1).optional(),
      pointsPerBdt: z.number().int().min(1).optional(),
    })
    .optional(),
  refundPolicy: z
    .object({
      enabled: z.boolean().optional(),
      windowDays: z.number().int().min(1).max(365).optional(),
      description: z.string().max(1000).optional(),
      autoApprove: z.boolean().optional(),
    })
    .optional(),
  deliveryConfig: z
    .object({
      enabled: z.boolean().optional(),
      insideDhakaCharge: z.number().min(0).optional(),
      outsideDhakaCharge: z.number().min(0).optional(),
    })
    .optional(),
  supportedLanguages: z.array(z.string()).optional(),
  defaultLanguage: z.string().optional(),
});

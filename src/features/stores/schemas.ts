import { z } from "zod";
import { THEME_TOKENS } from "./theme-tokens";

/** Accepts { en: "...", bn: "..." } or a plain string (wrapped to { en: value }). */
const localizedStringSchema = z
  .union([
    z.record(z.string(), z.string()),
    z.string().transform((s) => ({ en: s })),
  ])
  .optional()
  .default({});

const themeColorFields = Object.fromEntries(
  THEME_TOKENS.map((t) => [t.key, z.string().optional()])
);

export const storeThemeSchema = z.object({
  ...themeColorFields,
  fontFamily: z.string().optional(),
  borderRadius: z.string().optional(),
  layoutStyle: z.enum(["grid", "list", "masonry"]).optional(),
  dark: z.object(themeColorFields).optional(),
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
        title: localizedStringSchema,
        subtitle: localizedStringSchema,
        linkUrl: z.string().optional(),
        linkText: z.string().optional(),
        showOverlay: z.boolean().optional(),
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
  supportedLanguages: z.array(z.string()).optional(),
  defaultLanguage: z.string().optional(),
});

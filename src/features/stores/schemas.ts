import { z } from "zod";

/** Accepts { en: "...", bn: "..." } or a plain string (wrapped to { en: value }). */
const localizedStringSchema = z
  .union([
    z.record(z.string(), z.string()),
    z.string().transform((s) => ({ en: s })),
  ])
  .optional()
  .default({});

export const storeThemeSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  headerBg: z.string().optional(),
  headerText: z.string().optional(),
  fontFamily: z.string().optional(),
  borderRadius: z.string().optional(),
  layoutStyle: z.enum(["grid", "list", "masonry"]).optional(),
  newsletterBg: z.string().optional(),
  newsletterText: z.string().optional(),
  newsletterBtnBg: z.string().optional(),
  newsletterBtnText: z.string().optional(),
  priceColor: z.string().optional(),
  saleBadgeBg: z.string().optional(),
  saleBadgeText: z.string().optional(),
  footerBg: z.string().optional(),
  footerText: z.string().optional(),
  linkColor: z.string().optional(),
  cardBg: z.string().optional(),
  dark: z.object({
    primaryColor:    z.string().optional(),
    secondaryColor:  z.string().optional(),
    accentColor:     z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor:       z.string().optional(),
    surfaceColor:    z.string().optional(),
    borderColor:     z.string().optional(),
    headerBg:        z.string().optional(),
    headerText:      z.string().optional(),
    newsletterBg:    z.string().optional(),
    newsletterText:  z.string().optional(),
    newsletterBtnBg: z.string().optional(),
    newsletterBtnText: z.string().optional(),
    priceColor:      z.string().optional(),
    saleBadgeBg:     z.string().optional(),
    saleBadgeText:   z.string().optional(),
    footerBg:        z.string().optional(),
    footerText:      z.string().optional(),
    linkColor:       z.string().optional(),
    cardBg:          z.string().optional(),
  }).optional(),
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
  favicon: z.string().optional(),
  theme: storeThemeSchema.optional(),
  heroBanners: z
    .array(
      z.object({
        image: z.string().min(1, "Image URL is required"),
        title: localizedStringSchema,
        subtitle: localizedStringSchema,
        linkUrl: z.string().optional(),
        linkText: z.string().optional(),
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
  supportedLanguages: z.array(z.string()).optional(),
  defaultLanguage: z.string().optional(),
});

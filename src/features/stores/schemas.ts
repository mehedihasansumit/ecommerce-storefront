import { z } from "zod";

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
});

export const createStoreSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  domains: z.array(z.string()).min(1, "At least one domain is required"),
  theme: storeThemeSchema.optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
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
        image: z.string(),
        title: z.string(),
        subtitle: z.string(),
        linkUrl: z.string(),
        linkText: z.string(),
      })
    )
    .optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
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
});

import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().optional(),
  costPrice: z.number().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  trackInventory: z.boolean().optional(),
  images: z
    .array(z.object({ url: z.string(), alt: z.string().optional() }))
    .optional(),
  thumbnail: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        name: z.string(),
        options: z.array(
          z.object({
            value: z.string(),
            priceModifier: z.number().optional(),
            stock: z.number().int().min(0).optional(),
            sku: z.string().optional(),
          })
        ),
      })
    )
    .optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export const updateProductSchema = createProductSchema.partial();

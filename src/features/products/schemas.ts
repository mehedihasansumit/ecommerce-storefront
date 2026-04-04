import { z } from "zod";

const productImageSchema = z.object({
  url: z.string(),
  alt: z.string().optional().default(""),
});

const productOptionSchema = z.object({
  name: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
});

const productVariantSchema = z.object({
  _id: z.string().optional(),
  optionValues: z.record(z.string(), z.string()),
  price: z.number().positive(),
  compareAtPrice: z.number().min(0).optional().default(0),
  stock: z.number().int().min(0).optional().default(0),
  sku: z.string().optional().default(""),
  images: z.array(productImageSchema).optional().default([]),
});

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
  images: z.array(productImageSchema).optional(),
  thumbnail: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  options: z.array(productOptionSchema).optional().default([]),
  variants: z.array(productVariantSchema).optional().default([]),
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

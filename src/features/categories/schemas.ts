import { z } from "zod";

const localizedStringSchema = z
  .union([
    z.record(z.string(), z.string()),
    z.string().transform((s) => ({ en: s })),
  ])
  .optional()
  .default({});

const requiredLocalizedStringSchema = z.union([
  z.record(z.string(), z.string()).refine((r) => Object.keys(r).length > 0, {
    message: "At least one language is required",
  }),
  z.string().min(1, "Category name is required").transform((s) => ({ en: s })),
]);

export const sizeGuideSchema = z
  .object({
    columns: z.array(z.record(z.string(), z.string().max(40))).min(1).max(8),
    rows: z.array(z.array(z.string().max(40)).max(8)).max(30),
    note: localizedStringSchema,
  })
  .refine((g) => g.rows.every((r) => r.length === g.columns.length), {
    message: "Every size chart row needs one cell per column",
  });

export const createCategorySchema = z.object({
  name: requiredLocalizedStringSchema,
  description: localizedStringSchema,
  image: z.string().optional(),
  sizeGuide: sizeGuideSchema.nullable().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

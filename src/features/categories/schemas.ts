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

export const createCategorySchema = z.object({
  name: requiredLocalizedStringSchema,
  description: localizedStringSchema,
  image: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

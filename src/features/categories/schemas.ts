import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

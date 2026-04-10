import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().default(""),
  permissions: z.array(z.string()).default([]),
  isSuperAdmin: z.boolean().default(false),
});

export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

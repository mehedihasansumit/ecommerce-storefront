import { z } from "zod";
import { normalizePhone, BD_PHONE_REGEX } from "@/shared/lib/phone";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().min(1, "Phone is required").transform(normalizePhone).refine((v) => BD_PHONE_REGEX.test(v), "Invalid Bangladeshi phone number"),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["superadmin", "manager"]).default("manager"),
  permissions: z.array(z.string()).default([]),
  assignedStores: z.array(z.string()).default([]),
  roleId: z.string().transform((v) => v || null).nullable().optional(),
});

export const updateAdminSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["superadmin", "manager"]).optional(),
  permissions: z.array(z.string()).optional(),
  assignedStores: z.array(z.string()).optional(),
  roleId: z.string().transform((v) => v || null).nullable().optional(),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;

export const addressSchema = z.object({
  label: z.string().default(""),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().default(""),
  postalCode: z.string().default(""),
  country: z.string().default("Bangladesh"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;

import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  message: z.string().min(1, "Message is required").max(2000),
  displayType: z.enum(["banner", "modal", "bar", "float"]).default("float"),
  backgroundColor: z.string().default("#1e40af"),
  textColor: z.string().default("#ffffff"),
  linkUrl: z.string().url().or(z.string().startsWith("/")).or(z.literal("")).default(""),
  linkText: z.string().max(50).default(""),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional().default(null),
  isActive: z.boolean().default(true),
  dismissible: z.boolean().default(true),
  priority: z.number().int().min(0).default(0),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

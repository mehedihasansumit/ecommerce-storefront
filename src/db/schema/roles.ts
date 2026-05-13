import { sql } from "drizzle-orm";
import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").array().notNull().default(sql`'{}'::text[]`),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  ...timestamps,
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { stores } from "./stores";
import { roles } from "./roles";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    phone: text("phone"),
    points: integer("points").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    notificationPreferences: jsonb("notification_preferences")
      .notNull()
      .default({ email: true, sms: true, inApp: true }),
    ...timestamps,
  },
  (t) => ({
    storeEmailUq: uniqueIndex("uq_users_store_email").on(t.storeId, t.email),
  }),
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label"),
    street: text("street").notNull(),
    city: text("city").notNull(),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country").notNull(),
    phone: text("phone"),
    isDefault: boolean("is_default").notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    userIdx: index("idx_addresses_user").on(t.userId),
    oneDefaultPerUser: uniqueIndex("uq_addresses_user_default")
      .on(t.userId)
      .where(sql`${t.isDefault} = true`),
  }),
);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    assignedStores: uuid("assigned_stores").array().notNull().default(sql`'{}'::uuid[]`),
    ...timestamps,
  },
  (t) => ({
    assignedStoresGin: index("idx_admin_users_stores").using("gin", t.assignedStores),
    roleIdx: index("idx_admin_users_role").on(t.roleId),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

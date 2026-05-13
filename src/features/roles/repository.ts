import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { roles, type Role } from "@/db/schema/roles";
import type { Permission } from "@/shared/lib/permissions";
import type { IRole } from "./types";

function toIRole(row: Role): IRole {
  return {
    _id: row.id,
    name: row.name,
    description: row.description ?? "",
    permissions: row.permissions as Permission[],
    isSuperAdmin: row.isSuperAdmin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInsert(data: Partial<IRole>): typeof roles.$inferInsert {
  const { _id, createdAt, updatedAt, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  return rest as typeof roles.$inferInsert;
}

export const RoleRepository = {
  async findAll(): Promise<IRole[]> {
    const rows = await db.select().from(roles).orderBy(asc(roles.name));
    return rows.map(toIRole);
  },

  async findById(id: string): Promise<IRole | null> {
    const [row] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return row ? toIRole(row) : null;
  },

  async findByName(name: string): Promise<IRole | null> {
    const [row] = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    return row ? toIRole(row) : null;
  },

  async create(data: Partial<IRole>): Promise<IRole> {
    const [row] = await db.insert(roles).values(toInsert(data)).returning();
    return toIRole(row);
  },

  async update(id: string, data: Partial<IRole>): Promise<IRole | null> {
    const insert = toInsert(data);
    const [row] = await db
      .update(roles)
      .set({ ...insert, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return row ? toIRole(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(roles).where(eq(roles.id, id)).returning({ id: roles.id });
    return result.length > 0;
  },
};

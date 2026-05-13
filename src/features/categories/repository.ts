import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { categories, type Category } from "@/db/schema/categories";
import type { LocalizedString } from "@/shared/types/i18n";
import type { ICategory } from "./types";

function toICategory(row: Category): ICategory {
  return {
    _id: row.id,
    storeId: row.storeId,
    name: row.name as LocalizedString,
    slug: row.slug,
    description: (row.description as LocalizedString) ?? {},
    image: row.image ?? "",
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInsert(data: Partial<ICategory>): typeof categories.$inferInsert {
  const { _id, createdAt, updatedAt, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  return rest as typeof categories.$inferInsert;
}

export const CategoryRepository = {
  async findByStore(
    storeId: string,
    status: "active" | "inactive" | "all" = "active",
  ): Promise<ICategory[]> {
    const conditions = [eq(categories.storeId, storeId)];
    if (status === "active") conditions.push(eq(categories.isActive, true));
    else if (status === "inactive") conditions.push(eq(categories.isActive, false));

    const rows = await db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.sortOrder), asc(categories.slug));
    return rows.map(toICategory);
  },

  async findBySlug(storeId: string, slug: string): Promise<ICategory | null> {
    const [row] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.storeId, storeId), eq(categories.slug, slug)))
      .limit(1);
    return row ? toICategory(row) : null;
  },

  async findById(id: string): Promise<ICategory | null> {
    const [row] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return row ? toICategory(row) : null;
  },

  async create(data: Partial<ICategory>): Promise<ICategory> {
    const [row] = await db.insert(categories).values(toInsert(data)).returning();
    return toICategory(row);
  },

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    const insert = toInsert(data);
    const [row] = await db
      .update(categories)
      .set({ ...insert, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return row ? toICategory(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });
    return result.length > 0;
  },
};

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { stores, type Store } from "@/db/schema/stores";
import type {
  IStore,
  IStoreTheme,
  IStoreSeo,
  IStorePayment,
  IStoreContact,
  IStoreSocialLinks,
  IStoreSocialOrdering,
  IStorePointsConfig,
  IStoreRefundPolicy,
  IHeroBanner,
  HeroLayoutStyle,
} from "./types";

function toIStore(row: Store): IStore {
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    domains: row.domains,
    isActive: row.isActive,
    logo: row.logo ?? "",
    logoDark: row.logoDark ?? undefined,
    favicon: row.favicon ?? "",
    faviconDark: row.faviconDark ?? undefined,
    theme: row.theme as IStoreTheme,
    heroLayout: (row.heroLayout ?? undefined) as HeroLayoutStyle | undefined,
    heroContained: row.heroContained ?? false,
    heroBorderRadius: row.heroBorderRadius ?? undefined,
    heroBanners: (row.heroBanners as IHeroBanner[]) ?? [],
    seo: row.seo as IStoreSeo,
    payment: row.payment as IStorePayment,
    contact: row.contact as IStoreContact,
    socialLinks: row.socialLinks as IStoreSocialLinks,
    socialOrdering: row.socialOrdering as IStoreSocialOrdering,
    pointsConfig: row.pointsConfig as IStorePointsConfig,
    refundPolicy: row.refundPolicy as IStoreRefundPolicy,
    supportedLanguages: row.supportedLanguages,
    defaultLanguage: row.defaultLanguage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInsert(data: Partial<IStore>): typeof stores.$inferInsert {
  const { _id, createdAt, updatedAt, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  return rest as typeof stores.$inferInsert;
}

export const StoreRepository = {
  async findByDomain(domain: string): Promise<IStore | null> {
    const [row] = await db
      .select()
      .from(stores)
      .where(and(sql`${domain} = ANY(${stores.domains})`, eq(stores.isActive, true)))
      .limit(1);
    return row ? toIStore(row) : null;
  },

  async findById(id: string): Promise<IStore | null> {
    const [row] = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    return row ? toIStore(row) : null;
  },

  async findBySlug(slug: string): Promise<IStore | null> {
    const [row] = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
    return row ? toIStore(row) : null;
  },

  async findAll(): Promise<IStore[]> {
    const rows = await db.select().from(stores).orderBy(desc(stores.createdAt));
    return rows.map(toIStore);
  },

  async findByIds(ids: string[]): Promise<IStore[]> {
    if (ids.length === 0) return [];
    const rows = await db
      .select()
      .from(stores)
      .where(inArray(stores.id, ids))
      .orderBy(desc(stores.createdAt));
    return rows.map(toIStore);
  },

  async create(data: Partial<IStore>): Promise<IStore> {
    const [row] = await db.insert(stores).values(toInsert(data)).returning();
    return toIStore(row);
  },

  async update(id: string, data: Record<string, unknown>): Promise<IStore | null> {
    const { _id, createdAt, ...rest } = data as Record<string, unknown> & {
      _id?: unknown;
      createdAt?: unknown;
    };
    void _id;
    void createdAt;
    const [row] = await db
      .update(stores)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return row ? toIStore(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(stores).where(eq(stores.id, id)).returning({ id: stores.id });
    return result.length > 0;
  },
};

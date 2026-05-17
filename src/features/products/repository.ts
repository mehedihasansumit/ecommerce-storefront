import { and, asc, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  products,
  productVariants,
  productImages,
  type Product,
  type ProductVariant,
  type ProductImage,
} from "@/db/schema/products";
import type { LocalizedString } from "@/shared/types/i18n";
import type { PaginatedResponse, SearchParams } from "@/shared/types/common";
import type {
  IPricingTier,
  IProduct,
  IProductImage,
  IProductOption,
  IProductSeo,
  IProductVariant,
} from "./types";

function toIImage(row: ProductImage): IProductImage {
  return {
    url: row.url,
    alt: row.alt ?? "",
    key: row.key ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    variants: (row.variants as Record<string, string>) ?? undefined,
    blurDataURL: row.blurDataUrl ?? undefined,
  };
}

function toIVariant(row: ProductVariant, variantImages: ProductImage[]): IProductVariant {
  return {
    _id: row.id,
    optionValues: (row.optionValues as Record<string, string>) ?? {},
    price: Number(row.price ?? 0),
    compareAtPrice: row.compareAtPrice === null ? undefined : Number(row.compareAtPrice),
    stock: row.stock,
    sku: row.sku ?? "",
    images: variantImages.map(toIImage),
  };
}

function toIProduct(
  row: Product,
  productImageList: ProductImage[],
  variantList: ProductVariant[],
  variantImagesByVariantId: Map<string, ProductImage[]>,
): IProduct {
  const images = productImageList.filter((img) => img.variantId === null).map(toIImage);
  const firstVariantImgUrl = variantList.length > 0
    ? variantImagesByVariantId.get(variantList[0].id)?.[0]?.url
    : undefined;
  return {
    _id: row.id,
    storeId: row.storeId,
    name: row.name as LocalizedString,
    slug: row.slug,
    description: (row.description as LocalizedString) ?? {},
    shortDescription: (row.shortDescription as LocalizedString) ?? {},
    price: Number(row.price),
    compareAtPrice: Number(row.compareAtPrice ?? 0),
    costPrice: Number(row.costPrice ?? 0),
    sku: row.sku ?? "",
    barcode: row.barcode ?? "",
    stock: row.stock,
    trackInventory: row.trackInventory,
    images,
    thumbnail: row.thumbnail ?? images[0]?.url ?? firstVariantImgUrl ?? "",
    categoryId: row.categoryId ?? "",
    tags: row.tags,
    options: (row.options as IProductOption[]) ?? [],
    variants: variantList.map((v) => toIVariant(v, variantImagesByVariantId.get(v.id) ?? [])),
    pricingTiers: (row.pricingTiers as IPricingTier[]) ?? [],
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    seo: (row.seo as IProductSeo) ?? { title: {}, description: {} },
    averageRating: Number(row.averageRating),
    reviewCount: row.reviewCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function hydrateMany(rows: Product[]): Promise<IProduct[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [imgRows, varRows] = await Promise.all([
    db.select().from(productImages).where(inArray(productImages.productId, ids)),
    db.select().from(productVariants).where(inArray(productVariants.productId, ids)),
  ]);
  const imgsByProduct = new Map<string, ProductImage[]>();
  const variantImgsByVariant = new Map<string, ProductImage[]>();
  for (const img of imgRows) {
    if (!imgsByProduct.has(img.productId)) imgsByProduct.set(img.productId, []);
    imgsByProduct.get(img.productId)!.push(img);
    if (img.variantId) {
      if (!variantImgsByVariant.has(img.variantId)) variantImgsByVariant.set(img.variantId, []);
      variantImgsByVariant.get(img.variantId)!.push(img);
    }
  }
  const varsByProduct = new Map<string, ProductVariant[]>();
  for (const v of varRows) {
    if (!varsByProduct.has(v.productId)) varsByProduct.set(v.productId, []);
    varsByProduct.get(v.productId)!.push(v);
  }
  return rows.map((r) =>
    toIProduct(
      r,
      imgsByProduct.get(r.id) ?? [],
      varsByProduct.get(r.id) ?? [],
      variantImgsByVariant,
    ),
  );
}

async function hydrateOne(row: Product | undefined): Promise<IProduct | null> {
  if (!row) return null;
  const [list] = await hydrateMany([row]);
  return list ?? null;
}

const SORT_COLUMN_MAP: Record<string, keyof typeof products._.columns> = {
  createdAt: "createdAt",
  price: "price",
  averageRating: "averageRating",
  stock: "stock",
};

function toInsert(data: Partial<IProduct>): typeof products.$inferInsert {
  const {
    _id,
    createdAt,
    updatedAt,
    images,
    thumbnail,
    variants,
    price,
    compareAtPrice,
    costPrice,
    averageRating,
    categoryId,
    ...rest
  } = data;
  void _id;
  void createdAt;
  void updatedAt;
  void images;
  void variants;
  const out: Record<string, unknown> = { ...rest };
  if (thumbnail !== undefined) out.thumbnail = thumbnail || null;
  if (price !== undefined) out.price = String(price);
  if (compareAtPrice !== undefined) out.compareAtPrice = String(compareAtPrice);
  if (costPrice !== undefined) out.costPrice = String(costPrice);
  if (averageRating !== undefined) out.averageRating = String(averageRating);
  if (categoryId !== undefined) out.categoryId = categoryId === "" ? null : categoryId;
  return out as typeof products.$inferInsert;
}

export const ProductRepository = {
  async findByStore(
    storeId: string,
    params: SearchParams & {
      categoryId?: string;
      featured?: boolean;
      status?: "active" | "inactive" | "all";
    },
  ): Promise<PaginatedResponse<IProduct>> {
    const conds: SQL[] = [eq(products.storeId, storeId)];
    if (params.status === "inactive") conds.push(eq(products.isActive, false));
    else if (params.status !== "all") conds.push(eq(products.isActive, true));
    if (params.categoryId) conds.push(eq(products.categoryId, params.categoryId));
    if (params.featured) conds.push(eq(products.isFeatured, true));
    if (params.search) {
      const term = `%${params.search}%`;
      conds.push(
        sql`(${products.name}->>'en' ILIKE ${term}
          OR ${products.name}->>'bn' ILIKE ${term}
          OR EXISTS (SELECT 1 FROM unnest(${products.tags}) tag WHERE tag ILIKE ${term}))`,
      );
    }
    const where = and(...conds);

    const sortKey = params.sort && SORT_COLUMN_MAP[params.sort] ? SORT_COLUMN_MAP[params.sort] : "createdAt";
    const sortCol = products[sortKey];
    const order = params.order === "asc" ? asc(sortCol) : desc(sortCol);

    const skip = (params.page - 1) * params.limit;
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(products).where(where).orderBy(order).limit(params.limit).offset(skip),
      db.select({ total: count() }).from(products).where(where),
    ]);

    const hydrated = await hydrateMany(rows);
    const totalNum = Number(total);
    return {
      data: hydrated,
      total: totalNum,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(totalNum / params.limit),
    };
  },

  async findBySlug(storeId: string, slug: string): Promise<IProduct | null> {
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);
    return hydrateOne(row);
  },

  async findBySlugIncludingInactive(storeId: string, slug: string): Promise<IProduct | null> {
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.slug, slug)))
      .limit(1);
    return hydrateOne(row);
  },

  async findById(id: string): Promise<IProduct | null> {
    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return hydrateOne(row);
  },

  async findFeatured(storeId: string, limit = 8): Promise<IProduct[]> {
    const rows = await db
      .select()
      .from(products)
      .where(
        and(eq(products.storeId, storeId), eq(products.isActive, true), eq(products.isFeatured, true)),
      )
      .orderBy(desc(products.createdAt))
      .limit(limit);
    return hydrateMany(rows);
  },

  async findNewArrivals(storeId: string, limit = 8): Promise<IProduct[]> {
    const rows = await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, storeId), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt))
      .limit(limit);
    return hydrateMany(rows);
  },

  async create(data: Partial<IProduct>): Promise<IProduct> {
    return db.transaction(async (tx) => {
      const [row] = await tx.insert(products).values(toInsert(data)).returning();

      const variants = data.variants ?? [];
      if (variants.length > 0) {
        const inserted = await tx
          .insert(productVariants)
          .values(
            variants.map((v) => ({
              productId: row.id,
              optionValues: v.optionValues,
              price: v.price !== undefined ? String(v.price) : null,
              compareAtPrice: v.compareAtPrice !== undefined ? String(v.compareAtPrice) : null,
              stock: v.stock,
              sku: v.sku || null,
            })),
          )
          .returning({ id: productVariants.id });

        const variantImgs: (typeof productImages.$inferInsert)[] = [];
        inserted.forEach((ins, i) => {
          (variants[i].images ?? []).forEach((img) => {
            variantImgs.push({
              productId: row.id,
              variantId: ins.id,
              url: img.url,
              alt: img.alt ?? null,
              key: img.key ?? null,
              width: img.width ?? null,
              height: img.height ?? null,
              variants: img.variants ?? null,
              blurDataUrl: img.blurDataURL ?? null,
            });
          });
        });
        if (variantImgs.length > 0) await tx.insert(productImages).values(variantImgs);
      }

      const imgs = (data.images ?? []).map((img) => ({
        productId: row.id,
        variantId: null,
        url: img.url,
        alt: img.alt ?? null,
        key: img.key ?? null,
        width: img.width ?? null,
        height: img.height ?? null,
        variants: img.variants ?? null,
        blurDataUrl: img.blurDataURL ?? null,
      }));
      if (imgs.length > 0) await tx.insert(productImages).values(imgs);

      const out = await hydrateOne(row);
      return out!;
    });
  },

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    return db.transaction(async (tx) => {
      const insert = toInsert(data);
      const [row] = await tx
        .update(products)
        .set({ ...insert, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
      if (!row) return null;

      if (data.variants !== undefined) {
        await tx.delete(productVariants).where(eq(productVariants.productId, row.id));
        if (data.variants.length > 0) {
          const insertedVariants = await tx
            .insert(productVariants)
            .values(
              data.variants.map((v) => ({
                productId: row.id,
                optionValues: v.optionValues,
                price: v.price !== undefined ? String(v.price) : null,
                compareAtPrice: v.compareAtPrice !== undefined ? String(v.compareAtPrice) : null,
                stock: v.stock,
                sku: v.sku || null,
              })),
            )
            .returning({ id: productVariants.id });

          const variantImgs: (typeof productImages.$inferInsert)[] = [];
          insertedVariants.forEach((ins, i) => {
            (data.variants![i].images ?? []).forEach((img) => {
              variantImgs.push({
                productId: row.id,
                variantId: ins.id,
                url: img.url,
                alt: img.alt ?? null,
                key: img.key ?? null,
                width: img.width ?? null,
                height: img.height ?? null,
                variants: img.variants ?? null,
                blurDataUrl: img.blurDataURL ?? null,
              });
            });
          });
          if (variantImgs.length > 0) await tx.insert(productImages).values(variantImgs);
        }
      }
      if (data.images !== undefined) {
        await tx
          .delete(productImages)
          .where(and(eq(productImages.productId, row.id), sql`${productImages.variantId} IS NULL`));
        if (data.images.length > 0) {
          await tx.insert(productImages).values(
            data.images.map((img) => ({
              productId: row.id,
              variantId: null,
              url: img.url,
              alt: img.alt ?? null,
              key: img.key ?? null,
              width: img.width ?? null,
              height: img.height ?? null,
              variants: img.variants ?? null,
              blurDataUrl: img.blurDataURL ?? null,
            })),
          );
        }
      }

      return hydrateOne(row);
    });
  },

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning({ id: products.id });
    return result.length > 0;
  },

  async findManyByIds(ids: string[]): Promise<IProduct[]> {
    if (ids.length === 0) return [];
    const rows = await db.select().from(products).where(inArray(products.id, ids));
    return hydrateMany(rows);
  },

  async countByStore(storeId: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(products)
      .where(eq(products.storeId, storeId));
    return Number(total);
  },

  async updateRatingStats(id: string, averageRating: number, reviewCount: number): Promise<void> {
    await db
      .update(products)
      .set({
        averageRating: String(averageRating),
        reviewCount,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));
  },

  async decreaseStock(id: string, quantity: number): Promise<void> {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${quantity}`, updatedAt: new Date() })
      .where(eq(products.id, id));
  },

  async increaseStock(id: string, quantity: number): Promise<void> {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${quantity}`, updatedAt: new Date() })
      .where(eq(products.id, id));
  },

  async decreaseVariantStock(productId: string, variantId: string, quantity: number): Promise<void> {
    await db
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} - ${quantity}`, updatedAt: new Date() })
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)));
  },

  async increaseVariantStock(productId: string, variantId: string, quantity: number): Promise<void> {
    await db
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} + ${quantity}`, updatedAt: new Date() })
      .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)));
  },

  async countByCategoryIds(
    storeId: string,
    categoryIds: string[],
  ): Promise<Record<string, number>> {
    if (categoryIds.length === 0) return {};
    const rows = await db
      .select({ categoryId: products.categoryId, count: count() })
      .from(products)
      .where(and(eq(products.storeId, storeId), inArray(products.categoryId, categoryIds)))
      .groupBy(products.categoryId);
    return Object.fromEntries(rows.map((r) => [r.categoryId ?? "", Number(r.count)]));
  },
};

import { ProductRepository } from "./repository";
import { CategoryRepository } from "@/features/categories/repository";
import { generateBaseSku, generateVariantSku, dedupeVariantSkus } from "./sku";
import { deleteUnreferencedBlobs } from "@/shared/lib/storage";
import type { IProduct } from "./types";
import type { LocalizedString } from "@/shared/types/i18n";
import type { PaginatedResponse, SearchParams } from "@/shared/types/common";
import slugify from "slugify";

function baseSlug(name: string | LocalizedString): string {
  const raw = typeof name === "string" ? name : (name.en ?? Object.values(name)[0] ?? "product");
  return slugify(raw, { lower: true, strict: true });
}

/** All image URLs/keys a product references (main + variant images + thumbnail). */
function productBlobValues(p: IProduct): string[] {
  const out: string[] = [];
  if (p.thumbnail) out.push(p.thumbnail);
  const pushImg = (img: IProduct["images"][number]) => {
    if (img.key) out.push(img.key);
    if (img.url) out.push(img.url);
    if (img.variants) out.push(...Object.values(img.variants));
  };
  for (const img of p.images ?? []) pushImg(img);
  for (const v of p.variants ?? []) for (const img of v.images ?? []) pushImg(img);
  return out;
}

async function uniqueSlug(
  storeId: string,
  name: string | LocalizedString,
  excludeProductId?: string
): Promise<string> {
  const slug = baseSlug(name);
  let candidate = slug;
  let suffix = 2;

  while (true) {
    const existing = await ProductRepository.findBySlugIncludingInactive(storeId, candidate);
    if (!existing || existing._id === excludeProductId) return candidate;
    candidate = `${slug}-${suffix}`;
    suffix++;
  }
}

export const ProductService = {
  async getByStore(
    storeId: string,
    params: SearchParams & { categoryId?: string; featured?: boolean; status?: "active" | "inactive" | "all" }
  ): Promise<PaginatedResponse<IProduct>> {
    return ProductRepository.findByStore(storeId, params);
  },

  async getBySlug(storeId: string, slug: string): Promise<IProduct | null> {
    return ProductRepository.findBySlug(storeId, slug);
  },

  async getById(id: string): Promise<IProduct | null> {
    return ProductRepository.findById(id);
  },

  async getFeatured(storeId: string, limit = 8): Promise<IProduct[]> {
    return ProductRepository.findFeatured(storeId, limit);
  },

  async getNewArrivals(storeId: string, limit = 8): Promise<IProduct[]> {
    return ProductRepository.findNewArrivals(storeId, limit);
  },

  async create(
    storeId: string,
    data: Omit<IProduct, "_id" | "storeId" | "slug" | "averageRating" | "reviewCount" | "createdAt" | "updatedAt">
  ): Promise<IProduct> {
    const slug = await uniqueSlug(storeId, data.name);
    const categoryName = data.categoryId
      ? (await CategoryRepository.findById(data.categoryId))?.name
      : undefined;
    const baseSku = (data.sku && data.sku.trim()) || generateBaseSku(data.name, categoryName);
    const variants = dedupeVariantSkus(
      (data.variants ?? []).map((v) => ({
        ...v,
        sku: (v.sku && v.sku.trim()) || generateVariantSku(baseSku, v.optionValues),
      })),
    );
    return ProductRepository.create({
      ...data,
      sku: baseSku,
      variants,
      storeId,
      slug,
      averageRating: 0,
      reviewCount: 0,
    });
  },

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    const existing = await ProductRepository.findById(id);
    if (existing && data.name) {
      data.slug = await uniqueSlug(existing.storeId, data.name, id);
    }
    if (data.variants) {
      const base = data.sku?.trim();
      data.variants = dedupeVariantSkus(
        data.variants.map((v) => ({
          ...v,
          sku:
            (v.sku && v.sku.trim()) ||
            (base ? generateVariantSku(base, v.optionValues) : ""),
        })),
      );
    }
    const updated = await ProductRepository.update(id, data);
    if (existing && updated) {
      // Remove blobs dropped by this update (kept images are protected).
      await deleteUnreferencedBlobs(
        productBlobValues(existing),
        productBlobValues(updated),
      ).catch(() => {});
    }
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await ProductRepository.findById(id);
    const ok = await ProductRepository.delete(id);
    if (ok && existing) {
      await deleteUnreferencedBlobs(productBlobValues(existing)).catch(() => {});
    }
    return ok;
  },

  async getCountsByCategoryIds(
    storeId: string,
    categoryIds: string[]
  ): Promise<Record<string, number>> {
    return ProductRepository.countByCategoryIds(storeId, categoryIds);
  },
};

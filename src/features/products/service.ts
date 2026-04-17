import { ProductRepository } from "./repository";
import type { IProduct } from "./types";
import type { LocalizedString } from "@/shared/types/i18n";
import type { PaginatedResponse, SearchParams } from "@/shared/types/common";
import slugify from "slugify";

function baseSlug(name: string | LocalizedString): string {
  const raw = typeof name === "string" ? name : (name.en ?? Object.values(name)[0] ?? "product");
  return slugify(raw, { lower: true, strict: true });
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
    return ProductRepository.create({
      ...data,
      storeId,
      slug,
      averageRating: 0,
      reviewCount: 0,
    });
  },

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    if (data.name) {
      const existing = await ProductRepository.findById(id);
      if (existing) {
        data.slug = await uniqueSlug(existing.storeId, data.name, id);
      }
    }
    return ProductRepository.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    return ProductRepository.delete(id);
  },

  async getCountsByCategoryIds(
    storeId: string,
    categoryIds: string[]
  ): Promise<Record<string, number>> {
    return ProductRepository.countByCategoryIds(storeId, categoryIds);
  },
};

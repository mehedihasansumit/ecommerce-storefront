import { ProductRepository } from "./repository";
import type { IProduct } from "./types";
import type { LocalizedString } from "@/shared/types/i18n";
import type { PaginatedResponse, SearchParams } from "@/shared/types/common";
import slugify from "slugify";

function nameToSlug(name: string | LocalizedString): string {
  const raw = typeof name === "string" ? name : (name.en ?? Object.values(name)[0] ?? "product");
  return slugify(raw, { lower: true, strict: true });
}

export const ProductService = {
  async getByStore(
    storeId: string,
    params: SearchParams & { categoryId?: string; featured?: boolean }
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

  async create(
    storeId: string,
    data: Omit<IProduct, "_id" | "storeId" | "slug" | "averageRating" | "reviewCount" | "createdAt" | "updatedAt">
  ): Promise<IProduct> {
    const slug = nameToSlug(data.name);
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
      data.slug = nameToSlug(data.name);
    }
    return ProductRepository.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    return ProductRepository.delete(id);
  },
};

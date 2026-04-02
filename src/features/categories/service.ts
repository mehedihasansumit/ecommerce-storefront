import { CategoryRepository } from "./repository";
import type { ICategory } from "./types";
import slugify from "slugify";

export const CategoryService = {
  async getByStore(storeId: string): Promise<ICategory[]> {
    return CategoryRepository.findByStore(storeId);
  },

  async getBySlug(storeId: string, slug: string): Promise<ICategory | null> {
    return CategoryRepository.findBySlug(storeId, slug);
  },

  async getById(id: string): Promise<ICategory | null> {
    return CategoryRepository.findById(id);
  },

  async create(
    storeId: string,
    data: { name: string; description?: string; image?: string; parentId?: string; sortOrder?: number }
  ): Promise<ICategory> {
    const slug = slugify(data.name, { lower: true, strict: true });
    return CategoryRepository.create({ ...data, storeId, slug });
  },

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    if (data.name) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }
    return CategoryRepository.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    return CategoryRepository.delete(id);
  },
};

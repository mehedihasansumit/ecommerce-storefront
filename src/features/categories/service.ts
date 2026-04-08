import { CategoryRepository } from "./repository";
import type { ICategory } from "./types";
import type { LocalizedString } from "@/shared/types/i18n";
import slugify from "slugify";

function nameToSlug(name: string | LocalizedString): string {
  const raw = typeof name === "string" ? name : (name.en ?? Object.values(name)[0] ?? "category");
  return slugify(raw, { lower: true, strict: true });
}

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
    data: { name: string | LocalizedString; description?: string | LocalizedString; image?: string; parentId?: string; sortOrder?: number }
  ): Promise<ICategory> {
    const slug = nameToSlug(data.name);
    return CategoryRepository.create({ ...data, storeId, slug } as Partial<ICategory>);
  },

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    if (data.name) {
      data.slug = nameToSlug(data.name);
    }
    return CategoryRepository.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    return CategoryRepository.delete(id);
  },
};

import { CategoryRepository } from "./repository";
import { deleteUnreferencedBlobs } from "@/shared/lib/storage";
import type { ICategory } from "./types";
import type { LocalizedString } from "@/shared/types/i18n";
import slugify from "slugify";

function nameToSlug(name: string | LocalizedString): string {
  const raw = typeof name === "string" ? name : (name.en ?? Object.values(name)[0] ?? "category");
  return slugify(raw, { lower: true, strict: true });
}

export const CategoryService = {
  async getByStore(
    storeId: string,
    status?: "active" | "inactive" | "all"
  ): Promise<ICategory[]> {
    return CategoryRepository.findByStore(storeId, status);
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
    // Only need the old image when the image field is being changed.
    const before =
      data.image !== undefined ? await CategoryRepository.findById(id) : null;
    const updated = await CategoryRepository.update(id, data);
    if (before && updated) {
      await deleteUnreferencedBlobs([before.image], [updated.image]).catch(() => {});
    }
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const before = await CategoryRepository.findById(id);
    const ok = await CategoryRepository.delete(id);
    if (ok && before?.image) {
      await deleteUnreferencedBlobs([before.image]).catch(() => {});
    }
    return ok;
  },
};

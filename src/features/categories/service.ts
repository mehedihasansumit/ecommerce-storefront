import { CategoryRepository } from "./repository";
import { deleteUnreferencedBlobs } from "@/shared/lib/storage";
import type { ICategory } from "./types";
import type { LocalizedString } from "@/shared/types/i18n";
import slugify from "slugify";
import { ProductService } from "@/features/products/service";

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

  /**
   * Top-level categories that hold at least one active product, for the home
   * "Shop by Category" tiles and the /products chip row. Ordered by the admin
   * sort order; when no order was set (all equal) the busiest categories lead.
   * Pass `categories` when the caller already loaded the store's list.
   */
  async getTopLevelWithProducts(
    storeId: string,
    categories?: ICategory[],
  ): Promise<{ category: ICategory; count: number }[]> {
    const all = categories ?? (await CategoryRepository.findByStore(storeId, "active"));
    const roots = all.filter((c) => c.isActive && !c.parentId);
    if (roots.length === 0) return [];
    const counts = await ProductService.getCountsByCategoryIds(
      storeId,
      roots.map((c) => c._id),
      { activeOnly: true },
    );
    const withCounts = roots
      .map((category) => ({ category, count: counts[category._id] ?? 0 }))
      .filter((r) => r.count > 0);
    const hasOrder = new Set(withCounts.map((r) => r.category.sortOrder)).size > 1;
    return withCounts.sort((a, b) =>
      hasOrder && a.category.sortOrder !== b.category.sortOrder
        ? a.category.sortOrder - b.category.sortOrder
        : b.count - a.count,
    );
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

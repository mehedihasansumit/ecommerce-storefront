import { StoreRepository } from "./repository";
import { deleteUnreferencedBlobs, deleteBlobsByPrefix } from "@/shared/lib/storage";
import { invalidateStore } from "@/shared/lib/data-cache";
import type { IStore } from "./types";
import slugify from "slugify";

/** All blob URLs/keys a store references directly (logos, favicons, banner images and videos, OG image). */
function storeBlobValues(s: IStore): string[] {
  const out: string[] = [];
  for (const v of [s.logo, s.logoDark, s.favicon, s.faviconDark, s.seo?.ogImage]) {
    if (v) out.push(v);
  }
  for (const b of s.heroBanners ?? []) {
    if (b.image) out.push(b.image);
    if (b.video) out.push(b.video);
  }
  return out;
}

export const StoreService = {
  async resolveByDomain(domain: string): Promise<IStore | null> {
    return StoreRepository.findByDomain(domain);
  },

  async getById(id: string): Promise<IStore | null> {
    return StoreRepository.findById(id);
  },

  async getAll(): Promise<IStore[]> {
    return StoreRepository.findAll();
  },

  async getByIds(ids: string[]): Promise<IStore[]> {
    if (ids.length === 0) return [];
    return StoreRepository.findByIds(ids);
  },

  async create(data: {
    name: string;
    domains: string[];
    theme?: Partial<IStore["theme"]>;
    seo?: Partial<IStore["seo"]>;
    payment?: Partial<IStore["payment"]>;
  }): Promise<IStore> {
    const slug = slugify(data.name, { lower: true, strict: true });
    const created = await StoreRepository.create({
      ...data,
      slug,
    } as Partial<IStore>);
    invalidateStore(created._id, { domains: true });
    return created;
  },

  async update(id: string, data: Record<string, unknown>): Promise<IStore | null> {
    const before = await StoreRepository.findById(id);
    const updated = await StoreRepository.update(id, data);
    invalidateStore(id, { domains: true });
    if (before && updated) {
      await deleteUnreferencedBlobs(
        storeBlobValues(before),
        storeBlobValues(updated),
      ).catch(() => {});
    }
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const ok = await StoreRepository.delete(id);
    invalidateStore(id, { domains: true });
    if (ok) {
      // Store gone — wipe every blob under its prefix (logos, products, categories, campaigns).
      await deleteBlobsByPrefix(`${id}/`).catch(() => {});
    }
    return ok;
  },
};

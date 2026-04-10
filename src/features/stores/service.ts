import { StoreRepository } from "./repository";
import type { IStore } from "./types";
import slugify from "slugify";

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
    return StoreRepository.create({
      ...data,
      slug,
    } as Partial<IStore>);
  },

  async update(id: string, data: Record<string, unknown>): Promise<IStore | null> {
    return StoreRepository.update(id, data);
  },

  async delete(id: string): Promise<boolean> {
    return StoreRepository.delete(id);
  },
};

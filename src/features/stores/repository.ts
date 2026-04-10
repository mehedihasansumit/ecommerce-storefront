import dbConnect from "@/shared/lib/db";
import { StoreModel } from "./model";
import type { IStore } from "./types";

function serialize(doc: unknown): IStore {
  return JSON.parse(JSON.stringify(doc));
}

export const StoreRepository = {
  async findByDomain(domain: string): Promise<IStore | null> {
    await dbConnect();
    const store = await StoreModel.findOne({
      domains: domain,
      isActive: true,
    }).lean();
    return store ? serialize(store) : null;
  },

  async findById(id: string): Promise<IStore | null> {
    await dbConnect();
    const store = await StoreModel.findById(id).lean();
    return store ? serialize(store) : null;
  },

  async findBySlug(slug: string): Promise<IStore | null> {
    await dbConnect();
    const store = await StoreModel.findOne({ slug }).lean();
    return store ? serialize(store) : null;
  },

  async findAll(): Promise<IStore[]> {
    await dbConnect();
    const stores = await StoreModel.find().sort({ createdAt: -1 }).lean();
    return stores.map(serialize);
  },

  async findByIds(ids: string[]): Promise<IStore[]> {
    await dbConnect();
    const stores = await StoreModel.find({ _id: { $in: ids } }).sort({ createdAt: -1 }).lean();
    return stores.map(serialize);
  },

  async create(data: Partial<IStore>): Promise<IStore> {
    await dbConnect();
    const store = await StoreModel.create(data);
    return serialize(store.toObject());
  },

  async update(id: string, data: Record<string, unknown>): Promise<IStore | null> {
    await dbConnect();
    const store = await StoreModel.findById(id);
    if (!store) return null;
    Object.entries(data).forEach(([key, value]) => store.set(key, value));
    // Mixed-type fields must be explicitly marked modified so Mongoose persists them
    (["heroBanners", "seo"] as const).forEach((field) => {
      if (field in data) store.markModified(field);
    });
    await store.save();
    return serialize(store.toObject());
  },

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await StoreModel.findByIdAndDelete(id);
    return !!result;
  },
};

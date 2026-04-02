import dbConnect from "@/shared/lib/db";
import { CategoryModel } from "./model";
import type { ICategory } from "./types";

function serialize(doc: unknown): ICategory {
  return JSON.parse(JSON.stringify(doc));
}

export const CategoryRepository = {
  async findByStore(storeId: string): Promise<ICategory[]> {
    await dbConnect();
    const categories = await CategoryModel.find({ storeId, isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    return categories.map(serialize);
  },

  async findBySlug(storeId: string, slug: string): Promise<ICategory | null> {
    await dbConnect();
    const category = await CategoryModel.findOne({ storeId, slug }).lean();
    return category ? serialize(category) : null;
  },

  async findById(id: string): Promise<ICategory | null> {
    await dbConnect();
    const category = await CategoryModel.findById(id).lean();
    return category ? serialize(category) : null;
  },

  async create(data: Partial<ICategory>): Promise<ICategory> {
    await dbConnect();
    const category = await CategoryModel.create(data);
    return serialize(category.toObject());
  },

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    await dbConnect();
    const category = await CategoryModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    return category ? serialize(category) : null;
  },

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await CategoryModel.findByIdAndDelete(id);
    return !!result;
  },
};

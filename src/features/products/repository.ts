import dbConnect from "@/shared/lib/db";
import { ProductModel } from "./model";
import type { IProduct } from "./types";
import type { PaginatedResponse, SearchParams } from "@/shared/types/common";

function serialize(doc: unknown): IProduct {
  return JSON.parse(JSON.stringify(doc));
}

export const ProductRepository = {
  async findByStore(
    storeId: string,
    params: SearchParams & { categoryId?: string; featured?: boolean }
  ): Promise<PaginatedResponse<IProduct>> {
    await dbConnect();

    const filter: Record<string, unknown> = { storeId, isActive: true };
    if (params.categoryId) filter.categoryId = params.categoryId;
    if (params.featured) filter.isFeatured = true;
    if (params.search) {
      filter.$or = [
        { name: { $regex: params.search, $options: "i" } },
        { tags: { $in: [new RegExp(params.search, "i")] } },
      ];
    }

    const sort: Record<string, 1 | -1> = {};
    if (params.sort) {
      sort[params.sort] = params.order === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (params.page - 1) * params.limit;
    const [products, total] = await Promise.all([
      ProductModel.find(filter).sort(sort).skip(skip).limit(params.limit).lean(),
      ProductModel.countDocuments(filter),
    ]);

    return {
      data: products.map(serialize),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  },

  async findBySlug(storeId: string, slug: string): Promise<IProduct | null> {
    await dbConnect();
    const product = await ProductModel.findOne({ storeId, slug, isActive: true }).lean();
    return product ? serialize(product) : null;
  },

  async findById(id: string): Promise<IProduct | null> {
    await dbConnect();
    const product = await ProductModel.findById(id).lean();
    return product ? serialize(product) : null;
  },

  async findFeatured(storeId: string, limit = 8): Promise<IProduct[]> {
    await dbConnect();
    const products = await ProductModel.find({
      storeId,
      isActive: true,
      isFeatured: true,
    })
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();
    return products.map(serialize);
  },

  async create(data: Partial<IProduct>): Promise<IProduct> {
    await dbConnect();
    const product = await ProductModel.create(data);
    return serialize(product.toObject());
  },

  async update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    await dbConnect();
    const product = await ProductModel.findByIdAndUpdate(id, data, {
      new: true,
    }).lean();
    return product ? serialize(product) : null;
  },

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await ProductModel.findByIdAndDelete(id);
    return !!result;
  },

  async findManyByIds(ids: string[]): Promise<IProduct[]> {
    await dbConnect();
    const products = await ProductModel.find({ _id: { $in: ids } }).lean();
    return products.map(serialize);
  },

  async countByStore(storeId: string): Promise<number> {
    await dbConnect();
    return ProductModel.countDocuments({ storeId });
  },
};

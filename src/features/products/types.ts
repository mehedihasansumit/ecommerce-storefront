import { Types } from "mongoose";

export interface IProductOption {
  name: string;
  values: string[];
}

export interface IProductVariant {
  _id?: string;
  optionValues: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  images: IProductImage[];
}

export interface IProductImage {
  url: string;
  alt: string;
}

export interface IProductSeo {
  title: string;
  description: string;
}

export interface IProduct {
  _id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number;
  costPrice: number;
  sku: string;
  barcode: string;
  stock: number;
  trackInventory: boolean;
  images: IProductImage[];
  thumbnail: string;
  categoryId: string;
  tags: string[];
  options: IProductOption[];
  variants: IProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  seo: IProductSeo;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends Omit<IProduct, "_id" | "storeId" | "categoryId"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  categoryId: Types.ObjectId;
}

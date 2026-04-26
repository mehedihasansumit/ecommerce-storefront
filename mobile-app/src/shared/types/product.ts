import type { LocalizedString } from "./i18n";

export interface IProductOption {
  name: string;
  values: string[];
}

export interface IProductImage {
  url: string;
  alt: string;
  key?: string;
  width?: number;
  height?: number;
  variants?: Record<string, string>;
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

export interface IProduct {
  _id: string;
  storeId: string;
  name: LocalizedString;
  slug: string;
  description: LocalizedString;
  shortDescription: LocalizedString;
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
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

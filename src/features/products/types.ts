import type { LocalizedString } from "@/shared/types/i18n";
import type { ISizeGuide } from "@/features/categories/types";

export interface IProductOption {
  name: string;
  values: string[];
}

export interface IProductVariant {
  _id?: string;
  optionValues: Record<string, string>;
  /** Undefined = inherit the product price (DB `price` is NULL). */
  price?: number;
  compareAtPrice?: number;
  stock: number;
  sku: string;
  images: IProductImage[];
}

export interface IProductImage {
  url: string;
  alt: string;
  key?: string;
  width?: number;
  height?: number;
  variants?: Record<string, string>;
  blurDataURL?: string;
}

export interface IProductSeo {
  title: LocalizedString;
  description: LocalizedString;
}

/** One "Details" row on the product page, e.g. Fabric → 100% cotton. */
export interface IProductDetail {
  label: LocalizedString;
  value: LocalizedString;
}

export interface IPricingTier {
  quantity: number;
  totalPrice: number;
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
  details: IProductDetail[];
  /** Own size chart; null = the category's chart is shown instead. */
  sizeGuide: ISizeGuide | null;
  pricingTiers: IPricingTier[];
  isActive: boolean;
  isFeatured: boolean;
  seo: IProductSeo;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}


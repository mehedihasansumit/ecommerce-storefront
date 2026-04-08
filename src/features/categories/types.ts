import { Types } from "mongoose";
import type { LocalizedString } from "@/shared/types/i18n";

export interface ICategory {
  _id: string;
  storeId: string;
  name: LocalizedString;
  slug: string;
  description: LocalizedString;
  image: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends Omit<ICategory, "_id" | "storeId" | "parentId"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  parentId: Types.ObjectId | null;
}

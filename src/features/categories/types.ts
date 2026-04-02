import { Types } from "mongoose";

export interface ICategory {
  _id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
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

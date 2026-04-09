import { Types, Document } from "mongoose";

export interface ICartItem {
  _id?: string;
  productId: string;
  variantSelections: Record<string, string>;
  quantity: number;
  priceAtAdd: number;
}

export interface ICart {
  _id: string;
  storeId: string;
  userId: string | null;
  sessionId: string | null;
  items: ICartItem[];
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItemDocument {
  productId: Types.ObjectId;
  variantSelections: Map<string, string>;
  quantity: number;
  priceAtAdd: number;
}

export interface ICartDocument extends Omit<ICart, "_id" | "storeId" | "userId" | "items"> {
  _id: Types.ObjectId;
  storeId: Types.ObjectId;
  userId: Types.ObjectId | null;
  items: Types.DocumentArray<ICartItemDocument & Document>;
}

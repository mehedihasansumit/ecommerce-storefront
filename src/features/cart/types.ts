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


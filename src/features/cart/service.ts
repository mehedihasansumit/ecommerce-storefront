import { CartRepository } from "./repository";
import { ProductRepository } from "@/features/products/repository";
import type { ICart } from "./types";

export const CartService = {
  async getCart(
    storeId: string,
    userId?: string | null,
    sessionId?: string | null
  ): Promise<ICart | null> {
    if (userId) return CartRepository.findByUserId(storeId, userId);
    if (sessionId) return CartRepository.findBySessionId(storeId, sessionId);
    return null;
  },

  async addItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    productId: string,
    quantity: number,
    variantSelections: Record<string, string> = {}
  ): Promise<ICart> {
    const product = await ProductRepository.findById(productId);
    if (!product || product.storeId !== storeId)
      throw new Error("Product not found");
    if (product.stock < quantity) throw new Error("Insufficient stock");

    return CartRepository.upsertItem(storeId, identifier, {
      productId,
      variantSelections,
      quantity,
      priceAtAdd: product.price,
    });
  },

  async updateItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    itemId: string,
    quantity: number
  ): Promise<ICart | null> {
    return CartRepository.updateItem(storeId, identifier, itemId, quantity);
  },

  async removeItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    itemId: string
  ): Promise<ICart | null> {
    return CartRepository.removeItem(storeId, identifier, itemId);
  },
};

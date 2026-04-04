import dbConnect from "@/shared/lib/db";
import { CartModel } from "./model";
import type { ICart, ICartItem } from "./types";

function serialize(doc: unknown): ICart {
  return JSON.parse(JSON.stringify(doc));
}

export const CartRepository = {
  async findByUserId(storeId: string, userId: string): Promise<ICart | null> {
    await dbConnect();
    const cart = await CartModel.findOne({ storeId, userId }).lean();
    return cart ? serialize(cart) : null;
  },

  async findBySessionId(
    storeId: string,
    sessionId: string
  ): Promise<ICart | null> {
    await dbConnect();
    const cart = await CartModel.findOne({ storeId, sessionId }).lean();
    return cart ? serialize(cart) : null;
  },

  async upsertItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    item: ICartItem
  ): Promise<ICart> {
    await dbConnect();
    const query: Record<string, unknown> = { storeId };
    if (identifier.userId) query.userId = identifier.userId;
    else query.sessionId = identifier.sessionId;

    let cart = await CartModel.findOne(query);
    if (!cart) {
      cart = new CartModel({
        storeId,
        userId: identifier.userId || null,
        sessionId: identifier.sessionId || null,
        items: [],
        expiresAt: identifier.userId
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    const existingIdx = cart.items.findIndex((i: any) => {
      if (String(i.productId) !== item.productId) return false;
      const sel = i.variantSelections
        ? Object.fromEntries(i.variantSelections)
        : {};
      return (
        JSON.stringify(sel) === JSON.stringify(item.variantSelections || {})
      );
    });

    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += item.quantity;
    } else {
      cart.items.push(item as any);
    }

    await cart.save();
    return serialize(cart.toObject());
  },

  async updateItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    itemId: string,
    quantity: number
  ): Promise<ICart | null> {
    await dbConnect();
    const query: Record<string, unknown> = { storeId };
    if (identifier.userId) query.userId = identifier.userId;
    else query.sessionId = identifier.sessionId;

    const cart = await CartModel.findOne(query);
    if (!cart) return null;

    if (quantity <= 0) {
      cart.items.pull({ _id: itemId });
    } else {
      const item = cart.items.id(itemId);
      if (item) item.quantity = quantity;
    }

    await cart.save();
    return serialize(cart.toObject());
  },

  async removeItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    itemId: string
  ): Promise<ICart | null> {
    await dbConnect();
    const query: Record<string, unknown> = { storeId };
    if (identifier.userId) query.userId = identifier.userId;
    else query.sessionId = identifier.sessionId;

    const cart = await CartModel.findOne(query);
    if (!cart) return null;

    cart.items.pull({ _id: itemId });
    await cart.save();
    return serialize(cart.toObject());
  },
};

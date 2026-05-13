import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { carts, cartItems, type Cart, type CartItem } from "@/db/schema/cart";
import type { ICart, ICartItem } from "./types";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function toICartItem(row: CartItem): ICartItem {
  return {
    _id: row.id,
    productId: row.productId,
    variantSelections: (row.variantSelections as Record<string, string>) ?? {},
    quantity: row.quantity,
    priceAtAdd: Number(row.priceAtAdd),
  };
}

function toICart(cart: Cart, items: CartItem[]): ICart {
  return {
    _id: cart.id,
    storeId: cart.storeId,
    userId: cart.userId,
    sessionId: cart.sessionId,
    items: items.map(toICartItem),
    expiresAt: cart.expiresAt,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

async function loadItems(cartId: string): Promise<CartItem[]> {
  return db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));
}

async function findCart(
  storeId: string,
  identifier: { userId?: string | null; sessionId?: string | null },
): Promise<Cart | undefined> {
  const conds = [eq(carts.storeId, storeId)];
  if (identifier.userId) conds.push(eq(carts.userId, identifier.userId));
  else if (identifier.sessionId) conds.push(eq(carts.sessionId, identifier.sessionId));
  else return undefined;
  const [row] = await db
    .select()
    .from(carts)
    .where(and(...conds))
    .limit(1);
  return row;
}

export const CartRepository = {
  async findByUserId(storeId: string, userId: string): Promise<ICart | null> {
    const cart = await findCart(storeId, { userId });
    if (!cart) return null;
    const items = await loadItems(cart.id);
    return toICart(cart, items);
  },

  async findBySessionId(storeId: string, sessionId: string): Promise<ICart | null> {
    const cart = await findCart(storeId, { sessionId });
    if (!cart) return null;
    const items = await loadItems(cart.id);
    return toICart(cart, items);
  },

  async upsertItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    item: ICartItem,
  ): Promise<ICart> {
    return db.transaction(async (tx) => {
      let cart = await (async () => {
        const conds = [eq(carts.storeId, storeId)];
        if (identifier.userId) conds.push(eq(carts.userId, identifier.userId));
        else conds.push(eq(carts.sessionId, identifier.sessionId!));
        const [row] = await tx
          .select()
          .from(carts)
          .where(and(...conds))
          .limit(1);
        return row;
      })();

      if (!cart) {
        const [created] = await tx
          .insert(carts)
          .values({
            storeId,
            userId: identifier.userId ?? null,
            sessionId: identifier.sessionId ?? null,
            expiresAt: identifier.userId ? null : new Date(Date.now() + SESSION_TTL_MS),
          })
          .returning();
        cart = created;
      }

      const selections = item.variantSelections ?? {};
      const [existing] = await tx
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cart.id),
            eq(cartItems.productId, item.productId),
            sql`COALESCE(${cartItems.variantSelections}, '{}'::jsonb) = ${JSON.stringify(selections)}::jsonb`,
          ),
        )
        .limit(1);

      if (existing) {
        await tx
          .update(cartItems)
          .set({
            quantity: existing.quantity + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(cartItems.id, existing.id));
      } else {
        await tx.insert(cartItems).values({
          cartId: cart.id,
          productId: item.productId,
          variantSelections: selections,
          quantity: item.quantity,
          priceAtAdd: String(item.priceAtAdd),
        });
      }

      await tx.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));

      const items = await tx
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cart.id))
        .orderBy(asc(cartItems.createdAt));
      return toICart(cart, items);
    });
  },

  async updateItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    itemId: string,
    quantity: number,
  ): Promise<ICart | null> {
    const cart = await findCart(storeId, identifier);
    if (!cart) return null;

    if (quantity <= 0) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    } else {
      await db
        .update(cartItems)
        .set({ quantity, updatedAt: new Date() })
        .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    }
    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));

    const items = await loadItems(cart.id);
    return toICart(cart, items);
  },

  async removeItem(
    storeId: string,
    identifier: { userId?: string; sessionId?: string },
    itemId: string,
  ): Promise<ICart | null> {
    const cart = await findCart(storeId, identifier);
    if (!cart) return null;
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));
    const items = await loadItems(cart.id);
    return toICart(cart, items);
  },
};

import { and, count, desc, eq, isNull, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { coupons, couponUsages, type Coupon } from "@/db/schema/coupons";
import { orders } from "@/db/schema/orders";
import type { CouponType, ICoupon } from "./types";

function toICoupon(row: Coupon): ICoupon {
  return {
    _id: row.id,
    storeId: row.storeId,
    code: row.code,
    description: row.description ?? "",
    type: row.type as CouponType,
    value: Number(row.value),
    minOrderAmount: Number(row.minOrderAmount ?? 0),
    maxDiscountAmount: row.maxDiscountAmount === null ? null : Number(row.maxDiscountAmount),
    validFrom: row.validFrom,
    validUntil: row.validUntil,
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
    perCustomerLimit: row.perCustomerLimit ?? 0,
    applicableProducts: row.applicableProducts,
    applicableCategories: row.applicableCategories,
    requiresLogin: row.requiresLogin,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInsert(data: Partial<ICoupon>): typeof coupons.$inferInsert {
  const { _id, createdAt, updatedAt, value, minOrderAmount, maxDiscountAmount, code, ...rest } =
    data;
  void _id;
  void createdAt;
  void updatedAt;
  const out: Record<string, unknown> = { ...rest };
  if (code !== undefined) out.code = code.toUpperCase();
  if (value !== undefined) out.value = String(value);
  if (minOrderAmount !== undefined) out.minOrderAmount = String(minOrderAmount);
  if (maxDiscountAmount !== undefined && maxDiscountAmount !== null) {
    out.maxDiscountAmount = String(maxDiscountAmount);
  }
  return out as typeof coupons.$inferInsert;
}

export const CouponRepository = {
  async create(data: Partial<ICoupon>): Promise<ICoupon> {
    const [row] = await db.insert(coupons).values(toInsert(data)).returning();
    return toICoupon(row);
  },

  async findById(id: string): Promise<ICoupon | null> {
    const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return row ? toICoupon(row) : null;
  },

  async findByCode(storeId: string, code: string): Promise<ICoupon | null> {
    const [row] = await db
      .select()
      .from(coupons)
      .where(and(eq(coupons.storeId, storeId), eq(coupons.code, code.toUpperCase())))
      .limit(1);
    return row ? toICoupon(row) : null;
  },

  async findByStore(
    storeId: string,
    { page = 1, limit = 20, isActive }: { page?: number; limit?: number; isActive?: boolean } = {},
  ): Promise<{ coupons: ICoupon[]; total: number }> {
    const conds = [eq(coupons.storeId, storeId)];
    if (isActive !== undefined) conds.push(eq(coupons.isActive, isActive));
    const where = and(...conds);
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(coupons).where(where).orderBy(desc(coupons.createdAt)).limit(limit).offset(skip),
      db.select({ total: count() }).from(coupons).where(where),
    ]);
    return { coupons: rows.map(toICoupon), total: Number(total) };
  },

  async update(id: string, data: Partial<ICoupon>): Promise<ICoupon | null> {
    const insert = toInsert(data);
    const [row] = await db
      .update(coupons)
      .set({ ...insert, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return row ? toICoupon(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(coupons).where(eq(coupons.id, id)).returning({ id: coupons.id });
    return result.length > 0;
  },

  /**
   * Counts one use only while the coupon is under its usage limit, in one
   * statement, so parallel checkouts can't use a single-use coupon twice.
   * False when the limit is already reached.
   */
  async tryReserveUsage(couponId: string): Promise<boolean> {
    const rows = await db
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
      .where(
        and(
          eq(coupons.id, couponId),
          or(isNull(coupons.usageLimit), lt(coupons.usedCount, coupons.usageLimit)),
        ),
      )
      .returning({ id: coupons.id });
    return rows.length > 0;
  },

  /** Gives back a use reserved by tryReserveUsage (the order wasn't placed). */
  async releaseUsage(couponId: string): Promise<void> {
    await db
      .update(coupons)
      .set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(coupons.id, couponId));
  },

  /**
   * How many of this store's live orders used `code` with this phone number.
   * Guests have no account, so their per-customer limit is counted by phone.
   */
  async countUsageByPhone(storeId: string, code: string, phone: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          eq(orders.couponCode, code.toUpperCase()),
          eq(orders.guestPhone, phone),
          ne(orders.status, "cancelled"),
        ),
      );
    return Number(total);
  },

  async createUsage(data: {
    couponId: string;
    userId: string;
    orderId: string;
    storeId: string;
  }): Promise<void> {
    await db.insert(couponUsages).values(data);
  },

  async countUserUsage(couponId: string, userId: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(couponUsages)
      .where(and(eq(couponUsages.couponId, couponId), eq(couponUsages.userId, userId)));
    return Number(total);
  },
};

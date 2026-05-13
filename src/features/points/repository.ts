import { and, count, desc, eq, gt, lt, sql, sum } from "drizzle-orm";
import { db } from "@/db/client";
import { pointTransactions, type PointTransaction } from "@/db/schema/points";
import type { IPointTransaction, PointReason } from "./types";

function toIPointTransaction(row: PointTransaction): IPointTransaction {
  return {
    _id: row.id,
    storeId: row.storeId,
    userId: row.userId,
    amount: row.amount,
    reason: row.reason as PointReason,
    reviewId: row.reviewId,
    couponId: row.couponId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInsert(data: Partial<IPointTransaction>): typeof pointTransactions.$inferInsert {
  const { _id, createdAt, updatedAt, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  return rest as typeof pointTransactions.$inferInsert;
}

export const PointRepository = {
  async create(data: Partial<IPointTransaction>): Promise<IPointTransaction> {
    const [row] = await db.insert(pointTransactions).values(toInsert(data)).returning();
    return toIPointTransaction(row);
  },

  async findByUser(
    storeId: string,
    userId: string,
    { page, limit }: { page: number; limit: number },
  ): Promise<{ transactions: IPointTransaction[]; total: number }> {
    const where = and(eq(pointTransactions.storeId, storeId), eq(pointTransactions.userId, userId));
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(pointTransactions)
        .where(where)
        .orderBy(desc(pointTransactions.createdAt))
        .limit(limit)
        .offset(skip),
      db.select({ total: count() }).from(pointTransactions).where(where),
    ]);
    return { transactions: rows.map(toIPointTransaction), total: Number(total) };
  },

  async findByStore(
    storeId: string,
    { page, limit }: { page: number; limit: number },
  ): Promise<{ transactions: IPointTransaction[]; total: number }> {
    const where = eq(pointTransactions.storeId, storeId);
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(pointTransactions)
        .where(where)
        .orderBy(desc(pointTransactions.createdAt))
        .limit(limit)
        .offset(skip),
      db.select({ total: count() }).from(pointTransactions).where(where),
    ]);
    return { transactions: rows.map(toIPointTransaction), total: Number(total) };
  },

  async getStoreStats(storeId: string): Promise<{
    totalEarned: number;
    totalRedeemed: number;
    transactionCount: number;
  }> {
    const [row] = await db
      .select({
        earned: sum(sql<number>`CASE WHEN ${pointTransactions.amount} > 0 THEN ${pointTransactions.amount} ELSE 0 END`),
        redeemed: sum(sql<number>`CASE WHEN ${pointTransactions.amount} < 0 THEN -${pointTransactions.amount} ELSE 0 END`),
        cnt: count(),
      })
      .from(pointTransactions)
      .where(eq(pointTransactions.storeId, storeId));
    return {
      totalEarned: Number(row?.earned ?? 0),
      totalRedeemed: Number(row?.redeemed ?? 0),
      transactionCount: Number(row?.cnt ?? 0),
    };
  },

  async existsForReview(reviewId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: pointTransactions.id })
      .from(pointTransactions)
      .where(eq(pointTransactions.reviewId, reviewId))
      .limit(1);
    return row !== undefined;
  },
};

void gt;
void lt;

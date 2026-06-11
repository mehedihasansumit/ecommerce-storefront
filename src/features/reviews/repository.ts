import { and, avg, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { reviews, type Review } from "@/db/schema/reviews";
import { users } from "@/db/schema/auth";
import type { IReview } from "./types";

type ReviewAuthor = { avatarUrl: string | null; avatarPosition: unknown } | null;

function toIReview(row: Review, author: ReviewAuthor = null): IReview {
  return {
    _id: row.id,
    storeId: row.storeId,
    productId: row.productId,
    userId: row.userId,
    rating: row.rating,
    title: row.title ?? "",
    comment: row.comment ?? "",
    images: row.images ?? [],
    reviewerName: row.reviewerName ?? "",
    reviewerAvatarUrl: author?.avatarUrl ?? null,
    reviewerAvatarPosition: (author?.avatarPosition as IReview["reviewerAvatarPosition"]) ?? null,
    isApproved: row.isApproved,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInsert(data: Partial<IReview>): typeof reviews.$inferInsert {
  const { _id, createdAt, updatedAt, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  return rest as typeof reviews.$inferInsert;
}

export const ReviewRepository = {
  async create(data: Partial<IReview>): Promise<IReview> {
    const [row] = await db.insert(reviews).values(toInsert(data)).returning();
    return toIReview(row);
  },

  async findApprovedByProduct(
    storeId: string,
    productId: string,
    { page, limit }: { page: number; limit: number },
  ): Promise<{ reviews: IReview[]; total: number }> {
    const where = and(
      eq(reviews.storeId, storeId),
      eq(reviews.productId, productId),
      eq(reviews.isApproved, true),
    );
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          review: reviews,
          avatarUrl: users.avatarUrl,
          avatarPosition: users.avatarPosition,
        })
        .from(reviews)
        .leftJoin(users, eq(users.id, reviews.userId))
        .where(where)
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(skip),
      db.select({ total: count() }).from(reviews).where(where),
    ]);
    return {
      reviews: rows.map((r) =>
        toIReview(r.review, { avatarUrl: r.avatarUrl, avatarPosition: r.avatarPosition }),
      ),
      total: Number(total),
    };
  },

  async findByUserAndProduct(
    storeId: string,
    userId: string,
    productId: string,
  ): Promise<IReview | null> {
    const [row] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.storeId, storeId),
          eq(reviews.userId, userId),
          eq(reviews.productId, productId),
        ),
      )
      .limit(1);
    return row ? toIReview(row) : null;
  },

  async findByStore(
    storeId: string,
    { page, limit, isApproved }: { page: number; limit: number; isApproved?: boolean },
  ): Promise<{ reviews: IReview[]; total: number }> {
    const conds = [eq(reviews.storeId, storeId)];
    if (isApproved !== undefined) conds.push(eq(reviews.isApproved, isApproved));
    const where = and(...conds);
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(reviews).where(where).orderBy(desc(reviews.createdAt)).limit(limit).offset(skip),
      db.select({ total: count() }).from(reviews).where(where),
    ]);
    return { reviews: rows.map((row) => toIReview(row)), total: Number(total) };
  },

  async findById(id: string): Promise<IReview | null> {
    const [row] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    return row ? toIReview(row) : null;
  },

  async setApproved(id: string, isApproved: boolean): Promise<IReview | null> {
    const [row] = await db
      .update(reviews)
      .set({ isApproved, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return row ? toIReview(row) : null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning({ id: reviews.id });
    return result.length > 0;
  },

  async getProductRatingStats(
    storeId: string,
    productId: string,
  ): Promise<{ averageRating: number; reviewCount: number }> {
    const [row] = await db
      .select({ avg: avg(reviews.rating), cnt: count() })
      .from(reviews)
      .where(
        and(
          eq(reviews.storeId, storeId),
          eq(reviews.productId, productId),
          eq(reviews.isApproved, true),
        ),
      );
    const avgValue = Number(row?.avg ?? 0);
    const cnt = Number(row?.cnt ?? 0);
    if (cnt === 0) return { averageRating: 0, reviewCount: 0 };
    return {
      averageRating: Math.round(avgValue * 10) / 10,
      reviewCount: cnt,
    };
  },
};

void sql;

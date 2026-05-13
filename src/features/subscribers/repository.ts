import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { subscribers, type Subscriber } from "@/db/schema/subscribers";
import type { ISubscriber } from "./types";

function toISubscriber(row: Subscriber): ISubscriber {
  return {
    _id: row.id,
    storeId: row.storeId,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    status: row.status as "subscribed" | "unsubscribed",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const SubscriberRepository = {
  async findByStoreAndEmail(storeId: string, email: string): Promise<ISubscriber | null> {
    const [row] = await db
      .select()
      .from(subscribers)
      .where(and(eq(subscribers.storeId, storeId), eq(subscribers.email, email)))
      .limit(1);
    return row ? toISubscriber(row) : null;
  },

  async findByStoreAndPhone(storeId: string, phone: string): Promise<ISubscriber | null> {
    const [row] = await db
      .select()
      .from(subscribers)
      .where(and(eq(subscribers.storeId, storeId), eq(subscribers.phone, phone)))
      .limit(1);
    return row ? toISubscriber(row) : null;
  },

  async findEmailSubscribersByStore(storeId: string): Promise<ISubscriber[]> {
    const rows = await db
      .select()
      .from(subscribers)
      .where(
        and(
          eq(subscribers.storeId, storeId),
          eq(subscribers.status, "subscribed"),
          isNotNull(subscribers.email),
          sql`${subscribers.email} <> ''`,
        ),
      );
    return rows.map(toISubscriber);
  },

  async create(data: { storeId: string; email?: string; phone?: string }): Promise<ISubscriber> {
    const [row] = await db.insert(subscribers).values(data).returning();
    return toISubscriber(row);
  },

  async updateStatus(
    id: string,
    status: "subscribed" | "unsubscribed",
  ): Promise<ISubscriber | null> {
    const [row] = await db
      .update(subscribers)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscribers.id, id))
      .returning();
    return row ? toISubscriber(row) : null;
  },
};

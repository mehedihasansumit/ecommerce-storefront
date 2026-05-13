import { and, asc, count, desc, eq, ilike, inArray, isNotNull, ne, or, sql, sum, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  orders,
  orderItems,
  orderStatusHistory,
  orderRefunds,
  type Order,
  type OrderItem,
  type OrderStatusHistory,
  type OrderRefund,
} from "@/db/schema/orders";
import type {
  IOrder,
  IOrderItem,
  IRefundRequest,
  IShippingAddress,
  IStatusHistoryEntry,
  OrderStatus,
  PaymentStatus,
  RefundRequestStatus,
} from "./types";
import { normalizePhone } from "@/shared/lib/phone";

function toIItem(row: OrderItem): IOrderItem {
  return {
    productId: row.productId,
    variantId: row.variantId ?? undefined,
    productName: row.productName,
    productSlug: row.productSlug,
    variantSelections: (row.variantSelections as Record<string, string>) ?? {},
    quantity: row.quantity,
    unitPrice: Number(row.unitPrice),
    totalPrice: Number(row.totalPrice),
  };
}

function toIHistory(row: OrderStatusHistory): IStatusHistoryEntry {
  return {
    status: row.status as OrderStatus,
    changedAt: row.changedAt,
    note: row.note ?? "",
  };
}

function toIRefund(row: OrderRefund): IRefundRequest {
  return {
    status: row.status as RefundRequestStatus,
    reason: row.reason ?? "",
    requestedAt: row.requestedAt,
    adminNote: row.adminNote ?? "",
    reviewedAt: row.reviewedAt ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    refundAmount: Number(row.refundAmount ?? 0),
    gatewayRefundId: row.gatewayRefundId ?? "",
    processedAt: row.processedAt ?? undefined,
  };
}

function toIOrder(
  row: Order,
  items: OrderItem[],
  history: OrderStatusHistory[],
  refund: OrderRefund | undefined,
): IOrder {
  return {
    _id: row.id,
    storeId: row.storeId,
    orderNumber: row.orderNumber,
    userId: row.userId,
    guestPhone: row.guestPhone ?? undefined,
    guestEmail: row.guestEmail ?? undefined,
    items: items.map(toIItem),
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shippingCost),
    tax: Number(row.tax),
    discount: Number(row.discount),
    couponCode: row.couponCode ?? "",
    total: Number(row.total),
    shippingAddress: row.shippingAddress as IShippingAddress,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus as PaymentStatus,
    paymentIntentId: row.paymentIntentId ?? "",
    status: row.status as OrderStatus,
    statusHistory: history.map(toIHistory),
    refundRequest: refund ? toIRefund(refund) : undefined,
    notes: row.notes ?? "",
    clientIp: row.clientIp ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function hydrateMany(rows: Order[]): Promise<IOrder[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [items, history, refunds] = await Promise.all([
    db.select().from(orderItems).where(inArray(orderItems.orderId, ids)),
    db
      .select()
      .from(orderStatusHistory)
      .where(inArray(orderStatusHistory.orderId, ids))
      .orderBy(asc(orderStatusHistory.changedAt)),
    db.select().from(orderRefunds).where(inArray(orderRefunds.orderId, ids)),
  ]);
  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const it of items) {
    if (!itemsByOrder.has(it.orderId)) itemsByOrder.set(it.orderId, []);
    itemsByOrder.get(it.orderId)!.push(it);
  }
  const historyByOrder = new Map<string, OrderStatusHistory[]>();
  for (const h of history) {
    if (!historyByOrder.has(h.orderId)) historyByOrder.set(h.orderId, []);
    historyByOrder.get(h.orderId)!.push(h);
  }
  const refundByOrder = new Map<string, OrderRefund>();
  for (const r of refunds) refundByOrder.set(r.orderId, r);

  return rows.map((r) =>
    toIOrder(
      r,
      itemsByOrder.get(r.id) ?? [],
      historyByOrder.get(r.id) ?? [],
      refundByOrder.get(r.id),
    ),
  );
}

async function hydrateOne(row: Order | undefined): Promise<IOrder | null> {
  if (!row) return null;
  const [out] = await hydrateMany([row]);
  return out ?? null;
}

function orderInsert(data: Partial<IOrder>): typeof orders.$inferInsert {
  const {
    _id,
    createdAt,
    updatedAt,
    items,
    statusHistory,
    refundRequest,
    subtotal,
    shippingCost,
    tax,
    discount,
    total,
    ...rest
  } = data;
  void _id;
  void createdAt;
  void updatedAt;
  void items;
  void statusHistory;
  void refundRequest;
  const out: Record<string, unknown> = { ...rest };
  if (subtotal !== undefined) out.subtotal = String(subtotal);
  if (shippingCost !== undefined) out.shippingCost = String(shippingCost);
  if (tax !== undefined) out.tax = String(tax);
  if (discount !== undefined) out.discount = String(discount);
  if (total !== undefined) out.total = String(total);
  return out as typeof orders.$inferInsert;
}

function searchClause(search: string): SQL {
  const term = `%${search}%`;
  return or(
    ilike(orders.orderNumber, term),
    ilike(orders.guestPhone, term),
    ilike(orders.guestEmail, term),
    sql`${orders.shippingAddress}->>'name' ILIKE ${term}`,
    sql`${orders.shippingAddress}->>'phone' ILIKE ${term}`,
  )!;
}

export const OrderRepository = {
  async create(data: Partial<IOrder>): Promise<IOrder> {
    return db.transaction(async (tx) => {
      const [row] = await tx.insert(orders).values(orderInsert(data)).returning();
      const items = data.items ?? [];
      if (items.length > 0) {
        await tx.insert(orderItems).values(
          items.map((i) => ({
            orderId: row.id,
            productId: i.productId,
            variantId: i.variantId ?? null,
            productName: i.productName,
            productSlug: i.productSlug,
            variantSelections: i.variantSelections,
            quantity: i.quantity,
            unitPrice: String(i.unitPrice),
            totalPrice: String(i.totalPrice),
          })),
        );
      }
      await tx.insert(orderStatusHistory).values({
        orderId: row.id,
        status: row.status,
        note: "",
        changedAt: new Date(),
      });
      const out = await (async () => {
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, row.id));
        const history = await tx
          .select()
          .from(orderStatusHistory)
          .where(eq(orderStatusHistory.orderId, row.id))
          .orderBy(asc(orderStatusHistory.changedAt));
        return toIOrder(row, items, history, undefined);
      })();
      return out;
    });
  },

  async findById(id: string): Promise<IOrder | null> {
    const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return hydrateOne(row);
  },

  async findByOrderNumber(storeId: string, orderNumber: string): Promise<IOrder | null> {
    const [row] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.storeId, storeId), eq(orders.orderNumber, orderNumber)))
      .limit(1);
    return hydrateOne(row);
  },

  async findByStore(
    storeId: string,
    {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      search,
    }: {
      page?: number;
      limit?: number;
      status?: string;
      paymentStatus?: string;
      search?: string;
    } = {},
  ): Promise<{ orders: IOrder[]; total: number }> {
    const conds: SQL[] = [eq(orders.storeId, storeId)];
    if (status) conds.push(eq(orders.status, status));
    if (paymentStatus) conds.push(eq(orders.paymentStatus, paymentStatus));
    if (search) conds.push(searchClause(search));
    const where = and(...conds);
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(skip),
      db.select({ total: count() }).from(orders).where(where),
    ]);
    const hydrated = await hydrateMany(rows);
    return { orders: hydrated, total: Number(total) };
  },

  async findAll({
    offset = 0,
    limit = 20,
    status,
    paymentStatus,
    storeId,
  }: {
    offset?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    storeId?: string;
  } = {}): Promise<{ orders: IOrder[]; total: number }> {
    const conds: SQL[] = [];
    if (status) conds.push(eq(orders.status, status));
    if (paymentStatus) conds.push(eq(orders.paymentStatus, paymentStatus));
    if (storeId) conds.push(eq(orders.storeId, storeId));
    const where = conds.length ? and(...conds) : undefined;
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
      db.select({ total: count() }).from(orders).where(where),
    ]);
    return { orders: await hydrateMany(rows), total: Number(total) };
  },

  async findByUser(storeId: string, userId: string): Promise<IOrder[]> {
    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.storeId, storeId), eq(orders.userId, userId)))
      .orderBy(desc(orders.createdAt));
    return hydrateMany(rows);
  },

  async findByPhone(storeId: string, phone: string): Promise<IOrder[]> {
    const normalized = normalizePhone(phone);
    const withoutPlus = normalized.replace(/^\+/, "");
    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.storeId, storeId), inArray(orders.guestPhone, [normalized, withoutPlus])))
      .orderBy(desc(orders.createdAt));
    return hydrateMany(rows);
  },

  async findByPhonePaginated(
    storeId: string,
    phone: string,
    { skip = 0, limit = 10 }: { skip?: number; limit?: number } = {},
  ): Promise<{ orders: IOrder[]; total: number }> {
    const normalized = normalizePhone(phone);
    const withoutPlus = normalized.replace(/^\+/, "");
    const where = and(
      eq(orders.storeId, storeId),
      inArray(orders.guestPhone, [normalized, withoutPlus]),
    );
    const [rows, [{ total }]] = await Promise.all([
      db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(limit).offset(skip),
      db.select({ total: count() }).from(orders).where(where),
    ]);
    return { orders: await hydrateMany(rows), total: Number(total) };
  },

  async findByIp(storeId: string, clientIp: string, excludeOrderId?: string): Promise<IOrder[]> {
    const conds: SQL[] = [eq(orders.storeId, storeId), eq(orders.clientIp, clientIp)];
    if (excludeOrderId) conds.push(ne(orders.id, excludeOrderId));
    const rows = await db
      .select()
      .from(orders)
      .where(and(...conds))
      .orderBy(desc(orders.createdAt))
      .limit(20);
    return hydrateMany(rows);
  },

  async countByStore(storeId: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.storeId, storeId));
    return Number(total);
  },

  async getPaymentStats(storeId: string): Promise<{
    paid: number;
    pending: number;
    failed: number;
    refunded: number;
    totalRevenue: number;
  }> {
    const rows = await db
      .select({
        status: orders.paymentStatus,
        cnt: count(),
        amount: sum(orders.total),
      })
      .from(orders)
      .where(eq(orders.storeId, storeId))
      .groupBy(orders.paymentStatus);
    const stats = { paid: 0, pending: 0, failed: 0, refunded: 0, totalRevenue: 0 };
    for (const r of rows) {
      const key = r.status as keyof typeof stats;
      if (key in stats && key !== "totalRevenue") stats[key] = Number(r.cnt);
      if (r.status === "paid") stats.totalRevenue = Number(r.amount ?? 0);
    }
    return stats;
  },

  async getCustomerOrderStats(
    storeId: string,
  ): Promise<{ userId: string; orderCount: number; totalSpent: number; lastOrderAt: string }[]> {
    const rows = await db
      .select({
        userId: orders.userId,
        orderCount: count(),
        totalSpent: sum(orders.total),
        lastOrderAt: sql<Date>`MAX(${orders.createdAt})`,
      })
      .from(orders)
      .where(and(eq(orders.storeId, storeId), isNotNull(orders.userId)))
      .groupBy(orders.userId);
    return rows.map((r) => ({
      userId: r.userId!,
      orderCount: Number(r.orderCount),
      totalSpent: Number(r.totalSpent ?? 0),
      lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : "",
    }));
  },

  async updatePaymentStatus(id: string, paymentStatus: string): Promise<IOrder | null> {
    const [row] = await db
      .update(orders)
      .set({ paymentStatus, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return hydrateOne(row);
  },

  async applyDiscount(id: string, discount: number): Promise<IOrder | null> {
    return db.transaction(async (tx) => {
      const [order] = await tx.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!order) return null;
      const newTotal = Math.max(
        0,
        Number(order.subtotal) + Number(order.shippingCost) + Number(order.tax) - discount,
      );
      const [updated] = await tx
        .update(orders)
        .set({ discount: String(discount), total: String(newTotal), updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      return hydrateOne(updated);
    });
  },

  async updateStatus(id: string, status: string, note = ""): Promise<IOrder | null> {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning();
      if (!row) return null;
      await tx.insert(orderStatusHistory).values({
        orderId: row.id,
        status,
        note,
        changedAt: new Date(),
      });
      return hydrateOne(row);
    });
  },

  async createRefundRequest(
    orderId: string,
    data: { reason: string; refundAmount: number; requestedAt: Date },
  ): Promise<IOrder | null> {
    await db
      .insert(orderRefunds)
      .values({
        orderId,
        status: "pending",
        reason: data.reason,
        refundAmount: String(data.refundAmount),
        requestedAt: data.requestedAt,
        adminNote: "",
        gatewayRefundId: "",
      })
      .onConflictDoUpdate({
        target: orderRefunds.orderId,
        set: {
          status: "pending",
          reason: data.reason,
          refundAmount: String(data.refundAmount),
          requestedAt: data.requestedAt,
          adminNote: "",
          gatewayRefundId: "",
          reviewedAt: null,
          reviewedBy: null,
          processedAt: null,
          updatedAt: new Date(),
        },
      });
    const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return hydrateOne(row);
  },

  async reviewRefundRequest(
    orderId: string,
    data: {
      status: RefundRequestStatus;
      adminNote?: string;
      reviewedBy: string;
      reviewedAt: Date;
      refundAmount: number;
      processedAt?: Date;
      gatewayRefundId?: string;
    },
  ): Promise<IOrder | null> {
    return db.transaction(async (tx) => {
      const set: Record<string, unknown> = {
        status: data.status,
        adminNote: data.adminNote ?? "",
        reviewedBy: data.reviewedBy,
        reviewedAt: data.reviewedAt,
        refundAmount: String(data.refundAmount),
        updatedAt: new Date(),
      };
      if (data.status === "processed") {
        set.processedAt = data.processedAt ?? new Date();
        set.gatewayRefundId = data.gatewayRefundId ?? "";
      }
      await tx.update(orderRefunds).set(set).where(eq(orderRefunds.orderId, orderId));
      if (data.status === "processed") {
        await tx
          .update(orders)
          .set({ paymentStatus: "refunded", updatedAt: new Date() })
          .where(eq(orders.id, orderId));
      }
      const [row] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      return hydrateOne(row);
    });
  },

  async findByStoreWithRefundRequests(
    storeId: string,
    {
      status,
      page = 1,
      limit = 20,
    }: { status?: RefundRequestStatus; page?: number; limit?: number } = {},
  ): Promise<{ orders: IOrder[]; total: number }> {
    const refundConds: SQL[] = [];
    if (status) refundConds.push(eq(orderRefunds.status, status));
    const where = and(
      eq(orders.storeId, storeId),
      isNotNull(orderRefunds.orderId),
      ...(refundConds.length ? refundConds : []),
    );
    const skip = (page - 1) * limit;
    const [rows, [{ total }]] = await Promise.all([
      db
        .select({ order: orders })
        .from(orders)
        .innerJoin(orderRefunds, eq(orderRefunds.orderId, orders.id))
        .where(where)
        .orderBy(desc(orderRefunds.requestedAt))
        .limit(limit)
        .offset(skip),
      db
        .select({ total: count() })
        .from(orders)
        .innerJoin(orderRefunds, eq(orderRefunds.orderId, orders.id))
        .where(where),
    ]);
    return {
      orders: await hydrateMany(rows.map((r) => r.order)),
      total: Number(total),
    };
  },

  async userHasPurchased(storeId: string, userId: string, productId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.storeId, storeId),
          eq(orders.userId, userId),
          ne(orders.status, "cancelled"),
          eq(orderItems.productId, productId),
        ),
      )
      .limit(1);
    return row !== undefined;
  },

  async cancelRefundRequest(orderId: string): Promise<IOrder | null> {
    await db.delete(orderRefunds).where(eq(orderRefunds.orderId, orderId));
    const [row] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    return hydrateOne(row);
  },
};

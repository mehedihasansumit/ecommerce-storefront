import { and, asc, count, desc, eq, gte, ilike, inArray, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { users, addresses, adminUsers, type User, type Address, type AdminUser } from "@/db/schema/auth";
import type {
  IAddress,
  IAdminUser,
  IAvatarPosition,
  INotificationPreferences,
  IUser,
} from "./types";

const DEFAULT_AVATAR_POSITION: IAvatarPosition = { x: 50, y: 50, zoom: 1 };

function toIAddress(row: Address): IAddress {
  return {
    _id: row.id,
    label: row.label ?? "",
    street: row.street,
    city: row.city,
    state: row.state ?? "",
    postalCode: row.postalCode ?? "",
    country: row.country,
    isDefault: row.isDefault,
  };
}

function toIUser(row: User, addressList: Address[]): IUser {
  return {
    _id: row.id,
    storeId: row.storeId,
    name: row.name ?? "",
    email: row.email,
    passwordHash: row.passwordHash,
    phone: row.phone ?? "",
    avatarUrl: row.avatarUrl ?? null,
    avatarPosition: (row.avatarPosition as IAvatarPosition) ?? DEFAULT_AVATAR_POSITION,
    addresses: addressList.map(toIAddress),
    isActive: row.isActive,
    points: row.points,
    notificationPreferences: row.notificationPreferences as INotificationPreferences,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toIAdmin(row: AdminUser): IAdminUser {
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    roleId: row.roleId,
    assignedStores: row.assignedStores,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function loadAddresses(userIds: string[]): Promise<Map<string, Address[]>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(addresses)
    .where(inArray(addresses.userId, userIds))
    .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));
  const byUser = new Map<string, Address[]>();
  for (const row of rows) {
    if (!byUser.has(row.userId)) byUser.set(row.userId, []);
    byUser.get(row.userId)!.push(row);
  }
  return byUser;
}

async function hydrateUser(row: User | undefined): Promise<IUser | null> {
  if (!row) return null;
  const addrs = (await loadAddresses([row.id])).get(row.id) ?? [];
  return toIUser(row, addrs);
}

async function hydrateUsers(rows: User[]): Promise<IUser[]> {
  if (rows.length === 0) return [];
  const map = await loadAddresses(rows.map((r) => r.id));
  return rows.map((r) => toIUser(r, map.get(r.id) ?? []));
}

function customerSearchClause(search: string): SQL {
  const term = `%${search}%`;
  return or(ilike(users.name, term), ilike(users.email, term), ilike(users.phone, term))!;
}

function userInsert(data: Partial<IUser>): typeof users.$inferInsert {
  const { _id, createdAt, updatedAt, addresses: _addrs, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  void _addrs;
  return rest as typeof users.$inferInsert;
}

function adminInsert(data: Partial<IAdminUser>): typeof adminUsers.$inferInsert {
  const { _id, createdAt, updatedAt, ...rest } = data;
  void _id;
  void createdAt;
  void updatedAt;
  return rest as typeof adminUsers.$inferInsert;
}

export const AuthRepository = {
  async findUserByEmail(storeId: string, email: string): Promise<IUser | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(and(eq(users.storeId, storeId), eq(users.email, email)))
      .limit(1);
    return hydrateUser(row);
  },

  async findUserByPhone(storeId: string, phone: string): Promise<IUser | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(and(eq(users.storeId, storeId), eq(users.phone, phone)))
      .limit(1);
    return hydrateUser(row);
  },

  async findUserById(id: string): Promise<IUser | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return hydrateUser(row);
  },

  async createUser(data: Partial<IUser>): Promise<IUser> {
    const [row] = await db.insert(users).values(userInsert(data)).returning();
    return toIUser(row, []);
  },

  async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    const [row] = await db
      .update(users)
      .set({ ...userInsert(data), updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return hydrateUser(row);
  },

  async findAdminByEmail(email: string): Promise<IAdminUser | null> {
    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
    return row ? toIAdmin(row) : null;
  },

  async findAdminById(id: string): Promise<IAdminUser | null> {
    const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
    return row ? toIAdmin(row) : null;
  },

  async createAdmin(data: Partial<IAdminUser>): Promise<IAdminUser> {
    const [row] = await db.insert(adminUsers).values(adminInsert(data)).returning();
    return toIAdmin(row);
  },

  async findAllAdmins(): Promise<IAdminUser[]> {
    const rows = await db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt));
    return rows.map(toIAdmin);
  },

  async updateAdmin(id: string, data: Partial<IAdminUser>): Promise<IAdminUser | null> {
    const insert = adminInsert(data);
    const [row] = await db
      .update(adminUsers)
      .set({ ...insert, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return row ? toIAdmin(row) : null;
  },

  async deleteAdmin(id: string): Promise<boolean> {
    const result = await db
      .delete(adminUsers)
      .where(eq(adminUsers.id, id))
      .returning({ id: adminUsers.id });
    return result.length > 0;
  },

  async findCustomersByStore(
    storeId: string,
    {
      skip = 0,
      limit = 20,
      search,
      status,
    }: { skip?: number; limit?: number; search?: string; status?: "active" | "inactive" | "all" } = {},
  ): Promise<IUser[]> {
    const conds: SQL[] = [eq(users.storeId, storeId)];
    if (status === "active") conds.push(eq(users.isActive, true));
    else if (status === "inactive") conds.push(eq(users.isActive, false));
    if (search) conds.push(customerSearchClause(search));

    const rows = await db
      .select()
      .from(users)
      .where(and(...conds))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(skip);
    return hydrateUsers(rows);
  },

  async countCustomersByStore(
    storeId: string,
    { search, status }: { search?: string; status?: "active" | "inactive" | "all" } = {},
  ): Promise<number> {
    const conds: SQL[] = [eq(users.storeId, storeId)];
    if (status === "active") conds.push(eq(users.isActive, true));
    else if (status === "inactive") conds.push(eq(users.isActive, false));
    if (search) conds.push(customerSearchClause(search));
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(...conds));
    return Number(total);
  },

  async findAllCustomers({
    skip = 0,
    limit = 20,
    storeId,
    isActive,
  }: { skip?: number; limit?: number; storeId?: string; isActive?: boolean } = {}): Promise<IUser[]> {
    const conds: SQL[] = [];
    if (storeId) conds.push(eq(users.storeId, storeId));
    if (isActive !== undefined) conds.push(eq(users.isActive, isActive));
    const rows = await db
      .select()
      .from(users)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(skip);
    return hydrateUsers(rows);
  },

  async countAllCustomers(storeId?: string, isActive?: boolean): Promise<number> {
    const conds: SQL[] = [];
    if (storeId) conds.push(eq(users.storeId, storeId));
    if (isActive !== undefined) conds.push(eq(users.isActive, isActive));
    const [{ total }] = await db
      .select({ total: count() })
      .from(users)
      .where(conds.length ? and(...conds) : undefined);
    return Number(total);
  },

  async addAddress(
    storeId: string,
    userId: string,
    address: Omit<IAddress, "_id">,
  ): Promise<IUser | null> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.storeId, storeId)))
        .limit(1);
      if (!user) return null;

      const existing = await tx.select().from(addresses).where(eq(addresses.userId, userId));
      const shouldBeDefault = address.isDefault || existing.length === 0;
      if (shouldBeDefault) {
        await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
      }
      await tx.insert(addresses).values({
        userId,
        label: address.label || null,
        street: address.street,
        city: address.city,
        state: address.state || null,
        postalCode: address.postalCode || null,
        country: address.country,
        isDefault: shouldBeDefault,
      });
      await tx.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId));

      const updated = await tx
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));
      return toIUser(user, updated);
    });
  },

  async updateAddress(
    storeId: string,
    userId: string,
    addressId: string,
    updates: Partial<Omit<IAddress, "_id">>,
  ): Promise<IUser | null> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.storeId, storeId)))
        .limit(1);
      if (!user) return null;

      if (updates.isDefault) {
        await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
      }
      const setObj: Record<string, unknown> = {};
      if (updates.label !== undefined) setObj.label = updates.label || null;
      if (updates.street !== undefined) setObj.street = updates.street;
      if (updates.city !== undefined) setObj.city = updates.city;
      if (updates.state !== undefined) setObj.state = updates.state || null;
      if (updates.postalCode !== undefined) setObj.postalCode = updates.postalCode || null;
      if (updates.country !== undefined) setObj.country = updates.country;
      if (updates.isDefault !== undefined) setObj.isDefault = updates.isDefault;
      setObj.updatedAt = new Date();

      await tx
        .update(addresses)
        .set(setObj)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      const refreshed = await tx
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));
      return toIUser(user, refreshed);
    });
  },

  async removeAddress(storeId: string, userId: string, addressId: string): Promise<IUser | null> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.storeId, storeId)))
        .limit(1);
      if (!user) return null;

      const [target] = await tx
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
        .limit(1);
      const wasDefault = !!target?.isDefault;

      await tx
        .delete(addresses)
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      if (wasDefault) {
        const remaining = await tx
          .select()
          .from(addresses)
          .where(eq(addresses.userId, userId))
          .orderBy(asc(addresses.createdAt))
          .limit(1);
        if (remaining[0]) {
          await tx
            .update(addresses)
            .set({ isDefault: true })
            .where(eq(addresses.id, remaining[0].id));
        }
      }
      const refreshed = await tx
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));
      return toIUser(user, refreshed);
    });
  },

  async incrementPoints(userId: string, storeId: string, amount: number): Promise<void> {
    await db
      .update(users)
      .set({ points: sql`${users.points} + ${amount}`, updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.storeId, storeId)));
  },

  async findCustomersByPoints(
    storeId: string,
    {
      skip = 0,
      limit = 20,
      search,
      minPoints,
    }: { skip?: number; limit?: number; search?: string; minPoints?: number } = {},
  ): Promise<IUser[]> {
    const conds: SQL[] = [eq(users.storeId, storeId)];
    if (minPoints !== undefined) conds.push(gte(users.points, minPoints));
    if (search) conds.push(customerSearchClause(search));
    const rows = await db
      .select()
      .from(users)
      .where(and(...conds))
      .orderBy(desc(users.points), desc(users.createdAt))
      .limit(limit)
      .offset(skip);
    return hydrateUsers(rows);
  },

  async countCustomersByPoints(
    storeId: string,
    { search, minPoints }: { search?: string; minPoints?: number } = {},
  ): Promise<number> {
    const conds: SQL[] = [eq(users.storeId, storeId)];
    if (minPoints !== undefined) conds.push(gte(users.points, minPoints));
    if (search) conds.push(customerSearchClause(search));
    const [{ total }] = await db.select({ total: count() }).from(users).where(and(...conds));
    return Number(total);
  },

  async findUsersByIds(userIds: string[]): Promise<IUser[]> {
    if (userIds.length === 0) return [];
    const rows = await db.select().from(users).where(inArray(users.id, userIds));
    return hydrateUsers(rows);
  },

  async countAdminsByRoleId(roleId: string): Promise<number> {
    const [{ total }] = await db
      .select({ total: count() })
      .from(adminUsers)
      .where(eq(adminUsers.roleId, roleId));
    return Number(total);
  },

  async setDefaultAddress(storeId: string, userId: string, addressId: string): Promise<IUser | null> {
    return db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.storeId, storeId)))
        .limit(1);
      if (!user) return null;

      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, userId), ne(addresses.id, addressId)));
      await tx
        .update(addresses)
        .set({ isDefault: true })
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

      const refreshed = await tx
        .select()
        .from(addresses)
        .where(eq(addresses.userId, userId))
        .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));
      return toIUser(user, refreshed);
    });
  },
};

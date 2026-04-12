import dbConnect from "@/shared/lib/db";
import { UserModel, AdminUserModel } from "./model";
import type { IUser, IAdminUser, IAddress } from "./types";

function serializeUser(doc: unknown): IUser {
  return JSON.parse(JSON.stringify(doc));
}

function serializeAdmin(doc: unknown): IAdminUser {
  return JSON.parse(JSON.stringify(doc));
}

export const AuthRepository = {
  async findUserByEmail(storeId: string, email: string): Promise<IUser | null> {
    await dbConnect();
    const user = await UserModel.findOne({ storeId, email }).lean();
    return user ? serializeUser(user) : null;
  },

  async findUserByPhone(storeId: string, phone: string): Promise<IUser | null> {
    await dbConnect();
    const user = await UserModel.findOne({ storeId, phone }).lean();
    return user ? serializeUser(user) : null;
  },

  async findUserById(id: string): Promise<IUser | null> {
    await dbConnect();
    const user = await UserModel.findById(id).lean();
    return user ? serializeUser(user) : null;
  },

  async createUser(data: Partial<IUser>): Promise<IUser> {
    await dbConnect();
    const user = await UserModel.create(data);
    return serializeUser(user.toObject());
  },

  async findAdminByEmail(email: string): Promise<IAdminUser | null> {
    await dbConnect();
    const admin = await AdminUserModel.findOne({ email }).lean();
    return admin ? serializeAdmin(admin) : null;
  },

  async findAdminById(id: string): Promise<IAdminUser | null> {
    await dbConnect();
    const admin = await AdminUserModel.findById(id).lean();
    return admin ? serializeAdmin(admin) : null;
  },

  async createAdmin(data: Partial<IAdminUser>): Promise<IAdminUser> {
    await dbConnect();
    const admin = await AdminUserModel.create(data);
    return serializeAdmin(admin.toObject());
  },

  async findAllAdmins(): Promise<IAdminUser[]> {
    await dbConnect();
    const admins = await AdminUserModel.find().sort({ createdAt: -1 }).lean();
    return admins.map(serializeAdmin);
  },

  async updateAdmin(id: string, data: Partial<IAdminUser>): Promise<IAdminUser | null> {
    await dbConnect();
    const admin = await AdminUserModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return admin ? serializeAdmin(admin) : null;
  },

  async deleteAdmin(id: string): Promise<boolean> {
    await dbConnect();
    const result = await AdminUserModel.findByIdAndDelete(id);
    return !!result;
  },

  async findCustomersByStore(
    storeId: string,
    {
      skip = 0,
      limit = 20,
      search,
      status,
    }: {
      skip?: number;
      limit?: number;
      search?: string;
      status?: "active" | "inactive" | "all";
    } = {}
  ): Promise<IUser[]> {
    await dbConnect();
    const filter: Record<string, unknown> = { storeId };
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;
    if (search) {
      const re = { $regex: search, $options: "i" };
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }
    const users = await UserModel.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return users.map(serializeUser);
  },

  async countCustomersByStore(
    storeId: string,
    {
      search,
      status,
    }: { search?: string; status?: "active" | "inactive" | "all" } = {}
  ): Promise<number> {
    await dbConnect();
    const filter: Record<string, unknown> = { storeId };
    if (status === "active") filter.isActive = true;
    else if (status === "inactive") filter.isActive = false;
    if (search) {
      const re = { $regex: search, $options: "i" };
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }
    return UserModel.countDocuments(filter);
  },

  async findAllCustomers(
    { skip = 0, limit = 20, storeId, isActive }: { skip?: number; limit?: number; storeId?: string; isActive?: boolean } = {}
  ): Promise<IUser[]> {
    await dbConnect();
    const filter: Record<string, unknown> = {};
    if (storeId) filter.storeId = storeId;
    if (isActive !== undefined) filter.isActive = isActive;
    const users = await UserModel.find(filter)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return users.map(serializeUser);
  },

  async countAllCustomers(storeId?: string, isActive?: boolean): Promise<number> {
    await dbConnect();
    const filter: Record<string, unknown> = {};
    if (storeId) filter.storeId = storeId;
    if (isActive !== undefined) filter.isActive = isActive;
    return UserModel.countDocuments(filter);
  },

  async addAddress(
    storeId: string,
    userId: string,
    address: Omit<IAddress, "_id">
  ): Promise<IUser | null> {
    await dbConnect();

    // If new address is default, unset all existing defaults first
    if (address.isDefault) {
      await UserModel.updateOne(
        { _id: userId, storeId },
        { $set: { "addresses.$[].isDefault": false } }
      );
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, storeId },
      { $push: { addresses: address } },
      { new: true }
    ).lean();

    if (!user) return null;

    // If this is the only address, force it as default
    if (user.addresses.length === 1) {
      const updated = await UserModel.findOneAndUpdate(
        { _id: userId, storeId },
        { $set: { "addresses.0.isDefault": true } },
        { new: true }
      ).lean();
      return updated ? serializeUser(updated) : null;
    }

    return serializeUser(user);
  },

  async updateAddress(
    storeId: string,
    userId: string,
    addressId: string,
    updates: Partial<Omit<IAddress, "_id">>
  ): Promise<IUser | null> {
    await dbConnect();

    // If setting as default, unset all others first
    if (updates.isDefault) {
      await UserModel.updateOne(
        { _id: userId, storeId },
        { $set: { "addresses.$[].isDefault": false } }
      );
    }

    // Build $set object dynamically
    const setFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      setFields[`addresses.$.${key}`] = value;
    }

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, storeId, "addresses._id": addressId },
      { $set: setFields },
      { new: true }
    ).lean();

    return user ? serializeUser(user) : null;
  },

  async removeAddress(
    storeId: string,
    userId: string,
    addressId: string
  ): Promise<IUser | null> {
    await dbConnect();

    // Check if the address being removed is the default
    const currentUser = await UserModel.findOne(
      { _id: userId, storeId, "addresses._id": addressId },
      { "addresses.$": 1 }
    ).lean();
    const wasDefault = currentUser?.addresses?.[0]?.isDefault;

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, storeId },
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    ).lean();

    if (!user) return null;

    // If deleted address was default and others remain, promote first
    if (wasDefault && user.addresses.length > 0) {
      const promoted = await UserModel.findOneAndUpdate(
        { _id: userId, storeId, "addresses._id": user.addresses[0]._id },
        { $set: { "addresses.$.isDefault": true } },
        { new: true }
      ).lean();
      return promoted ? serializeUser(promoted) : serializeUser(user);
    }

    return serializeUser(user);
  },

  async setDefaultAddress(
    storeId: string,
    userId: string,
    addressId: string
  ): Promise<IUser | null> {
    await dbConnect();

    const user = await UserModel.findOneAndUpdate(
      { _id: userId, storeId },
      {
        $set: {
          "addresses.$[all].isDefault": false,
          "addresses.$[target].isDefault": true,
        },
      },
      {
        arrayFilters: [
          { "all._id": { $ne: addressId } },
          { "target._id": addressId },
        ],
        new: true,
      }
    ).lean();

    return user ? serializeUser(user) : null;
  },
};

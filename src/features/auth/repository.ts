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

  async findCustomersByStore(storeId: string): Promise<IUser[]> {
    await dbConnect();
    const users = await UserModel.find({ storeId })
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();
    return users.map(serializeUser);
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

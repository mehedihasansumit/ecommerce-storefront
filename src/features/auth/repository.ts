import dbConnect from "@/shared/lib/db";
import { UserModel, AdminUserModel } from "./model";
import type { IUser, IAdminUser } from "./types";

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
};

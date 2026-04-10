import bcrypt from "bcryptjs";
import { AuthRepository } from "./repository";
import { signToken } from "@/shared/lib/auth";
import type { IUser, IAdminUser, IAddress, JwtCustomerPayload, JwtAdminPayload } from "./types";
import type { AddressInput } from "./schemas";

export const AuthService = {
  async registerCustomer(
    storeId: string,
    data: { name: string; email?: string; password: string; phone: string }
  ): Promise<{ user: Omit<IUser, "passwordHash">; token: string }> {
    // Check for duplicate email
    const email = data.email?.trim() ? data.email : "";
    if (email) {
      const existingEmail = await AuthRepository.findUserByEmail(storeId, email);
      if (existingEmail) {
        throw new Error("Email already registered");
      }
    }

    // Check for duplicate phone
    const existingPhone = await AuthRepository.findUserByPhone(storeId, data.phone);
    if (existingPhone) {
      throw new Error("Phone number already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await AuthRepository.createUser({
      storeId,
      name: data.name,
      email: email,
      passwordHash,
      phone: data.phone,
    });

    const payload: JwtCustomerPayload = {
      userId: user._id,
      storeId,
      email: user.email,
      type: "customer",
    };
    const token = await signToken(payload);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async loginCustomer(
    storeId: string,
    email: string,
    password: string
  ): Promise<{ user: Omit<IUser, "passwordHash">; token: string }> {
    const user = await AuthRepository.findUserByEmail(storeId, email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const payload: JwtCustomerPayload = {
      userId: user._id,
      storeId,
      email: user.email,
      type: "customer",
    };
    const token = await signToken(payload);

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  },

  async loginAdmin(
    email: string,
    password: string
  ): Promise<{ admin: Omit<IAdminUser, "passwordHash">; token: string }> {
    const admin = await AuthRepository.findAdminByEmail(email);
    if (!admin) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const payload: JwtAdminPayload = {
      adminId: admin._id,
      role: admin.role,
      type: "admin",
    };
    const token = await signToken(payload);

    const { passwordHash: _, ...safeAdmin } = admin;
    return { admin: safeAdmin, token };
  },

  async createAdmin(data: {
    name: string;
    email: string;
    password: string;
    role?: "superadmin" | "manager";
  }): Promise<IAdminUser> {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return AuthRepository.createAdmin({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || "manager",
    });
  },

  async getCustomersByStore(
    storeId: string,
    { page = 1, limit = 20 }: { page?: number; limit?: number } = {}
  ): Promise<{ customers: Omit<IUser, "passwordHash">[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      AuthRepository.findCustomersByStore(storeId, { skip, limit }),
      AuthRepository.countCustomersByStore(storeId),
    ]);
    return {
      customers: users.map(({ passwordHash: _, ...u }) => u),
      total,
    };
  },

  async getAllCustomers(
    { page = 1, limit = 20, storeId }: { page?: number; limit?: number; storeId?: string } = {}
  ): Promise<{ customers: Omit<IUser, "passwordHash">[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      AuthRepository.findAllCustomers({ skip, limit, storeId }),
      AuthRepository.countAllCustomers(storeId),
    ]);
    return {
      customers: users.map(({ passwordHash: _, ...u }) => u),
      total,
    };
  },

  async getAddresses(storeId: string, userId: string): Promise<IAddress[]> {
    const user = await AuthRepository.findUserById(userId);
    if (!user || user.storeId !== storeId) {
      throw new Error("User not found");
    }
    return user.addresses || [];
  },

  async addAddress(
    storeId: string,
    userId: string,
    data: AddressInput
  ): Promise<IAddress[]> {
    const user = await AuthRepository.findUserById(userId);
    if (!user || user.storeId !== storeId) {
      throw new Error("User not found");
    }
    if ((user.addresses || []).length >= 10) {
      throw new Error("Maximum 10 addresses allowed");
    }

    const updated = await AuthRepository.addAddress(storeId, userId, data);
    if (!updated) throw new Error("Failed to add address");
    return updated.addresses;
  },

  async updateAddress(
    storeId: string,
    userId: string,
    addressId: string,
    data: Partial<AddressInput>
  ): Promise<IAddress[]> {
    const updated = await AuthRepository.updateAddress(storeId, userId, addressId, data);
    if (!updated) throw new Error("Address not found");
    return updated.addresses;
  },

  async removeAddress(
    storeId: string,
    userId: string,
    addressId: string
  ): Promise<IAddress[]> {
    const updated = await AuthRepository.removeAddress(storeId, userId, addressId);
    if (!updated) throw new Error("Address not found");
    return updated.addresses;
  },

  async setDefaultAddress(
    storeId: string,
    userId: string,
    addressId: string
  ): Promise<IAddress[]> {
    const updated = await AuthRepository.setDefaultAddress(storeId, userId, addressId);
    if (!updated) throw new Error("Address not found");
    return updated.addresses;
  },
};

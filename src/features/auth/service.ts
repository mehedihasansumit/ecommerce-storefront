import bcrypt from "bcryptjs";
import { AuthRepository } from "./repository";
import { signToken } from "@/shared/lib/auth";
import type { IUser, IAdminUser, JwtCustomerPayload, JwtAdminPayload } from "./types";

export const AuthService = {
  async registerCustomer(
    storeId: string,
    data: { name: string; email: string; password: string; phone?: string }
  ): Promise<{ user: Omit<IUser, "passwordHash">; token: string }> {
    const existing = await AuthRepository.findUserByEmail(storeId, data.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await AuthRepository.createUser({
      storeId,
      name: data.name,
      email: data.email,
      passwordHash,
      phone: data.phone || "",
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
};

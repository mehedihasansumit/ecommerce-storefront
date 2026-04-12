import bcrypt from "bcryptjs";
import { AuthRepository } from "./repository";
import { signToken } from "@/shared/lib/auth";
import { RoleRepository } from "@/features/roles/repository";
import type { Permission } from "@/shared/lib/permissions";
import type { IUser, IAdminUser, IAdminUserWithRole, IAddress, JwtCustomerPayload, JwtAdminPayload } from "./types";
import type { AddressInput, CreateAdminInput, UpdateAdminInput } from "./schemas";

/** Populate the admin's role, returning IAdminUserWithRole */
async function populateRole(admin: IAdminUser): Promise<IAdminUserWithRole> {
  const role = await RoleRepository.findById(admin.roleId);
  if (!role) throw new Error("Admin's assigned role not found");
  return { ...admin, role };
}

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
  ): Promise<{ admin: Omit<IAdminUserWithRole, "passwordHash">; token: string }> {
    const admin = await AuthRepository.findAdminByEmail(email);
    if (!admin) {
      throw new Error("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    const adminWithRole = await populateRole(admin);

    const payload: JwtAdminPayload = {
      adminId: admin._id,
      roleId: admin.roleId,
      isSuperAdmin: adminWithRole.role.isSuperAdmin,
      permissions: adminWithRole.role.permissions as Permission[],
      assignedStores: admin.assignedStores ?? [],
      type: "admin",
    };
    const token = await signToken(payload);

    const { passwordHash: _, ...safeAdmin } = adminWithRole;
    return { admin: safeAdmin, token };
  },

  async createAdmin(data: CreateAdminInput): Promise<IAdminUser> {
    const existing = await AuthRepository.findAdminByEmail(data.email);
    if (existing) throw new Error("Email already in use");

    // Verify role exists
    const role = await RoleRepository.findById(data.roleId);
    if (!role) throw new Error("Selected role does not exist");

    const passwordHash = await bcrypt.hash(data.password, 12);

    return AuthRepository.createAdmin({
      name: data.name,
      email: data.email,
      passwordHash,
      roleId: data.roleId,
      assignedStores: role.isSuperAdmin ? [] : (data.assignedStores ?? []),
    });
  },

  async listAdmins(): Promise<Omit<IAdminUserWithRole, "passwordHash">[]> {
    const admins = await AuthRepository.findAllAdmins();
    const results: Omit<IAdminUserWithRole, "passwordHash">[] = [];
    for (const admin of admins) {
      const withRole = await populateRole(admin);
      const { passwordHash: _, ...safe } = withRole;
      results.push(safe);
    }
    return results;
  },

  async getAdminWithRole(id: string): Promise<IAdminUserWithRole | null> {
    const admin = await AuthRepository.findAdminById(id);
    if (!admin) return null;
    return populateRole(admin);
  },

  async updateAdmin(id: string, data: UpdateAdminInput): Promise<Omit<IAdminUserWithRole, "passwordHash">> {
    const updateData: Partial<IAdminUser> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.roleId !== undefined) {
      const role = await RoleRepository.findById(data.roleId);
      if (!role) throw new Error("Selected role does not exist");
      updateData.roleId = data.roleId;
      // Clear assignedStores if switching to a superadmin role
      if (role.isSuperAdmin) updateData.assignedStores = [];
    }
    if (data.assignedStores !== undefined) updateData.assignedStores = data.assignedStores;
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const updated = await AuthRepository.updateAdmin(id, updateData);
    if (!updated) throw new Error("Admin not found");
    const withRole = await populateRole(updated);
    const { passwordHash: _, ...safe } = withRole;
    return safe;
  },

  async deleteAdmin(id: string): Promise<void> {
    const deleted = await AuthRepository.deleteAdmin(id);
    if (!deleted) throw new Error("Admin not found");
  },

  async getCustomersByStore(
    storeId: string,
    {
      page = 1,
      limit = 20,
      search,
      status,
    }: {
      page?: number;
      limit?: number;
      search?: string;
      status?: "active" | "inactive" | "all";
    } = {}
  ): Promise<{ customers: Omit<IUser, "passwordHash">[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      AuthRepository.findCustomersByStore(storeId, { skip, limit, search, status }),
      AuthRepository.countCustomersByStore(storeId, { search, status }),
    ]);
    return {
      customers: users.map(({ passwordHash: _, ...u }) => u),
      total,
    };
  },

  async getAllCustomers(
    { page = 1, limit = 20, storeId, status }: { page?: number; limit?: number; storeId?: string; status?: "active" | "inactive" } = {}
  ): Promise<{ customers: Omit<IUser, "passwordHash">[]; total: number }> {
    const skip = (page - 1) * limit;
    const isActive = status === "active" ? true : status === "inactive" ? false : undefined;
    const [users, total] = await Promise.all([
      AuthRepository.findAllCustomers({ skip, limit, storeId, isActive }),
      AuthRepository.countAllCustomers(storeId, isActive),
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

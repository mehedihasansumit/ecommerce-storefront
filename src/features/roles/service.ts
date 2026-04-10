import { RoleRepository } from "./repository";
import type { IRole } from "./types";
import type { CreateRoleInput, UpdateRoleInput } from "./schemas";
import type { Permission } from "@/shared/lib/permissions";

export const RoleService = {
  async list(): Promise<IRole[]> {
    return RoleRepository.findAll();
  },

  async getById(id: string): Promise<IRole | null> {
    return RoleRepository.findById(id);
  },

  async create(data: CreateRoleInput): Promise<IRole> {
    const existing = await RoleRepository.findByName(data.name);
    if (existing) throw new Error("A role with this name already exists");
    return RoleRepository.create({
      name: data.name,
      description: data.description,
      permissions: data.permissions as Permission[],
      isSuperAdmin: data.isSuperAdmin ?? false,
    });
  },

  async update(id: string, data: UpdateRoleInput): Promise<IRole> {
    if (data.name) {
      const existing = await RoleRepository.findByName(data.name);
      if (existing && existing._id !== id) {
        throw new Error("A role with this name already exists");
      }
    }
    const updated = await RoleRepository.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.permissions !== undefined && {
        permissions: data.permissions as Permission[],
      }),
      ...(data.isSuperAdmin !== undefined && { isSuperAdmin: data.isSuperAdmin }),
    });
    if (!updated) throw new Error("Role not found");
    return updated;
  },

  async delete(id: string): Promise<void> {
    // Block deletion if any admins are assigned to this role
    const { AdminUserModel } = await import("@/features/auth/model");
    const { default: dbConnect } = await import("@/shared/lib/db");
    await dbConnect();
    const count = await AdminUserModel.countDocuments({ roleId: id });
    if (count > 0) {
      throw new Error(
        `Cannot delete this role — ${count} admin${count > 1 ? "s are" : " is"} still assigned to it. Reassign them first.`
      );
    }

    const deleted = await RoleRepository.delete(id);
    if (!deleted) throw new Error("Role not found");
  },
};

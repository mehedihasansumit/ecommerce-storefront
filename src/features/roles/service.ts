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
    });
    if (!updated) throw new Error("Role not found");

    // Re-sync permissions for all admins assigned to this role
    if (data.permissions !== undefined) {
      await syncAdminPermissionsForRole(id, updated.permissions);
    }

    return updated;
  },

  async delete(id: string): Promise<void> {
    const deleted = await RoleRepository.delete(id);
    if (!deleted) throw new Error("Role not found");
    // Detach role from admins (set roleId to null, keep their own permissions)
    await detachRoleFromAdmins(id);
  },
};

/**
 * When a role's permissions are updated, re-resolve effective permissions
 * for all admins that have this role assigned.
 */
async function syncAdminPermissionsForRole(
  roleId: string,
  newRolePermissions: Permission[]
) {
  // Import dynamically to avoid circular dependency
  const { AdminUserModel } = await import("@/features/auth/model");
  const { default: dbConnect } = await import("@/shared/lib/db");
  await dbConnect();

  const admins = await AdminUserModel.find({ roleId }).lean();
  for (const admin of admins) {
    // Admins may have their own extra permissions beyond the role
    // We store: rolePermissions ∪ ownPermissions (those NOT in the old role set)
    // Since we can't easily separate own vs role perms, rebuild from scratch:
    // Treat admin's current permissions that aren't in ANY role as "own" perms.
    const ownPerms = (admin.permissions as string[]).filter(
      (p) => !newRolePermissions.includes(p as Permission)
    );
    const effective = Array.from(
      new Set([...newRolePermissions, ...ownPerms])
    );
    await AdminUserModel.updateOne(
      { _id: admin._id },
      { permissions: effective }
    );
  }
}

async function detachRoleFromAdmins(roleId: string) {
  const { AdminUserModel } = await import("@/features/auth/model");
  const { default: dbConnect } = await import("@/shared/lib/db");
  await dbConnect();
  await AdminUserModel.updateMany({ roleId }, { roleId: null });
}

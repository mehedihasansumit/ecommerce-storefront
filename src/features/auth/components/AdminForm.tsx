"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@/shared/lib/permissions";
import type { IAdminUser } from "@/features/auth/types";
import type { IRole } from "@/features/roles/types";

interface Store {
  _id: string;
  name: string;
}

interface AdminFormProps {
  admin?: Omit<IAdminUser, "passwordHash">;
  stores: Store[];
  roles: IRole[];
}

export function AdminForm({ admin, stores, roles }: AdminFormProps) {
  const router = useRouter();
  const isEditing = !!admin;

  const [name, setName] = useState(admin?.name ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"superadmin" | "manager">(
    admin?.role ?? "manager"
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    admin?.roleId ?? ""
  );
  const [permissions, setPermissions] = useState<Permission[]>(
    (admin?.permissions as Permission[]) ?? []
  );
  const [assignedStores, setAssignedStores] = useState<string[]>(
    admin?.assignedStores ?? []
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function applyRoleTemplate(roleId: string) {
    setSelectedRoleId(roleId);
    if (!roleId) return;
    const found = roles.find((r) => r._id === roleId);
    if (found) {
      // Merge role permissions with existing admin permissions
      const combined = new Set([
        ...permissions,
        ...(found.permissions as Permission[]),
      ]);
      setPermissions(Array.from(combined));
    }
  }

  function togglePermission(perm: Permission) {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  function toggleStore(storeId: string) {
    setAssignedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((s) => s !== storeId)
        : [...prev, storeId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!isEditing && !password) {
      setError("Password is required");
      setSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      name,
      email,
      role,
      permissions: role === "superadmin" ? [] : permissions,
      assignedStores: role === "superadmin" ? [] : assignedStores,
      roleId: role === "superadmin" ? null : selectedRoleId || null,
    };
    if (password) body.password = password;

    const url = isEditing ? `/api/admins/${admin!._id}` : "/api/admins";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save admin");
      }
      router.push("/admin/admins");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Account Details</h2>
        <div>
          <label className={labelClass}>Name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className={labelClass}>
            Password{" "}
            {isEditing && (
              <span className="text-gray-400 font-normal">
                (leave blank to keep current)
              </span>
            )}
          </label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required={!isEditing}
          />
        </div>
        <div>
          <label className={labelClass}>System Role</label>
          <select
            className={inputClass}
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "superadmin" | "manager")
            }
          >
            <option value="manager">Manager</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Superadmin has unrestricted access to everything.
          </p>
        </div>
      </div>

      {/* Manager-only: Role template + Permissions + Stores */}
      {role === "manager" && (
        <>
          {/* Role Template */}
          {roles.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Role Template
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Apply a preset permission template. You can still customise
                  permissions below after applying.
                </p>
              </div>
              <select
                className={inputClass}
                value={selectedRoleId}
                onChange={(e) => applyRoleTemplate(e.target.value)}
              >
                <option value="">— No template —</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                    {r.description ? ` — ${r.description}` : ""}
                  </option>
                ))}
              </select>
              {selectedRoleId && (
                <p className="text-xs text-blue-600">
                  Template applied. Permissions below include role permissions +
                  any extra you add.
                </p>
              )}
            </div>
          )}

          {/* Permissions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">
                Permissions
              </h2>
              <span className="text-xs text-gray-400">
                {permissions.length} selected
              </span>
            </div>
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {group.label}
                </p>
                <div className="space-y-2">
                  {group.permissions.map((perm) => (
                    <label
                      key={perm}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                      />
                      <span className="text-sm text-gray-700">
                        {PERMISSION_LABELS[perm]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Assigned Stores */}
          {stores.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Assigned Stores
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manager can only access products, orders, and payments for
                  these stores.
                </p>
              </div>
              <div className="space-y-2">
                {stores.map((store) => (
                  <label
                    key={store._id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={assignedStores.includes(store._id)}
                      onChange={() => toggleStore(store._id)}
                      className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                    />
                    <span className="text-sm text-gray-700">{store.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Admin"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/admins")}
          className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

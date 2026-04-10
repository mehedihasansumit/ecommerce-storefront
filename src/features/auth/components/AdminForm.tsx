"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@/shared/lib/permissions";
import type { IAdminUserWithRole } from "@/features/auth/types";
import type { IRole } from "@/features/roles/types";

interface Store {
  _id: string;
  name: string;
}

interface AdminFormProps {
  admin?: Omit<IAdminUserWithRole, "passwordHash">;
  stores: Store[];
  roles: IRole[];
}

export function AdminForm({ admin, stores, roles }: AdminFormProps) {
  const router = useRouter();
  const isEditing = !!admin;

  const [name, setName] = useState(admin?.name ?? "");
  const [email, setEmail] = useState(admin?.email ?? "");
  const [password, setPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    admin?.roleId ?? ""
  );
  const [assignedStores, setAssignedStores] = useState<string[]>(
    admin?.assignedStores ?? []
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedRole = roles.find((r) => r._id === selectedRoleId);
  const isSuperAdminRole = selectedRole?.isSuperAdmin ?? false;

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

    if (!selectedRoleId) {
      setError("Please select a role");
      setSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      name,
      email,
      roleId: selectedRoleId,
      assignedStores: isSuperAdminRole ? [] : assignedStores,
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
      </div>

      {/* Role Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Role</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            The role determines what this admin can access and do.
          </p>
        </div>
        <select
          className={inputClass}
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          required
        >
          <option value="">— Select a role —</option>
          {roles.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
              {r.isSuperAdmin ? " (Super Admin)" : ""}
              {r.description ? ` — ${r.description}` : ""}
            </option>
          ))}
        </select>

        {/* Show the role's permissions as read-only preview */}
        {selectedRole && (
          <div className="mt-3">
            {selectedRole.isSuperAdmin ? (
              <p className="text-xs text-purple-600 font-medium">
                This role has unrestricted access to everything.
              </p>
            ) : selectedRole.permissions.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Permissions included in this role:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRole.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md"
                    >
                      {PERMISSION_LABELS[perm as Permission] ?? perm}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                This role has no permissions assigned.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Assigned Stores — only for non-superadmin roles */}
      {!isSuperAdminRole && stores.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Assigned Stores
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This admin can only access products, orders, and payments for
              these stores. Leave empty to allow access to all stores.
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

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Admin"}
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

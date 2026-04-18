"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@/shared/lib/permissions";
import type { IRole } from "@/features/roles/types";

interface RoleFormProps {
  role?: IRole;
}

export function RoleForm({ role }: RoleFormProps) {
  const router = useRouter();
  const isEditing = !!role;

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [isSuperAdmin, setIsSuperAdmin] = useState(role?.isSuperAdmin ?? false);
  const [permissions, setPermissions] = useState<Permission[]>(
    (role?.permissions as Permission[]) ?? []
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function togglePermission(perm: Permission) {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }

  function toggleGroup(groupPerms: readonly Permission[]) {
    const allSelected = groupPerms.every((p) => permissions.includes(p));
    if (allSelected) {
      setPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      setPermissions((prev) => {
        const combined = new Set([...prev, ...groupPerms]);
        return Array.from(combined);
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = isEditing ? `/api/roles/${role!._id}` : "/api/roles";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, permissions: isSuperAdmin ? [] : permissions, isSuperAdmin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save role");
      }
      router.push("/admin/roles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 text-sm border border-admin-border-md rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-admin-text-secondary mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-admin-surface rounded-xl border border-admin-border-md p-6 space-y-4">
        <h2 className="text-sm font-semibold text-admin-text-primary">Role Details</h2>
        <div>
          <label className={labelClass}>Role Name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Order Manager, Warehouse Staff"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this role do?"
          />
        </div>
      </div>

      {/* Super Admin Toggle */}
      <div className="bg-admin-surface rounded-xl border border-admin-border-md p-6 space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isSuperAdmin}
            onChange={(e) => setIsSuperAdmin(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 accent-gray-900"
          />
          <div>
            <span className="text-sm font-medium text-admin-text-primary">Super Admin</span>
            <p className="text-xs text-admin-text-muted">
              Grants unrestricted access to everything. Permissions below are ignored.
            </p>
          </div>
        </label>
      </div>

      {/* Permissions */}
      {!isSuperAdmin && (
      <div className="bg-admin-surface rounded-xl border border-admin-border-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-admin-text-primary">Permissions</h2>
          <span className="text-xs text-admin-text-muted">
            {permissions.length} selected
          </span>
        </div>

        {PERMISSION_GROUPS.map((group) => {
          const groupPerms = group.permissions as readonly Permission[];
          const allSelected = groupPerms.every((p) => permissions.includes(p));
          const someSelected = groupPerms.some((p) => permissions.includes(p));

          return (
            <div key={group.label}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-admin-text-muted uppercase tracking-wide">
                  {group.label}
                </p>
                <button
                  type="button"
                  onClick={() => toggleGroup(groupPerms)}
                  className="text-xs text-admin-text-subtle hover:text-admin-text-secondary transition-colors"
                >
                  {allSelected ? "Deselect all" : someSelected ? "Select all" : "Select all"}
                </button>
              </div>
              <div className="space-y-2">
                {groupPerms.map((perm) => (
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
                    <span className="text-sm text-admin-text-secondary">
                      {PERMISSION_LABELS[perm]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Role"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/roles")}
          className="px-5 py-2 text-sm font-medium text-admin-text-secondary bg-admin-surface border border-admin-border-md rounded-lg hover:bg-admin-surface-raised transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

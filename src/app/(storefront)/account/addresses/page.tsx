"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, ArrowLeft, MapPin } from "lucide-react";
import { AddressForm } from "@/features/auth/components/AddressForm";
import { AddressCard } from "@/features/auth/components/AddressCard";
import type { IAddress } from "@/features/auth/types";
import { useTenant } from "@/shared/hooks/useTenant";

export default function AddressesPage() {
  const t = useTranslations("addresses");
  const router = useRouter();
  const tenant = useTenant();

  useEffect(() => {
    document.title = `Addresses | ${tenant?.name ?? "Store"}`;
  }, [tenant?.name]);
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<IAddress | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch("/api/addresses");
      if (res.status === 401) {
        router.replace("/account/login");
        return;
      }
      const data = await res.json();
      if (res.ok) setAddresses(data.addresses);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  async function handleAdd(data: Omit<IAddress, "_id">) {
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    setAddresses(result.addresses);
    setShowAddForm(false);
  }

  async function handleUpdate(data: Omit<IAddress, "_id">) {
    if (!editingAddress) return;
    const res = await fetch(`/api/addresses/${editingAddress._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    setAddresses(result.addresses);
    setEditingAddress(null);
  }

  async function handleDelete(addressId: string) {
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/addresses/${addressId}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (res.ok) setAddresses(result.addresses);
  }

  async function handleSetDefault(addressId: string) {
    const res = await fetch(`/api/addresses/${addressId}/default`, {
      method: "PUT",
    });
    const result = await res.json();
    if (res.ok) setAddresses(result.addresses);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
        </div>
        {!showAddForm && !editingAddress && addresses.length < 10 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium transition-all hover:brightness-105"
            style={{
              backgroundColor: "var(--color-primary)",
              borderRadius: "var(--border-radius)",
            }}
          >
            <Plus size={16} />
            {t("addNew")}
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-4">{t("addNew")}</h2>
          <AddressForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editingAddress && (
        <div className="mb-6 bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg p-6">
          <h2 className="font-semibold text-lg mb-4">{t("editAddress")}</h2>
          <AddressForm
            initialData={editingAddress}
            onSubmit={handleUpdate}
            onCancel={() => setEditingAddress(null)}
          />
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-100 shadow-[var(--shadow-xs)] rounded-lg">
          <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">{t("noAddresses")}</p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-5 py-2 text-white text-sm font-medium transition-all hover:brightness-105"
              style={{
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius)",
              }}
            >
              {t("addNew")}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr._id}
              address={addr}
              onEdit={(a) => {
                setEditingAddress(a);
                setShowAddForm(false);
              }}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {addresses.length >= 10 && (
        <p className="mt-4 text-sm text-amber-600">{t("maxReached")}</p>
      )}
    </div>
  );
}

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
import { Button, Card, CardHeader, EmptyState, ConfirmDialog } from "@/shared/components/ui";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!deletingId) return;
    const res = await fetch(`/api/addresses/${deletingId}`, { method: "DELETE" });
    const result = await res.json();
    if (res.ok) setAddresses(result.addresses);
    setDeletingId(null);
  }

  async function handleSetDefault(addressId: string) {
    const res = await fetch(`/api/addresses/${addressId}/default`, { method: "PUT" });
    const result = await res.json();
    if (res.ok) setAddresses(result.addresses);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-40" />
          </div>
          <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  const canAddMore = !showAddForm && !editingAddress && addresses.length < 10;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-bg border border-border-subtle hover:border-primary/40 transition-colors shrink-0"
            aria-label="Back to account"
          >
            <ArrowLeft size={16} className="text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-[var(--color-text)] tracking-tight">
            {t("title")}
          </h1>
        </div>
        {canAddMore && (
          <Button
            variant="brand"
            size="sm"
            leftIcon={<Plus size={15} />}
            onClick={() => setShowAddForm(true)}
          >
            {t("addNew")}
          </Button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card padding="lg">
          <CardHeader title={t("addNew")} />
          <AddressForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </Card>
      )}

      {/* Edit form */}
      {editingAddress && (
        <Card padding="lg">
          <CardHeader title={t("editAddress")} />
          <AddressForm
            initialData={editingAddress}
            onSubmit={handleUpdate}
            onCancel={() => setEditingAddress(null)}
          />
        </Card>
      )}

      {/* Address list or empty state */}
      {addresses.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={MapPin}
            title={t("noAddresses")}
            description="Add an address to make checkout faster."
            action={
              !showAddForm && (
                <Button
                  variant="brand"
                  leftIcon={<Plus size={15} />}
                  onClick={() => setShowAddForm(true)}
                >
                  {t("addNew")}
                </Button>
              )
            }
          />
        </Card>
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
              onDelete={(id) => setDeletingId(id)}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {addresses.length >= 10 && (
        <p className="text-sm text-amber-600 dark:text-amber-400 px-1">{t("maxReached")}</p>
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title={t("deleteConfirm")}
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel={t("cancel")}
        tone="danger"
      />
    </div>
  );
}
